from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AnalyticsSummary(BaseModel):
    total_income: float
    total_expenses: float
    total_savings: float
    savings_rate: float
    budget_health_score: int
    budget_health_status: str
    daily_average: float
    total_transactions_count: int
    active_budgets_count: int
    top_spending_category: Optional[str] = None
    currency: str = "INR"

class CategoryBreakdownItem(BaseModel):
    category: str
    amount: float
    percentage: float
    count: int

class MonthlyTrendItem(BaseModel):
    month: int
    year: int
    month_name: str
    total_expenses: float
    total_income: float
    total_savings: float

class AnalyticsTrends(BaseModel):
    monthly_history: List[MonthlyTrendItem]
    category_distribution: List[CategoryBreakdownItem]
    weekend_spending: float
    weekday_spending: float
    weekend_percentage: float
    top_merchants: List[Dict[str, Any]]
    largest_expenses: List[Dict[str, Any]]
