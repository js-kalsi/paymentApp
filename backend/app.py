from fastapi import FastAPI, HTTPException, UploadFile, File, Query, Depends
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
from datetime import date, datetime
from pymongo import MongoClient
from bson import ObjectId
from bson.errors import InvalidId
import os
from config import COLLECTION_NAME, DB_HOST, DB_PORT, DB_NAME

app = FastAPI()

# MongoDB Connection
client = MongoClient(f"mongodb://{DB_HOST}:{DB_PORT}/")
db = client[DB_NAME]
payment_collection = db[COLLECTION_NAME]


# Pydantic Models
class PayeeAddress(BaseModel):
    line_1: str
    line_2: Optional[str]
    city: str
    province_or_state: Optional[str]
    country: str
    postal_code: str


class PayeeContact(BaseModel):
    phone_number: str
    email: EmailStr


class Payment(BaseModel):
    payee_first_name: str
    payee_last_name: str
    payee_payment_status: str
    payee_added_date_utc: int
    payee_due_date: str
    payee_address: PayeeAddress
    payee_contact: PayeeContact
    currency: str
    discount_percent: Optional[float] = 0.0
    tax_percent: Optional[float] = 0.0
    due_amount: float
    evidence_file: Optional[dict] = None
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)


class UpdatePayment(BaseModel):
    payee_first_name: Optional[str]
    payee_last_name: Optional[str]
    payee_payment_status: Optional[str]
    payee_due_date: Optional[str]
    payee_address: Optional[PayeeAddress]
    payee_contact: Optional[PayeeContact]
    currency: Optional[str]
    discount_percent: Optional[float]
    tax_percent: Optional[float]
    due_amount: Optional[float]


# Helper Functions
def calculate_total_due(due_amount, discount_percent, tax_percent):
    discount = due_amount * (discount_percent / 100)
    tax = due_amount * (tax_percent / 100)
    return round(due_amount - discount + tax, 2)


# Routes
@app.get("/get_payments")
async def get_payments(
    status: Optional[str] = None,
    search: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1),
):
    query = {}

    # Filtering
    if status:
        query["payee_payment_status"] = status

    # Searching
    if search:
        query["$or"] = [
            {"payee_first_name": {"$regex": search, "$options": "i"}},
            {"payee_last_name": {"$regex": search, "$options": "i"}},
            {"payee_contact.email": {"$regex": search, "$options": "i"}},
        ]

    # Pagination
    skip = (page - 1) * limit
    payments = list(payment_collection.find(query).skip(skip).limit(limit))

    # Post-fetch modifications
    today = date.today()
    for payment in payments:
        due_date = datetime.strptime(payment["payee_due_date"], "%Y-%m-%d").date()
        if due_date == today:
            payment["payee_payment_status"] = "due_now"
        elif due_date < today:
            payment["payee_payment_status"] = "overdue"

        payment["total_due"] = calculate_total_due(
            payment["due_amount"],
            payment.get("discount_percent", 0),
            payment.get("tax_percent", 0),
        )

    return payments


@app.post("/create_payment")
async def create_payment(payment: Payment):
    result = payment_collection.insert_one(payment.dict(by_alias=True))
    return {"id": str(result.inserted_id)}


@app.put("/update_payment/{payment_id}")
async def update_payment(payment_id: str, payment: UpdatePayment):
    try:
        payment_id = ObjectId(payment_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid payment ID")

    update_data = payment.dict(exclude_unset=True)
    update_data["updated_at"] = datetime.utcnow()

    result = payment_collection.update_one({"_id": payment_id}, {"$set": update_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")

    return {"message": "Payment updated successfully"}


@app.delete("/delete_payment/{payment_id}")
async def delete_payment(payment_id: str):
    try:
        payment_id = ObjectId(payment_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid payment ID")

    result = payment_collection.delete_one({"_id": payment_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Payment not found")

    return {"message": "Payment deleted successfully"}


@app.post("/upload_evidence/{payment_id}")
async def upload_evidence(payment_id: str, file: UploadFile = File(...)):
    try:
        payment_id = ObjectId(payment_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid payment ID")

    if file.content_type not in ["application/pdf", "image/png", "image/jpeg"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    file_path = f"evidence_files/{payment_id}_{file.filename}"
    os.makedirs("evidence_files", exist_ok=True)
    with open(file_path, "wb") as f:
        f.write(await file.read())

    payment_collection.update_one(
        {"_id": payment_id},
        {
            "$set": {
                "evidence_file": {
                    "file_name": file.filename,
                    "file_path": file_path,
                    "content_type": file.content_type,
                }
            }
        },
    )

    return {"message": "Evidence uploaded successfully"}


@app.get("/download_evidence/{payment_id}")
async def download_evidence(payment_id: str):
    try:
        payment_id = ObjectId(payment_id)
    except InvalidId:
        raise HTTPException(status_code=400, detail="Invalid payment ID")

    payment = payment_collection.find_one({"_id": payment_id})
    if not payment or "evidence_file" not in payment:
        raise HTTPException(status_code=404, detail="Evidence not found")

    file_path = payment["evidence_file"]["file_path"]
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(
        file_path,
        media_type=payment["evidence_file"]["content_type"],
        filename=payment["evidence_file"]["file_name"],
    )
