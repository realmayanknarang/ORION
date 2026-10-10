from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# ---------------------------------------------------------------------------
# TATVA Forensic Intelligence API
# ---------------------------------------------------------------------------

app = FastAPI(
    title="TATVA Forensic Intelligence API",
    description="Backend API for the TATVA forensic investigation platform.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

@app.get("/health")
def health_check():
    """Liveness probe — returns 200 when the server is up."""
    return {"status": "ok", "service": "TATVA API"}
