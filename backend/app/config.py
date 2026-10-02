import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "SpendIQ"
    TAGLINE: str = "Understand your spending. Improve your finances."
    API_V1_STR: str = "/api"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "spendiq-super-secret-jwt-key-2026-production-ready")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./spendiq.db")
    MYSQL_FALLBACK_URL: str = "sqlite:///./spendiq.db"
    
    # AI / LLM Configuration
    AI_API_KEY: Optional[str] = os.getenv("AI_API_KEY", None)
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "auto") # "gemini", "openai", "auto"
    
    # Storage
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
    
    # Defaults
    DEFAULT_CURRENCY: str = "INR"

    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()
