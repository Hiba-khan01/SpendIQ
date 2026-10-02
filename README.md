# SpendIQ — Spend Smarter. Live Better.

SpendIQ is an AI-powered personal finance and expense management platform that helps users track expenses, understand spending patterns, manage budgets, and generate personalized financial insights.

It combines React, FastAPI, MySQL, machine learning, NLP, OCR, and financial analytics into one full-stack application.

---

## 🌟 Features

- 🧠 **Natural Language Expense Entry**  
  Add expenses using everyday language such as:  
  *"Spent ₹650 on dinner at Swiggy yesterday using UPI."*  
  Extracts relevant information including amount, merchant, date, payment method, category, and subcategory with missing-field validation.

- 📸 **AI Receipt Scanner**  
  Upload receipt images and extract transaction information using OCR and intelligent parsing. Line items, dates, merchants, and totals are extracted and verified with discrepancy resolution, allowing users to review and edit details before saving.

- 🤖 **Automatic Expense Categorization**  
  Categorize expenses using a dedicated machine learning pipeline based on TF-IDF vectorization and Logistic Regression trained across 11 transaction categories.

- 🎯 **Budget Health Score**  
  A transparent 0–100 score calculated deterministically by backend logic based on:
  - **Savings Rate** (30 pts) — Ratio of monthly savings to income
  - **Budget Utilization** (30 pts) — Percentage of allocated budget consumed
  - **Category Discipline** (25 pts) — Tracking categories approaching or exceeding limits
  - **Spending Velocity** (15 pts) — Projected month-end outflow based on daily spending pace

- 📊 **Interactive Financial Analytics**  
  - Monthly spending totals and 6-month historical trends
  - Category-wise spending breakdown and percentage distributions
  - Weekend vs. weekday spending concentration
  - Top merchants by total spend and transaction frequency
  - Top 5 largest individual expenses
  - Month-over-month (MoM) spending comparisons

- 📑 **Monthly Financial Reports**  
  Generate comprehensive monthly reviews containing:
  - Total income, expenses, and savings
  - Savings rate benchmark
  - Detailed category breakdowns and budget adherence
  - Month-over-month comparative changes
  - Data-backed observations and actionable recommendations

- 📄 **PDF Report Export**  
  Export generated monthly reports as formatted, downloadable PDF documents styled with ReportLab.

- 🔐 **Secure Authentication**  
  - JWT (JSON Web Token) authentication with configurable expiry
  - Password hashing with bcrypt (safe 72-byte truncation)
  - Protected API endpoints using FastAPI OAuth2 dependency injection
  - Strict per-user data isolation

- 🗄️ **Persistent MySQL Storage**  
  Store users, expenses, budgets, reports, insights, and settings in MySQL 8.0 managed via SQLAlchemy ORM with connection pooling.

---

## 🏗️ Architecture

```text
React Frontend
(Vite + Tailwind CSS + Recharts)
        │
        │ REST API + JWT
        ▼
FastAPI Backend
(Pydantic + Authentication)
        │
        ▼
Service Layer
├── AI / NLP (Regex + Relative Date Parser)
├── OCR (WinOCR / Tesseract + Line Item Reconstruction)
├── ML Categorization (TF-IDF + Logistic Regression)
├── Analytics (Aggregations, Trends, MoM)
├── Budget Health (4-Factor Deterministic Algorithm)
└── Reports (ReportLab PDF Generation)
        │
        ▼
SQLAlchemy ORM
        │
        ▼
MySQL 8.0
```

### Machine Learning Categorization Flow

```text
Expense Description / Receipt Text
               ↓
        Text Cleaning
               ↓
     TF-IDF Vectorization
(ngram_range=(1,2), max_features=5000)
               ↓
      Logistic Regression
               ↓
       Predicted Category
               ↓
     Confidence Score & Flags
```

---

## 🛠️ Technology Stack

