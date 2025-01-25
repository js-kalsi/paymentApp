docker run -d -p 27017:27017 --name=payment-info-db mongo:latest

docker ps 

docker exec -it payment-info-db mongosh



# Database schema:

```json
 use payment_info_db;
```

```json
db.createCollection("payment_info", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "payee_first_name", "payee_last_name", "payee_payment_status",
        "payee_added_date_utc", "payee_due_date", "payee_address",
        "payee_contact", "currency", "due_amount", "discount_percent",
        "tax_percent"
      ],
      properties: {
        payee_first_name: { bsonType: "string" },
        payee_last_name: { bsonType: "string" },
        payee_payment_status: {
          bsonType: "string",
          enum: ["completed", "due_now", "overdue", "pending"]
        },
        payee_added_date_utc: { bsonType: "int" },
        payee_due_date: { bsonType: "string" },
        payee_address: {
          bsonType: "object",
          required: ["line_1", "city", "country", "postal_code"],
          properties: {
            line_1: { bsonType: "string" },
            line_2: { bsonType: "string" },
            city: { bsonType: "string" },
            province_or_state: { bsonType: "string" },
            country: { bsonType: "string" },
            postal_code: { bsonType: "string" }
          }
        },
        payee_contact: {
          bsonType: "object",
          required: ["phone_number", "email"],
          properties: {
            phone_number: { bsonType: "string" },
            email: { bsonType: "string" }
          }
        },
        currency: { bsonType: "string" },
        discount_percent: {
          bsonType: "double",
          minimum: 0,
          maximum: 100
        },
        tax_percent: {
          bsonType: "double",
          minimum: 0,
          maximum: 100
        },
        due_amount: { bsonType: "double", minimum: 0 },
        evidence_file: {
          bsonType: "object",
          properties: {
            file_data: { bsonType: "binData" },
            file_name: { bsonType: "string" },
            content_type: { bsonType: "string" }
          }
        },
        created_at: { bsonType: "date" },
        updated_at: { bsonType: "date" }
      }
    }
  }
});
```

```json
db.payment_info.find();
```







```python
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


```



```docker
docker run -d -v mongodb_data:/data/db -p 27017:27017 --name=payment-info-db mongo:latest
docker exec -it payment-info-db mongosh
```


```shell
curl -X POST http://127.0.0.1:8000/add_payment \
     -H "Content-Type: application/json" \
     -d '{
        "payee_first_name": "Jaspreet Singh",
        "payee_last_name": "Kalsi",
        "payee_address_line_1": "36 Eleanor Drive",
        "payee_address_line_2": "Unit 4",
        "payee_city": "Ottawa",
        "payee_country": "Canada",
        "payee_province_or_state": "Ontario",
        "payee_postal_code": "K2E5Z7",
        "payee_phone_number": "5146640997",
        "payee_email": "flockbithamp@gmail.com",
        "currency": Optional[str] = "CAD"
         }'
```