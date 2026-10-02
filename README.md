# SpendIQ — Spend Smarter. Live Better.

> **SpendIQ** is an AI-powered personal finance and expense management platform built with FastAPI, React (Vite), Tailwind CSS, Scikit-learn, and SQLAlchemy.

---

## 🌟 Product Highlights

- 🧠 **AI Natural Language Expense Parsing**: Type expenses naturally (e.g. *"Spent ₹650 on dinner at Swiggy yesterday using UPI"*).
- 📸 **AI Receipt Scanner**: Upload or drag-and-drop receipt images with OCR line item extraction and category prediction.
- 🎯 **Machine Learning Categorization**: Custom TF-IDF + Logistic Regression pipeline trained on real-world Indian & global transactions.
- 🛡️ **Budget Health Score (Signature Feature)**: Algorithmic 0–100 financial discipline gauge with transparent factor breakdowns (savings rate, budget utilization, category discipline, spending velocity).
- 📊 **Interactive Analytics**: Monthly spending trends, category donut distribution, weekend vs weekday spending, and merchant rankings.
- 📑 **Executive Monthly Reports**: Comprehensive monthly reviews, category month-over-month (MoM) shift comparisons, AI recommendations, and **downloadable PDF export**.
- 🔒 **Enterprise-Grade Security**: Password hashing with bcrypt, JWT authentication, per-user data isolation, and protected API routes.

---

## 🏗️ Architecture

```text
React (Vite + Tailwind CSS + Recharts)
                ↓ [REST API + JWT]
FastAPI Application Layer (Pydantic Schemas + Security)
                ↓
Service Layer (AI Service, Categorizer, Analytics, Budget Health, OCR, Reports)
        ↓                    ↓                       ↓
Machine Learning       LLM / NLP Engine        SQLAlchemy ORM
(TF-IDF + LogReg)    (Structured Prompts)     (MySQL / SQLite)
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, JavaScript, Tailwind CSS v4, React Router v7, Axios, Recharts, Lucide React |
| **Backend** | Python 3.11+, FastAPI, SQLAlchemy 2.0, Pydantic v2, PyJWT, bcrypt, ReportLab |
| **Database** | MySQL 8.0 (with automatic zero-friction SQLite fallback for local development) |
| **Machine Learning** | Scikit-learn (TF-IDF Vectorizer + Logistic Regression), Pandas, NumPy, Joblib |
| **AI / OCR** | Prompt Engineering, Rule-based NLP Parser + Gemini/OpenAI integration, Tesseract/EasyOCR fallback |

---

## 📁 Project Structure

```text
spendiq/
├── frontend/                     # React + Vite Application
│   ├── src/
│   │   ├── components/           # Common, Dashboard, Expenses, Budgets, Reports, Insights
│   │   ├── context/              # AuthContext, ToastContext
│   │   ├── layouts/              # DashboardLayout, AuthLayout
│   │   ├── pages/                # Dashboard, Expenses, AddExpense, ReceiptScanner, Budgets, etc.
│   │   ├── routes/               # AppRoutes (Public & Protected)
│   │   ├── services/             # Axios API Services (Auth, Expenses, Budgets, Analytics, etc.)
│   │   └── utils/                # Constants, Formatters
│   ├── package.json
│   └── vite.config.js
│
├── backend/                      # FastAPI Python Application
│   ├── app/
│   │   ├── models/               # SQLAlchemy Models (User, Expense, Budget, Report, Insight, Setting)
│   │   ├── schemas/              # Pydantic Schemas for Validation & OpenAPI
│   │   ├── routers/              # Auth, Expenses, Budgets, Health, Analytics, Insights, Reports, Profile
│   │   ├── services/             # AI Engine, ML Categorizer, Analytics, Budget Health, OCR, PDF Exporter
│   │   ├── utils/                # Security (bcrypt, JWT), Date Parser, PDF Exporter
│   │   ├── config.py             # Environment Settings
│   │   ├── database.py           # DB Engine & Session Management
│   │   └── main.py               # FastAPI App Entrypoint & Static Uploads
│   ├── seed.py                   # 3-Month Demo Data Seeder
│   ├── requirements.txt
│   └── tests/                    # 15+ Automated Backend & Integration Tests
│
├── ml/                           # ML Training & Datasets
│   ├── datasets/                 # expenses_train.csv
│   ├── training/                 # train_categorizer.py
│   └── models/                   # categorizer.joblib
│
├── uploads/                      # Uploaded receipt image assets
├── seed.py                       # Root seeder script
├── docker-compose.yml
└── README.md
```

---

## 🗄️ Database Schema

- `users`: User credentials, authentication hashes, timestamps.
- `user_settings`: Base currency (default: `INR`), monthly income benchmark.
- `expenses`: Amount, merchant, category, subcategory, payment method, date, source (`manual`, `natural_language`, `receipt`), confidence score, receipt image path.
- `budgets`: Category limits, month, year, composite unique constraint `(user_id, category, month, year)`.
- `monthly_reports`: Month, year, total income, expenses, savings, savings rate, AI summary text.
- `ai_insights`: Categorized insight cards, severity tags (`info`, `warning`, `success`), timestamps.

---

## 🚀 Quick Start & Installation

### 1. Prerequisites
- Python 3.11+
- Node.js v18+ & npm

### 2. Backend Setup

```bash
# Clone the repository and navigate to root
cd spendiq

# Install Python requirements
pip install -r backend/requirements.txt

# Seed Database with 3 months of realistic demo data
python seed.py

# Launch FastAPI Backend Server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`

### 3. Frontend Setup

```bash
# In a new terminal tab, navigate to frontend/
cd frontend

# Install dependencies
npm install

# Start Vite Development Server
npm run dev
```

- Web Application: `http://localhost:5173`

---

## 🔑 Demo Account Credentials

You can test the application immediately with pre-loaded demo transactions:

- **Email**: `demo@spendiq.app`
- **Password**: `Demo@123`
- *(Or click the "Auto Fill Demo" button directly on the login page)*

---

## 🧪 Testing

Run the automated backend test suite:

```bash
python backend/tests/test_backend.py
```

Validates 15 core scenarios:
1. Health check & uptime
2. Authentication & token decoding
3. User registration & profile defaults
4. Expense creation, retrieval, and pagination
5. Expense updating and deletion
6. Natural language AI parsing with relative dates
7. Natural language missing amount validation
8. Category ML inference
9. Category budget creation & tracking
10. Budget Health Score calculation & factor transparency
11. Analytics metrics & category distribution
12. Monthly financial report compilation
13. ReportLab PDF streaming & download
14. Security data isolation between multiple users

---

## 📄 License
MIT License. SpendIQ — Understand your spending. Improve your finances.
