import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load .env from backend directory or project root
current_dir = Path(__file__).resolve().parent
backend_dir = current_dir.parent
root_dir = backend_dir.parent

env_paths = [
    backend_dir / ".env",
    root_dir / ".env",
    Path(".env")
]

for env_path in env_paths:
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=False)

class Settings(BaseSettings):
    model_config = SettingsConfigDict(case_sensitive=True, extra="allow")

    PROJECT_NAME: str = "SpendIQ"
    TAGLINE: str = "Spend Smarter. Live Better."
    API_V1_STR: str = "/api"
    
    # Security
    JWT_SECRET: str = os.getenv("JWT_SECRET", "spendiq-super-secret-jwt-key-2026-production-ready")
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", str(60 * 24 * 7))) # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "mysql+pymysql://root:hibakhan123@localhost:3306/spendiq")
    
    # AI / LLM Configuration
    AI_API_KEY: Optional[str] = os.getenv("AI_API_KEY", None)
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "auto") # "gemini", "openai", "auto"
    
    # Storage
    UPLOAD_DIR: str = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "uploads"))
    
    # Defaults
    DEFAULT_CURRENCY: str = os.getenv("DEFAULT_CURRENCY", "INR")

settings = Settings()
