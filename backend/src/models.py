from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional
from fastapi import Query
from .helpers import validate_country, validate_currency


class PaymentQuery(BaseModel):
    payee_first_name: Optional[str] = None
    payee_last_name: Optional[str]= None
    payee_payment_status: Optional[str]= None
    payee_address_line_1: Optional[str]= None
    payee_address_line_2: Optional[str]= None
    payee_city: Optional[str]= None
    payee_country: Optional[str]= None  # ISO 3166-1 alpha-2
    payee_province_or_state: Optional[str]= None
    payee_postal_code: Optional[str]= None
    payee_phone_number: Optional[str] = Field(None, pattern=r"^\+?[1-9]\d{1,14}$")  # E.164
    payee_email: Optional[EmailStr] = None
    currency: Optional[str] = Field(None, pattern="^[A-Z]{3}$")  # ISO 4217

    # Page and limit values
    page: int = Query(1, ge=1)  # Default is 1, and must be >= 1
    limit: int = Query(10, ge=1)  # Default is 10, and must be >= 1

    # Check if the country code is valid as per ISO 3166-1 alpha-2 format.
    @validator("payee_country")
    def check_valid_country(cls, value):
        if value and not validate_country(value):
            raise ValueError(f"{value} is not a valid ISO 3166-1 alpha-2 country code.")
        return value

    # Check if the currency is valid as per ISO 4217 format.
    @validator("currency")
    def check_valid_currency(cls, value):
        if value and not validate_currency(value):
            raise ValueError(f"{value} is not a valid ISO 4217 currency code.")
        return value
