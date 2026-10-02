import os
import sys
from datetime import date, datetime, timedelta
import random

# Ensure root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import engine, Base, SessionLocal
from backend.app.models.user import User
from backend.app.models.expense import Expense
from backend.app.models.budget import Budget
from backend.app.models.monthly_report import MonthlyReport
from backend.app.models.ai_insight import AIInsight
from backend.app.models.user_setting import UserSetting
from backend.app.utils.security import get_password_hash
from backend.app.services.budget_health_service import budget_health_service
from backend.app.services.report_service import report_service
from backend.app.services.analytics_service import analytics_service

def seed_database():
    print("Creating tables if not present...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if demo user already exists
        demo_email = "demo@spendiq.app"
        existing_user = db.query(User).filter(User.email == demo_email).first()
        if existing_user:
            print(f"Removing previous data for {demo_email}...")
            db.delete(existing_user)
            db.commit()

        print(f"Seeding demo user: {demo_email} (Password: Demo@123)...")
        demo_user = User(
            name="Alex Sharma",
            email=demo_email,
            password_hash=get_password_hash("Demo@123")
        )
        db.add(demo_user)
        db.commit()
        db.refresh(demo_user)

        # User Setting
        setting = UserSetting(
            user_id=demo_user.id,
            currency="INR",
            monthly_income=85000.0
        )
        db.add(setting)
        db.commit()

        # Seed 3 Months of Data: August 2026 (Month 8), September 2026 (Month 9), October 2026 (Month 10)
        # Template transactions for realistic generation
        sample_transactions = [
            # Food
            {"merchant": "Swiggy", "description": "Biryani dinner delivery", "category": "Food", "subcategory": "Food Delivery", "amount": 650.0, "payment_method": "UPI", "source": "natural_language"},
            {"merchant": "Zomato", "description": "Gourmet burger & fries", "category": "Food", "subcategory": "Food Delivery", "amount": 420.0, "payment_method": "UPI", "source": "natural_language"},
            {"merchant": "Domino's Pizza", "description": "Weekend pizza party", "category": "Food", "subcategory": "Dining Out", "amount": 845.0, "payment_method": "UPI", "source": "receipt"},
            {"merchant": "Starbucks", "description": "Iced latte & butter croissant", "category": "Food", "subcategory": "Cafe", "amount": 480.0, "payment_method": "Credit Card", "source": "manual"},
            {"merchant": "Blue Tokai Coffee", "description": "Cold brew with colleague", "category": "Food", "subcategory": "Cafe", "amount": 320.0, "payment_method": "UPI", "source": "manual"},
            {"merchant": "Barbeque Nation", "description": "Team lunch buffet", "category": "Food", "subcategory": "Dining Out", "amount": 1850.0, "payment_method": "Credit Card", "source": "manual"},
            {"merchant": "Chai Point", "description": "Ginger chai & samosas", "category": "Food", "subcategory": "Snacks", "amount": 160.0, "payment_method": "UPI", "source": "manual"},
            
            # Groceries
            {"merchant": "Blinkit", "description": "Quick grocery essentials", "category": "Groceries", "subcategory": "10-Min Delivery", "amount": 380.0, "payment_method": "UPI", "source": "natural_language"},
            {"merchant": "Instamart", "description": "Fresh organic fruits and milk", "category": "Groceries", "subcategory": "Daily Needs", "amount": 540.0, "payment_method": "UPI", "source": "manual"},
            {"merchant": "DMart", "description": "Monthly provisions & pantry staples", "category": "Groceries", "subcategory": "Supermarket", "amount": 4200.0, "payment_method": "Debit Card", "source": "receipt"},
            {"merchant": "Zepto", "description": "Bread, eggs and snack items", "category": "Groceries", "subcategory": "10-Min Delivery", "amount": 290.0, "payment_method": "UPI", "source": "manual"},
            {"merchant": "Nature's Basket", "description": "Artisan cheese and olive oil", "category": "Groceries", "subcategory": "Gourmet", "amount": 1150.0, "payment_method": "Credit Card", "source": "manual"},
            
            # Transport
            {"merchant": "Uber", "description": "Cab ride to tech park", "category": "Transport", "subcategory": "Ride Hailing", "amount": 340.0, "payment_method": "UPI", "source": "natural_language"},
            {"merchant": "Ola", "description": "Auto ride to client office", "category": "Transport", "subcategory": "Ride Hailing", "amount": 180.0, "payment_method": "UPI", "source": "manual"},
            {"merchant": "Shell Fuel Station", "description": "Petrol tank refill for car", "category": "Transport", "subcategory": "Fuel", "amount": 2800.0, "payment_method": "Credit Card", "source": "receipt"},
            {"merchant": "Namma Metro", "description": "Metro smart card recharge", "category": "Transport", "subcategory": "Public Transit", "amount": 500.0, "payment_method": "UPI", "source": "manual"},
            {"merchant": "Fastag", "description": "Highway toll recharge", "category": "Transport", "subcategory": "Toll", "amount": 1000.0, "payment_method": "UPI", "source": "manual"},

            # Shopping
            {"merchant": "Amazon India", "description": "Noise-cancelling wireless headphones", "category": "Shopping", "subcategory": "Electronics", "amount": 3499.0, "payment_method": "Credit Card", "source": "manual"},
            {"merchant": "Myntra", "description": "Sneakers and autumn hoodie", "category": "Shopping", "subcategory": "Apparel", "amount": 2890.0, "payment_method": "Credit Card", "source": "natural_language"},
            {"merchant": "IKEA", "description": "Desk organizer & reading lamp", "category": "Shopping", "subcategory": "Home Decor", "amount": 1650.0, "payment_method": "Debit Card", "source": "receipt"},
            {"merchant": "Decathlon", "description": "Running shorts and gym bottle", "category": "Shopping", "subcategory": "Sports", "amount": 899.0, "payment_method": "UPI", "source": "manual"},

            # Entertainment
            {"merchant": "BookMyShow", "description": "IMAX movie tickets for two", "category": "Entertainment", "subcategory": "Movies", "amount": 950.0, "payment_method": "UPI", "source": "natural_language"},
            {"merchant": "PVR Cinemas", "description": "Popcorn combo & beverages", "category": "Entertainment", "subcategory": "Movies", "amount": 620.0, "payment_method": "UPI", "source": "receipt"},
            {"merchant": "Smaaash Arcade", "description": "Bowling game night with friends", "category": "Entertainment", "subcategory": "Gaming", "amount": 1200.0, "payment_method": "Credit Card", "source": "manual"},

            # Subscriptions
            {"merchant": "Netflix", "description": "Monthly 4K Premium Plan", "category": "Subscriptions", "subcategory": "Streaming", "amount": 649.0, "payment_method": "Credit Card", "source": "manual"},
            {"merchant": "Spotify", "description": "Individual Premium annual plan", "category": "Subscriptions", "subcategory": "Music", "amount": 119.0, "payment_method": "UPI", "source": "manual"},
            {"merchant": "ChatGPT Plus", "description": "OpenAI subscription", "category": "Subscriptions", "subcategory": "Software", "amount": 1999.0, "payment_method": "Credit Card", "source": "manual"},
            {"merchant": "Google One", "description": "2TB Cloud Storage monthly", "category": "Subscriptions", "subcategory": "Cloud Storage", "amount": 210.0, "payment_method": "UPI", "source": "manual"},

            # Bills
            {"merchant": "BESCOM", "description": "Apartment electricity bill", "category": "Bills", "subcategory": "Electricity", "amount": 2140.0, "payment_method": "UPI", "source": "receipt"},
            {"merchant": "Airtel Fiber", "description": "High-speed broadband monthly", "category": "Bills", "subcategory": "Internet", "amount": 1179.0, "payment_method": "UPI", "source": "manual"},
            {"merchant": "Jio Postpaid", "description": "Mobile 5G connection bill", "category": "Bills", "subcategory": "Mobile", "amount": 599.0, "payment_method": "UPI", "source": "manual"},
            {"merchant": "Apartment Association", "description": "Monthly society maintenance", "category": "Bills", "subcategory": "Maintenance", "amount": 3500.0, "payment_method": "Bank Transfer", "source": "manual"},

            # Healthcare
            {"merchant": "Apollo Pharmacy", "description": "Prescription multivitamins & first aid", "category": "Healthcare", "subcategory": "Pharmacy", "amount": 820.0, "payment_method": "UPI", "source": "receipt"},
            {"merchant": "Practo Clinic", "description": "Routine dental checkup and scaling", "category": "Healthcare", "subcategory": "Consultation", "amount": 1200.0, "payment_method": "UPI", "source": "manual"},

            # Education
            {"merchant": "Udemy", "description": "System Design & Cloud Architecture course", "category": "Education", "subcategory": "Online Course", "amount": 599.0, "payment_method": "Credit Card", "source": "natural_language"},
            {"merchant": "Bookstore", "description": "Psychology of Money book", "category": "Education", "subcategory": "Books", "amount": 399.0, "payment_method": "Cash", "source": "manual"},

            # Travel
            {"merchant": "IndiGo Airlines", "description": "Flight ticket to Mumbai conference", "category": "Travel", "subcategory": "Flights", "amount": 4650.0, "payment_method": "Credit Card", "source": "manual"},
            {"merchant": "Airbnb", "description": "Weekend getaway homestay", "category": "Travel", "subcategory": "Lodging", "amount": 3800.0, "payment_method": "Credit Card", "source": "manual"},

            # Other
            {"merchant": "Dry Cleaner", "description": "Suit and jacket dry cleaning", "category": "Other", "subcategory": "Laundry", "amount": 450.0, "payment_method": "UPI", "source": "manual"},
            {"merchant": "Handyman Service", "description": "Plumbing repair fix", "category": "Other", "subcategory": "Home Repair", "amount": 600.0, "payment_method": "Cash", "source": "manual"},
        ]

        # Seed for months 8 (Aug 2026), 9 (Sept 2026), 10 (Oct 2026)
        months_config = [
            {"month": 8, "year": 2026, "multiplier": 0.92, "count": 28},
            {"month": 9, "year": 2026, "multiplier": 1.05, "count": 32},
            {"month": 10, "year": 2026, "multiplier": 1.0, "count": 25},
        ]

        total_expenses_seeded = 0

        for mc in months_config:
            m = mc["month"]
            y = mc["year"]
            mult = mc["multiplier"]

            # Seed Budgets for this month
            monthly_budgets = [
                {"category": "Food", "limit": 7500.0},
                {"category": "Groceries", "limit": 8000.0},
                {"category": "Transport", "limit": 5500.0},
                {"category": "Shopping", "limit": 9000.0},
                {"category": "Entertainment", "limit": 3500.0},
                {"category": "Bills", "limit": 8500.0},
                {"category": "Subscriptions", "limit": 3500.0},
                {"category": "Healthcare", "limit": 4000.0},
                {"category": "Travel", "limit": 8000.0},
            ]
            for mb in monthly_budgets:
                b_obj = Budget(
                    user_id=demo_user.id,
                    category=mb["category"],
                    monthly_limit=mb["limit"],
                    month=m,
                    year=y
                )
                db.add(b_obj)

            # Generate realistic transactions spread throughout the month
            # Max days in month
            max_day = 28 if m == 2 else 30 if m in [4, 6, 9, 11] else 31
            if m == 10 and y == 2026:
                max_day = min(max_day, date.today().day)

            for i in range(mc["count"]):
                tpl = sample_transactions[i % len(sample_transactions)]
                day_num = random.randint(1, max_day)
                exp_date = date(y, m, day_num)
                
                # Vary amount slightly
                var_factor = random.uniform(0.88, 1.15)
                amt = round(tpl["amount"] * mult * var_factor, 2)
                
                exp = Expense(
                    user_id=demo_user.id,
                    amount=amt,
                    merchant=tpl["merchant"],
                    description=tpl["description"],
                    category=tpl["category"],
                    subcategory=tpl["subcategory"],
                    payment_method=tpl["payment_method"],
                    expense_date=exp_date,
                    source=tpl["source"],
                    confidence_score=0.96 if tpl["source"] != "manual" else 1.0
                )
                db.add(exp)
                total_expenses_seeded += 1

        db.commit()
        print(f"Successfully created {total_expenses_seeded} transactions and budgets for 3 months!")

        # Generate fresh AI insights
        print("Generating AI insights...")
        stats = analytics_service.get_stats_for_ai(demo_user.id, db, month=10, year=2026)
        from backend.app.services.ai_service import ai_service
        insights_list = ai_service.generate_spending_insights(stats)
        for ins in insights_list:
            db.add(AIInsight(
                user_id=demo_user.id,
                type=ins["type"],
                title=ins["title"],
                description=ins["description"],
                severity=ins["severity"]
            ))
        db.commit()

        # Pre-generate Monthly Reports for Aug, Sept, and Oct
        print("Pre-generating monthly reports...")
        for mc in months_config:
            report_service.get_or_generate_report(demo_user.id, mc["month"], mc["year"], db, force_regenerate=True)

        print("\n=======================================================")
        print(" SpendIQ Database Successfully Seeded!")
        print(" Demo Credentials:")
        print("   Email:    demo@spendiq.app")
        print("   Password: Demo@123")
        print("   Income:   Rs. 85,000 / month")
        print("=======================================================\n")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
