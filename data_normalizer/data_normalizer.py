import re
from datetime import datetime, timezone

import pandas as pd
import pycountry


# Validate ISO 3166-1 alpha-2 country codes
def validate_country(country_code):
    try:
        return pycountry.countries.get(alpha_2=country_code.upper()) is not None
    except Exception:
        print(f"Invalid country detected: {country_code}")
        return False


# Validate ISO 4217 currency codes
def validate_currency(currency_code):
    try:
        return pycountry.currencies.get(alpha_3=currency_code.upper()) is not None
    except Exception:
        print(f"Invalid currency detected: {currency_code}")
        return False


def validate_phone(phone_number):
    """Validate phone number in E.164 format."""
    pattern = re.compile(r"^\+?[1-9]\d{1,14}$")
    if pattern is None:
        print(f"Invalid Phone number detected: {phone_number}")
    return bool(pattern.match(phone_number))


def format_date(date_str):
    """Ensure date is in YYYY-MM-DD format."""
    try:
        return pd.to_datetime(date_str).strftime("%Y-%m-%d")
    except Exception:
        return None


def format_utc_timestamp(timestamp: int):
    datetime_utc = datetime.fromtimestamp(timestamp, tz=timezone.utc)
    assert (
        datetime_utc.tzinfo == timezone.utc
    ), f"Timestamp: {timestamp} is not in UTC format"


def validate_percentage(value):
    """Ensure percentage values are between 0 and 100."""
    try:
        return round(float(value), 2) if 0 <= float(value) <= 100 else None
    except Exception:
        return None


def validate_mandatory(value):
    """Check if a mandatory field is non-empty."""
    return value if pd.notnull(value) and str(value).strip() else None


def validate_dataset(
    csv_file="payment_information.csv",
    normalized_csv_file: str = "normalized_payment_information.csv",
):
    df = pd.read_csv(
        csv_file, dtype={"payee_phone_number": str, "payee_postal_code": str}
    )

    # Detect the rows which are having invalid country code
    # pd.set_option("display.max_columns", None)
    # null_rows = df[df["payee_country"].isna()]
    # print(null_rows)

    # Check if col(payee_first_name) is having valid datatype
    assert (
        df["payee_first_name"].apply(lambda x: isinstance(x, str)).all() == True
    ), "Column payee_first_name contains non-string"

    # Check if col(payee_last_name) is having valid datatype
    assert (
        df["payee_last_name"].apply(lambda x: isinstance(x, str)).all() == True
    ), "Column payee_last_name contains non-string"

    # Validate payee_payment_status column: should be string and contains only ["completed", "due_now", "overdue", "pending"]
    assert (
        df["payee_payment_status"].apply(lambda x: isinstance(x, str)).all() == True
    ), "Column payee_payment_status contains non-string"

    assert (
        df["payee_payment_status"]
        .isin(["completed", "due_now", "overdue", "pending"])
        .all()
    ), "Column payee_payment_status contains invalid values"

    # Check if col(payee_added_date_utc) is having valid datatype
    assert (
        df["payee_added_date_utc"].apply(lambda x: isinstance(x, int)).all() == True
    ), "Column payee_added_date_utc contains non-int values"

    # Check if col(payee_due_date) is having valid datatype
    assert (
        df["payee_due_date"].apply(lambda x: isinstance(x, str)).all() == True
    ), "Column payee_due_date contains non-string"

    # Check if col(valid_dates_invalid) is having valid datatype
    valid_dates_invalid = pd.to_datetime(df["payee_due_date"], errors="coerce").notna()
    assert (
        valid_dates_invalid.all()
    ), "There are invalid or improperly formatted dates in the 'date' column"

    # Check if payee_address_line_1 & payee_address_line_2 are valid datatype
    assert (
        df["payee_address_line_1"].apply(lambda x: isinstance(x, str)).all() == True
    ), "payee_address_line_1 column contains non-string"
    assert (
        df["payee_address_line_2"].apply(lambda x: isinstance(x, str)).all() == True
    ), "payee_address_line_2 column contains non-string"

    # Check if col(payee_city) is having valid datatype
    assert (
        df["payee_city"].apply(lambda x: isinstance(x, str)).all() == True
    ), "payee_city column contains non-string"

    # Check if col(payee_country) is having valid datatype
    assert (
        df["payee_country"].apply(lambda x: isinstance(x, str)).all() == True
    ), "payee_country column contains non-string"

    # Check if col(payee_country) is in ISO 3166-1 alpha-2 format
    df["payee_country"] = df["payee_country"].apply(
        lambda x: x if validate_country(x) else None
    )

    # Check if payee_province_or_state are valid datatype
    assert (
        df["payee_province_or_state"].apply(lambda x: isinstance(x, str)).all() == True
    ), "payee_province_or_state column contains non-string"

    # Check if col(payee_postal_code) is having valid datatype
    assert (
        df["payee_postal_code"].apply(lambda x: isinstance(x, str)).all() == True
    ), "payee_postal_code column contains non-string"

    # Check if col(payee_phone_number) is having valid datatype
    assert (
        df["payee_phone_number"].apply(lambda x: isinstance(x, str)).all() == True
    ), "payee_phone_number column contains non-string"

    # Check if col(payee_email) is having valid datatype
    assert (
        df["payee_email"].apply(lambda x: isinstance(x, str)).all() == True
    ), "payee_email column contains non-string"

    # Check if col(currency) is having valid datatype
    assert (
        df["currency"].apply(lambda x: isinstance(x, str)).all() == True
    ), "currency column contains non-string"

    # Check if col(discount_percent) is having valid datatype
    assert (
        df["discount_percent"].apply(lambda x: isinstance(x, float)).all() == True
    ), "discount_percent column contains non-float"

    # Check if col(tax_percent) is having valid datatype
    assert (
        df["tax_percent"].apply(lambda x: isinstance(x, float)).all() == True
    ), "tax_percent column contains non-string"

    # Check if col(due_amount) is having valid datatype
    assert (
        df["due_amount"].apply(lambda x: isinstance(x, float)).all() == True
    ), "payee_first_name column contains non-string"

    # ***** Apply normalization rules *****

    # Check if col(payee_phone_number) is in ISO 4217 format
    df["currency"] = df["currency"].apply(lambda x: x if validate_currency(x) else None)

    # Check if col(payee_phone_number) is in E.164 format
    df["payee_phone_number"] = (
        df["payee_phone_number"]
        .map(str)
        .apply(lambda x: x if validate_phone(x) else None)
    )

    df["payee_due_date"] = df["payee_due_date"].apply(format_date)
    df["payee_added_date_utc"].apply(format_utc_timestamp)
    df["discount_percent"] = df["discount_percent"].apply(validate_percentage)
    df["tax_percent"] = df["tax_percent"].apply(validate_percentage)
    df["due_amount"] = df["due_amount"].apply(
        lambda x: round(float(x), 2) if pd.notnull(x) and float(x) >= 0 else None
    )

    # Validate mandatory fields
    mandatory_fields = [
        "payee_address_line_1",
        "payee_city",
        "payee_country",
        "payee_postal_code",
        "payee_phone_number",
        "payee_email",
        "currency",
        "due_amount",
    ]
    for field in mandatory_fields:
        df[field] = df[field].apply(validate_mandatory)

    # Save the normalized data to a new CSV file
    df.to_csv(normalized_csv_file, index=False)

    print(f"Normalized data saved to {normalized_csv_file}")


if __name__ == "__main__":
    validate_dataset()
