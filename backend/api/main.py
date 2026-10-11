from fastapi import FastAPI, HTTPException, Body, Query, UploadFile, File
import hashlib
import os
import shutil
import aiofiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel

from insights.graph_insights import (
    get_suspects, get_alerts, get_timeline, get_summary, compute_insights
)
from insights import graph_insights
from insights.insight_schema import (
    GraphPayload, SuspectDetail, TransactionAlert, TimelineEvent, GraphSummary,
    EntityDetail, RelationDetail,
    GraphRenderPayload, RenderNode, RenderLink,
)
from db.postgres_client import PostgresClient
from db.redis_client import RedisClient
from analysis.rule_validation.relation_analyzer import get_relation_summary_and_metadata

# ---------------------------------------------------------------------------
# TATVA Forensic Intelligence API
# ---------------------------------------------------------------------------

app = FastAPI(
    title="TATVA Forensic Intelligence API",
    description="Backend API for the TATVA forensic investigation platform.",
    version="0.5.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = PostgresClient()
cache = RedisClient()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ---------------------------------------------------------------------------
# Helper: legacy raw-graph payload
# ---------------------------------------------------------------------------

def get_graph_payload() -> GraphPayload:
    if not graph_insights._GRAPH_DATA:
        compute_insights()
    return GraphPayload(
        master_entities=[EntityDetail(**m) for m in graph_insights._GRAPH_DATA.get("master_entities", [])],
        relations=[RelationDetail(**r) for r in graph_insights._GRAPH_DATA.get("relations", [])]
    )

def _entity_label(master: dict) -> str:
    resolved = master.get("resolved_values", [])
    master_type = master.get("master_type", "")
    if master_type == "PERSON":
        for val in resolved:
            v = val.strip()
            if (not v.startswith("98") and not v.startswith("91")
                    and not v.startswith("acc") and not v.startswith("@")
                    and "@" not in v and not v.startswith("android")
                    and not v.startswith("watch") and not v.startswith("tracker")
                    and not any(c.isdigit() for c in v)
                    and len(v) > 2):
                return v.title()
    if resolved:
        label = resolved[0].strip()
        if "_" in label and len(label) > 20:
            return label.replace("_", " ").title()
        return label.replace("_", " ").title() if "_" in label else label.title()
    return master.get("master_id", "Unknown")

def get_graph_render_payload() -> GraphRenderPayload:
    if not graph_insights._GRAPH_DATA:
        compute_insights()
    if not graph_insights._SUSPECTS:
        compute_insights()

    import json
    profiles_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "analysis", "rule_validation", "output", "person_risk_profiles.json")
    risk_lookup = {}
    if os.path.exists(profiles_path):
        try:
            with open(profiles_path, "r", encoding="utf-8") as f:
                profs = json.load(f)
                risk_lookup = {p["person_id"]: p["risk_score"] for p in profs}
        except Exception:
            pass

    if not risk_lookup:
        risk_lookup = {s.master_id: s.risk_score for s in graph_insights._SUSPECTS}

    nodes: List[RenderNode] = []
    for master in graph_insights._GRAPH_DATA.get("master_entities", []):
        mid = master.get("master_id", "")
        master_type = master.get("master_type", "ENTITY")
        entity_types = master.get("entity_types", [])
        sub_type = entity_types[0] if entity_types else master_type
        score = risk_lookup.get(mid, 0.0)
        label = _entity_label(master)

        nodes.append(RenderNode(
            id=mid,
            label=label,
            type=master_type,
            sub_type=sub_type,
            risk_score=score,
        ))

    links: List[RenderLink] = []
    for rel in graph_insights._GRAPH_DATA.get("relations", []):
        links.append(RenderLink(
            source=rel.get("source", ""),
            target=rel.get("target", ""),
            type=rel.get("relation", "ASSOCIATED_WITH"),
            confidence=float(rel.get("confidence", 1.0)),
        ))

    return GraphRenderPayload(nodes=nodes, links=links)

# ---------------------------------------------------------------------------
# Pydantic Schemas
# ---------------------------------------------------------------------------

class CaseCreateRequest(BaseModel):
    case_id: str
    title: str
    description: Optional[str] = ""
    investigator: Optional[str] = ""
    metadata: Optional[dict] = None

class NoteCreateRequest(BaseModel):
    author: Optional[str] = "investigator"
    content: str
    entity_ref: Optional[str] = None
    tags: Optional[List[str]] = None

