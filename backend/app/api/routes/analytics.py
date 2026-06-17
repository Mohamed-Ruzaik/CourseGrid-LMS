from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import db_session, get_current_user
from app.models.user import User
from app.schemas.analytics import AnalyticsSummary
from app.services.analytics import get_analytics_summary

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary", response_model=AnalyticsSummary)
def summary(
    db: Session = Depends(db_session),
    current_user: User = Depends(get_current_user),
) -> AnalyticsSummary:
    return get_analytics_summary(db, current_user)
