import os
import sys
from datetime import date
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.database import engine, SessionLocal
from backend.app.models.expense import Expense
from backend.app.models.user import User

client = TestClient(app)

def create_receipt_image(lines, filename):
    img = Image.new("RGB", (900, 1100), color="#FFFFFF")
    d = ImageDraw.Draw(img)
    
    font_path = "C:/Windows/Fonts/segoeui.ttf"
    font_bold_path = "C:/Windows/Fonts/segoeuib.ttf"
    
    f_title = ImageFont.truetype(font_bold_path if os.path.exists(font_bold_path) else font_path, 34)
    f_body = ImageFont.truetype(font_path, 26)
    f_bold = ImageFont.truetype(font_bold_path if os.path.exists(font_bold_path) else font_path, 28)
    
    y = 50
    for idx, (text, style) in enumerate(lines):
        f = f_title if style == "title" else (f_bold if style == "bold" else f_body)
        color = "#111827" if style in ["title", "bold"] else "#374151"
        d.text((60, y), text, fill=color, font=f)
        y += 45 if style == "title" else 40
        
    img.save(filename)
    return filename

def test_full_receipt_pipeline():
    print("=== STARTING RECEIPT PIPELINE VERIFICATION ===")
    
    # 1. Login with demo user
    login_resp = client.post("/api/auth/login", json={
        "email": "demo@spendiq.app",
        "password": "Demo@123"
    })
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # ----------------------------------------------------
    # TEST 1: Fresh Mart & Cafe (The User's Exact Problem Case)
    # ----------------------------------------------------
    r1_lines = [
        ("FRESH MART & CAFE", "title"),
        ("123 MG Road, Bengaluru - 560001", "body"),
        ("Date: 02/10/2026   Time: 14:20", "body"),
        ("Invoice #: 84912", "body"),
        ("----------------------------------------------------------", "body"),
        ("Gourmet Sandwich               Rs 320.00", "body"),
        ("Fresh Cold Brew Coffee         Rs 210.00", "body"),
        ("Chocolate Cookie               Rs 120.00", "body"),
        ("----------------------------------------------------------", "body"),
        ("Subtotal                       Rs 650.00", "body"),
        ("GST (5%)                       Rs 32.50", "body"),
        ("GRAND TOTAL                    Rs 682.50", "bold"),
        ("Payment Method: UPI", "body"),
        ("Thank you for your visit!", "body"),
    ]
    r1_file = create_receipt_image(r1_lines, "test_fresh_mart.png")
    
    with open(r1_file, "rb") as f:
        scan_resp1 = client.post(
            "/api/expenses/receipt",
            headers=headers,
            files={"file": ("test_fresh_mart.png", f, "image/png")}
        )
    
    assert scan_resp1.status_code == 200, f"Scan 1 failed: {scan_resp1.text}"
    data1 = scan_resp1.json()
    
    print("\n[RECEIPT 1 EXTRACTED DATA]:")
    print(f"  Merchant:     {data1['merchant']}")
    print(f"  Total Amount: Rs. {data1['amount']} (Expected ~682.50 or 650.00, NEVER 84912)")
    print(f"  Category:     {data1['category']}")
    print(f"  Payment:      {data1['payment_method']}")
    print(f"  Items ({len(data1['items'])}): {data1['items']}")
    print(f"  Is Readable:  {data1['is_readable']}")
    
    # Strict Assertions for Receipt 1
    assert "FRESH MART" in data1["merchant"].upper()
    assert data1["amount"] in [682.5, 682.50, 650.0, 650]
    assert data1["amount"] != 84912, "CRITICAL ERROR: Invoice number 84912 was incorrectly chosen as grand total!"
    assert len(data1["items"]) >= 2
    assert data1["payment_method"] == "UPI"
    assert data1["is_readable"] is True
    
    # ----------------------------------------------------
    # TEST 2: Reliance Digital (Completely Different Receipt)
    # ----------------------------------------------------
    r2_lines = [
        ("RELIANCE DIGITAL RETAIL", "title"),
        ("Store #552, Indiranagar", "body"),
        ("Date: 2026-10-01   Invoice: INV-990234", "body"),
        ("----------------------------------------------------------", "body"),
        ("Sony Wireless Headphones       Rs 2,499.00", "body"),
        ("USB Type-C Fast Cable          Rs 450.00", "body"),
        ("----------------------------------------------------------", "body"),
        ("TOTAL AMOUNT                   Rs 2,949.00", "bold"),
        ("Paid by Credit Card", "body"),
    ]
    r2_file = create_receipt_image(r2_lines, "test_reliance_digital.png")
    
    with open(r2_file, "rb") as f:
        scan_resp2 = client.post(
            "/api/expenses/receipt",
            headers=headers,
            files={"file": ("test_reliance_digital.png", f, "image/png")}
        )
        
    assert scan_resp2.status_code == 200, f"Scan 2 failed: {scan_resp2.text}"
    data2 = scan_resp2.json()
    
    print("\n[RECEIPT 2 EXTRACTED DATA]:")
    print(f"  Merchant:     {data2['merchant']}")
    print(f"  Total Amount: Rs. {data2['amount']} (Expected 2949.00)")
    print(f"  Category:     {data2['category']}")
    print(f"  Payment:      {data2['payment_method']}")
    print(f"  Items ({len(data2['items'])}): {data2['items']}")
    print(f"  Is Readable:  {data2['is_readable']}")
    
    # Strict Assertions for Receipt 2
    assert "RELIANCE" in data2["merchant"].upper()
    assert data2["amount"] == 2949.0
    assert data2["payment_method"] == "Credit Card"
    assert len(data2["items"]) >= 1
    assert data2["amount"] != data1["amount"], "Receipt 1 and 2 must have distinct totals!"
    assert data2["merchant"] != data1["merchant"], "Receipt 1 and 2 must have distinct merchants!"
    
    # ----------------------------------------------------
    # TEST 3: Confirm & Save Receipt Transaction to MySQL
    # ----------------------------------------------------
    save_resp = client.post(
        "/api/expenses",
        headers=headers,
        json={
            "amount": data1["amount"],
            "merchant": data1["merchant"],
            "description": ", ".join(i["name"] for i in data1["items"][:3]),
            "category": data1["category"],
            "subcategory": "Cafe / Dining",
            "payment_method": data1["payment_method"],
            "expense_date": data1["expense_date"],
            "source": "receipt",
            "confidence_score": data1["confidence_score"],
            "receipt_image_path": data1["receipt_image_path"]
        }
    )
    assert save_resp.status_code == 201, f"Save expense failed: {save_resp.text}"
    saved_exp = save_resp.json()
    exp_id = saved_exp["id"]
    
    print(f"\n[MYSQL EXPENSE SAVED]: ID={exp_id}, Amount=Rs. {saved_exp['amount']}, Merchant='{saved_exp['merchant']}', Image='{saved_exp['receipt_image_path']}'")
    
    # Verify in MySQL session directly
    db = SessionLocal()
    db_exp = db.query(Expense).filter(Expense.id == exp_id).first()
    assert db_exp is not None
    assert db_exp.amount == data1["amount"]
    assert db_exp.source == "receipt"
    assert db_exp.receipt_image_path == data1["receipt_image_path"]
    db.close()
    
    # Cleanup test files
    for fl in [r1_file, r2_file]:
        if os.path.exists(fl):
            os.remove(fl)
            
    print("\n=======================================================")
    print(" ALL RECEIPT OCR & PIPELINE CHECKS PASSED WITH 100% ACCURACY!")
    print("=======================================================\n")

if __name__ == "__main__":
    test_full_receipt_pipeline()
