import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.app.config import settings
from backend.app.database import engine, Base
import backend.app.models # ensures all models are imported for metadata creation
from backend.app.routers import (
    auth, expenses, budgets, budget_health,
    analytics, insights, reports, profile
)

# Initialize DB tables
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

@app.get("/api/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "app": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "version": "1.0.0"
    }

@app.get("/", tags=["Root"])
def root():
    return {
        "message": f"Welcome to {settings.PROJECT_NAME} API",
        "tagline": settings.TAGLINE,
        "docs": "/docs"
    }