| Layer | Technologies | Package / Version |
|---|---|---|
| **Frontend** | React, Vite, JavaScript, Tailwind CSS, React Router, Axios, Recharts, Lucide React | `react` ^19.2.8, `vite` ^8.3.0, `tailwindcss` ^4.3.3, `react-router-dom` ^7.18.4, `axios` ^1.20.0, `recharts` ^3.10.1, `lucide-react` ^1.50.0, `canvas-confetti` ^1.9.4 |
| **Backend** | Python, FastAPI, Uvicorn, SQLAlchemy, Pydantic, PyJWT, bcrypt | Python 3.11+, `fastapi` >=0.110.0, `uvicorn` >=0.28.0, `sqlalchemy` >=2.0.0, `pydantic` >=2.6.0, `pydantic-settings` >=2.2.0, `pyjwt` >=2.8.0, `bcrypt` >=4.1.2, `passlib` >=1.7.4 |
| **Database** | MySQL 8.0 (with PyMySQL driver & connection pooling) | `pymysql` >=1.1.0, `cryptography` >=42.0.0 |
| **Machine Learning** | Scikit-learn, TF-IDF, Logistic Regression, Pandas, NumPy, Joblib | `scikit-learn` >=1.4.0, `pandas` >=2.2.0, `numpy` >=1.26.0, `joblib` >=1.3.2 |
| **AI / NLP** | Rule-based NLP parser, Prompt templates, Date parsing, LLM API integration | Custom regex & date utilities, `requests` >=2.31.0 |
| **OCR & Imaging** | Windows Media OCR (WinOCR) with Tesseract OCR fallback, Pillow | `winocr` >=0.0.15, `pillow` >=10.2.0 |
| **Reports** | ReportLab PDF generator | `reportlab` >=4.1.0 |
| **Testing** | Pytest, FastAPI TestClient, HTTPX | `pytest` >=8.0.0, `httpx` >=0.27.0 |

---

## 📁 Project Structure

```text
spendiq/
├── backend/
│   ├── app/
│   │   ├── ml/
│   │   │   └── categorizer.joblib
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── ai_insight.py
│   │   │   ├── budget.py
│   │   │   ├── expense.py
│   │   │   ├── monthly_report.py
│   │   │   ├── user.py
│   │   │   └── user_setting.py
│   │   ├── routers/
│   │   │   ├── analytics.py
│   │   │   ├── auth.py
│   │   │   ├── budget_health.py
│   │   │   ├── budgets.py
│   │   │   ├── expenses.py
│   │   │   ├── insights.py
│   │   │   ├── profile.py
│   │   │   └── reports.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── analytics.py
│   │   │   ├── auth.py
│   │   │   ├── budget.py
│   │   │   ├── budget_health.py
│   │   │   ├── expense.py
│   │   │   ├── insight.py
│   │   │   ├── profile.py
│   │   │   └── report.py
│   │   ├── services/
│   │   │   ├── prompts/
│   │   │   │   ├── expense_extraction.txt
│   │   │   │   └── insights.txt
│   │   │   ├── ai_service.py
│   │   │   ├── analytics_service.py
│   │   │   ├── budget_health_service.py
│   │   │   ├── categorization_service.py
│   │   │   ├── ocr_service.py
│   │   │   └── report_service.py
│   │   ├── utils/
│   │   │   ├── date_utils.py
│   │   │   ├── pdf_exporter.py
│   │   │   └── security.py
│   │   ├── config.py
│   │   ├── database.py
│   │   └── main.py
│   ├── tests/
│   │   ├── test_backend.py
│   │   ├── test_receipt_flow.py
│   │   └── verify_live_api.py
│   ├── requirements.txt
│   └── seed.py
│
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── budgets/
│   │   │   ├── common/
│   │   │   ├── dashboard/
│   │   │   ├── expenses/
│   │   │   ├── insights/
│   │   │   └── reports/
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ToastContext.jsx
│   │   ├── hooks/
│   │   ├── layouts/
│   │   │   ├── AuthLayout.jsx
│   │   │   └── DashboardLayout.jsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── Register.jsx
│   │   │   ├── AddExpense.jsx
│   │   │   ├── Budgets.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Expenses.jsx
│   │   │   ├── Insights.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── ReceiptScanner.jsx
│   │   │   └── Reports.jsx
│   │   ├── routes/
│   │   │   └── AppRoutes.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── authService.js
│   │   │   ├── expenseService.js
│   │   │   └── index.js
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   └── formatters.js
│   │   ├── App.css
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── ml/
│   ├── datasets/
│   │   └── expenses_train.csv
│   ├── models/
│   │   └── categorizer.joblib
│   └── training/
│       └── train_categorizer.py
│
├── uploads/
├── .env.example
├── .gitignore
├── docker-compose.yml
├── seed.py
└── README.md
```

