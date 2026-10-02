from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class AIInsightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    type: str # trend, warning, opportunity, anomaly, savings
    title: str
    description: str
    severity: str # info, warning, success, low, medium, high
    created_at: datetime

class AIInsightGenerateRequest(BaseModel):
    month: Optional[int] = None
    year: Optional[int] = None
