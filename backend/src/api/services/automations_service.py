import os
import uuid
from typing import Dict, Any, List
from src.api.services.connector_tools_service import calculate_node_color
from src.api.utils.db import get_collection

async def populate_automation_colors(automation_data: Dict[str, Any]):
    """Iterates through nodes and populates their color based on tools."""
    if not automation_data:
        return
    nodes = automation_data.get("nodes", [])
    for node in nodes:
        data = node.get("data", {})
        tools = data.get("tools", [])
        color = await calculate_node_color(tools)
        data["color"] = color
        node["data"] = data

def get_all_automations() -> List[Dict[str, Any]]:
    coll = get_collection("automations")
    result = []
    for doc in coll.find():
        if "_id" in doc:
            doc["id"] = doc.pop("_id")
        result.append(doc)
    return result

def get_automations_by_ids(automation_ids: List[str]) -> List[Dict[str, Any]]:
    if not automation_ids:
        return []
    coll = get_collection("automations")
    result = []
    for doc in coll.find({"_id": {"$in": automation_ids}}):
        if "_id" in doc:
            doc["id"] = doc.pop("_id")
        result.append(doc)
    return result

def get_automation_by_id(automation_id: str) -> Dict[str, Any]:
    coll = get_collection("automations")
    doc = coll.find_one({"_id": automation_id})
    if doc:
        doc["id"] = doc.pop("_id")
    return doc

async def create_new_automation(automation_data: Dict[str, Any]) -> Dict[str, Any]:
    new_id = str(uuid.uuid4())
    automation_data["id"] = new_id
    await populate_automation_colors(automation_data)
    
    db_dict = automation_data.copy()
    db_dict["_id"] = db_dict.pop("id")
    
    coll = get_collection("automations")
    coll.insert_one(db_dict)
    
    return automation_data

async def update_existing_automation(automation_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    coll = get_collection("automations")
    existing = coll.find_one({"_id": automation_id})
    
    if not existing:
        return None
    
    for key, value in update_data.items():
        if key != "id" and key != "_id":
            existing[key] = value
            
    existing["id"] = automation_id
    await populate_automation_colors(existing)
    
    db_dict = existing.copy()
    db_dict["_id"] = db_dict.pop("id")
    
    coll.replace_one({"_id": automation_id}, db_dict)
    return existing

def delete_automation_by_id(automation_id: str) -> bool:
    coll = get_collection("automations")
    result = coll.delete_one({"_id": automation_id})
    return result.deleted_count > 0

