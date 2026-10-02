from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class BudgetBase(BaseModel):
    category: str = Field(..., max_length=100)
    monthly_limit: float = Field(..., gt=0)
    month: int = Field(..., ge=1, le=12)
    year: int = Field(..., ge=2020, le=2050)

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BaseModel):
    monthly_limit: float = Field(..., gt=0)

class BudgetResponse(BudgetBase):
    id: int
    user_id: int
    spent: float = 0.0
    remaining: float = 0.0
    percentage: float = 0.0
    status: str = "normal" # "normal", "warning" (>=80%), "over_budget" (>100%)
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
