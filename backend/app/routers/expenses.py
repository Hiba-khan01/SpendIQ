import os
import uuid
import math
from typing import Optional, List, Dict, Any
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc, asc, or_
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.expense import Expense
from backend.app.schemas.expense import (
    ExpenseCreate, ExpenseUpdate, ExpenseResponse,
    NaturalLanguageInput, NaturalLanguageResponse, ReceiptScanResponse
)
from backend.app.utils.security import get_current_user
from backend.app.services.ai_service import ai_service
from backend.app.services.ocr_service import ocr_service
from backend.app.services.categorization_service import categorization_service

router = APIRouter(prefix="/expenses", tags=["Expenses"])

@router.get("")
def list_expenses(
    search: Optional[str] = None,
    category: Optional[str] = None,
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    min_amount: Optional[float] = None,
    max_amount: Optional[float] = None,
    source: Optional[str] = None,
    payment_method: Optional[str] = None,
    sort_by: str = "expense_date", # expense_date, amount, merchant, created_at
    sort_order: str = "desc",      # asc, desc
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Expense).filter(Expense.user_id == current_user.id)

    # Search filter
    if search and search.strip():
        s = f"%{search.strip()}%"
        query = query.filter(
            or_(
                Expense.merchant.ilike(s),
                Expense.description.ilike(s),
                Expense.category.ilike(s),
                Expense.subcategory.ilike(s)
            )
        )

    # Category filter
    if category and category.strip() and category != "All":
        query = query.filter(Expense.category == category.strip())

    # Source filter
    if source and source.strip() and source != "All":
        query = query.filter(Expense.source == source.strip())

    # Payment method filter
    if payment_method and payment_method.strip() and payment_method != "All":
        query = query.filter(Expense.payment_method == payment_method.strip())

    # Date range filter
    if start_date:
        query = query.filter(Expense.expense_date >= start_date)
    if end_date:
        query = query.filter(Expense.expense_date <= end_date)

    # Amount range filter
    if min_amount is not None:
        query = query.filter(Expense.amount >= min_amount)
    if max_amount is not None:
        query = query.filter(Expense.amount <= max_amount)

    # Total count before pagination
    total = query.count()

    # Sorting
    sort_col = getattr(Expense, sort_by, Expense.expense_date)
    if sort_order.lower() == "asc":
        query = query.order_by(asc(sort_col), asc(Expense.id))
    else:
        query = query.order_by(desc(sort_col), desc(Expense.id))

    # Pagination
    offset = (page - 1) * limit
    items = query.offset(offset).limit(limit).all()
    pages = math.ceil(total / limit) if limit > 0 else 1

    return {
        "items": [ExpenseResponse.model_validate(item) for item in items],
        "total": total,
        "page": page,
        "limit": limit,
        "pages": pages
    }

@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(
    expense_in: ExpenseCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # If category confidence is not provided, evaluate it
    conf = expense_in.confidence_score
    cat = expense_in.category
    if not cat:
        pred_cat, pred_conf, _ = categorization_service.predict_category(f"{expense_in.merchant} {expense_in.description or ''}")
        cat = pred_cat
        conf = pred_conf

    new_expense = Expense(
        user_id=current_user.id,
        amount=expense_in.amount,
        merchant=expense_in.merchant.strip(),
        description=expense_in.description.strip() if expense_in.description else None,
        category=cat,
        subcategory=expense_in.subcategory.strip() if expense_in.subcategory else None,
        payment_method=expense_in.payment_method or "UPI",
        expense_date=expense_in.expense_date or date.today(),
        source=expense_in.source or "manual",
        confidence_score=conf,
        receipt_image_path=expense_in.receipt_image_path
    )
    db.add(new_expense)
    db.commit()
    db.refresh(new_expense)
    return new_expense

@router.get("/{expense_id}", response_model=ExpenseResponse)
def get_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")
    return expense

@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    expense_in: ExpenseUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")

    update_data = expense_in.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(expense, key, value)

    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/{expense_id}", status_code=status.HTTP_200_OK)
def delete_expense(
    expense_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    expense = db.query(Expense).filter(
        Expense.id == expense_id,
        Expense.user_id == current_user.id
    ).first()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found.")

    db.delete(expense)
    db.commit()
    return {"message": "Expense deleted successfully.", "id": expense_id}

@router.post("/natural-language", response_model=NaturalLanguageResponse)
def parse_natural_language_expense(
    nl_input: NaturalLanguageInput,
    current_user: User = Depends(get_current_user)
):
    """
    Parses user natural language string using AI service and returns structured data
    for user confirmation before saving.
    """
    result = ai_service.extract_natural_language_expense(nl_input.text)
    return NaturalLanguageResponse(**result)

@router.post("/receipt", response_model=ReceiptScanResponse)
async def scan_receipt(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """
    Accepts receipt image, runs OCR + AI extraction, and returns structured data for confirmation.
    """
    # Validate extension
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload JPG, JPEG, or PNG."
        )

    # Save uploaded file
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_id = f"{uuid.uuid4().hex}{ext}"
    saved_path = os.path.join(settings.UPLOAD_DIR, file_id)

    contents = await file.read()
    # Check file size (max 10MB)
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size exceeds maximum allowed limit (10 MB)."
        )

    with open(saved_path, "wb") as f:
        f.write(contents)

    # Run OCR
    raw_ocr_text = ocr_service.extract_text_from_image(saved_path)

    # AI structured extraction
    relative_image_path = f"/uploads/{file_id}"
    extracted_data = ai_service.extract_receipt_data(raw_ocr_text, relative_image_path)

    return ReceiptScanResponse(**extracted_data)

@router.post("/categorize")
def live_categorize(payload: Dict[str, str], current_user: User = Depends(get_current_user)):
    """
    Live helper to categorize text on-the-fly while typing in the UI.
    """
    text = payload.get("text", "")
    category, confidence, requires_confirmation = categorization_service.predict_category(text)
    return {
        "category": category,
        "confidence_score": confidence,
        "requires_confirmation": requires_confirmation
    }
