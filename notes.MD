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
        "payee_contact", "currency", "due_amount"
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
          required: ["file_data", "file_name", "content_type"],
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