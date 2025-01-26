from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import JSONResponse, StreamingResponse
from pymongo import MongoClient
from datetime import datetime, timezone, date
import time
import base64
from bson.objectid import ObjectId
from src.config import COLLECTION_NAME, DB_HOST, DB_PORT, DB_NAME
from src.models import PaymentCreate, PaymentQuery, PaymentUpdate
from src.helpers import calculate_total_due

payment_router = APIRouter()

# MongoDB Connection
client = MongoClient(f"mongodb://{DB_HOST}:{DB_PORT}/")
db = client[DB_NAME]
payment_collection = db[COLLECTION_NAME]


@payment_router.get("/get_payments")
def get_payments(request: Request, params: PaymentQuery = Depends()):
    # Query object to filter the database
    query = {}

    # Add filters for each field if provided
    if params.paymentId:
        try:
            query["_id"] = ObjectId(params.paymentId)
        except Exception as e:
            return {"error": f"Invalid ID format: {e}"}
    if params.payee_first_name:
        query["payee_first_name"] = {"$regex": params.payee_first_name, "$options": "i"}
    if params.payee_last_name:
        query["payee_last_name"] = {"$regex": params.payee_last_name, "$options": "i"}
    if params.payee_payment_status:
        query["payee_payment_status"] = params.payee_payment_status
    if params.payee_due_date:
        query["payee_due_date"] = params.payee_due_date
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
    if params.mode == "search":
        result = []
        for payment in payments:
            # Construct evidenceFileUrl if evidence_file exists
            evidence_file_url = ""
            if "evidence_file" in payment and payment["evidence_file"].get("file_name"):
                base_url = request.base_url  # Get the base URL of the request
                evidence_file_url = f"{base_url}download_evidence/{payment['_id']}"

            result.append(
                {
                    "id": f"{payment['_id']}",
                    "addedDateUTC": payment["payee_added_date_utc"],
                    "firstName": payment["payee_first_name"],
                    "lastName": payment["payee_last_name"],
                    "paymentStatus": payment["payee_payment_status"],
                    "dueDate": payment["payee_due_date"],
                    "totalDue": calculate_total_due(
                        payment["due_amount"],
                        payment.get("discount_percent", 0),
                        payment.get("tax_percent", 0),
                    ),
                    "evidenceFileUrl": evidence_file_url,
                }
            )

        return {
            "data": result,
            "page": params.page,
            "limit": params.limit,
            "total": payment_collection.count_documents(query),
        }

    today = date.today()
    result = []
    for payment in payments:
        payment["_id"] = f"{payment['_id']}"
        due_date = date.fromisoformat(payment["payee_due_date"])
        if due_date == today:
            payment["payee_payment_status"] = "due_now"
        elif due_date < today:
            payment["payee_payment_status"] = "overdue"
        evidence_file_url = ""
        if "evidence_file" in payment and payment["evidence_file"].get("file_name"):
            base_url = request.base_url  # Get the base URL of the request
            evidence_file_url = f"{base_url}download_evidence/{payment['_id']}"
        payment["evidence_file_url"] = evidence_file_url

        if "evidence_file" in payment:
            del payment["evidence_file"]
    return {
        "data": payments,
        "page": params.page,
        "limit": params.limit,
        "total": payment_collection.count_documents(query),
    }


@payment_router.post("/add_payment")
def create_payment(payment: PaymentCreate):
    # Convert the Pydantic model to a dictionary
    payment_data = payment.dict()

    # Insert into MongoDB
    try:
        result = payment_collection.insert_one(payment_data)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to insert payment: {str(e)}"
        )

    # Return the inserted document's ID
    return {
        "message": "Payment entry added successfully",
        "id": str(result.inserted_id),
    }


@payment_router.delete("/delete_payment/{payment_id}")
def delete_payment(payment_id: str):
    try:
        payment_id = ObjectId(payment_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid payment ID")
    result = payment_collection.delete_one({"_id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")
    return {"message": "Payment deleted successfully"}


@payment_router.put("/update_payment/{payment_id}")
async def update_payment(payment_id: str, payment_update: PaymentCreate):
    print("payment_id :>", payment_id)
    print("payment_update :>", payment_update)
    # Validate the payment ID
    if not ObjectId.is_valid(payment_id):
        raise HTTPException(status_code=400, detail="Invalid payment ID format")

    # Find the existing payment document
    payment = payment_collection.find_one({"_id": ObjectId(payment_id)})

    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Prepare the updated data
    update_data = payment_update.dict()

    # Handle nested objects (e.g., payee_address and payee_contact)
    # if "payee_address" in update_data:
    #     update_data["payee_address"] = {
    #         **(payment.get("payee_address") or {}),  # Merge with existing data
    #         **update_data["payee_address"],  # Overwrite with new data
    #     }

    # if "payee_contact" in update_data:
    #     update_data["payee_contact"] = {
    #         **(payment.get("payee_contact") or {}),  # Merge with existing data
    #         **update_data["payee_contact"],  # Overwrite with new data
    #     }

    # Update the `updated_at` field
    update_data["updated_at"] = datetime.now(timezone.utc)

    # Update the document in MongoDB
    result = payment_collection.update_one(
        {"_id": ObjectId(payment_id)},
        {"$set": update_data},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")

    return {"message": "Payment updated successfully", "payment_id": payment_id}


import base64


@payment_router.put("/update_payment/{payment_id}")
async def update_payment(payment_id: str, payment_update: PaymentCreate):
    print("payment_id :>", payment_id)
    print("payment_update :>", payment_update)

    if not ObjectId.is_valid(payment_id):
        raise HTTPException(status_code=400, detail="Invalid payment ID format")

    payment = payment_collection.find_one({"_id": ObjectId(payment_id)})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    update_data = payment_update.dict()

    # Handle evidence_file
    if update_data.get("evidence_file"):
        evidence_file = update_data["evidence_file"]

        if evidence_file.get("file_data"):
            try:
                # Decode Base64 to binary data
                evidence_file["file_data"] = base64.b64decode(
                    evidence_file["file_data"]
                )
            except Exception as e:
                raise HTTPException(
                    status_code=400, detail=f"Invalid file_data: {str(e)}"
                )
        else:
            evidence_file["file_data"] = None

        update_data["evidence_file"] = evidence_file

    # Update the `updated_at` field
    update_data["updated_at"] = datetime.now(timezone.utc)

    # Update the document in MongoDB
    result = payment_collection.update_one(
        {"_id": ObjectId(payment_id)},
        {"$set": update_data},
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")

    return {"message": "Payment updated successfully", "payment_id": payment_id}


@payment_router.get("/download_evidence/{payment_id}")
async def download_evidence(payment_id: str):
    # Validate payment ID
    if not ObjectId.is_valid(payment_id):
        raise HTTPException(status_code=400, detail="Invalid payment ID format")

    # Fetch the payment record
    payment = payment_collection.find_one({"_id": ObjectId(payment_id)})
    if not payment:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Check if evidence file exists
    evidence_file = payment.get("evidence_file")
    if not evidence_file:
        raise HTTPException(
            status_code=404, detail="No evidence file found for this payment."
        )

    # Decode Base64 file data
    file_data = evidence_file["file_data"]
    try:
        decoded_file_data = base64.b64decode(file_data)
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to decode the file data")

    # File metadata
    file_name = evidence_file.get("file_name", "file")
    content_type = evidence_file.get("content_type", "application/octet-stream")

    # Create a generator to stream binary data
    def file_data_generator():
        yield decoded_file_data

    # Return the response with binary stream
    return StreamingResponse(
        file_data_generator(),
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename={file_name}"},
    )
