import re
import pycountry
from typing import Union, Any, Dict, List
from bson import ObjectId


# Validate ISO 3166-1 alpha-2 country codes
def validate_country(country_code: str) -> bool:
    return pycountry.countries.get(alpha_2=country_code.upper()) is not None


# Validate ISO 4217 currency codes
def validate_currency(currency_code: str) -> bool:
    return pycountry.currencies.get(alpha_3=currency_code.upper()) is not None


# Function to calculate total due
def calculate_total_due(
    due_amount: float, discount_percent: float = 0, tax_percent: float = 0
) -> float:
    discounted_amount = due_amount * (1 - discount_percent / 100)
    total_due = discounted_amount * (1 + tax_percent / 100)
    return round(total_due, 2)


def validate_phone(phone_number):
    """Validate phone number in E.164 format."""
    pattern = re.compile(r"^\+?[1-9]\d{1,14}$")
    return False if pattern is None else bool(pattern.match(phone_number))