---

## 🗄️ Database

SpendIQ uses MySQL 8.0 managed via SQLAlchemy ORM.

### Database Models

- **`users`**: Stores user authentication details, display name, email, hashed passwords (bcrypt), and account creation/update timestamps.
- **`user_settings`**: Stores user preferences including primary currency (default: `INR`) and monthly income benchmark used for savings rate calculations.
- **`expenses`**: Stores individual expense transactions including amount, merchant, description, category, subcategory, payment method (`UPI`, `Credit Card`, `Debit Card`, `Cash`, `Bank Transfer`), expense date, source tag (`manual`, `natural_language`, `receipt`), ML confidence score, and receipt image path.
- **`budgets`**: Stores monthly spending limits per category with a unique constraint on `(user_id, category, month, year)`.
- **`monthly_reports`**: Stores compiled monthly financial snapshots including total income, total expenses, total savings, savings rate, and narrative report summaries with a unique constraint on `(user_id, month, year)`.
- **`ai_insights`**: Stores generated financial insight items categorized by type (`trend`, `warning`, `opportunity`, `anomaly`, `savings`) and severity (`info`, `warning`, `success`).

---

## 🧾 Receipt Processing

The receipt scanning pipeline processes uploaded receipt images and extracts transaction data:

```text
Receipt Image (PNG / JPG / WEBP)
               ↓
  Image Preprocessing (Pillow)
 (Resolution scaling & contrast boost)
               ↓
        OCR Extraction
(WinOCR native engine / Tesseract fallback)
               ↓
 Horizontal Line Reconstruction
  (Word bounding-box alignment)
               ↓
      Structured Parsing
 ├── Merchant Name Detection
 ├── Date Extraction (ISO / relative)
 ├── Line Items & Individual Prices
 └── Grand Total & Subtotal Matching
               ↓
 Discrepancy Resolution Logic
(Validates line items sum against total)
               ↓
ML Category & Payment Method Detection
               ↓
 User Confirmation & Review Modal
               ↓
   MySQL Storage via SQLAlchemy
```

> **Note**: Optical Character Recognition accuracy varies based on image lighting, angle, and receipt formatting. SpendIQ displays an interactive confirmation screen before committing scanned transactions to the database so users can review or correct extracted fields.

---

## 🧠 Natural Language Expense Entry

Users can record expenses by typing natural language sentences.

### Example

> *"Spent ₹650 on dinner at Swiggy yesterday using UPI"*

### Extraction Process

1. **Amount Extraction**: Identifies numeric amounts alongside currency symbols (`₹`, `rs`, `inr`, `bucks`, etc.). If no valid amount is present, the parser flags `missing_fields: ["amount"]` and sets `is_complete: false`.
2. **Merchant Extraction**: Matches against known merchants or patterns (`at <Merchant>`, `from <Merchant>`).
3. **Date Parsing**: Converts relative terms (*"yesterday"*, *"today"*, *"last Friday"*) into exact ISO `YYYY-MM-DD` dates.
4. **Payment Method Detection**: Identifies `UPI`, `Credit Card`, `Debit Card`, `Cash`, or `Bank Transfer`.
5. **Category Prediction**: Runs the machine learning model to predict category and assign a confidence score.

---

## 🎯 Budget Health

