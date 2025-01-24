import csv
from pymongo import MongoClient
from datetime import datetime

# MongoDB connection details
MONGO_URI = "mongodb://localhost:27017/"
DATABASE_NAME = "payment_info_db"
COLLECTION_NAME = "payment_info"


# Function to validate and transform a row
def transform_row(row):
    return {
        "payee_first_name": row["payee_first_name"],
        "payee_last_name": row["payee_last_name"],
        "payee_payment_status": row["payee_payment_status"],
        "payee_added_date_utc": int(row["payee_added_date_utc"]),
        "payee_due_date": row["payee_due_date"],
        "payee_address": {
            "line_1": row["payee_address_line_1"],
            "line_2": row.get("payee_address_line_2", ""),
            "city": row["payee_city"],
            "country": row["payee_country"],
            "province_or_state": row.get("payee_province_or_state", ""),
            "postal_code": row["payee_postal_code"],
        },
        "payee_contact": {
            "phone_number": row["payee_phone_number"],
            "email": row["payee_email"],
        },
        "currency": row["currency"],
        "discount_percent": (
            float(row["discount_percent"]) if row["discount_percent"] else None
        ),
        "tax_percent": float(row["tax_percent"]) if row["tax_percent"] else None,
        "due_amount": float(row["due_amount"]),
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow(),
    }


if __name__ == "__main__":
    # Connect to MongoDB
    client = MongoClient(MONGO_URI)
    db = client[DATABASE_NAME]
    collection = db[COLLECTION_NAME]

    # Read CSV file and insert into MongoDB
    csv_file_path = "/Users/bugsbunny/Projects/paymentApp/data_processing/csv_files/normalized_payment_information.csv"
    with open(csv_file_path, mode="r") as file:
        reader = csv.DictReader(file)
        transformed_data = [transform_row(row) for row in reader]

    # Insert data into MongoDB
    result = collection.insert_many(transformed_data)
    print(f"Inserted {len(result.inserted_ids)} documents into MongoDB.")
