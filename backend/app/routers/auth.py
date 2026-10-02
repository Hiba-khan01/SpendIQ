from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.user_setting import UserSetting
from backend.app.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from backend.app.utils.security import verify_password, get_password_hash, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check duplicate email
    existing_user = db.query(User).filter(User.email == user_in.email.lower().strip()).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Password strength check
    if len(user_in.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # Create User
    new_user = User(
        name=user_in.name.strip(),
        email=user_in.email.lower().strip(),
        password_hash=get_password_hash(user_in.password)
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create default user setting
    setting = UserSetting(
        user_id=new_user.id,
        currency=user_in.currency or "INR",
        monthly_income=user_in.monthly_income or 75000.0
    )
    db.add(setting)
    db.commit()
    db.refresh(setting)

    # Generate JWT
    access_token = create_access_token(data={"sub": str(new_user.id)})
    
    user_resp = UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        created_at=new_user.created_at,
        currency=setting.currency,
        monthly_income=setting.monthly_income
    )

    return Token(access_token=access_token, token_type="bearer", user=user_resp)

@router.post("/login", response_model=Token)
def login(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == credentials.email.lower().strip()).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password. Please try again."
        )

    setting = db.query(UserSetting).filter(UserSetting.user_id == user.id).first()
    currency = setting.currency if setting else "INR"
    income = setting.monthly_income if setting else 75000.0

    access_token = create_access_token(data={"sub": str(user.id)})
    
    user_resp = UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        created_at=user.created_at,
        currency=currency,
        monthly_income=income
    )

    return Token(access_token=access_token, token_type="bearer", user=user_resp)

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    setting = db.query(UserSetting).filter(UserSetting.user_id == current_user.id).first()
    return UserResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        created_at=current_user.created_at,
        currency=setting.currency if setting else "INR",
        monthly_income=setting.monthly_income if setting else 75000.0
    )
