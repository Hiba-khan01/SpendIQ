import os
import sys
from datetime import date
from fastapi.testclient import TestClient

# Ensure root is on path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["app"] == "SpendIQ"

def test_auth_and_user_flows():
    # 1. Login with demo user
    login_resp = client.post("/api/auth/login", json={
        "email": "demo@spendiq.app",
        "password": "Demo@123"
    })
    assert login_resp.status_code == 200
    token_data = login_resp.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Test /api/auth/me
    me_resp = client.get("/api/auth/me", headers=headers)
    assert me_resp.status_code == 200
    me_data = me_resp.json()
    assert me_data["email"] == "demo@spendiq.app"
    assert me_data["name"] == "Alex Sharma"

    # 3. Test Register New User
    import uuid
    test_email = f"tester_{uuid.uuid4().hex[:8]}@spendiq.app"
    reg_resp = client.post("/api/auth/register", json={
        "name": "Test User",
        "email": test_email,
        "password": "Password@123",
        "monthly_income": 60000.0,
        "currency": "INR"
    })
    assert reg_resp.status_code == 201
    user_token = reg_resp.json()["access_token"]
    user_headers = {"Authorization": f"Bearer {user_token}"}

    # 4. Test Create Expense
    exp_resp = client.post("/api/expenses", headers=user_headers, json={
        "amount": 450.0,
        "merchant": "Swiggy",
        "description": "Lunch with colleagues",
        "category": "Food",
        "payment_method": "UPI",
        "expense_date": date.today().isoformat()
    })
    assert exp_resp.status_code == 201
    exp_data = exp_resp.json()
    exp_id = exp_data["id"]
    assert exp_data["amount"] == 450.0
    assert exp_data["merchant"] == "Swiggy"

    # 5. Test Get Expenses List
    list_resp = client.get("/api/expenses", headers=user_headers)
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert list_data["total"] >= 1
    assert any(item["id"] == exp_id for item in list_data["items"])

    # 6. Test Update Expense
    update_resp = client.put(f"/api/expenses/{exp_id}", headers=user_headers, json={
        "amount": 500.0,
        "description": "Lunch buffet"
    })
    assert update_resp.status_code == 200
    assert update_resp.json()["amount"] == 500.0

    # 7. Test Natural Language Parsing (Complete)
    nl_resp = client.post("/api/expenses/natural-language", headers=user_headers, json={
        "text": "Spent 650 on dinner at Zomato yesterday using UPI"
    })
    assert nl_resp.status_code == 200
    nl_data = nl_resp.json()
    assert nl_data["amount"] == 650.0
    assert nl_data["merchant"] == "Zomato"
    assert nl_data["category"] == "Food"
    assert nl_data["payment_method"] == "UPI"
    assert nl_data["is_complete"] is True

    # 8. Test Natural Language Missing Amount Handling
    nl_missing = client.post("/api/expenses/natural-language", headers=user_headers, json={
        "text": "Spent money on food at cafe"
    })
    assert nl_missing.status_code == 200
    nl_missing_data = nl_missing.json()
    assert nl_missing_data["amount"] is None
    assert "amount" in nl_missing_data["missing_fields"]
    assert nl_missing_data["is_complete"] is False

    # 9. Test Budget Creation & Tracking
    budget_resp = client.post("/api/budgets", headers=user_headers, json={
        "category": "Food",
        "monthly_limit": 5000.0,
        "month": date.today().month,
        "year": date.today().year
    })
    assert budget_resp.status_code == 201
    b_data = budget_resp.json()
    assert b_data["monthly_limit"] == 5000.0
    assert b_data["spent"] == 500.0
    assert b_data["remaining"] == 4500.0

    # 10. Test Budget Health Calculation
    health_resp = client.get("/api/budget-health", headers=user_headers)
    assert health_resp.status_code == 200
    health_data = health_resp.json()
    assert 0 <= health_data["score"] <= 100
    assert health_data["status"] in ["Healthy", "Moderate", "Warning", "Critical"]
    assert len(health_data["reasons"]) > 0

    # 11. Test Analytics Summary & Categories
    summary_resp = client.get("/api/analytics/summary", headers=user_headers)
    assert summary_resp.status_code == 200
    summary_data = summary_resp.json()
    assert summary_data["total_expenses"] == 500.0
    assert summary_data["total_income"] == 60000.0

    cats_resp = client.get("/api/analytics/categories", headers=user_headers)
    assert cats_resp.status_code == 200
    assert len(cats_resp.json()) >= 1

    # 12. Test Monthly Reports
    today = date.today()
    rep_resp = client.get(f"/api/reports/{today.year}/{today.month}", headers=user_headers)
    assert rep_resp.status_code == 200
    rep_data = rep_resp.json()
    assert rep_data["month"] == today.month
    assert rep_data["total_expenses"] == 500.0
    assert len(rep_data["recommendations"]) > 0

    # 13. Test PDF Download
    pdf_resp = client.get(f"/api/reports/{today.year}/{today.month}/pdf", headers=user_headers)
    assert pdf_resp.status_code == 200
    assert pdf_resp.headers["content-type"] == "application/pdf"
    assert len(pdf_resp.content) > 1000

    # 14. Test Delete Expense
    del_resp = client.delete(f"/api/expenses/{exp_id}", headers=user_headers)
    assert del_resp.status_code == 200

    # 15. Security Isolation: verify tester cannot access demo user's expenses
    demo_exp_resp = client.get("/api/expenses", headers=headers)
    demo_first_id = demo_exp_resp.json()["items"][0]["id"]
    unauthorized_del = client.delete(f"/api/expenses/{demo_first_id}", headers=user_headers)
    assert unauthorized_del.status_code == 404

    print("All 15 Backend Test Scenarios Passed Successfully!")

if __name__ == "__main__":
    test_health_check()
    test_auth_and_user_flows()
