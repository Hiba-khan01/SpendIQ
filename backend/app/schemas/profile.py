from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ProfileUpdate(BaseModel):
    name: Optional[str] = None
    currency: Optional[str] = None
    monthly_income: Optional[float] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class ProfileResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    currency: str
    monthly_income: float
    total_transactions: int = 0
    total_spent_all_time: float = 0.0
    created_at: datetime

    class Config:
        from_attributes = True