SpendIQ calculates a deterministic **0–100 Budget Health Score** entirely in backend Python logic without relying on language model arithmetic.

### Scoring Factors

| Factor | Weight | Evaluation Criteria |
|---|---|---|
| **Savings Rate** | 30 pts | Ratio of savings (`income - expenses`) to monthly income. Healthy (30%+) yields full 30 pts, 20–30% yields 22 pts, 10–20% yields 14 pts, <10% yields 5 pts. |
| **Budget Utilization** | 30 pts | Percentage of total budget limit spent. <=70% yields 30 pts, <=85% yields 22 pts, <=100% yields 12 pts, >100% yields 0 pts. |
| **Category Discipline** | 25 pts | Tracks categories exceeding or near (>80%) limit. 0 near/over yields 25 pts, near limit yields 18 pts, 1 over yields 10 pts, >1 over yields 0 pts. |
| **Spending Velocity** | 15 pts | Daily spending pace projected across the full month against monthly income. <=75% yields 15 pts, <=90% yields 10 pts, <=100% yields 5 pts, >100% yields 0 pts. |

### Health Status Levels

- **Healthy** (80–100): Strong savings and sustainable budget pacing.
- **Moderate** (60–79): Controlled spending with minor areas for optimization.
- **Warning** (40–59): Tight savings margin or categories nearing limit.
- **Critical** (0–39): Expenses exceeding income or multiple budget breaches.

---

## 📊 Analytics

SpendIQ delivers real-time financial analytics calculated from recorded transactions:

- **Financial Summary**: Monthly income, total expenses, net savings, savings rate, and daily average spend.
- **Category Breakdown**: Total spend and percentage share per category with transaction counts.
- **Monthly History**: 6-month historical trajectory of income, expenses, and savings.
- **Weekend vs. Weekday Spending**: Expenditure distribution and percentage spent on weekends.
- **Merchant Analysis**: Top merchants ranked by total spend volume and transaction frequency.
- **Largest Expenses**: Top 5 highest individual transactions in the selected period.
- **Month-over-Month (MoM) Changes**: Percentage change in total spending and individual categories compared to the previous month.

---

## 📑 Monthly Reports

The reporting engine aggregates monthly financial performance into structured summaries:

- **Executive Metrics**: Total income, total expenses, total savings, and savings rate.
- **Category Performance**: Breakdown of spending per category with budget status indicators (`within_budget`, `near_limit`, `over_budget`).
- **MoM Comparative Analysis**: Shift in spending direction across all active categories.
- **Top Transactions**: Highlighted list of the month's largest expenses.
- **AI-Assisted Observations**: Automated insights and practical recommendations based on spending trends.
- **PDF Export**: Generate clean, print-ready PDF reports with ReportLab via `/api/reports/{year}/{month}/pdf`.

---

## 🔐 Secure Authentication

- **Password Hashing**: Strong password hashing using `bcrypt` with salt generation.
- **JWT Authentication**: Stateless token-based sessions using `PyJWT` (HS256) with configurable expiration.
- **Protected Endpoints**: Route protection via FastAPI dependencies enforcing authenticated bearer token validation.
- **Multi-Tenant Data Isolation**: Database queries strictly filter records by authenticated `user_id` to prevent cross-user data exposure.
- **Configuration Safety**: Sensitive credentials and secrets loaded via environment variables; `.env` is excluded from version control.

---

## 🚀 Getting Started

### Prerequisites

- **Python**: 3.11 or higher
- **Node.js**: v18 or higher & **npm**
- **MySQL**: 8.0 (running locally or via Docker)

### 1. Database Setup

Create the MySQL database:

```sql
CREATE DATABASE spendiq;
```

### 2. Environment Configuration

Copy the example environment file:

```bash
cp .env.example .env
```

Configure the environment variables in `.env`:

```env
DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost:3306/spendiq
JWT_SECRET=your_secure_random_jwt_secret_here
ACCESS_TOKEN_EXPIRE_MINUTES=10080
AI_API_KEY=
AI_PROVIDER=auto
DEFAULT_CURRENCY=INR
```

