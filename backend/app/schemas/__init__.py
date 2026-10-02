from backend.app.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from backend.app.schemas.expense import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    NaturalLanguageInput, NaturalLanguageResponse, ReceiptScanResponse
)
from backend.app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from backend.app.schemas.budget_health import BudgetHealthResponse
from backend.app.schemas.insight import AIInsightResponse, AIInsightGenerateRequest
from backend.app.schemas.report import MonthlyReportResponse, MonthlyReportGenerateRequest
from backend.app.schemas.profile import ProfileUpdate, ProfileResponse
from backend.app.schemas.analytics import AnalyticsSummary, CategoryBreakdownItem, MonthlyTrendItem, AnalyticsTrends

__all__ = [
    "UserRegister", "UserLogin", "UserResponse", "Token",
    "ExpenseCreate", "ExpenseUpdate", "ExpenseResponse",
    "NaturalLanguageInput", "NaturalLanguageResponse", "ReceiptScanResponse",
    "BudgetCreate", "BudgetUpdate", "BudgetResponse",
    "BudgetHealthResponse",
    "AIInsightResponse", "AIInsightGenerateRequest",
    "MonthlyReportResponse", "MonthlyReportGenerateRequest",
    "ProfileUpdate", "ProfileResponse",
    "AnalyticsSummary", "CategoryBreakdownItem", "MonthlyTrendItem", "AnalyticsTrends"
]
