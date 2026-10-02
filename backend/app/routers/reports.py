from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.schemas.report import MonthlyReportResponse, MonthlyReportGenerateRequest
from backend.app.utils.security import get_current_user
from backend.app.services.report_service import report_service

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{year}/{month}", response_model=MonthlyReportResponse)
def get_monthly_report(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not (1 <= month <= 12):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid month.")
    report_data = report_service.get_or_generate_report(current_user.id, month, year, db, force_regenerate=False)
    return MonthlyReportResponse(**report_data)

@router.post("/generate", response_model=MonthlyReportResponse)
def generate_monthly_report(
    req: MonthlyReportGenerateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if not (1 <= req.month <= 12):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid month.")
    report_data = report_service.get_or_generate_report(current_user.id, req.month, req.year, db, force_regenerate=True)
    return MonthlyReportResponse(**report_data)

@router.get("/{year}/{month}/pdf")
def download_monthly_report_pdf(
    year: int,
    month: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Downloads monthly report as a formatted PDF.
    """
    if not (1 <= month <= 12):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid month.")
    
    pdf_bytes = report_service.generate_pdf(current_user.id, month, year, db)
    filename = f"SpendIQ_Report_{year}_{month:02d}.pdf"

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )
