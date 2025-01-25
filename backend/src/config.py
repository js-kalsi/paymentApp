import os
import urllib

DB_HOST = os.environ.get("DB_HOST") or "localhost"
DB_PORT = os.environ.get("DB_PORT") or "27017"
DB_NAME = os.environ.get("DB_NAME") or "payment_info_db"
COLLECTION_NAME = os.environ.get("COLLECTION_NAME") or "payment_info"
