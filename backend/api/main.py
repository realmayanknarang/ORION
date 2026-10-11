from fastapi import FastAPI, HTTPException, Body, Query
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
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

db = PostgresClient()

# ---------------------------------------------------------------------------
# Pydantic Schemas for Case Management
# ---------------------------------------------------------------------------

class CaseCreateRequest(BaseModel):
    case_id: str
    title: str
    description: Optional[str] = ""
    investigator: Optional[str] = ""
    metadata: Optional[dict] = None

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
