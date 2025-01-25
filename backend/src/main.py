from fastapi import FastAPI
from src.routes.payments import payment_router

app = FastAPI()

# Include the router from routes.py
app.include_router(payment_router)
