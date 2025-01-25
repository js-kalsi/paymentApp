from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, Annotated
from fastapi import Query
from datetime import datetime, timezone
import time
from datetime import datetime, timezone
from src.helpers import validate_country, validate_currency, validate_phone

current_time = datetime.now(timezone.utc)


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


def check_valid_phone_number(value: str) -> str:
    if value and not validate_phone(value):
        raise ValueError(f"{value} is not a valid phone number.")
    return value


class PayeeAddress(BaseModel):
    line_1: Optional[str] = None
    line_2: Optional[str] = None
    city: Optional[str] = None
    province_or_state: Optional[str] = None
    country: Optional[str] = None
    postal_code: Optional[str] = None
    _validate_country = validator("country", allow_reuse=True)(check_valid_country)


class PayeeContact(BaseModel):
    phone_number: Optional[str] = None
    email: Optional[EmailStr] = None
    _validate_phone_number = validator("phone_number", allow_reuse=True)(
        check_valid_phone_number
    )


class EvidenceFile(BaseModel):
    file_data: Optional[bytes] = None
    file_name: Optional[str] = None
    content_type: Optional[str] = None


class PaymentUpdate(BaseModel):
    payee_first_name: Optional[str] = None
    payee_last_name: Optional[str] = None
    payee_payment_status: Optional[str] = None
    payee_due_date: Optional[str] = None
    payee_address: Optional[PayeeAddress] = None
    payee_contact: Optional[PayeeContact] = None
    currency: Optional[str] = Field(default=None, pattern="^[A-Z]{3}$")
    due_amount: Optional[float] = Field(default=None, ge=0)
    discount_percent: Optional[float] = Field(default=None, ge=0, le=100)
    tax_percent: Optional[float] = Field(default=None, ge=0, le=100)
    evidence_file: Optional[EvidenceFile] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )
    _validate_currency = validator("currency", allow_reuse=True)(check_valid_currency)
    _validate_payment_status = validator("payee_payment_status", allow_reuse=True)(
        check_valid_payment_status
    )
