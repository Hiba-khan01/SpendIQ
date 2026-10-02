from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.schemas.budget_health import BudgetHealthResponse
from backend.app.utils.security import get_current_user
from backend.app.services.budget_health_service import budget_health_service

router = APIRouter(prefix="/budget-health", tags=["Budget Health"])

@router.get("", response_model=BudgetHealthResponse)
def get_budget_health(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Computes transparent Budget Health score (0-100), status, and clear factor breakdown.
    """
    health_data = budget_health_service.calculate_health_score(current_user.id, db, month, year)
    return BudgetHealthResponse(**health_data)