VALID_STATUSES = {"ACTIVE", "CLEARED", "PERSON_OF_INTEREST", "PRIORITY_TARGET"}

class EntityAssessmentCreate(BaseModel):
    case_id: str
    entity_id: str
    status: str
    reason: Optional[str] = ""

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    """Liveness probe — returns 200 when the server is up."""
    return {"status": "ok", "service": "TATVA API"}

# ---------------------------------------------------------------------------
# Graph & Insights Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/graph", response_model=GraphPayload)
def read_graph():
    return get_graph_payload()

@app.get("/graph/render", response_model=GraphRenderPayload)
def read_graph_render():
    return get_graph_render_payload()

@app.get("/api/insights/suspects", response_model=List[SuspectDetail])
def read_suspects():
    return get_suspects()

@app.get("/api/insights/transactions", response_model=List[TransactionAlert])
def read_alerts():
    return get_alerts()

@app.get("/api/timeline")
def read_timeline():
    return get_timeline()

@app.get("/api/insights/summary", response_model=GraphSummary)
def read_summary():
    return get_summary()

@app.get("/api/insights/risk-profiles")
def read_person_risk_profiles():
    import json
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "analysis", "rule_validation", "output", "person_risk_profiles.json")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.get("/api/insights/relationship-profiles")
def read_relationship_risk_profiles():
    import json
    file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "analysis", "rule_validation", "output", "relationship_risk_profiles.json")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

@app.get("/api/insights/relation-details")
def read_relation_details(source: str, target: str):
    try:
        return get_relation_summary_and_metadata(source, target)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# Entity Assessment Endpoints
# ---------------------------------------------------------------------------

@app.post("/api/entity-assessments")
def upsert_entity_assessment(assessment: EntityAssessmentCreate):
    if assessment.status not in VALID_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid status '{assessment.status}'. Must be one of: {', '.join(sorted(VALID_STATUSES))}"
        )
    try:
        return db.upsert_entity_assessment(
            case_id=assessment.case_id,
            entity_id=assessment.entity_id,
            status=assessment.status,
            reason=assessment.reason,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/entity-assessments/{case_id}")
def get_entity_assessments(case_id: str):
    try:
        return db.get_entity_assessments(case_id=case_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ---------------------------------------------------------------------------
# Case Management Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/cases")
def list_cases(status: Optional[str] = None):
    try:
        return db.list_cases(status=status)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/cases")
def create_case(payload: CaseCreateRequest):
    try:
        case = db.create_case(
            case_id=payload.case_id,
            title=payload.title,
            description=payload.description or "",
            investigator=payload.investigator or "",
            metadata=payload.metadata or {}
        )
        return case
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/cases/{case_id}")
def get_case(case_id: str):
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@app.post("/api/cases/{case_id}/notes")
def add_case_note(case_id: str, payload: NoteCreateRequest):
    try:
        return db.add_note(
            case_id=case_id,
            author=payload.author or "investigator",
            content=payload.content,
            entity_ref=payload.entity_ref,
            tags=payload.tags
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/cases/{case_id}/notes")
def get_case_notes(case_id: str):
    return db.get_notes(case_id)

@app.post("/api/cases/{case_id}/upload")
async def upload_evidence_files(case_id: str, files: List[UploadFile] = File(...)):
    case_upload_dir = os.path.join(UPLOAD_DIR, case_id)
    os.makedirs(case_upload_dir, exist_ok=True)
    uploaded_records = []
    for file in files:
        destination_path = os.path.join(case_upload_dir, file.filename)
        sha256 = hashlib.sha256()
        size_bytes = 0
        async with aiofiles.open(destination_path, "wb") as out_file:
            while content := await file.read(1024 * 1024):
                sha256.update(content)
                size_bytes += len(content)
                await out_file.write(content)
        file_hash = sha256.hexdigest()
        file_ext = os.path.splitext(file.filename)[1].lower()
        try:
            ev = db.record_evidence(
                case_id=case_id,
                filename=file.filename,
                file_type=file_ext,
                file_hash=file_hash,
                storage_path=destination_path,
                size_bytes=size_bytes,
                metadata_json={"source": "api_upload"}
            )
            uploaded_records.append(ev)
        except Exception as e:
            uploaded_records.append({"filename": file.filename, "error": str(e)})
    return {"uploaded_count": len(uploaded_records), "files": uploaded_records}
