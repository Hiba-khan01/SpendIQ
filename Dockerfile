# Production Dockerfile for SpendIQ FastAPI Backend on Render Linux
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8000

# Install Linux system dependencies and Tesseract OCR
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    tesseract-ocr \
    tesseract-ocr-eng \
    libtesseract-dev \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r ./backend/requirements.txt

# Copy backend code, ML models, and seed files
COPY backend ./backend
COPY ml ./ml
COPY seed.py ./seed.py

# Create ephemeral uploads directory for temporary receipt processing
RUN mkdir -p uploads

# Expose default port
EXPOSE 8000

# Start FastAPI using dynamic PORT for Render
CMD ["sh", "-c", "uvicorn backend.app.main:app --host 0.0.0.0 --port ${PORT}"]
