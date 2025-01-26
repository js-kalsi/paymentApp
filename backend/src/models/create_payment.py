from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, Annotated
from fastapi import Query
from pydantic.types import constr
from datetime import datetime, timezone
import time
from src.helpers import validate_country, validate_currency

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


class PayeeAddress(BaseModel):
    line_1: Annotated[str, Field()]
    line_2: Annotated[Optional[str], Field(default=None)]
    city: Annotated[str, Field()]
    province_or_state: Annotated[Optional[str], Field(default=None)]
    country: Annotated[str, Field()]
    postal_code: Annotated[str, Field()]
    _validate_country = validator("country", allow_reuse=True)(check_valid_country)


class PayeeContact(BaseModel):
    phone_number: str = Field(..., pattern=r"^\+?[1-9]\d{1,14}$")
    email: EmailStr


class EvidenceFile(BaseModel):
    file_data: Annotated[Optional[bytes], Field(default=None)]
    file_name: Annotated[Optional[str], Field(default=None)]
    content_type: Annotated[Optional[str], Field(default=None)]


class PaymentCreate(BaseModel):
    payee_first_name: str
    payee_last_name: str
    payee_payment_status: Optional[str] = "pending"
    payee_added_date_utc: Annotated[Optional[int], Field(default=int(time.time()))]
    payee_due_date: str
    payee_address: PayeeAddress
    payee_contact: PayeeContact
    currency: Annotated[str, Field(pattern="^[A-Z]{3}$")]
    due_amount: Annotated[float, Field(default=0.0, ge=0)]
    discount_percent: Annotated[float, Field(default=0.0, ge=0, le=100)]
    tax_percent: Annotated[float, Field(default=0.0, ge=0, le=100)]
    evidence_file: EvidenceFile
    created_at: Annotated[Optional[datetime], Field(default=current_time)]
    updated_at: Annotated[Optional[datetime], Field(default=current_time)]

    # Validators
    _validate_currency = validator("currency", allow_reuse=True)(check_valid_currency)
