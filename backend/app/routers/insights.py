from typing import List, Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.ai_insight import AIInsight
from backend.app.schemas.insight import AIInsightResponse, AIInsightGenerateRequest
from backend.app.utils.security import get_current_user
from backend.app.services.analytics_service import analytics_service
from backend.app.services.ai_service import ai_service

router = APIRouter(prefix="/ai/insights", tags=["AI Insights"])

@router.get("", response_model=List[AIInsightResponse])
def get_insights(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Fetches active AI insights for the authenticated user. If none exist, generates initial insights.
    """
    insights = db.query(AIInsight).filter(
        AIInsight.user_id == current_user.id
    ).order_by(AIInsight.created_at.desc()).all()

    if not insights:
        # Generate initial insights based on data
        stats = analytics_service.get_stats_for_ai(current_user.id, db)
        generated = ai_service.generate_spending_insights(stats)
        
        for g in generated:
            item = AIInsight(
                user_id=current_user.id,
                type=g["type"],
                title=g["title"],
                description=g["description"],
                severity=g["severity"]
            )
            db.add(item)
        db.commit()

        insights = db.query(AIInsight).filter(
            AIInsight.user_id == current_user.id
        ).order_by(AIInsight.created_at.desc()).all()

    return insights

@router.post("/generate", response_model=List[AIInsightResponse], status_code=status.HTTP_201_CREATED)
def generate_fresh_insights(
    req: AIInsightGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Recalculates financial metrics and generates a fresh set of personalized AI insights.
    """
    # Clear old insights
    db.query(AIInsight).filter(AIInsight.user_id == current_user.id).delete()

    stats = analytics_service.get_stats_for_ai(current_user.id, db, req.month, req.year)
    generated = ai_service.generate_spending_insights(stats)

    new_insights = []
    for g in generated:
        item = AIInsight(
            user_id=current_user.id,
            type=g["type"],
            title=g["title"],
            description=g["description"],
            severity=g["severity"]
        )
        db.add(item)
        new_insights.append(item)

    db.commit()
    for item in new_insights:
        db.refresh(item)

    return new_insights
