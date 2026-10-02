from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class HealthFactor(BaseModel):
    title: str
    impact: str # "positive", "warning", "negative"
    description: str

class BudgetHealthResponse(BaseModel):
    score: int # 0 to 100
    status: str # "Critical", "Warning", "Moderate", "Healthy"
    reasons: List[str]
    factors: List[HealthFactor] = []
    metrics: Dict[str, Any] = {}
