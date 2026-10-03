import os
import sys
from datetime import date

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.app.services.ai_service import ai_service

def test_problematic_invoice_exact_raw_ocr():
    """
    Test the exact raw OCR text from the problematic invoice:
    0: (just) Invoice
    1: Company
    2: name
    3: Inveee to: Invoice date
    4: Pesi naldo 2nd June
    5: 325. Btz street Invoke no
    6: +123456700 00325
    7: Description Price
    8: Your title here
    9: Lorem ipsum dolor St amet consectetuer adipis $49
    10: cing elit sed diom nonummy nibh evismod.
    11: Your title here
    12: Lorem ipwm dolor sit arnef consectetuer adipis $51
    13: cing elit sed diam nonummy nibh et-ismod.
    14: Sub total: $100
    15: Payment info
    16: Tax:
    17: Account here
    18: NC here Total: Sloo
    19: Bank details here
    20: Thank you for your business!
    """
    lines = [
        "(just) Invoice",
        "Company",
        "name",
        "Inveee to: Invoice date",
        "Pesi naldo 2nd June",
        "325. Btz street Invoke no",
        "+123456700 00325",
        "Description Price",
        "Your title here",
        "Lorem ipsum dolor St amet consectetuer adipis $49",
        "cing elit sed diom nonummy nibh evismod.",
        "Your title here",
        "Lorem ipwm dolor sit arnef consectetuer adipis $51",
        "cing elit sed diam nonummy nibh et-ismod.",
        "Sub total: $100",
        "Payment info",
        "Tax:",
        "Account here",
        "NC here Total: Sloo",
        "Bank details here",
        "Thank you for your business!"
    ]
    raw_text = "\n".join(lines)
    result = ai_service.extract_receipt_data({"raw_text": raw_text, "lines": lines})

    # Line item assertions
    assert len(result["items"]) == 2, f"Expected 2 items, got {result['items']}"
    assert result["items"][0]["price"] == 49.0
    assert result["items"][1]["price"] == 51.0
    item_sum = sum(it["price"] for it in result["items"])
    assert item_sum == 100.0

    # Subtotal & Grand Total assertions
    assert result["subtotal"] == 100.0
    assert result["amount"] == 100.0, f"Expected total 100.0, got {result['amount']}"
    assert result["amount"] != 374.0, "Total must NOT be 374!"
    assert result["amount"] != 325.0, "Invoice number 00325 must NOT become amount!"

    # Numeric noise isolation
    for it in result["items"]:
        assert "+1234" not in it["name"], "Phone number must not be an item name"
        assert "00325" not in it["name"], "Invoice number must not be an item name"
        assert "325" not in it["name"], "Address number must not be an item name"
        assert it["price"] not in [325.0, 123456700.0]

    # Currency assertion
    assert result["currency"] == "USD"

    # Date assertion: 2nd June -> 2026-06-02
    assert result["expense_date"] == "2026-06-02", f"Expected '2026-06-02', got {result['expense_date']}"

    # Merchant assertions: Reject generic labels
    assert result["merchant"] is None or result["merchant"] not in ["(just) Invoice", "Invoice", "Company", "name"]

    # Payment method assertion: No confirmed payment method found
    assert result["payment_method"] is None, f"Expected None, got {result['payment_method']}"

    # Discrepancy flag
    assert result["has_discrepancy"] is False
    assert result["is_readable"] is True

def test_generic_restaurant_receipt():
    """
    Test a standard restaurant receipt layout.
    """
    lines = [
        "Blue Tokai Coffee Roasters",
        "Koramangala 4th Block, Bengaluru",
        "GSTIN: 29ABCDE1234F1Z5",
        "Date: 15/09/2026  Time: 11:45 AM",
        "Bill No: BLR-8921",
        "--------------------------------------",
        "Flat White Regular            Rs 240.00",
        "Almond Croissant              Rs 180.00",
        "Avocado Sourdough Toast       Rs 350.00",
        "--------------------------------------",
        "Subtotal                      Rs 770.00",
        "CGST (2.5%)                   Rs 19.25",
        "SGST (2.5%)                   Rs 19.25",
        "Total Amount                  Rs 808.50",
        "Paid via UPI",
        "Thank you! Visit again."
    ]
    raw_text = "\n".join(lines)
    result = ai_service.extract_receipt_data({"raw_text": raw_text, "lines": lines})

    assert "Blue Tokai" in (result["merchant"] or "")
    assert len(result["items"]) == 3
    assert result["items"][0]["price"] == 240.0
    assert result["items"][1]["price"] == 180.0
    assert result["items"][2]["price"] == 350.0
    assert result["subtotal"] == 770.0
    assert result["amount"] == 808.50
    assert result["currency"] == "INR"
    assert result["payment_method"] == "UPI"
    assert result["expense_date"] == "2026-09-15"
    assert result["has_discrepancy"] is False

def test_discrepancy_detection_without_fabrication():
    """
    When detected grand total differs from item sum, do not invent a new total.
    Return detected total and flag has_discrepancy = True.
    """
    lines = [
        "Fresh Supermarket",
        "Date: 2026-08-10",
        "Receipt #: 4421",
        "Organic Milk 1L               Rs 65.00",
        "Brown Bread                   Rs 45.00",
        "Subtotal                      Rs 110.00",
        "Total Amount                  Rs 250.00",  # Mismatch with line items sum
        "Paid by Cash"
    ]
    raw_text = "\n".join(lines)
    result = ai_service.extract_receipt_data({"raw_text": raw_text, "lines": lines})

    assert result["amount"] == 250.0
    assert result["has_discrepancy"] is True
    assert result["payment_method"] == "Cash"
