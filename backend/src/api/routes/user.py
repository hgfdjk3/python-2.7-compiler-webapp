import os
from fastapi import APIRouter, Depends
from typing import Dict, List, Any, Optional
from pydantic import BaseModel

from src.api.dependencies.auth import get_current_user
from src.api.utils.db import get_collection

router = APIRouter()

class UserConfig(BaseModel):
    enabled_connectors: List[str] = []
    header_values: Dict[str, Dict[str, str]] = {}

def get_user_config_dict(username: str) -> Dict[str, Any]:
    users_coll = get_collection("users")
    user_doc = users_coll.find_one({"_id": username})
    if user_doc:
        # Remove the _id field before returning if needed, or just return the dict
        # Ensure it has the structure we want
        return {
            "enabled_connectors": user_doc.get("enabled_connectors", []),
            "header_values": user_doc.get("header_values", {})
        }
    return {"enabled_connectors": [], "header_values": {}}

@router.get("/user/config", response_model=UserConfig)
async def get_user_config(username: str = Depends(get_current_user)):
    return get_user_config_dict(username)

@router.post("/user/config", response_model=UserConfig)
async def update_user_config(config: UserConfig, username: str = Depends(get_current_user)):
    users_coll = get_collection("users")
    
    users_coll.update_one(
        {"_id": username},
        {"$set": config.model_dump()},
        upsert=True
    )
    
    return config

