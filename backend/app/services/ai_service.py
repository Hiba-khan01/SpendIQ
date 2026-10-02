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
            logger.warning(f"Receipt scan failed: OCR returned empty or insufficient text (<5 chars).")
            return {
                "merchant": None,
                "expense_date": date.today().isoformat(),
                "amount": None,
                "category": "Other",
                "payment_method": "Card",
                "confidence_score": 0.0,
                "items": [],
                "raw_text": raw_text or "",
                "receipt_image_path": image_path,
                "is_readable": False,
                "error_message": "We couldn't read this receipt clearly. Try a clearer image."
            }

        # Filter and clean lines
        clean_lines = [l.strip() for l in lines if l and len(l.strip()) >= 2]
        if not clean_lines:
            clean_lines = [l.strip() for l in raw_text.split("\n") if l.strip()]

        # ----------------------------------------------------
        # 1. MERCHANT NAME EXTRACTION
        # ----------------------------------------------------
        merchant = None
        noise_line_patterns = [
            r'^(tax\s*invoice|invoice|receipt|bill|gst|gstin|welcome|date|time|store\s*#|order\s*#|table\s*#|pos|terminal)',
            r'^\d+\s+[a-zA-Z\s]+(road|street|nagar|lane|layout|marg|ave|avenue|bengaluru|bangalore|mumbai|delhi|hyderabad|chennai)',
            r'^\+?\d{10,12}$',
            r'^[=\-_*#~]{3,}$',
            r'^\d{6}$',
            r'^(thank\s*you|visit\s*again|customer\s*copy|merchant\s*copy)'
        ]

        for line in clean_lines[:6]:
            is_noise = any(re.search(pat, line, re.IGNORECASE) for pat in noise_line_patterns)
            if not is_noise and len(line) >= 3 and not re.search(r'^\d', line):
                # Clean up trailing noise
                cleaned_m = re.sub(r'[\-_*#:].*$', '', line).strip()
                if len(cleaned_m) >= 3:
                    merchant = cleaned_m
                    break

        if not merchant and clean_lines:
            merchant = clean_lines[0]

        # ----------------------------------------------------
        # 2. DATE EXTRACTION
        # ----------------------------------------------------
        expense_date = None
        # Try YYYY-MM-DD
        m_date = re.search(r'\b(20\d{2})[-/.](\d{1,2})[-/.](\d{1,2})\b', raw_text)
        if m_date:
            try:
                y, m, d = int(m_date.group(1)), int(m_date.group(2)), int(m_date.group(3))
                if 1 <= m <= 12 and 1 <= d <= 31:
                    expense_date = f"{y:04d}-{m:02d}-{d:02d}"
            except ValueError:
                pass

        # Try DD-MM-YYYY or DD/MM/YYYY
        if not expense_date:
            m_date2 = re.search(r'\b(\d{1,2})[-/.](\d{1,2})[-/.](20\d{2})\b', raw_text)
            if m_date2:
                try:
                    d, m, y = int(m_date2.group(1)), int(m_date2.group(2)), int(m_date2.group(3))
                    if 1 <= m <= 12 and 1 <= d <= 31:
                        expense_date = f"{y:04d}-{m:02d}-{d:02d}"
                except ValueError:
                    pass

        if not expense_date:
            parsed_dt = parse_relative_date(raw_text, date.today())
            expense_date = parsed_dt.isoformat() if parsed_dt else date.today().isoformat()

        # ----------------------------------------------------
        # 3. LINE ITEMS EXTRACTION
        # ----------------------------------------------------
        items = []
        non_item_keywords = r'(?i)\b(subtotal|sub-total|grand\s*total|total\s*amount|final\s*total|net\s*amount|total\s*payable|amount\s*payable|total\s*due|amount\s*due|balance\s*due|total|tax|gst|cgst|sgst|vat|discount|round\s*off|cash|card|upi|change|balance|invoice|bill\s*no|date|time|table|tel|phone|store)\b'

        for line in clean_lines:
            # Check pattern: Item Name + Price (e.g. "Gourmet Sandwich Rs 320.00" or "Pizza ₹499")
            m_item = re.search(r'^([a-zA-Z0-9\s&\'\.\(\)\-\+]{2,45}?)\s+(?:rs\.?|inr|₹|\$|€|£)?\s*([\d,]+(?:\.\d{2})?)$', line, re.IGNORECASE)
            if m_item:
                name = m_item.group(1).strip()
                price_str = m_item.group(2).replace(",", "")
                # Skip if name is a total, tax, or receipt header
                if not re.search(non_item_keywords, name) and not re.search(r'^[=\-_*#]{2,}$', name):
                    try:
                        price_val = float(price_str)
                        if 1.0 <= price_val <= 500000.0 and len(name) >= 2:
                            items.append({"name": name, "price": price_val, "quantity": 1})
                    except ValueError:
                        pass

        line_items_sum = round(sum(i["price"] * i.get("quantity", 1) for i in items), 2)

        # ----------------------------------------------------
        # 4. TOTAL AMOUNT EXTRACTION & LOGICAL VALIDATION
        # ----------------------------------------------------
        # Pattern set 1: Explicit Grand Total / Total Amount lines
        grand_total_patterns = [
            r'(?i)\b(?:grand\s*total|total\s*amount|final\s*total|net\s*amount|total\s*payable|amount\s*payable|net\s*payable|bill\s*amount)\b[:=\s]*(?:rs\.?|inr|₹|\$|€|£)?\s*([\d,]+(?:\.\d{1,2})?)',
            r'(?i)\b(?:total|net\s*total)\b[:=\s]*(?:rs\.?|inr|₹|\$|€|£)?\s*([\d,]+(?:\.\d{1,2})?)',
        ]

        extracted_total = None
        matched_total_line = None

        for pat in grand_total_patterns:
            for idx, line in enumerate(clean_lines):
                m = re.search(pat, line)
                if m:
                    try:
                        cand = float(m.group(1).replace(",", ""))
                        # Guard against year / invoice numbers / tiny noise
                        if cand > 0 and cand != 2026 and cand != 2025:
                            extracted_total = cand
                            matched_total_line = line
                            break
                    except ValueError:
                        pass
                # Also check if the price is on the very next line after "TOTAL AMOUNT"
                elif re.search(r'(?i)^\s*(?:grand\s*total|total\s*amount|total)\s*[:=]?\s*$', line) and idx + 1 < len(clean_lines):
                    next_line = clean_lines[idx + 1]
                    m_next = re.search(r'(?:rs\.?|inr|₹|\$|€|£)?\s*([\d,]+(?:\.\d{1,2})?)', next_line, re.IGNORECASE)
                    if m_next:
                        try:
                            cand = float(m_next.group(1).replace(",", ""))
                            if cand > 0 and cand != 2026:
                                extracted_total = cand
                                matched_total_line = f"{line} -> {next_line}"
                                break
                        except ValueError:
                            pass
            if extracted_total is not None:
                break

        # Subtotal fallback if grand total was not matched
        subtotal = None
        for line in clean_lines:
            m_sub = re.search(r'(?i)\b(?:subtotal|sub-total)\b[:=\s]*(?:rs\.?|inr|₹|\$|€|£)?\s*([\d,]+(?:\.\d{1,2})?)', line)
            if m_sub:
                try:
                    subtotal = float(m_sub.group(1).replace(",", ""))
                    break
                except ValueError:
                    pass

        # ----------------------------------------------------
        # CONSISTENCY CHECK & DISCREPANCY RESOLUTION
        # ----------------------------------------------------
        final_amount = None
        consistency_status = "unverified"

        if extracted_total is not None:
            if items and line_items_sum > 0:
                # Normal variation allow: items sum <= total <= items sum * 1.35 (taxes/service charge)
                # or total <= items sum * 1.0 (discounts)
                if 0.70 * line_items_sum <= extracted_total <= 1.50 * line_items_sum:
                    final_amount = extracted_total
                    consistency_status = "consistent_with_items"
                else:
                    # Wild discrepancy detected (e.g. extracted_total=84912 vs line_items_sum=650)
                    logger.warning(
                        f"Receipt Extraction Discrepancy: Extracted Grand Total ({extracted_total}) "
                        f"does not match Line Items Sum ({line_items_sum}). Resolving to actual receipt total."
                    )
                    # Check if subtotal or line items sum matches a printed amount on receipt
                    if subtotal and 0.70 * line_items_sum <= subtotal <= 1.50 * line_items_sum:
                        final_amount = subtotal
                        consistency_status = "corrected_to_subtotal"
                    else:
                        final_amount = line_items_sum
                        consistency_status = "corrected_to_line_items_sum"
            else:
                final_amount = extracted_total
                consistency_status = "total_only_no_items"
        elif subtotal is not None:
            final_amount = subtotal
            consistency_status = "used_subtotal"
        elif items and line_items_sum > 0:
            final_amount = line_items_sum
            consistency_status = "used_line_items_sum"

        # ----------------------------------------------------
        # 5. PAYMENT METHOD & CATEGORY
        # ----------------------------------------------------
        payment_method = "Card"
        if re.search(r'\b(upi|gpay|google\s*pay|phonepe|paytm)\b', raw_text, re.IGNORECASE):
            payment_method = "UPI"
        elif re.search(r'\b(credit\s*card|visa|mastercard|amex)\b', raw_text, re.IGNORECASE):
            payment_method = "Credit Card"
        elif re.search(r'\b(debit\s*card)\b', raw_text, re.IGNORECASE):
            payment_method = "Debit Card"
        elif re.search(r'\b(cash)\b', raw_text, re.IGNORECASE):
            payment_method = "Cash"
        elif re.search(r'\b(net\s*banking|bank\s*transfer)\b', raw_text, re.IGNORECASE):
            payment_method = "Bank Transfer"

        # Predict Category
        merchant_for_cat = merchant or "General"
        items_text = " ".join(i["name"] for i in items)
        cat, conf, _ = categorization_service.predict_category(f"{merchant_for_cat} {items_text} {raw_text[:200]}")

        is_readable = final_amount is not None and final_amount > 0 and merchant is not None
        confidence = 0.95 if (is_readable and consistency_status in ["consistent_with_items", "total_only_no_items"]) else (0.80 if is_readable else 0.30)

        # ----------------------------------------------------
        # 6. DETAILED LOGGING FOR DEVELOPMENT / TRACING
        # ----------------------------------------------------
        logger.info(f"=== RECEIPT SCAN REPORT ===")
        logger.info(f"Image Path: {image_path}")
        logger.info(f"Extracted Merchant: '{merchant}'")
        logger.info(f"Extracted Date: {expense_date}")
        logger.info(f"Detected Line Items ({len(items)}): {items}")
        logger.info(f"Line Items Sum: ₹{line_items_sum}")
        logger.info(f"Matched Total Line: '{matched_total_line}', Raw Total: {extracted_total}")
        logger.info(f"Final Resolved Total: ₹{final_amount} (Status: {consistency_status})")
        logger.info(f"Category: {cat}, Payment Method: {payment_method}")
        logger.info(f"Confidence: {confidence}, is_readable: {is_readable}")
        logger.info(f"===========================")

        return {
            "merchant": merchant,
            "expense_date": expense_date,
            "amount": final_amount,
            "category": cat,
            "payment_method": payment_method,
            "confidence_score": round(confidence, 2),
            "items": items,
            "raw_text": raw_text,
            "receipt_image_path": image_path,
            "is_readable": is_readable,
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
