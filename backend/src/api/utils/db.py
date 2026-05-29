import os
from pymongo import MongoClient

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
DB_NAME = os.getenv("MONGO_DB_NAME", "atom_db")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def get_collection(name: str):
    return db[name]
