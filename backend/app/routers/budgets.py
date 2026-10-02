from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import extract
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.budget import Budget
from backend.app.models.expense import Expense
from backend.app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse
from backend.app.utils.security import get_current_user

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetResponse])
def list_budgets(
    month: Optional[int] = None,
    year: Optional[int] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()
    m = month if month else today.month
    y = year if year else today.year

    budgets = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.month == m,
        Budget.year == y
    ).all()

    # Get actual spending per category for this month
    expenses = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        extract('month', Expense.expense_date) == m,
        extract('year', Expense.expense_date) == y
    ).all()

    cat_spending = {}
    for e in expenses:
        cat_spending[e.category] = cat_spending.get(e.category, 0.0) + e.amount

    result = []
    for b in budgets:
        spent = cat_spending.get(b.category, 0.0)
        remaining = max(0.0, b.monthly_limit - spent)
        pct = round((spent / b.monthly_limit) * 100, 1) if b.monthly_limit > 0 else 0.0
        
        if pct > 100.0:
            status_val = "over_budget"
        elif pct >= 80.0:
            status_val = "warning"
        else:
            status_val = "normal"

        result.append(BudgetResponse(
            id=b.id,
            user_id=b.user_id,
            category=b.category,
            monthly_limit=b.monthly_limit,
            month=b.month,
            year=b.year,
            spent=round(spent, 2),
            remaining=round(remaining, 2),
            percentage=pct,
            status=status_val,
            created_at=b.created_at,
            updated_at=b.updated_at
        ))

    return result

@router.post("", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
def create_budget(
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check if a budget already exists for this user, category, month, year
    existing = db.query(Budget).filter(
        Budget.user_id == current_user.id,
        Budget.category == budget_in.category.strip(),
        Budget.month == budget_in.month,
        Budget.year == budget_in.year
    ).first()

    if existing:
        # Update existing limit
        existing.monthly_limit = budget_in.monthly_limit
        db.commit()
        db.refresh(existing)
        b = existing
    else:
        b = Budget(
            user_id=current_user.id,
            category=budget_in.category.strip(),
            monthly_limit=budget_in.monthly_limit,
            month=budget_in.month,
            year=budget_in.year
        )
        db.add(b)
        db.commit()
        db.refresh(b)

    # Calculate current spent
    spent = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.category == b.category,
        extract('month', Expense.expense_date) == b.month,
        extract('year', Expense.expense_date) == b.year
    ).all()
    total_spent = sum(e.amount for e in spent)
    remaining = max(0.0, b.monthly_limit - total_spent)
    pct = round((total_spent / b.monthly_limit) * 100, 1) if b.monthly_limit > 0 else 0.0

    return BudgetResponse(
        id=b.id,
        user_id=b.user_id,
        category=b.category,
        monthly_limit=b.monthly_limit,
        month=b.month,
        year=b.year,
        spent=round(total_spent, 2),
        remaining=round(remaining, 2),
        percentage=pct,
        status="over_budget" if pct > 100 else ("warning" if pct >= 80 else "normal"),
        created_at=b.created_at,
        updated_at=b.updated_at
    )

@router.put("/{budget_id}", response_model=BudgetResponse)
def update_budget(
    budget_id: int,
    budget_in: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")

    b.monthly_limit = budget_in.monthly_limit
    db.commit()
    db.refresh(b)

    # Calculate spent
    spent = db.query(Expense).filter(
        Expense.user_id == current_user.id,
        Expense.category == b.category,
        extract('month', Expense.expense_date) == b.month,
        extract('year', Expense.expense_date) == b.year
    ).all()
    total_spent = sum(e.amount for e in spent)
    remaining = max(0.0, b.monthly_limit - total_spent)
    pct = round((total_spent / b.monthly_limit) * 100, 1) if b.monthly_limit > 0 else 0.0

    return BudgetResponse(
        id=b.id,
        user_id=b.user_id,
        category=b.category,
        monthly_limit=b.monthly_limit,
        month=b.month,
        year=b.year,
        spent=round(total_spent, 2),
        remaining=round(remaining, 2),
        percentage=pct,
        status="over_budget" if pct > 100 else ("warning" if pct >= 80 else "normal"),
        created_at=b.created_at,
        updated_at=b.updated_at
    )

@router.delete("/{budget_id}")
def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    b = db.query(Budget).filter(
        Budget.id == budget_id,
        Budget.user_id == current_user.id
    ).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found.")

    db.delete(b)
    db.commit()
    return {"message": "Budget deleted successfully.", "id": budget_id}
