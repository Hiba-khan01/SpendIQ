from datetime import datetime, date
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    merchant = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=False, index=True)
    subcategory = Column(String(100), nullable=True)
    payment_method = Column(String(100), default="UPI", nullable=False)
    expense_date = Column(Date, default=date.today, nullable=False, index=True)
    source = Column(String(50), default="manual", nullable=False) # manual, natural_language, receipt
    confidence_score = Column(Float, default=1.0, nullable=False)
    receipt_image_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="expenses")
