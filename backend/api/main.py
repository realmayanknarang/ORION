from fastapi import FastAPI, HTTPException, Body, Query, UploadFile, File
import hashlib
import os
import shutil
import aiofiles
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel

from db.postgres_client import PostgresClient

# ---------------------------------------------------------------------------
# TATVA Forensic Intelligence API
# ---------------------------------------------------------------------------

app = FastAPI(
    title="TATVA Forensic Intelligence API",
    description="Backend API for the TATVA forensic investigation platform.",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = PostgresClient()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

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

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    """Liveness probe — returns 200 when the server is up."""
    return {"status": "ok", "service": "TATVA API"}

# ---------------------------------------------------------------------------
# Case Management Endpoints
# ---------------------------------------------------------------------------

@app.get("/api/cases")
def list_cases():
    """List all cases."""
    return db.list_cases()

@app.post("/api/cases")
def create_case(payload: CaseCreateRequest):
    """Create a new forensic case."""
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
    """Get case details."""
    case = db.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case

@app.post("/api/cases/{case_id}/notes")
def add_case_note(case_id: str, payload: NoteCreateRequest):
    """Add an investigator note to a case."""
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
    """Retrieve all investigator notes for a case."""
    return db.get_notes(case_id)

@app.post("/api/cases/{case_id}/upload")
async def upload_evidence_files(case_id: str, files: List[UploadFile] = File(...)):
    """Upload multiple heterogeneous evidence files associated with a case."""
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