> **Security Warning**: Never commit `.env`, database passwords, API keys, or JWT secrets to GitHub or public repositories.

### 3. Backend Setup

```bash
# Navigate to project root
cd spendiq

# Create and activate Python virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# (Optional) Re-train the ML categorizer model
python ml/training/train_categorizer.py

# Seed the database with 3 months of realistic demo transactions
python seed.py

# Launch FastAPI backend server
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/api/health`

### 4. Frontend Setup

```bash
# In a new terminal, navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```

- Web Application: `http://localhost:5173`

---

## 🔑 Demo Account Credentials

A pre-configured demo account is created during seeding:

- **Email**: `demo@spendiq.app`
- **Password**: `Demo@123`
- *(Or click the **Auto Fill Demo** button on the login screen)*

---

## 🧪 Testing

The repository contains automated backend and integration tests.

### Running Backend Tests

Run the test suite using `pytest`:

```bash
pytest backend/tests/test_backend.py -v
```

Or execute directly with Python:

```bash
python backend/tests/test_backend.py
```

### Verified Test Scenarios

The backend test suite (`test_backend.py`) validates 15 core scenarios:

1. System health check & uptime endpoint (`/api/health`)
2. Demo user login & JWT bearer token issuance
3. Current user profile retrieval (`/api/auth/me`)
4. New user registration with default profile settings
5. Expense creation and data persistence
6. Expense retrieval and pagination listing
7. Expense updating (PUT)
8. Natural language expense parsing with relative dates
9. Natural language validation for missing amounts
10. Category budget creation and tracking
11. Budget health score calculation and factor transparency
12. Analytics summary and category distribution
13. Monthly report generation and recommendations
14. PDF report generation and binary streaming
15. User deletion & multi-tenant data isolation

Additional test suites include:
- `backend/tests/test_receipt_flow.py`: Validates OCR line item extraction, bounding-box alignment, and total discrepancy resolution.
- `backend/tests/verify_live_api.py`: Validates live API endpoint response structures.

---

## 🔄 Core Data Flow

```text
User Interaction
       │
       ▼
React Frontend (Vite + Tailwind CSS + Recharts)
       │
       │ HTTP / REST API (Axios + JWT Bearer Token)
       ▼
FastAPI Application Layer (Pydantic Validation & Security)
       │
       ▼
Business & Service Layer
├── Expense Service & Categorization (TF-IDF + Logistic Regression)
├── AI / NLP Engine (Regex + Relative Date Parser + Heuristics)
├── OCR Service (WinOCR / Tesseract + Line Item Reconstruction)
├── Analytics Service (Aggregations, Trends, MoM Calculations)
├── Budget Health Service (Deterministic 4-Factor 0-100 Algorithm)
└── Report & PDF Service (ReportLab PDF Document Generator)
       │
       ▼
SQLAlchemy ORM (Connection Pool, Session Management)
       │
       ▼
MySQL 8.0 Database (or SQLite Development Fallback)
```

---

## 🔮 Future Improvements

- Bank integrations and Open Banking APIs (Account Aggregator framework)
- Automated SMS and UPI transaction notification parsing
- Voice-based expense recording with speech-to-text
- Recurring expense detection and subscription renewal alerts
- Multi-currency support with live exchange rate conversion
- Advanced spending anomaly detection and predictive forecasting
- Shared and collaborative family / team budget pools
- Native mobile application (React Native / Flutter)

---

## 🎯 Project Goals

SpendIQ demonstrates practical implementation of:

- Full-stack web application development
- REST API architecture and OpenAPI documentation
- Secure authentication and multi-tenant data isolation
- Relational database schema design and connection pooling
- Natural language parsing and rule-based text extraction
- Optical Character Recognition (OCR) and document parsing
- Machine learning model training, serialization, and real-time inference
- Deterministic financial analytics and data visualization
- Automated report generation and PDF compilation

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
