from pydantic import BaseModel, ConfigDict
from typing import List, Dict, Any, Optional
from datetime import datetime

class MonthlyReportGenerateRequest(BaseModel):
    month: int
    year: int

class MonthlyReportResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: Optional[int] = None
    month: int
    year: int
    month_name: Optional[str] = None
    total_income: float
    total_expenses: float
    total_savings: float
    savings_rate: float
    report_text: Optional[str] = None
    category_breakdown: List[Dict[str, Any]] = []
    mom_comparison: Dict[str, Any] = {}
    budget_performance: List[Dict[str, Any]] = []
    top_expenses: List[Dict[str, Any]] = []
    recommendations: List[str] = []
    created_at: Optional[datetime] = None
