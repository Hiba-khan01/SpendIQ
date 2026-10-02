import calendar
from datetime import date, datetime, timedelta
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from backend.app.models.expense import Expense
from backend.app.models.budget import Budget
from backend.app.models.user_setting import UserSetting
from backend.app.utils.date_utils import get_month_name

class AnalyticsService:
    def get_user_settings(self, user_id: int, db: Session) -> UserSetting:
        setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
        if not setting:
            setting = UserSetting(user_id=user_id, currency="INR", monthly_income=75000.0)
            db.add(setting)
            db.commit()
            db.refresh(setting)
        return setting

    def get_summary(self, user_id: int, db: Session, month: Optional[int] = None, year: Optional[int] = None) -> Dict[str, Any]:
        today = date.today()
        m = month if month else today.month
        y = year if year else today.year

        setting = self.get_user_settings(user_id, db)
        income = setting.monthly_income or 75000.0

        # Query expenses for the specified month and year
        expenses_query = db.query(Expense).filter(
            Expense.user_id == user_id,
            extract('month', Expense.expense_date) == m,
            extract('year', Expense.expense_date) == y
        )
        expenses_list = expenses_query.all()
        
        total_expenses = sum(e.amount for e in expenses_list)
        total_savings = max(0.0, income - total_expenses)
        savings_rate = round((total_savings / income) * 100, 1) if income > 0 else 0.0

        # Calculate daily average
        if m == today.month and y == today.year:
            days_passed = max(1, today.day)
        else:
            _, num_days = calendar.monthrange(y, m)
            days_passed = num_days
        daily_average = round(total_expenses / days_passed, 2)

        # Active budgets count
        active_budgets = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.month == m,
            Budget.year == y
        ).count()

        # Top category
        top_cat = None
        if expenses_list:
            cat_totals = {}
            for e in expenses_list:
                cat_totals[e.category] = cat_totals.get(e.category, 0.0) + e.amount
            top_cat = max(cat_totals, key=cat_totals.get)

        # Health score calculation import lazy to avoid circular dependency
        from backend.app.services.budget_health_service import budget_health_service
        health_data = budget_health_service.calculate_health_score(user_id, db, m, y)

        return {
            "total_income": round(income, 2),
            "total_expenses": round(total_expenses, 2),
            "total_savings": round(total_savings, 2),
            "savings_rate": savings_rate,
            "budget_health_score": health_data["score"],
            "budget_health_status": health_data["status"],
            "daily_average": daily_average,
            "total_transactions_count": len(expenses_list),
            "active_budgets_count": active_budgets,
            "top_spending_category": top_cat,
            "currency": setting.currency or "INR"
        }

    def get_category_breakdown(self, user_id: int, db: Session, month: Optional[int] = None, year: Optional[int] = None) -> List[Dict[str, Any]]:
        today = date.today()
        m = month if month else today.month
        y = year if year else today.year

        expenses = db.query(Expense).filter(
            Expense.user_id == user_id,
            extract('month', Expense.expense_date) == m,
            extract('year', Expense.expense_date) == y
        ).all()

        total_spent = sum(e.amount for e in expenses)
        cat_map: Dict[str, Dict[str, Any]] = {}

        for e in expenses:
            if e.category not in cat_map:
                cat_map[e.category] = {"category": e.category, "amount": 0.0, "count": 0}
            cat_map[e.category]["amount"] += e.amount
            cat_map[e.category]["count"] += 1

        result = []
        for cat, data in cat_map.items():
            pct = round((data["amount"] / total_spent) * 100, 1) if total_spent > 0 else 0.0
            result.append({
                "category": cat,
                "amount": round(data["amount"], 2),
                "percentage": pct,
                "count": data["count"]
            })

        # Sort descending by amount
        result.sort(key=lambda x: x["amount"], reverse=True)
        return result

    def get_monthly_history(self, user_id: int, db: Session, count: int = 6) -> List[Dict[str, Any]]:
        today = date.today()
        history = []
        setting = self.get_user_settings(user_id, db)
        income = setting.monthly_income or 75000.0

        for i in range(count - 1, -1, -1):
            # Calculate past month & year
            month_calc = today.month - i
            year_calc = today.year
            while month_calc <= 0:
                month_calc += 12
                year_calc -= 1

            total_expenses = db.query(func.sum(Expense.amount)).filter(
                Expense.user_id == user_id,
                extract('month', Expense.expense_date) == month_calc,
                extract('year', Expense.expense_date) == year_calc
            ).scalar() or 0.0

            total_savings = max(0.0, income - total_expenses)

            history.append({
                "month": month_calc,
                "year": year_calc,
                "month_name": f"{get_month_name(month_calc)[:3]} {year_calc}",
                "total_expenses": round(total_expenses, 2),
                "total_income": round(income, 2),
                "total_savings": round(total_savings, 2)
            })

        return history

    def get_trends(self, user_id: int, db: Session, month: Optional[int] = None, year: Optional[int] = None) -> Dict[str, Any]:
        today = date.today()
        m = month if month else today.month
        y = year if year else today.year

        expenses = db.query(Expense).filter(
            Expense.user_id == user_id,
            extract('month', Expense.expense_date) == m,
            extract('year', Expense.expense_date) == y
        ).all()

        # Weekend vs Weekday
        weekend_spending = 0.0
        weekday_spending = 0.0
        merchant_counts: Dict[str, Dict[str, Any]] = {}

        for e in expenses:
            # 5 is Saturday, 6 is Sunday
            if e.expense_date.weekday() >= 5:
                weekend_spending += e.amount
            else:
                weekday_spending += e.amount

            # Merchant accumulation
            m_name = e.merchant or "Unknown"
            if m_name not in merchant_counts:
                merchant_counts[m_name] = {"merchant": m_name, "total_spent": 0.0, "count": 0, "category": e.category}
            merchant_counts[m_name]["total_spent"] += e.amount
            merchant_counts[m_name]["count"] += 1

        total_spent = weekend_spending + weekday_spending
        weekend_pct = round((weekend_spending / total_spent) * 100, 1) if total_spent > 0 else 0.0

        # Top merchants by spend & frequency
        top_merchants = sorted(merchant_counts.values(), key=lambda x: x["total_spent"], reverse=True)[:5]

        # Top 5 largest individual expenses
        largest_expenses_query = sorted(expenses, key=lambda x: x.amount, reverse=True)[:5]
        largest_expenses = [
            {
                "id": e.id,
                "merchant": e.merchant,
                "description": e.description,
                "amount": e.amount,
                "category": e.category,
                "date": e.expense_date.isoformat()
            }
            for e in largest_expenses_query
        ]

        return {
            "monthly_history": self.get_monthly_history(user_id, db, 6),
            "category_distribution": self.get_category_breakdown(user_id, db, m, y),
            "weekend_spending": round(weekend_spending, 2),
            "weekday_spending": round(weekday_spending, 2),
            "weekend_percentage": weekend_pct,
            "top_merchants": top_merchants,
            "largest_expenses": largest_expenses
        }

    def get_stats_for_ai(self, user_id: int, db: Session, month: Optional[int] = None, year: Optional[int] = None) -> Dict[str, Any]:
        """
        Calculates all numerical statistics in Python for feeding to AI Insight generator.
        """
        today = date.today()
        m = month if month else today.month
        y = year if year else today.year

        # Current month expenses
        curr_expenses = db.query(Expense).filter(
            Expense.user_id == user_id,
            extract('month', Expense.expense_date) == m,
            extract('year', Expense.expense_date) == y
        ).all()
        curr_total = sum(e.amount for e in curr_expenses)

        # Previous month expenses
        prev_m = m - 1 if m > 1 else 12
        prev_y = y if m > 1 else y - 1
        prev_expenses = db.query(Expense).filter(
            Expense.user_id == user_id,
            extract('month', Expense.expense_date) == prev_m,
            extract('year', Expense.expense_date) == prev_y
        ).all()
        prev_total = sum(e.amount for e in prev_expenses)

        # User settings
        setting = self.get_user_settings(user_id, db)
        income = setting.monthly_income or 75000.0
        savings = max(0.0, income - curr_total)
        savings_rate = round((savings / income) * 100, 1) if income > 0 else 0.0

        # Category maps
        curr_cats: Dict[str, float] = {}
        for e in curr_expenses:
            curr_cats[e.category] = curr_cats.get(e.category, 0.0) + e.amount
            
        prev_cats: Dict[str, float] = {}
        for e in prev_expenses:
            prev_cats[e.category] = prev_cats.get(e.category, 0.0) + e.amount

        # Category changes
        category_changes = {}
        for cat, amt in curr_cats.items():
            if cat in prev_cats and prev_cats[cat] > 0:
                diff_pct = round(((amt - prev_cats[cat]) / prev_cats[cat]) * 100, 1)
                category_changes[cat] = diff_pct

        top_cat = max(curr_cats, key=curr_cats.get) if curr_cats else None
        top_cat_spent = curr_cats.get(top_cat, 0.0) if top_cat else 0.0

        # Weekend spending
        weekend_amt = sum(e.amount for e in curr_expenses if e.expense_date.weekday() >= 5)
        weekend_pct = round((weekend_amt / curr_total) * 100, 1) if curr_total > 0 else 0.0

        # Small transactions (< ₹300)
        small_txs = [e for e in curr_expenses if e.amount < 300.0]
        small_tx_count = len(small_txs)
        small_tx_total = sum(e.amount for e in small_txs)

        # Budgets overage check
        budgets = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.month == m,
            Budget.year == y
        ).all()
        over_budget_cats = []
        for b in budgets:
            spent = curr_cats.get(b.category, 0.0)
            if spent > b.monthly_limit:
                over_budget_cats.append(b.category)

        return {
            "month": m,
            "year": y,
            "month_name": get_month_name(m),
            "total_spending": curr_total,
            "previous_month_spending": prev_total,
            "income": income,
            "savings": savings,
            "savings_rate": savings_rate,
            "top_category": top_cat,
            "top_category_spent": top_cat_spent,
            "category_changes": category_changes,
            "weekend_spending_percentage": weekend_pct,
            "small_transactions_count": small_tx_count,
            "small_transactions_total": small_tx_total,
            "over_budget_categories": over_budget_cats
        }

analytics_service = AnalyticsService()
