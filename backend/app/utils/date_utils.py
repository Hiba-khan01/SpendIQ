import re
from datetime import date, datetime, timedelta
from typing import Optional

MONTH_NAMES = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
]

def get_month_name(month: int) -> str:
    if 1 <= month <= 12:
        return MONTH_NAMES[month - 1]
    return ""

def parse_relative_date(text: str, reference_date: Optional[date] = None) -> date:
    if reference_date is None:
        reference_date = date.today()
        
    text_lower = text.lower()
    
    if "today" in text_lower:
        return reference_date
    if "yesterday" in text_lower:
        return reference_date - timedelta(days=1)
    if "day before yesterday" in text_lower:
        return reference_date - timedelta(days=2)
        
    # Check for "N days ago"
    match = re.search(r'(\d+)\s*days?\s*ago', text_lower)
    if match:
        days = int(match.group(1))
        return reference_date - timedelta(days=days)
        
    # Check for weekday mentions: "last monday", "on monday"
    weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
    for idx, day in enumerate(weekdays):
        if day in text_lower:
            cur_weekday = reference_date.weekday()
            diff = (cur_weekday - idx) % 7
            if diff == 0:
                diff = 7 # Previous week's day
            return reference_date - timedelta(days=diff)
            
    # Check explicit date formats like YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY
    date_match = re.search(r'(\d{4})[-/](\d{1,2})[-/](\d{1,2})', text)
    if date_match:
        try:
            return date(int(date_match.group(1)), int(date_match.group(2)), int(date_match.group(3)))
        except ValueError:
            pass
            
    date_match2 = re.search(r'(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})', text)
    if date_match2:
        try:
            day = int(date_match2.group(1))
            month = int(date_match2.group(2))
            year = int(date_match2.group(3))
            if year < 100:
                year += 2000
            return date(year, month, day)
        except ValueError:
            pass

    return reference_date
