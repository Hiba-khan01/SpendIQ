import os
import re
import json
import logging
from datetime import date, datetime
from typing import Dict, Any, List, Optional
from backend.app.config import settings
from backend.app.utils.date_utils import parse_relative_date, get_month_name
from backend.app.services.categorization_service import categorization_service

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.api_key = settings.AI_API_KEY
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
        Rule 5 & 11: Never invent missing information. If amount is missing, flag it.
        """
        text_clean = text.strip()
        
        # 1. Check for missing amount
        # Regex for currency/amount patterns: ₹650, Rs 650, Rs. 650, 650 rs, 650.50, INR 650, 650 rupees
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
                    
        # If still not found, try raw stand-alone numbers
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
        description = None
        
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

        # Fallback merchant extraction: "at <Merchant>", "on <Merchant>", "from <Merchant>"
        if not merchant:
            m_match = re.search(r'\b(?:at|from|to|with)\s+([A-Z][a-zA-Z0-9\s&\'\.-]{2,20})', text)
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
        
        # Subcategory mapping
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

        # Build clean description
        # e.g. "dinner at Swiggy" -> "Dinner"
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

    def extract_receipt_data(self, ocr_text: str, image_path: Optional[str] = None) -> Dict[str, Any]:
        """
        Extracts structured receipt information from OCR text.
        """
        if not ocr_text or len(ocr_text.strip()) < 5:
            return {
                "merchant": None,
                "expense_date": date.today().isoformat(),
                "amount": None,
                "category": "Food",
                "payment_method": "Card",
                "confidence_score": 0.0,
                "items": [],
                "raw_text": ocr_text or "",
                "receipt_image_path": image_path,
                "is_readable": False,
                "error_message": "We couldn't read this receipt clearly. Try a clearer image."
            }

        lines = [line.strip() for line in ocr_text.split("\n") if line.strip()]
        
        # 1. Merchant candidate: usually first 1-3 non-empty lines
        merchant = "Retail Store"
        for line in lines[:3]:
            # skip generic words like INVOICE, RECEIPT, TAX
            if not re.search(r'^(tax|invoice|receipt|bill|gst|welcome|date)', line, re.IGNORECASE) and len(line) >= 3:
                merchant = line
                break

        # 2. Extract Total Amount
        amount = None
        total_pattern = r'(?:total|grand total|net amount|amount due|final total|balance due)\s*[:=]?\s*[₹$€£]?\s*([\d,]+(?:\.\d{1,2})?)'
        for line in lines:
            m = re.search(total_pattern, line, re.IGNORECASE)
            if m:
                try:
                    amount = float(m.group(1).replace(",", ""))
                    break
                except ValueError:
                    pass

        # Fallback: find highest numerical value on lines with prices
        if amount is None:
            all_numbers = []
            for line in lines:
                nums = re.findall(r'[₹$€£]?\s*(\d{2,6}(?:\.\d{1,2})?)', line)
                for n in nums:
                    try:
                        all_numbers.append(float(n))
                    except ValueError:
                        pass
            if all_numbers:
                amount = max(all_numbers)

        # 3. Extract items
        items = []
        for line in lines:
            # Look for item + price pattern, e.g. "Pizza 499.00" or "Garlic Bread ₹199"
            item_match = re.search(r'^([a-zA-Z\s]{3,35})\s+.*?([₹$€£]?\s*\d+(?:\.\d{1,2})?)$', line)
            if item_match:
                item_name = item_match.group(1).strip()
                # skip total lines
                if not re.search(r'total|subtotal|tax|gst|change|cash|card|due', item_name, re.IGNORECASE):
                    price_str = re.sub(r'[^\d.]', '', item_match.group(2))
                    try:
                        p_val = float(price_str)
                        items.append({"name": item_name, "price": p_val, "quantity": 1})
                    except ValueError:
                        pass

        # 4. Extract Date
        expense_date = parse_relative_date(ocr_text, date.today())

        # 5. Extract Category
        cat, conf, _ = categorization_service.predict_category(f"{merchant} {ocr_text[:200]}")

        # 6. Payment method
        payment_method = "Card"
        if re.search(r'upi|phonepe|gpay|paytm', ocr_text, re.IGNORECASE):
            payment_method = "UPI"
        elif re.search(r'cash', ocr_text, re.IGNORECASE):
            payment_method = "Cash"
        elif re.search(r'credit card|visa|mastercard|amex', ocr_text, re.IGNORECASE):
            payment_method = "Credit Card"

        return {
            "merchant": merchant,
            "expense_date": expense_date.isoformat(),
            "amount": amount,
            "category": cat,
            "payment_method": payment_method,
            "confidence_score": round(max(0.70, conf), 2),
            "items": items,
            "raw_text": ocr_text,
            "receipt_image_path": image_path,
            "is_readable": amount is not None and amount > 0,
            "error_message": None if (amount is not None and amount > 0) else "Amount could not be detected with high confidence. Please verify before saving."
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
