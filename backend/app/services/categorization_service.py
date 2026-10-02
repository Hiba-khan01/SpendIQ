import os
import joblib
import logging
from typing import Tuple, Dict

logger = logging.getLogger(__name__)

CATEGORY_KEYWORDS: Dict[str, list] = {
    "Food": ["swiggy", "zomato", "dominos", "pizza", "burger", "mcdonalds", "kfc", "restaurant", "cafe", "starbucks", "dinner", "lunch", "breakfast", "coffee", "tea", "biryani", "food"],
    "Groceries": ["blinkit", "zepto", "instamart", "bigbasket", "dmart", "spencers", "reliance fresh", "supermarket", "vegetable", "fruits", "milk", "eggs", "grocery", "kirana"],
    "Transport": ["uber", "ola", "rapido", "cab", "auto", "metro", "petrol", "diesel", "fuel", "fastag", "toll", "parking", "bus", "train", "taxi"],
    "Travel": ["flight", "indigo", "air india", "makemytrip", "cleartrip", "yatra", "airbnb", "hotel", "resort", "irctc", "redbus", "trip", "vacation"],
    "Shopping": ["amazon", "flipkart", "myntra", "ajio", "zara", "h&m", "clothes", "shoes", "electronics", "croma", "reliance digital", "nykaa", "ikea", "decathlon", "mall", "purchase"],
    "Entertainment": ["bookmyshow", "pvr", "inox", "movie", "cinema", "theatre", "concert", "game", "arcade", "bowling", "event"],
    "Subscriptions": ["netflix", "spotify", "amazon prime", "disney", "hotstar", "youtube premium", "icloud", "google one", "chatgpt", "openai", "subscription", "membership"],
    "Bills": ["electricity", "water bill", "gas bill", "airtel", "jio", "broadband", "wifi", "postpaid", "recharge", "maintenance", "society", "bescom", "tax", "rent"],
    "Healthcare": ["pharmacy", "apollo", "1mg", "practo", "doctor", "hospital", "medicine", "clinic", "dental", "blood test", "health", "lenskart", "insurance"],
    "Education": ["udemy", "coursera", "course", "tuition", "school", "college", "books", "exam", "certification", "skillshare", "class"],
    "Other": ["cash", "atm", "donation", "repair", "laundry", "courier", "cleaning", "miscellaneous"]
}

class CategorizationService:
    def __init__(self):
        self.model = None
        self._load_model()

    def _load_model(self):
        model_paths = [
            os.path.join(os.path.dirname(__file__), "..", "ml", "categorizer.joblib"),
            os.path.join(os.path.dirname(__file__), "..", "..", "..", "ml", "models", "categorizer.joblib")
        ]
        for p in model_paths:
            if os.path.exists(p):
                try:
                    self.model = joblib.load(p)
                    logger.info(f"Loaded ML categorizer from {p}")
                    return
                except Exception as e:
                    logger.warning(f"Error loading model from {p}: {e}")
        logger.warning("ML categorizer model not found on disk. Using rule-based fallback engine.")

    def predict_category(self, text: str) -> Tuple[str, float, bool]:
        """
        Predicts category and returns (category, confidence_score, requires_confirmation)
        """
        if not text or not text.strip():
            return ("Other", 0.5, True)

        cleaned_text = text.lower().strip()

        # Check keyword exact/partial match boost
        for cat, keywords in CATEGORY_KEYWORDS.items():
            for kw in keywords:
                if kw in cleaned_text:
                    # Very strong keyword match
                    return (cat, 0.95, False)

        # ML Model prediction
        if self.model is not None:
            try:
                probs = self.model.predict_proba([cleaned_text])[0]
                classes = self.model.classes_
                max_idx = probs.argmax()
                best_cat = classes[max_idx]
                confidence = float(probs[max_idx])
                
                # If confidence is lower than 0.60, suggest confirmation
                requires_confirmation = confidence < 0.60
                return (best_cat, round(confidence, 2), requires_confirmation)
            except Exception as e:
                logger.warning(f"Prediction failed with model: {e}")

        # Default fallback
        return ("Other", 0.50, True)

categorization_service = CategorizationService()
