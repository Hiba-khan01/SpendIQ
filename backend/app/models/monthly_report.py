from datetime import datetime
from sqlalchemy import Column, Integer, Float, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.database import Base

class MonthlyReport(Base):
    __tablename__ = "monthly_reports"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    total_income = Column(Float, default=0.0, nullable=False)
    total_expenses = Column(Float, default=0.0, nullable=False)
    total_savings = Column(Float, default=0.0, nullable=False)
    savings_rate = Column(Float, default=0.0, nullable=False)
    report_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'month', 'year', name='uq_user_report_month_year'),
    )

    user = relationship("User", back_populates="monthly_reports")
