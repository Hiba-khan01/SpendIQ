import requests
import json
from datetime import date

BASE_URL = "http://127.0.0.1:8000/api"

def verify_live():
    print("=== Testing Live SpendIQ API ===")
    
    # 1. Health check
    res = requests.get(f"{BASE_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("[PASS] Health Check:", res.json())

    # 2. Login as Demo User
    login_res = requests.post(f"{BASE_URL}/auth/login", json={
        "email": "demo@spendiq.app",
        "password": "Demo@123"
    })
    assert login_res.status_code == 200, f"Login failed: {login_res.text}"
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("[PASS] Demo User Login: Token received")

    # 3. Current User Profile
    me_res = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    assert me_res.status_code == 200, f"/auth/me failed: {me_res.text}"
    print("[PASS] Authenticated Profile:", me_res.json()["name"], "-", me_res.json()["email"])

    # 4. Dashboard Analytics Summary
    summary_res = requests.get(f"{BASE_URL}/analytics/summary", headers=headers)
    assert summary_res.status_code == 200, f"Summary failed: {summary_res.text}"
    summary = summary_res.json()
    print(f"[PASS] Summary: Income={summary['total_income']}, Expenses={summary['total_expenses']}, Savings={summary['total_savings']}, Rate={summary['savings_rate']}%")

    # 5. Budget Health Score
    health_res = requests.get(f"{BASE_URL}/budget-health", headers=headers)
    assert health_res.status_code == 200, f"Budget health failed: {health_res.text}"
    health = health_res.json()
    print(f"[PASS] Budget Health: Score={health['score']}/100, Status='{health['status']}', Reasons={len(health['reasons'])} factors")

    # 6. Natural Language Extraction
    nl_res = requests.post(f"{BASE_URL}/expenses/natural-language", headers=headers, json={
        "text": "Spent 650 on dinner at Swiggy yesterday using UPI"
    })
    assert nl_res.status_code == 200, f"Natural language failed: {nl_res.text}"
    nl = nl_res.json()
    print(f"[PASS] AI Natural Language: Merchant='{nl['merchant']}', Amount={nl['amount']}, Category='{nl['category']}', Payment='{nl['payment_method']}', Confidence={nl['confidence_score']}")
    assert nl["amount"] == 650.0
    assert nl["merchant"] == "Swiggy"
    assert nl["category"] == "Food"

    # 7. Create Expense from AI Parsed data
    create_exp_res = requests.post(f"{BASE_URL}/expenses", headers=headers, json={
        "amount": nl["amount"],
        "merchant": nl["merchant"],
        "description": nl["description"],
        "category": nl["category"],
        "payment_method": nl["payment_method"],
        "expense_date": nl["expense_date"],
        "source": "natural_language",
        "confidence_score": nl["confidence_score"]
    })
    assert create_exp_res.status_code == 201, f"Expense creation failed: {create_exp_res.text}"
    new_exp_id = create_exp_res.json()["id"]
    print(f"[PASS] Expense Saved: ID={new_exp_id}")

    # 8. List Expenses with Pagination and Search
    list_res = requests.get(f"{BASE_URL}/expenses?search=Swiggy", headers=headers)
    assert list_res.status_code == 200
    assert list_res.json()["total"] >= 1
    print(f"[PASS] Filtered Expenses: Found {list_res.json()['total']} transactions for 'Swiggy'")

    # 9. Budgets
    budget_res = requests.get(f"{BASE_URL}/budgets", headers=headers)
    assert budget_res.status_code == 200
    budgets = budget_res.json()
    print(f"[PASS] Budgets: {len(budgets)} active category budgets retrieved")

    # 10. AI Insights
    insights_res = requests.get(f"{BASE_URL}/ai/insights", headers=headers)
    assert insights_res.status_code == 200
    insights = insights_res.json()
    print(f"[PASS] AI Insights: {len(insights)} active insights available")

    # 11. Monthly Report & PDF Export
    today = date.today()
    report_res = requests.get(f"{BASE_URL}/reports/{today.year}/{today.month}", headers=headers)
    assert report_res.status_code == 200
    rep = report_res.json()
    print(f"[PASS] Monthly Report: {rep['month_name']} {rep['year']} - Executive Summary generated")

    pdf_res = requests.get(f"{BASE_URL}/reports/{today.year}/{today.month}/pdf", headers=headers)
    assert pdf_res.status_code == 200
    assert len(pdf_res.content) > 1000
    print(f"[PASS] PDF Export: Successfully generated {len(pdf_res.content)} bytes PDF report")

    # Cleanup created expense
    del_res = requests.delete(f"{BASE_URL}/expenses/{new_exp_id}", headers=headers)
    assert del_res.status_code == 200
    print("[PASS] Expense Cleanup: Deleted temporary test expense")

    print("\n=======================================================")
    print(" ALL LIVE API & DATAFLOW INTEGRATION TESTS PASSED 100%!")
    print("=======================================================")

if __name__ == "__main__":
    verify_live()
