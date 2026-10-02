from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Any, Dict
from datetime import date, datetime

class ExpenseBase(BaseModel):
    amount: float = Field(..., gt=0, description="Expense amount in active currency")
    merchant: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    category: str = Field(..., max_length=100)
    subcategory: Optional[str] = None
    payment_method: str = Field(default="UPI", max_length=100)
    expense_date: date = Field(default_factory=date.today)
    source: str = Field(default="manual", max_length=50) # manual, natural_language, receipt
    confidence_score: float = Field(default=1.0, ge=0.0, le=1.0)
    receipt_image_path: Optional[str] = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(BaseModel):
    amount: Optional[float] = Field(None, gt=0)
    merchant: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    payment_method: Optional[str] = None
    expense_date: Optional[date] = None

class ExpenseResponse(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    created_at: datetime
    updated_at: datetime

class NaturalLanguageInput(BaseModel):
    text: str = Field(..., min_length=2, description="Natural language description of the expense")

class NaturalLanguageResponse(BaseModel):
    amount: Optional[float] = None
    merchant: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    payment_method: Optional[str] = "UPI"
    expense_date: Optional[str] = None
    confidence_score: float = 0.95
    is_complete: bool = True
    missing_fields: List[str] = []
    raw_text: str

class ReceiptItem(BaseModel):
    name: str
    price: float
    quantity: Optional[int] = 1

class ReceiptScanResponse(BaseModel):
    merchant: Optional[str] = None
    expense_date: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = "Food"
    payment_method: Optional[str] = "Card"
    confidence_score: float = 0.90
    items: List[Dict[str, Any]] = []
    raw_text: str = ""
    receipt_image_path: Optional[str] = None
    is_readable: bool = True
    error_message: Optional[str] = None
