from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    monthly_income: Optional[float] = 75000.0
    currency: Optional[str] = "INR"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserSettingsResponse(BaseModel):
    currency: str
    monthly_income: float

    class Config:
        from_attributes = True

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: datetime
    currency: str = "INR"
    monthly_income: float = 75000.0

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
