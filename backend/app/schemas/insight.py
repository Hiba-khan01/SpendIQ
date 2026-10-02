from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class AIInsightResponse(BaseModel):
    id: int
    user_id: int
    type: str # trend, warning, opportunity, anomaly, savings
    title: str
    description: str
    severity: str # info, warning, success, low, medium, high
    created_at: datetime

    class Config:
        from_attributes = True

class AIInsightGenerateRequest(BaseModel):
    month: Optional[int] = None
    year: Optional[int] = None
