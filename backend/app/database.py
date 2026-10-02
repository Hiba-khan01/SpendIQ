import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

logger = logging.getLogger(__name__)

database_url = settings.DATABASE_URL

# Connect to database with robust fallback to SQLite if MySQL is unavailable
try:
    if database_url.startswith("sqlite"):
        engine = create_engine(
            database_url,
            connect_args={"check_same_thread": False}
        )
    else:
        engine = create_engine(
            database_url,
            pool_pre_ping=True,
            pool_recycle=3600
        )
        # Test connection immediately
        with engine.connect() as connection:
            pass
        logger.info("Successfully connected to primary database.")
except Exception as e:
    logger.warning(f"Failed to connect to configured DATABASE_URL ({database_url}): {e}. Falling back to SQLite.")
    database_url = "sqlite:///./spendiq.db"
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False}
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
