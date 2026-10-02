from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.schemas.analytics import AnalyticsSummary, CategoryBreakdownItem, MonthlyTrendItem, AnalyticsTrends
from backend.app.utils.security import get_current_user
from backend.app.services.analytics_service import analytics_service

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/summary", response_model=AnalyticsSummary)
def get_analytics_summary(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    summary_data = analytics_service.get_summary(current_user.id, db, month, year)
    return AnalyticsSummary(**summary_data)

@router.get("/categories", response_model=List[CategoryBreakdownItem])
def get_category_breakdown(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    categories = analytics_service.get_category_breakdown(current_user.id, db, month, year)
    return [CategoryBreakdownItem(**c) for c in categories]

@router.get("/monthly", response_model=List[MonthlyTrendItem])
def get_monthly_history(
    count: int = 6,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    history = analytics_service.get_monthly_history(current_user.id, db, count)
    return [MonthlyTrendItem(**h) for h in history]

@router.get("/trends", response_model=AnalyticsTrends)
def get_analytics_trends(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    trends = analytics_service.get_trends(current_user.id, db, month, year)
    return AnalyticsTrends(**trends)
