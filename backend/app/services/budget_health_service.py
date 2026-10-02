import calendar
from datetime import date
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import extract
from backend.app.models.expense import Expense
from backend.app.models.budget import Budget
from backend.app.models.user_setting import UserSetting

class BudgetHealthService:
    def calculate_health_score(self, user_id: int, db: Session, month: Optional[int] = None, year: Optional[int] = None) -> Dict[str, Any]:
        today = date.today()
        m = month if month else today.month
        y = year if year else today.year

        # 1. Fetch user income & expenses
        setting = db.query(UserSetting).filter(UserSetting.user_id == user_id).first()
        income = setting.monthly_income if setting and setting.monthly_income else 75000.0

        expenses = db.query(Expense).filter(
            Expense.user_id == user_id,
            extract('month', Expense.expense_date) == m,
            extract('year', Expense.expense_date) == y
        ).all()
        total_expenses = sum(e.amount for e in expenses)

        # 2. Fetch budgets
        budgets = db.query(Budget).filter(
            Budget.user_id == user_id,
            Budget.month == m,
            Budget.year == y
        ).all()

        cat_spending: Dict[str, float] = {}
        for e in expenses:
            cat_spending[e.category] = cat_spending.get(e.category, 0.0) + e.amount

        # Determine days passed vs total days in month
        _, total_days = calendar.monthrange(y, m)
        if m == today.month and y == today.year:
            days_passed = max(1, today.day)
        else:
            days_passed = total_days

        reasons = []
        factors = []
        score = 0

        # FACTOR 1: Savings Rate (Weight: 30 pts)
        savings = max(0.0, income - total_expenses)
        savings_rate = (savings / income) * 100 if income > 0 else 0.0
        
        if savings_rate >= 30.0:
            score += 30
            reasons.append("Savings rate is healthy (30%+)")
            factors.append({
                "title": "Savings Rate",
                "impact": "positive",
                "description": f"Strong savings rate of {savings_rate:.1f}% provides excellent financial buffer."
            })
        elif savings_rate >= 20.0:
            score += 22
            reasons.append("Solid savings rate (20-30%)")
            factors.append({
                "title": "Savings Rate",
                "impact": "positive",
                "description": f"Healthy savings rate of {savings_rate:.1f}% aligns with the 20% rule."
            })
        elif savings_rate >= 10.0:
            score += 14
            reasons.append("Moderate savings rate (10-20%)")
            factors.append({
                "title": "Savings Rate",
                "impact": "warning",
                "description": f"Savings rate is {savings_rate:.1f}%. Consider trimming discretionary expenses."
            })
        else:
            score += 5
            reasons.append("Low savings buffer (<10%)")
            factors.append({
                "title": "Savings Rate",
                "impact": "negative",
                "description": f"Savings rate of {savings_rate:.1f}% leaves minimal safety cushion."
            })

        # FACTOR 2: Budget Utilization (Weight: 30 pts)
        total_budget_limit = sum(b.monthly_limit for b in budgets) if budgets else (income * 0.70)
        utilization = (total_expenses / total_budget_limit) * 100 if total_budget_limit > 0 else 0.0

        if utilization <= 70.0:
            score += 30
            reasons.append("Overall spending is well within budget limits")
            factors.append({
                "title": "Budget Utilization",
                "impact": "positive",
                "description": f"You have utilized only {utilization:.1f}% of your planned monthly budget."
            })
        elif utilization <= 85.0:
            score += 22
            reasons.append("Spending is on track with planned budget")
            factors.append({
                "title": "Budget Utilization",
                "impact": "positive",
                "description": f"Current budget utilization is {utilization:.1f}%."
            })
        elif utilization <= 100.0:
            score += 12
            reasons.append("Spending is approaching total budget limit")
            factors.append({
                "title": "Budget Utilization",
                "impact": "warning",
                "description": f"Budget utilization is {utilization:.1f}%. Monitor remaining transactions."
            })
        else:
            score += 0
            reasons.append(f"Total budget exceeded by {utilization - 100:.1f}%")
            factors.append({
                "title": "Budget Utilization",
                "impact": "negative",
                "description": f"Total spending has exceeded planned budget ({utilization:.1f}%)."
            })

        # FACTOR 3: Category Discipline (Weight: 25 pts)
        over_budget_cats = []
        near_limit_cats = []
        for b in budgets:
            spent = cat_spending.get(b.category, 0.0)
            pct = (spent / b.monthly_limit) * 100 if b.monthly_limit > 0 else 0.0
            if pct > 100.0:
                over_budget_cats.append(b.category)
            elif pct >= 80.0:
                near_limit_cats.append(b.category)

        if len(over_budget_cats) == 0:
            if len(near_limit_cats) == 0:
                score += 25
                reasons.append("No categories are near or over budget limits")
                factors.append({
                    "title": "Category Discipline",
                    "impact": "positive",
                    "description": "All category allocations are perfectly managed."
                })
            else:
                score += 18
                cats_str = ", ".join(near_limit_cats)
                reasons.append(f"{cats_str} spending is approaching its limit")
                factors.append({
                    "title": "Category Discipline",
                    "impact": "warning",
                    "description": f"{cats_str} is at 80%+ of its allocated limit."
                })
        elif len(over_budget_cats) == 1:
            score += 10
            reasons.append(f"{over_budget_cats[0]} exceeded its monthly budget")
            factors.append({
                "title": "Category Discipline",
                "impact": "warning",
                "description": f"{over_budget_cats[0]} is over budget."
            })
        else:
            score += 0
            reasons.append(f"Multiple categories over budget ({', '.join(over_budget_cats)})")
            factors.append({
                "title": "Category Discipline",
                "impact": "negative",
                "description": f"{len(over_budget_cats)} categories have surpassed their limits."
            })

        # FACTOR 4: Spending Velocity & Projection (Weight: 15 pts)
        projected_spend = (total_expenses / days_passed) * total_days if days_passed > 0 else 0.0
        projected_ratio = (projected_spend / income) * 100 if income > 0 else 0.0

        if projected_ratio <= 75.0:
            score += 15
            reasons.append("Daily spending velocity is steady and sustainable")
            factors.append({
                "title": "Spending Velocity",
                "impact": "positive",
                "description": f"Projected month-end spend of ₹{int(projected_spend):,} leaves healthy surplus."
            })
        elif projected_ratio <= 90.0:
            score += 10
            reasons.append("Spending velocity is manageable")
            factors.append({
                "title": "Spending Velocity",
                "impact": "positive",
                "description": f"Projected month-end spend is ₹{int(projected_spend):,}."
            })
        elif projected_ratio <= 100.0:
            score += 5
            reasons.append("Projected spend is close to entire monthly income")
            factors.append({
                "title": "Spending Velocity",
                "impact": "warning",
                "description": f"Spending velocity projects ₹{int(projected_spend):,} total outflow."
            })
        else:
            score += 0
            reasons.append("Spending velocity is tracking above total monthly income")
            factors.append({
                "title": "Spending Velocity",
                "impact": "negative",
                "description": f"At current pace, month-end spend will reach ₹{int(projected_spend):,}."
            })

        # Cap score 0 - 100
        score = max(0, min(100, score))

        # Status determination
        if score >= 80:
            status = "Healthy"
        elif score >= 60:
            status = "Moderate"
        elif score >= 40:
            status = "Warning"
        else:
            status = "Critical"

        return {
            "score": score,
            "status": status,
            "reasons": reasons,
            "factors": factors,
            "metrics": {
                "income": income,
                "total_expenses": total_expenses,
                "savings": savings,
                "savings_rate": round(savings_rate, 1),
                "budget_utilization": round(utilization, 1),
                "projected_month_end_spend": round(projected_spend, 2),
                "over_budget_categories_count": len(over_budget_cats)
            }
        }

budget_health_service = BudgetHealthService()
