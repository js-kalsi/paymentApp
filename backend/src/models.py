from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional
from fastapi import Query
from .helpers import validate_country, validate_currency


def check_valid_country(value: str) -> str:
    """Validates that the country code is a valid ISO 3166-1 alpha-2 code."""
    if value and not validate_country(value):
        raise ValueError(f"{value} is not a valid ISO 3166-1 alpha-2 country code.")
    return value


def check_valid_currency(value: str) -> str:
    """Validates that the currency code is a valid ISO 4217 code."""
    if value and not validate_currency(value):
        raise ValueError(f"{value} is not a valid ISO 4217 currency code.")
    return value


def check_valid_payment_status(value: str) -> str:
    if value and value not in ["completed", "due_now", "overdue", "pending"]:
        raise ValueError(f"{value} is not a valid payment status.")
    return value


class PaymentQuery(BaseModel):
    payee_first_name: Optional[str] = None
    payee_last_name: Optional[str] = None
    payee_payment_status: Optional[str] = None
    payee_address_line_1: Optional[str] = None
    payee_address_line_2: Optional[str] = None
    payee_city: Optional[str] = None
    payee_country: Optional[str] = None  # ISO 3166-1 alpha-2
    payee_province_or_state: Optional[str] = None
    payee_postal_code: Optional[str] = None
    payee_phone_number: Optional[str] = Field(
        None, pattern=r"^\+?[1-9]\d{1,14}$"
    )  # E.164
    payee_email: Optional[EmailStr] = None
    currency: Optional[str] = Field(None, pattern="^[A-Z]{3}$")  # ISO 4217

    # Page and limit values
    page: int = Query(1, ge=1)  # Default is 1, and must be >= 1
    limit: int = Query(10, ge=1)  # Default is 10, and must be >= 1

    # Validators
    _validate_country = validator("payee_country", allow_reuse=True)(
        check_valid_country
    )
    _validate_currency = validator("currency", allow_reuse=True)(check_valid_currency)
    _validate_payment_status = validator("payee_payment_status", allow_reuse=True)(
        check_valid_payment_status
    )


class PaymentCreate(BaseModel):
    payee_first_name: str
    payee_last_name: str
    payee_payment_status: Optional[str] = "pending"
    payee_address_line_1: str
    payee_address_line_2: Optional[str] = None
    payee_city: str
    payee_country: str
    payee_province_or_state: Optional[str] = None
    payee_postal_code: str
    payee_phone_number: str = Field(..., pattern=r"^\+?[1-9]\d{1,14}$")
    payee_email: EmailStr
    currency: str = Field(..., pattern="^[A-Z]{3}$")  # ISO 4217
    discount_percent: Optional[float] = 0.0
    tax_percent: Optional[float] = 0.0
    due_amount: Optional[float] = 0.0

    # Validators
    _validate_country = validator("payee_country", allow_reuse=True)(
        check_valid_country
    )
    _validate_currency = validator("currency", allow_reuse=True)(check_valid_currency)
    _validate_payment_status = validator("payee_payment_status", allow_reuse=True)(
        check_valid_payment_status
    )
