import pandas as pd
import iso3166
import iso4217
import re


def validate_country(country_code):
    """Validate country code against ISO 3166-1 alpha-2."""
    return country_code.upper() in [c.alpha2 for c in iso3166.countries]


def validate_currency(currency_code):
    """Validate currency code against ISO 4217."""
    return currency_code.upper() in [c.code for c in iso4217.currencies]


def validate_phone(phone_number):
    """Validate phone number in E.164 format."""
    pattern = re.compile(r"^\+?[1-9]\d{1,14}$")
    return bool(pattern.match(phone_number))


def format_date(date_str):
    """Ensure date is in YYYY-MM-DD format."""
    try:
        return pd.to_datetime(date_str).strftime("%Y-%m-%d")
    except Exception:
        return None


def format_utc_timestamp(timestamp_str):
    """Ensure UTC timestamp is in ISO 8601 format."""
    try:
        return pd.to_datetime(timestamp_str).isoformat()
    except Exception:
        return None


def validate_percentage(value):
    """Ensure percentage values are between 0 and 100."""
    try:
        return round(float(value), 2) if 0 <= float(value) <= 100 else None
    except Exception:
        return None


def validate_mandatory(value):
    """Check if a mandatory field is non-empty."""
    return value if pd.notnull(value) and str(value).strip() else None


# Calculate 'total_due'
def calculate_total_due(row):
    """Calculate total_due based on discount, tax, and due_amount."""
    due_amount = row["due_amount"] or 0
    discount = (row["discount_percent"] or 0) / 100
    tax = (row["tax_percent"] or 0) / 100
    return round(due_amount * (1 - discount) * (1 + tax), 2)


def validate_dataset(
    csv_file="payment_information.csv",
    normalized_csv_file: str = "normalized_payment_information.csv",
):
    df = pd.read_csv(csv_file)
    # Apply normalization rules
    df["payee_country"] = df["payee_country"].apply(
        lambda x: x if validate_country(x) else None
    )
    df["currency"] = df["currency"].apply(lambda x: x if validate_currency(x) else None)
    df["payee_phone_number"] = df["payee_phone_number"].apply(
        lambda x: x if validate_phone(x) else None
    )
    df["payee_due_date"] = df["payee_due_date"].apply(format_date)
    df["payee_added_date_utc"] = df["payee_added_date_utc"].apply(format_utc_timestamp)
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

    # Remove rows with missing mandatory fields
    df = df.dropna(subset=mandatory_fields)
    df["total_due"] = df.apply(calculate_total_due, axis=1)

    # Save the normalized data to a new CSV file

    df.to_csv(normalized_csv_file, index=False)

    print(f"Normalized data saved to {normalized_csv_file}")


if __name__ == "__main__":
    validate_dataset()
