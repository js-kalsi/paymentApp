from fastapi import APIRouter, Depends, HTTPException
from pymongo import MongoClient
from datetime import datetime, timezone, date
import time
from bson import ObjectId
from src.config import COLLECTION_NAME, DB_HOST, DB_PORT, DB_NAME
from src.models import PaymentQuery, PaymentCreate
from src.helpers import calculate_total_due

payment_router = APIRouter()

# MongoDB Connection
client = MongoClient(f"mongodb://{DB_HOST}:{DB_PORT}/")
db = client[DB_NAME]
payment_collection = db[COLLECTION_NAME]


@payment_router.get("/get_payments")
def get_payments(params: PaymentQuery = Depends()):
    # Query object to filter the database
    query = {}

    # Add filters for each field if provided
    if params.payee_first_name:
        query["payee_first_name"] = {"$regex": params.payee_first_name, "$options": "i"}
    if params.payee_last_name:
        query["payee_last_name"] = {"$regex": params.payee_last_name, "$options": "i"}
    if params.payee_payment_status:
        query["payee_payment_status"] = params.payee_payment_status
    if params.payee_address_line_1:
        query["payee_address.line_1"] = {
            "$regex": params.payee_address_line_1,
            "$options": "i",
        }
    if params.payee_address_line_2:
        query["payee_address.line_2"] = {
            "$regex": params.payee_address_line_2,
            "$options": "i",
        }
    if params.payee_city:
        query["payee_address.city"] = {"$regex": params.payee_city, "$options": "i"}
    if params.payee_country:
        query["payee_address.country"] = params.payee_country
    if params.payee_province_or_state:
        query["payee_address.province_or_state"] = {
            "$regex": params.payee_province_or_state,
            "$options": "i",
        }
    if params.payee_postal_code:
        query["payee_address.postal_code"] = {
            "$regex": params.payee_postal_code,
            "$options": "i",
        }
    if params.payee_phone_number:
        query["payee_contact.phone_number"] = params.payee_phone_number
    if params.payee_email:
        query["payee_contact.email"] = {"$regex": params.payee_email, "$options": "i"}
    if params.currency:
        query["currency"] = params.currency

    # Pagination
    skip = (params.page - 1) * params.limit
    payments = list(payment_collection.find(query).skip(skip).limit(params.limit))

    # Post-fetch modifications
    today = date.today()
    for payment in payments:
        payment["_id"] = f"{payment['_id']}"
        due_date = date.fromisoformat(payment["payee_due_date"])
        if due_date == today:
            payment["payee_payment_status"] = "due_now"
        elif due_date < today:
            payment["payee_payment_status"] = "overdue"

        payment["total_due"] = calculate_total_due(
            payment["due_amount"],
            payment.get("discount_percent", 0),
            payment.get("tax_percent", 0),
        )

    return {
        "data": payments,
        "page": params.page,
        "limit": params.limit,
        "total": payment_collection.count_documents(query),
    }


@payment_router.post("/add_payment")
def add_payment(payment: PaymentCreate):
    # Convert the Pydantic model to a dictionary
    payment_data = payment.dict()
    current_time = datetime.now(timezone.utc)
    payment_row = {
        "payee_first_name": payment_data["payee_first_name"],
        "payee_last_name": payment_data["payee_last_name"],
        "payee_payment_status": payment_data["payee_payment_status"],
        "payee_added_date_utc": int(time.time()),
        "payee_due_date": datetime.now().strftime("%Y-%m-%d"),
        "payee_address": {
            "line_1": payment_data["payee_address_line_1"],
            "line_2": payment_data["payee_address_line_2"],
            "city": payment_data["payee_city"],
            "province_or_state": payment_data["payee_province_or_state"],
            "country": payment_data["payee_country"],
            "postal_code": payment_data["payee_postal_code"],
        },
        "payee_contact": {
            "phone_number": payment_data["payee_phone_number"],
            "email": payment_data["payee_email"],
        },
        "currency": payment_data["currency"],
        "discount_percent": payment_data["discount_percent"],
        "tax_percent": payment_data["tax_percent"],
        "due_amount": payment_data["due_amount"],
        "created_at": current_time,
        "updated_at": current_time,
    }

    print("payment_row :>", payment_row)

    # Insert into MongoDB
    try:
        result = payment_collection.insert_one(payment_row)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to insert payment: {str(e)}"
        )

    # Return the inserted document's ID
    return {
        "message": "Payment entry added successfully",
        "id": str(result.inserted_id),
    }
