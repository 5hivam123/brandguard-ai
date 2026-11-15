from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.schemas import HealthResponse
from app.services.ai_service import ai_service
from app.core.config import settings

router = APIRouter(tags=["Health"])

@router.get("/api/health", response_model=HealthResponse)
def health_check(db: Session = Depends(get_db)):
    """
    Backend health check verifying database and AI engine status.
    """
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    engine_mode = "Hybrid AI (Gemini Connected)" if ai_service.is_configured else "Deterministic Rule-based Compliance Engine (Active)"

    return HealthResponse(
        status="healthy" if db_status == "connected" else "degraded",
        database=db_status,
        ai_engine_mode=engine_mode,
        gemini_configured=ai_service.is_configured,
        app_name=settings.APP_NAME,
        version="1.0.0"
    )
