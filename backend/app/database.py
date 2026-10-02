import os
import re
import logging
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker
from backend.app.config import settings

logger = logging.getLogger(__name__)

def mask_database_url(url: str) -> str:
    # Mask password in connection string for safe logging
    return re.sub(r":([^:@]+)@", ":****@", url)

database_url = settings.DATABASE_URL
masked_url = mask_database_url(database_url)
logger.info(f"Initializing database connection to: {masked_url}")

# Create engine with production-ready connection pool settings
if database_url.startswith("sqlite"):
    engine = create_engine(
        database_url,
        connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(
        database_url,
        pool_pre_ping=True,
        pool_recycle=3600,
        pool_size=10,
        max_overflow=20
    )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    """
    SQLAlchemy database session dependency for FastAPI endpoints.
    Yields a session and automatically closes it after request completion.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def check_db_health() -> dict:
    """
    Check if the database connection is alive and working.
    Returns status dict with dialect and response time.
    """
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            row = result.fetchone()
            if row and row[0] == 1:
                return {
                    "connected": True,
                    "dialect": engine.dialect.name,
                    "database": engine.url.database or "default"
                }
            return {"connected": False, "error": "Query returned unexpected result"}
    except Exception as exc:
        logger.error(f"Database health check failed: {exc}")
        return {"connected": False, "error": str(exc)}
