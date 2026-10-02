from typing import Dict, Any, List, Optional
from datetime import date
from sqlalchemy.orm import Session
from sqlalchemy import extract
from backend.app.models.expense import Expense
from backend.app.models.budget import Budget
from backend.app.models.monthly_report import MonthlyReport
from backend.app.models.user_setting import UserSetting
from backend.app.services.analytics_service import analytics_service
from backend.app.services.ai_service import ai_service
from backend.app.utils.date_utils import get_month_name
from backend.app.utils.pdf_exporter import generate_report_pdf

class ReportService:
    def get_or_generate_report(self, user_id: int, month: int, year: int, db: Session, force_regenerate: bool = False) -> Dict[str, Any]:
        month_name = get_month_name(month)
        
        # 1. Fetch user income & expenses
        setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
        income = setting.monthly_income if setting and setting.monthly_income else 75000.0

        expenses = db.query(Expense).filter(
            Expense.user_id == user_id,
            extract('month', Expense.expense_date) == month,
            extract('year', Expense.expense_date) == year
        ).all()
        total_expenses = sum(e.amount for e in expenses)
        total_savings = max(0.0, income - total_expenses)
        savings_rate = round((total_savings / income) * 100, 1) if income > 0 else 0.0

        # Category Breakdown
        category_breakdown = analytics_service.get_category_breakdown(user_id, db, month, year)

        # Previous month for MoM comparison
        prev_m = month - 1 if month > 1 else 12
        prev_y = year if month > 1 else year - 1
        prev_expenses = db.query(Expense).filter(
            Expense.user_id == user_id,
            extract('month', Expense.expense_date) == prev_m,
            extract('year', Expense.expense_date) == prev_y
        ).all()
        prev_total = sum(e.amount for e in prev_expenses)
        
        mom_overall_pct = round(((total_expenses - prev_total) / prev_total) * 100, 1) if prev_total > 0 else 0.0
        
        # Category MoM
        prev_cat_map = {}
        for pe in prev_expenses:
            prev_cat_map[pe.category] = prev_cat_map.get(pe.category, 0.0) + pe.amount
            
        mom_category_diffs = []
        for cb in category_breakdown:
            cat = cb["category"]
            curr_amt = cb["amount"]
            p_amt = prev_cat_map.get(cat, 0.0)
            if p_amt > 0:
                diff_pct = round(((curr_amt - p_amt) / p_amt) * 100, 1)
            else:
                diff_pct = 100.0 if curr_amt > 0 else 0.0
            mom_category_diffs.append({
                "category": cat,
                "current_amount": curr_amt,
                "previous_amount": p_amt,
                "percentage_change": diff_pct,
                "direction": "up" if diff_pct > 0 else ("down" if diff_pct < 0 else "neutral")
            })

        # Budget Performance
        budgets = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.month == month,
            Budget.year == year
        ).all()
        
        curr_cat_map = {cb["category"]: cb["amount"] for cb in category_breakdown}
        budget_performance = []
        over_budget_count = 0

        for b in budgets:
            spent = curr_cat_map.get(b.category, 0.0)
            pct = round((spent / b.monthly_limit) * 100, 1) if b.monthly_limit > 0 else 0.0
            if pct > 100.0:
                status = "over_budget"
                over_budget_count += 1
            elif pct >= 80.0:
                status = "near_limit"
            else:
                status = "within_budget"

            budget_performance.append({
                "id": b.id,
                "category": b.category,
                "monthly_limit": b.monthly_limit,
                "spent": spent,
                "remaining": max(0.0, b.monthly_limit - spent),
                "percentage": pct,
                "status": status
            })

        # Top Expenses
        sorted_expenses = sorted(expenses, key=lambda x: x.amount, reverse=True)[:5]
        top_expenses = [
            {
                "id": e.id,
                "merchant": e.merchant,
                "description": e.description,
                "amount": e.amount,
                "category": e.category,
                "expense_date": e.expense_date.isoformat(),
                "payment_method": e.payment_method
            }
            for e in sorted_expenses
        ]

        # Check existing MonthlyReport in DB
        existing_report = db.query(MonthlyReport).filter(
            MonthlyReport.user_id == user_id,
            MonthlyReport.month == month,
            MonthlyReport.year == year
        ).first()

        report_text = None
        recommendations = []

        if existing_report and not force_regenerate:
            report_text = existing_report.report_text
        
        if not report_text or force_regenerate:
            top_cat_item = category_breakdown[0] if category_breakdown else {"category": "Food", "amount": 0.0}
            ai_data = ai_service.generate_monthly_report_summary(
                month_name=month_name,
                year=year,
                metrics={
                    "total_income": income,
                    "total_expenses": total_expenses,
                    "total_savings": total_savings,
                    "savings_rate": savings_rate,
                    "mom_change_pct": mom_overall_pct,
                    "top_category": top_cat_item["category"],
                    "top_category_spent": top_cat_item["amount"],
                    "over_budget_count": over_budget_count
                }
            )
            report_text = ai_data["summary"]
            recommendations = ai_data["recommendations"]

            if existing_report:
                existing_report.total_income = income
                existing_report.total_expenses = total_expenses
                existing_report.total_savings = total_savings
                existing_report.savings_rate = savings_rate
                existing_report.report_text = report_text
            else:
                new_report = MonthlyReport(
                    user_id=user_id,
                    month=month,
                    year=year,
                    total_income=income,
                    total_expenses=total_expenses,
                    total_savings=total_savings,
                    savings_rate=savings_rate,
                    report_text=report_text
                )
                db.add(new_report)
            db.commit()
        else:
            # Generate fresh recommendations dynamically
            top_cat_item = category_breakdown[0] if category_breakdown else {"category": "Food", "amount": 0.0}
            ai_data = ai_service.generate_monthly_report_summary(
                month_name=month_name,
                year=year,
                metrics={
                    "total_income": income,
                    "total_expenses": total_expenses,
                    "total_savings": total_savings,
                    "savings_rate": savings_rate,
                    "mom_change_pct": mom_overall_pct,
                    "top_category": top_cat_item["category"],
                    "top_category_spent": top_cat_item["amount"],
                    "over_budget_count": over_budget_count
                }
            )
            recommendations = ai_data["recommendations"]

        return {
            "id": existing_report.id if existing_report else None,
            "month": month,
            "year": year,
            "month_name": month_name,
            "total_income": round(income, 2),
            "total_expenses": round(total_expenses, 2),
            "total_savings": round(total_savings, 2),
            "savings_rate": savings_rate,
            "report_text": report_text,
            "category_breakdown": category_breakdown,
            "mom_comparison": {
                "overall_change_pct": mom_overall_pct,
                "previous_month_total": round(prev_total, 2),
                "category_changes": mom_category_diffs
            },
            "budget_performance": budget_performance,
            "top_expenses": top_expenses,
            "recommendations": recommendations,
            "currency": setting.currency if setting else "INR"
        }

    def generate_pdf(self, user_id: int, month: int, year: int, db: Session) -> bytes:
        report_data = self.get_or_generate_report(user_id, month, year, db)
        setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
        currency = setting.currency if setting else "INR"
        return generate_report_pdf(report_data, currency)

report_service = ReportService()
