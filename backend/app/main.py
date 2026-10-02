import os
from datetime import datetime, timezone
from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.config import settings
from backend.app.database import engine, Base, check_db_health
import backend.app.models  # ensures all models are imported for metadata creation
from backend.app.routers import (
    auth, expenses, budgets, budget_health,
    analytics, insights, reports, profile
)

# Initialize DB tables automatically on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=f"{settings.PROJECT_NAME} API",
    description=f"{settings.TAGLINE} — Full-Stack AI Personal Finance & Expense Management Engine",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure uploads directory exists and mount static files
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(expenses.router, prefix=settings.API_V1_STR)
app.include_router(budgets.router, prefix=settings.API_V1_STR)
app.include_router(budget_health.router, prefix=settings.API_V1_STR)
app.include_router(analytics.router, prefix=settings.API_V1_STR)
app.include_router(insights.router, prefix=settings.API_V1_STR)
app.include_router(reports.router, prefix=settings.API_V1_STR)
app.include_router(profile.router, prefix=settings.API_V1_STR)

def get_health_status(response: Response):
    db_health = check_db_health()
    is_healthy = db_health.get("connected", False)
    
    if not is_healthy:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "app": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": "1.0.0",
        "database": {
            "status": "connected" if is_healthy else "disconnected",
            "dialect": db_health.get("dialect", "unknown"),
            "name": db_health.get("database", "unknown"),
            **({"error": db_health.get("error")} if not is_healthy else {})
        },
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/health", tags=["Health"])
def health(response: Response):
    return get_health_status(response)

@app.get("/api/health", tags=["Health"])
def api_health(response: Response):
    return get_health_status(response)

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "tagline": settings.TAGLINE,
        "docs": "/docs",
        "health": "/health"
    }
