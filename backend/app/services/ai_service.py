import os
import re
import json
import logging
from datetime import date, datetime
from typing import Dict, Any, List, Optional, Union
from backend.app.config import settings
from backend.app.utils.date_utils import parse_relative_date, get_month_name
from backend.app.services.categorization_service import categorization_service

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = settings.AI_API_KEY
        self.ai_provider = settings.AI_PROVIDER
        self.prompts_dir = os.path.join(os.path.dirname(__file__), "prompts")

    def _load_prompt(self, filename: str) -> str:
        filepath = os.path.join(self.prompts_dir, filename)
        if os.path.exists(filepath):
            with open(filepath, "r", encoding="utf-8") as f:
                return f.read()
        return ""

    def extract_natural_language_expense(self, text: str) -> Dict[str, Any]:
        """
        Parses natural language expense text into structured JSON.
        Rule: Never invent missing information. If amount is missing, flag it.
        """
        text_clean = text.strip()
        
        # 1. Check for missing amount
        amount = None
        amount_patterns = [
            r'[₹$€£]\s*([\d,]+(?:\.\d{1,2})?)',
            r'(?:rs\.?|inr|rupees)\s*([\d,]+(?:\.\d{1,2})?)',
            r'([\d,]+(?:\.\d{1,2})?)\s*(?:rs\.?|inr|rupees|bucks)',
            r'\b(?:for|spent|paid|of)\s+([\d,]+(?:\.\d{1,2})?)\b'
        ]
        
        for pat in amount_patterns:
            m = re.search(pat, text_clean, re.IGNORECASE)
            if m:
                raw_amt = m.group(1).replace(",", "")
                try:
                    amount = float(raw_amt)
                    break
                except ValueError:
                    pass
                    
        # If still not found, try stand-alone numbers
        if amount is None:
            m = re.search(r'\b(\d+(?:\.\d{1,2})?)\b', text_clean)
            if m:
                try:
                    amount = float(m.group(1))
                except ValueError:
                    pass

        missing_fields = []
        if amount is None or amount <= 0:
            missing_fields.append("amount")

        # 2. Extract Merchant & Description
        merchant = None
        
        # Check known popular merchants
        merchants_list = [
            "Swiggy", "Zomato", "Dominos", "Domino's", "McDonalds", "McDonald's", "KFC", "Starbucks", 
            "Subway", "Burger King", "Pizza Hut", "Haldirams", "Blinkit", "Zepto", "Instamart", 
            "BigBasket", "DMart", "Reliance Fresh", "Spencers", "Uber", "Ola", "Rapido", "IndiGo", 
            "Air India", "MakeMyTrip", "Cleartrip", "IRCTC", "RedBus", "Amazon", "Flipkart", "Myntra", 
            "Ajio", "Zara", "H&M", "Croma", "Reliance Digital", "Nykaa", "IKEA", "Decathlon", 
            "BookMyShow", "PVR", "INOX", "Netflix", "Spotify", "Amazon Prime", "Hotstar", "YouTube", 
            "Airtel", "Jio", "BESCOM", "Apollo", "1mg", "Practo", "Lenskart", "Udemy", "Coursera"
        ]
        for m_cand in merchants_list:
            if re.search(rf'\b{re.escape(m_cand)}\b', text_clean, re.IGNORECASE):
                merchant = m_cand
                break

        # Fallback merchant extraction: "at <Merchant>", "from <Merchant>"
        if not merchant:
            m_match = re.search(r'\b(?:at|from|to|with)\s+([A-Z][a-zA-Z0-9\s&\'\.-]{2,25})', text)
            if m_match:
                merchant = m_match.group(1).strip()

        # Extract payment method
        payment_method = "UPI"
        if re.search(r'\b(credit card|cc)\b', text_clean, re.IGNORECASE):
            payment_method = "Credit Card"
        elif re.search(r'\b(debit card|dc)\b', text_clean, re.IGNORECASE):
            payment_method = "Debit Card"
        elif re.search(r'\b(cash)\b', text_clean, re.IGNORECASE):
            payment_method = "Cash"
        elif re.search(r'\b(net banking|bank transfer|neft|imps|rtgs)\b', text_clean, re.IGNORECASE):
            payment_method = "Bank Transfer"
        elif re.search(r'\b(upi|gpay|phonepe|paytm)\b', text_clean, re.IGNORECASE):
            payment_method = "UPI"

        # Extract date
        expense_date = parse_relative_date(text_clean, date.today())
        
        # Extract Category using ML + keywords
        cat, conf, _ = categorization_service.predict_category(text_clean)
        
        subcategory_map = {
            "Food": "Dining / Food Delivery",
            "Groceries": "Daily Needs",
            "Transport": "Ride / Fuel",
            "Shopping": "Online Shopping",
            "Entertainment": "Movies & Events",
            "Subscriptions": "Digital Subscriptions",
            "Bills": "Utility Bills",
            "Healthcare": "Pharmacy / Doctor",
            "Education": "Online Courses & Books",
            "Travel": "Flights & Lodging",
            "Other": "General"
        }
        subcategory = subcategory_map.get(cat, "General")

        if not merchant:
            merchant = cat if cat != "Other" else "General Store"

        desc_match = re.search(r'\b(?:on|for)\s+([a-zA-Z\s]{3,30}?)(?:\s+at|\s+yesterday|\s+today|\s+using|\s+via|\s+with|$)', text_clean, re.IGNORECASE)
        if desc_match:
            description = desc_match.group(1).strip().capitalize()
        else:
            description = f"{cat} Expense"

        is_complete = len(missing_fields) == 0

        return {
            "amount": amount,
            "merchant": merchant,
            "description": description,
            "category": cat,
            "subcategory": subcategory,
            "payment_method": payment_method,
            "expense_date": expense_date.isoformat(),
            "confidence_score": round(conf, 2),
            "is_complete": is_complete,
            "missing_fields": missing_fields,
            "raw_text": text
        }

    def _parse_amount_str(self, raw_val: str) -> Optional[float]:
        if not raw_val:
            return None
        cleaned = raw_val.strip().replace(',', '')
        cleaned = re.sub(r'^[sS$₹€£]\s*', '', cleaned)
        if re.search(r'[0-9loO]', cleaned):
            cleaned = cleaned.replace('o', '0').replace('O', '0').replace('l', '1').replace('I', '1')
        m = re.search(r'(\d+(?:\.\d{1,2})?)', cleaned)
        if m:
            try:
                return float(m.group(1))
            except ValueError:
                pass
        return None

    def _extract_receipt_date(self, raw_text: str, clean_lines: List[str]) -> Optional[str]:
        months_map = {
            'jan': 1, 'january': 1, 'feb': 2, 'february': 2, 'mar': 3, 'march': 3,
            'apr': 4, 'april': 4, 'may': 5, 'jun': 6, 'june': 6,
            'jul': 7, 'july': 7, 'aug': 8, 'august': 8, 'sep': 9, 'sept': 9, 'september': 9,
            'oct': 10, 'october': 10, 'nov': 11, 'november': 11, 'dec': 12, 'december': 12
        }

        # Check explicit date lines first e.g. "Invoice date\n 2nd June" or "Date: 02/10/2026"
        for idx, line in enumerate(clean_lines):
            m_prefix = re.search(r'(?i)\b(?:invoice\s*date|date|dated)\b[:\s]*(.+)?', line)
            if m_prefix:
                prefix_val = m_prefix.group(1).strip() if m_prefix.group(1) else ""
                line_to_check = prefix_val if prefix_val else (clean_lines[idx + 1] if idx + 1 < len(clean_lines) else "")
                if line_to_check:
                    m1 = re.search(r'\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})(?:\s*,?\s*(20\d{2}))?\b', line_to_check)
                    if m1:
                        d = int(m1.group(1))
                        m_name = m1.group(2).lower()
                        if m_name in months_map:
                            m = months_map[m_name]
                            y = int(m1.group(3)) if m1.group(3) else date.today().year
                            if 1 <= d <= 31:
                                return f"{y:04d}-{m:02d}-{d:02d}"

                    m2 = re.search(r'\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(20\d{2}))?\b', line_to_check)
                    if m2:
                        m_name = m2.group(1).lower()
                        if m_name in months_map:
                            m = months_map[m_name]
                            d = int(m2.group(2))
                            y = int(m2.group(3)) if m2.group(3) else date.today().year
                            if 1 <= d <= 31:
                                return f"{y:04d}-{m:02d}-{d:02d}"

                    m3 = re.search(r'\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b', line_to_check)
                    if m3:
                        y, m, d = int(m3.group(1)), int(m3.group(2)), int(m3.group(3))
                        if 1 <= m <= 12 and 1 <= d <= 31:
                            return f"{y:04d}-{m:02d}-{d:02d}"

                    m4 = re.search(r'\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b', line_to_check)
                    if m4:
                        d, m, y = int(m4.group(1)), int(m4.group(2)), int(m4.group(3))
                        if 1 <= m <= 12 and 1 <= d <= 31:
                            return f"{y:04d}-{m:02d}-{d:02d}"

        # Global search in raw_text
        m1 = re.search(r'\b(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]{3,9})(?:\s*,?\s*(20\d{2}))?\b', raw_text)
        if m1:
            d = int(m1.group(1))
            m_name = m1.group(2).lower()
            if m_name in months_map:
                m = months_map[m_name]
                y = int(m1.group(3)) if m1.group(3) else date.today().year
                if 1 <= d <= 31:
                    return f"{y:04d}-{m:02d}-{d:02d}"

        m2 = re.search(r'\b([A-Za-z]{3,9})\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s*,?\s*(20\d{2}))?\b', raw_text)
        if m2:
            m_name = m2.group(1).lower()
            if m_name in months_map:
                m = months_map[m_name]
                d = int(m2.group(2))
                y = int(m2.group(3)) if m2.group(3) else date.today().year
                if 1 <= d <= 31:
                    return f"{y:04d}-{m:02d}-{d:02d}"

        m3 = re.search(r'\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b', raw_text)
        if m3:
            y, m, d = int(m3.group(1)), int(m3.group(2)), int(m3.group(3))
            if 1 <= m <= 12 and 1 <= d <= 31:
                return f"{y:04d}-{m:02d}-{d:02d}"

        m4 = re.search(r'\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b', raw_text)
        if m4:
            d, m, y = int(m4.group(1)), int(m4.group(2)), int(m4.group(3))
            if 1 <= m <= 12 and 1 <= d <= 31:
                return f"{y:04d}-{m:02d}-{d:02d}"

        return None

    def extract_receipt_data(
        self,
        ocr_input: Union[str, Dict[str, Any]],
        image_path: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extracts structured receipt information from OCR text with strict validation.
        Validates line item totals against grand total to ensure logical consistency.
        """
        # Unpack input
        if isinstance(ocr_input, dict):
            raw_text = ocr_input.get("raw_text", "")
            lines = ocr_input.get("lines", [])
        else:
            raw_text = str(ocr_input or "")
            lines = [l.strip() for l in raw_text.split("\n") if l.strip()]

        if not raw_text or len(raw_text.strip()) < 5:
            logger.warning("Receipt scan failed: OCR returned empty or insufficient text (<5 chars).")
            return {
                "merchant": None,
                "expense_date": date.today().isoformat(),
                "amount": None,
                "subtotal": None,
                "tax": None,
                "currency": "INR",
                "category": "Other",
                "payment_method": None,
                "confidence_score": 0.0,
                "items": [],
                "raw_text": raw_text or "",
                "receipt_image_path": image_path,
                "is_readable": False,
                "has_discrepancy": False,
                "error_message": "We couldn't read this receipt clearly. Try a clearer image."
            }

        # Filter and clean lines
        clean_lines = [l.strip() for l in lines if l and len(l.strip()) >= 2]
        if not clean_lines:
            clean_lines = [l.strip() for l in raw_text.split("\n") if l.strip()]

        # ----------------------------------------------------
        # 1. CURRENCY DETECTION
        # ----------------------------------------------------
        currency = "INR"
        if "$" in raw_text:
            currency = "USD"
        elif "€" in raw_text:
            currency = "EUR"
        elif "£" in raw_text:
            currency = "GBP"
        elif "₹" in raw_text or re.search(r'\b(rs\.?|inr|rupees)\b', raw_text, re.IGNORECASE):
            currency = "INR"

        # ----------------------------------------------------
        # 2. DATE EXTRACTION
        # ----------------------------------------------------
        parsed_date = self._extract_receipt_date(raw_text, clean_lines)
        if not parsed_date:
            rel_dt = parse_relative_date(raw_text, date.today())
            parsed_date = rel_dt.isoformat() if rel_dt else date.today().isoformat()
        expense_date = parsed_date

        # ----------------------------------------------------
        # 3. LINE ITEMS EXTRACTION
        # ----------------------------------------------------
        non_item_keywords = (
            r'(?i)\b('
            r'subtotal|sub\s*total|sub-total|grand\s*total|total\s*amount|final\s*total|net\s*amount|'
            r'total\s*payable|amount\s*payable|total\s*due|amount\s*due|balance\s*due|net\s*due|total|'
            r'tax|gst|cgst|sgst|igst|vat|cess|discount|round\s*off|change|balance|'
            r'cash|card|upi|credit\s*card|debit\s*card|payment|paid\s*by|'
            r'invoice|invoke|bill\s*no|receipt\s*no|order\s*no|table\s*no|pos\s*#|terminal|'
            r'date|time|tel|phone|mobile|fax|email|website|'
            r'gstin|fssai|tin|cin|pan|hsn|sac|tax\s*id|reg\s*no|regn\s*no|'
            r'payment\s*info|bank\s*details|account\s*here|nc\s*here|'
            r'description\s*price|qty\s*price|items?\s*rate|description\s*amount|'
            r'thank\s*you|visit\s*again|customer\s*copy|merchant\s*copy'
            r')\b'
        )

        filler_patterns = [
            r'\b(lorem|ipsum|ipwm|dolor|amet|arnef|consectet|adipis|elit|nonummy|nibh|euismod|et-ismod|evismod)\b'
        ]

        def is_filler_text(text: str) -> bool:
            words = re.findall(r'[a-zA-Z]+', text.lower())
            if not words:
                return False
            filler_count = sum(1 for w in words if any(re.search(pat, w) for pat in filler_patterns))
            return (filler_count / len(words)) >= 0.35

        address_patterns = (
            r'(?i)\b('
            r'road|street|nagar|lane|layout|marg|ave|avenue|bengaluru|bangalore|mumbai|delhi|'
            r'hyderabad|chennai|pincode|pin|zip|po\s*box'
            r')\b'
        )

        items = []
        for idx, line in enumerate(clean_lines):
            # Match item price at end of line (e.g. '$49', 'Rs 320.00', 'Rs 2,499.00', '450.00')
            m_price = re.search(r'(?:rs\.?|inr|₹|\$|€|£|s)?\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*[\.\-]?$', line, re.IGNORECASE)
            if not m_price:
                continue

            price_raw = m_price.group(1).replace(',', '')
            # Reject identifiers / invoice numbers with leading zeros like '00325'
            if re.match(r'^0\d+$', price_raw):
                continue

            try:
                price_val = float(price_raw)
            except ValueError:
                continue

            if not (0.5 <= price_val <= 1000000.0):
                continue

            # Text before price
            raw_name = line[:m_price.start()].strip()
            raw_name = re.sub(r'[\-:=~#_]+$', '', raw_name).strip()

            # Reject if raw_name matches non-item keywords, address patterns, or is noise
            if not raw_name or re.search(non_item_keywords, raw_name) or re.search(address_patterns, raw_name) or re.search(r'^[=\-_*#~]{2,}$', raw_name):
                continue

            # Reject if raw_name is purely digits/phone characters (e.g. +123456700)
            if not re.search(r'[a-zA-Z]{2,}', raw_name):
                continue

            # Reject if price looks like a 6-digit postal code (e.g. 560001)
            if price_val > 100000 and re.search(r'\b\d{6}\b', price_raw):
                continue

            # Check if raw_name is dummy/filler Latin text e.g. 'Lorem ipsum...'
            if is_filler_text(raw_name):
                # Scan backwards to locate the preceding title line e.g. 'Your title here'
                found_title = None
                for back_idx in range(idx - 1, max(-1, idx - 4), -1):
                    cand_line = clean_lines[back_idx].strip()
                    if (not re.search(non_item_keywords, cand_line)
                        and not re.search(address_patterns, cand_line)
                        and re.search(r'[a-zA-Z]{2,}', cand_line)
                        and not is_filler_text(cand_line)
                        and not re.search(r'(?:rs\.?|inr|₹|\$|€|£)?\s*[0-9,]+(?:\.[0-9]{1,2})?$', cand_line, re.IGNORECASE)):
                        found_title = cand_line
                        break
                if found_title:
                    raw_name = found_title

            # Clean name
            clean_name = re.sub(r'^(item\s*\d*|\d+[\.\)]\s*)', '', raw_name, flags=re.IGNORECASE).strip()
            if len(clean_name) >= 2 and not is_filler_text(clean_name):
                items.append({'name': clean_name, 'price': price_val, 'quantity': 1})
            elif len(clean_name) >= 2 and is_filler_text(clean_name):
                items.append({'name': 'Item', 'price': price_val, 'quantity': 1})

        line_items_sum = round(sum(i['price'] * i.get('quantity', 1) for i in items), 2)

        # ----------------------------------------------------
        # 4. TOTAL & SUBTOTAL EXTRACTION
        # ----------------------------------------------------
        extracted_total = None
        subtotal = None
        tax = None

        # Explicit Grand Total
        for idx, line in enumerate(clean_lines):
            m_tot = re.search(r'(?i)\b(?:grand\s*total|total\s*amount|final\s*total|net\s*amount|total\s*payable|amount\s*payable|net\s*payable|bill\s*amount)\b[:=\s]*(?:rs\.?|inr|₹|\$|€|£|s)?\s*([0-9loO,]+(?:\.[0-9loO]{1,2})?)', line)
            if m_tot:
                cand = self._parse_amount_str(m_tot.group(1))
                if cand and cand not in [2024, 2025, 2026, 2027]:
                    extracted_total = cand
                    break

        if extracted_total is None:
            for idx, line in enumerate(clean_lines):
                m_tot = re.search(r'(?i)\b(?:total|net\s*total)\b[:=\s]*(?:rs\.?|inr|₹|\$|€|£|s)?\s*([0-9loO,]+(?:\.[0-9loO]{1,2})?)', line)
                if m_tot:
                    cand = self._parse_amount_str(m_tot.group(1))
                    if cand and cand not in [2024, 2025, 2026, 2027]:
                        extracted_total = cand
                        break

        # Subtotal
        for line in clean_lines:
            m_sub = re.search(r'(?i)\b(?:sub\s*total|sub-total|subtotal)\b[:=\s]*(?:rs\.?|inr|₹|\$|€|£|s)?\s*([0-9loO,]+(?:\.[0-9loO]{1,2})?)', line)
            if m_sub:
                cand = self._parse_amount_str(m_sub.group(1))
                if cand:
                    subtotal = cand
                    break

        # Tax
        tax_sum = 0.0
        found_tax = False
        for line in clean_lines:
            if re.search(r'(?i)\b(?:tax|gst|vat|cgst|sgst|cess|service\s*tax)\b', line):
                if re.search(r'(?i)\b0(?:\.0+)?\s*%', line):
                    if not found_tax:
                        tax_sum = 0.0
                        found_tax = True
                m_amt = re.search(r'(?:rs\.?|inr|₹|\$|€|£)?\s*([0-9,]+(?:\.[0-9]{1,2})?)\s*$', line, re.IGNORECASE)
                if m_amt and not line.strip().endswith('%'):
                    try:
                        t_val = float(m_amt.group(1).replace(',', ''))
                        tax_sum += t_val
                        found_tax = True
                    except ValueError:
                        pass
        if found_tax:
            tax = round(tax_sum, 2)

        # Total Resolution Strategy
        final_amount = None
        has_discrepancy = False

        if subtotal is not None and items and line_items_sum > 0 and abs(line_items_sum - subtotal) <= 0.05:
            # Strong supporting evidence: line items sum equals detected subtotal
            computed_total = round(subtotal + (tax or 0.0), 2)
            if extracted_total is not None and abs(extracted_total - computed_total) <= 0.05:
                final_amount = extracted_total
                has_discrepancy = False
            elif extracted_total is not None and abs(extracted_total - computed_total) > 0.05:
                # Disagreement between explicit total and verified line-item sum: keep detected total but flag discrepancy
                final_amount = extracted_total
                has_discrepancy = True
            else:
                # Corrupted or missing explicit grand total: resolve to validated subtotal + tax
                final_amount = computed_total
                has_discrepancy = False
        elif extracted_total is not None:
            final_amount = extracted_total
            if items and line_items_sum > 0:
                expected = round((subtotal or line_items_sum) + (tax or 0.0), 2)
                if abs(extracted_total - line_items_sum) > 0.05 and abs(extracted_total - expected) > 0.05:
                    has_discrepancy = True
        elif subtotal is not None:
            final_amount = round(subtotal + (tax or 0.0), 2)
            if items and line_items_sum > 0 and abs(final_amount - line_items_sum) > 0.05:
                has_discrepancy = True
        elif items and line_items_sum > 0:
            final_amount = line_items_sum
            has_discrepancy = False

        # ----------------------------------------------------
        # 5. MERCHANT NAME EXTRACTION
        # ----------------------------------------------------
        generic_merchant_keywords = [
            r'^(tax\s*invoice|invoice|receipt|bill|statement|proforma|welcome|date|time|store\s*#|order\s*#|table\s*#|pos|terminal|inve|invoke)',
            r'^\(?just\)?\s*invoice',
            r'^(company\s*name|your\s*company|business\s*name|company|customer|name|customer\s*phone|phone|contact)$',
            r'\b(customer\s*phone|contact\s*no|phone\s*no|mobile\s*no|tel\s*no|phone)\b',
            r'^\d+\s+[a-zA-Z\s]+(road|street|nagar|lane|layout|marg|ave|avenue|bengaluru|bangalore|mumbai|delhi|hyderabad|chennai)',
            r'^\+?\d{10,12}$',
            r'^[=\-_*#~]{3,}$',
            r'^(thank\s*you|visit\s*again|customer\s*copy|merchant\s*copy|description\s*price)',
            r'\b(invoice\s*to|inve.*to|billed\s*to|bill\s*to|customer\s*name|client)\b',
            r'^(january|february|march|april|may|june|july|august|september|october|november|december)',
        ]

        merchant = None
        is_under_customer_section = False
        for line in clean_lines[:6]:
            cleaned_m = re.sub(r'[\-_*#:].*$', '', line).strip()
            if re.search(r'\b(invoice\s*to|inve.*to|billed\s*to|bill\s*to)\b', line, re.IGNORECASE):
                is_under_customer_section = True
                continue
            if is_under_customer_section:
                is_under_customer_section = False
                continue
            is_generic = any(re.search(pat, line, re.IGNORECASE) or re.search(pat, cleaned_m, re.IGNORECASE) for pat in generic_merchant_keywords)
            if not is_generic and len(line) >= 3 and not re.search(r'^\d', line):
                if len(cleaned_m) >= 3 and not any(re.search(pat, cleaned_m, re.IGNORECASE) for pat in generic_merchant_keywords):
                    merchant = cleaned_m
                    break

        # ----------------------------------------------------
        # 6. PAYMENT METHOD
        # ----------------------------------------------------
        payment_method = None
        if re.search(r'\b(upi|gpay|google\s*pay|phonepe|paytm|bhim)\b', raw_text, re.IGNORECASE):
            payment_method = "UPI"
        elif re.search(r'\b(credit\s*card|visa|mastercard|amex|rupay|paid\s*by\s*credit\s*card|paid\s*by\s*card)\b', raw_text, re.IGNORECASE):
            payment_method = "Credit Card"
        elif re.search(r'\b(debit\s*card|paid\s*by\s*debit\s*card)\b', raw_text, re.IGNORECASE):
            payment_method = "Debit Card"
        elif re.search(r'\b(cash|paid\s*by\s*cash|cash\s*tender|counter\s*cash)\b', raw_text, re.IGNORECASE):
            payment_method = "Cash"
        elif re.search(r'\b(net\s*banking|bank\s*transfer|neft|imps|rtgs)\b', raw_text, re.IGNORECASE):
            payment_method = "Bank Transfer"

        # ----------------------------------------------------
        # 7. CATEGORY PREDICTION
        # ----------------------------------------------------
        if merchant and merchant != "Other":
            items_text = " ".join(i["name"] for i in items if i["name"] != "Item")
            cat, conf, _ = categorization_service.predict_category(f"{merchant} {items_text}")
            confidence_score = conf if conf >= 0.60 else 0.50
        else:
            items_text = " ".join(i["name"] for i in items if i["name"] not in ["Item", "Your title here"])
            if items_text:
                cat, conf, _ = categorization_service.predict_category(items_text)
                confidence_score = conf
            else:
                cat = "Other"
                confidence_score = 0.40

        is_readable = bool(final_amount and final_amount > 0)
        overall_confidence = 0.95 if (is_readable and not has_discrepancy and merchant) else (0.75 if is_readable else 0.30)

        # ----------------------------------------------------
        # 8. DETAILED LOGGING
        # ----------------------------------------------------
        logger.info("=== RECEIPT SCAN REPORT ===")
        logger.info(f"Image Path: {image_path}")
        logger.info(f"Extracted Merchant: '{merchant}'")
        logger.info(f"Extracted Date: {expense_date}")
        logger.info(f"Detected Line Items ({len(items)}): {items}")
        logger.info(f"Line Items Sum: {currency} {line_items_sum}")
        logger.info(f"Detected Subtotal: {subtotal}, Tax: {tax}")
        logger.info(f"Final Resolved Total: {currency} {final_amount} (Has Discrepancy: {has_discrepancy})")
        logger.info(f"Category: {cat}, Payment Method: {payment_method}")
        logger.info(f"Confidence: {overall_confidence}, is_readable: {is_readable}")
        logger.info("===========================")

        return {
            "merchant": merchant,
            "expense_date": expense_date,
            "amount": final_amount,
            "subtotal": subtotal,
            "tax": tax,
            "currency": currency,
            "category": cat,
            "payment_method": payment_method,
            "confidence_score": round(overall_confidence, 2),
            "items": items,
            "raw_text": raw_text,
            "receipt_image_path": image_path,
            "is_readable": is_readable,
            "has_discrepancy": has_discrepancy,
            "error_message": None if is_readable else "We couldn't read all details with high confidence. Please verify fields before saving."
        }

    def generate_spending_insights(self, stats: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Generates actionable, data-backed insights from deterministic statistics.
        """
        insights = []
        total_spending = stats.get("total_spending", 0.0)
        prev_spending = stats.get("previous_month_spending", 0.0)
        savings_rate = stats.get("savings_rate", 0.0)
        top_category = stats.get("top_category", None)
        top_category_spent = stats.get("top_category_spent", 0.0)
        weekend_pct = stats.get("weekend_spending_percentage", 0.0)
        small_tx_count = stats.get("small_transactions_count", 0)
        small_tx_total = stats.get("small_transactions_total", 0.0)
        category_changes = stats.get("category_changes", {})
        over_budget_categories = stats.get("over_budget_categories", [])

        # 1. Month-over-Month Trend Insight
        if prev_spending > 0:
            pct_diff = round(((total_spending - prev_spending) / prev_spending) * 100, 1)
            if pct_diff > 10:
                insights.append({
                    "type": "warning",
                    "title": "Spending Acceleration",
                    "description": f"Overall spending is up {pct_diff}% compared to last month (₹{int(total_spending):,} vs ₹{int(prev_spending):,}).",
                    "severity": "warning"
                })
            elif pct_diff < -5:
                insights.append({
                    "type": "savings",
                    "title": "Disciplined Spending",
                    "description": f"Great job! Your spending is down {abs(pct_diff)}% compared to last month.",
                    "severity": "success"
                })
            else:
                insights.append({
                    "type": "trend",
                    "title": "Consistent Spending",
                    "description": f"Monthly spending is stable with a modest {pct_diff:+0.1f}% change from last month.",
                    "severity": "info"
                })

        # 2. Weekend Spending Insight
        if weekend_pct >= 35.0:
            insights.append({
                "type": "anomaly",
                "title": "Weekend Spending Concentration",
                "description": f"{round(weekend_pct, 1)}% of your expenses occur on weekends. Planning weekend activities in advance can help curb impulse spending.",
                "severity": "warning" if weekend_pct > 45 else "info"
            })

        # 3. Micro-transactions Insight
        if small_tx_count >= 10:
            insights.append({
                "type": "opportunity",
                "title": "Micro-Transactions Accumulation",
                "description": f"You made {small_tx_count} small transactions under ₹300 totaling ₹{int(small_tx_total):,}. These small purchases add up quickly.",
                "severity": "info"
            })

        # 4. Top Category & Over-budget Alert
        if over_budget_categories:
            cats_str = ", ".join(over_budget_categories[:2])
            insights.append({
                "type": "warning",
                "title": "Budget Limit Exceeded",
                "description": f"Your spending in {cats_str} has exceeded the allocated monthly budget limit.",
                "severity": "warning"
            })
        elif top_category and total_spending > 0:
            cat_pct = round((top_category_spent / total_spending) * 100, 1)
            insights.append({
                "type": "trend",
                "title": f"Dominant Category: {top_category}",
                "description": f"{top_category} accounts for {cat_pct}% (₹{int(top_category_spent):,}) of your total expenses this month.",
                "severity": "info"
            })

        # 5. Significant Category Shifts
        for cat, change_pct in category_changes.items():
            if change_pct >= 20.0:
                insights.append({
                    "type": "warning",
                    "title": f"Spike in {cat} Spending",
                    "description": f"{cat} spending increased by {change_pct:.1f}% compared with last month.",
                    "severity": "warning"
                })
                break

        # 6. Savings Rate Insight
        if savings_rate >= 30.0:
            insights.append({
                "type": "savings",
                "title": "Healthy Savings Rate",
                "description": f"Your current savings rate is {savings_rate:.1f}%, exceeding the recommended 20% financial wellness benchmark.",
                "severity": "success"
            })
        elif savings_rate < 15.0:
            insights.append({
                "type": "opportunity",
                "title": "Savings Rate Boost",
                "description": f"Your savings rate is currently {savings_rate:.1f}%. Aiming for 20% savings by cutting non-essential dining or shopping will strengthen your emergency fund.",
                "severity": "warning"
            })

        return insights[:6]

    def generate_monthly_report_summary(self, month_name: str, year: int, metrics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generates executive summary and recommendations for the monthly report.
        """
        total_income = metrics.get("total_income", 0.0)
        total_expenses = metrics.get("total_expenses", 0.0)
        total_savings = metrics.get("total_savings", 0.0)
        savings_rate = metrics.get("savings_rate", 0.0)
        mom_change = metrics.get("mom_change_pct", 0.0)
        top_category = metrics.get("top_category", "Food")
        top_cat_spent = metrics.get("top_category_spent", 0.0)
        over_budget_count = metrics.get("over_budget_count", 0)

        # Summary text
        if mom_change > 0:
            change_desc = f"{mom_change:+.1f}% higher than last month"
        elif mom_change < 0:
            change_desc = f"{abs(mom_change):.1f}% lower than last month"
        else:
            change_desc = "virtually unchanged compared to last month"

        summary = (
            f"You spent ₹{int(total_expenses):,} in {month_name} {year}, which is {change_desc}. "
            f"The primary spending driver was {top_category} at ₹{int(top_cat_spent):,}. "
            f"You saved ₹{int(total_savings):,}, achieving a {savings_rate:.1f}% savings rate."
        )

        recommendations = []
        if over_budget_count > 0:
            recommendations.append(f"Review the {over_budget_count} categories that exceeded their budget limits and adjust spending pace.")
        else:
            recommendations.append("All category budgets remained within planned limits. Maintain this spending discipline.")

        if savings_rate >= 25.0:
            recommendations.append(f"Channel ₹{int(total_savings * 0.4):,} of your monthly surplus into a high-yield investment or emergency fund.")
        else:
            recommendations.append("Identify discretionary subscriptions and dining delivery expenses to raise your savings rate above 20%.")

        if top_category in ["Food", "Shopping"]:
            potential_save = int(top_cat_spent * 0.15)
            recommendations.append(f"A 15% reduction in {top_category} could save approximately ₹{potential_save:,} next month.")
        else:
            recommendations.append("Set proactive weekly spending alerts to monitor middle-of-month spending velocity.")

        return {
            "summary": summary,
            "recommendations": recommendations
        }

ai_service = AIService()
