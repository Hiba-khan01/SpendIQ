from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.database import Base

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    monthly_limit = Column(Float, nullable=False)
    month = Column(Integer, nullable=False) # 1 - 12
    year = Column(Integer, nullable=False)  # e.g. 2026
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        UniqueConstraint('user_id', 'category', 'month', 'year', name='uq_user_category_month_year'),
    )

    user = relationship("User", back_populates="budgets")
