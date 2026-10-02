from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.expense import Expense
from backend.app.models.user_setting import UserSetting
from backend.app.schemas.profile import ProfileUpdate, ProfileResponse
from backend.app.utils.security import get_current_user, verify_password, get_password_hash

router = APIRouter(prefix="/profile", tags=["Profile & Settings"])

@router.get("", response_model=ProfileResponse)
def get_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    setting = db.query(UserSetting).filter(UserSetting.user_id == current_user.id).first()
    if not setting:
        setting = UserSetting(user_id=current_user.id, currency="INR", monthly_income=75000.0)
        db.add(setting)
        db.commit()
        db.refresh(setting)

    total_txs = db.query(Expense).filter(Expense.user_id == current_user.id).count()
    total_spent = db.query(func.sum(Expense.amount)).filter(Expense.user_id == current_user.id).scalar() or 0.0

    return ProfileResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        currency=setting.currency,
        monthly_income=setting.monthly_income,
        total_transactions=total_txs,
        total_spent_all_time=round(total_spent, 2),
        created_at=current_user.created_at
    )

@router.put("", response_model=ProfileResponse)
def update_profile(
    update_in: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Name update
    if update_in.name and update_in.name.strip():
        current_user.name = update_in.name.strip()

    # Password update
    if update_in.new_password:
        if not update_in.current_password or not verify_password(update_in.current_password, current_user.password_hash):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect.")
        if len(update_in.new_password) < 6:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="New password must be at least 6 characters.")
        current_user.password_hash = get_password_hash(update_in.new_password)

    # Settings update
    setting = db.query(UserSetting).filter(UserSetting.user_id == current_user.id).first()
    if not setting:
        setting = UserSetting(user_id=current_user.id, currency="INR", monthly_income=75000.0)
        db.add(setting)

    if update_in.currency:
        setting.currency = update_in.currency.strip().upper()
    if update_in.monthly_income is not None:
        setting.monthly_income = max(0.0, update_in.monthly_income)

    db.commit()
    db.refresh(current_user)
    db.refresh(setting)

    total_txs = db.query(Expense).filter(Expense.user_id == current_user.id).count()
    total_spent = db.query(func.sum(Expense.amount)).filter(Expense.user_id == current_user.id).scalar() or 0.0

    return ProfileResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        currency=setting.currency,
        monthly_income=setting.monthly_income,
        total_transactions=total_txs,
        total_spent_all_time=round(total_spent, 2),
        created_at=current_user.created_at
    )
