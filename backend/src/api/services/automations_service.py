import json
import os
import uuid
from typing import Dict, Any, List
from src.api.services.connector_tools_service import calculate_node_color

# Resolve path to automations.json in the backend directory
services_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(services_dir, "..", "..", ".."))
AUTOMATIONS_FILE = os.path.join(backend_dir, "automations.json")

def load_automations() -> Dict[str, Any]:
    if os.path.exists(AUTOMATIONS_FILE):
        try:
            with open(AUTOMATIONS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {}

def save_automations_to_file(automations: Dict[str, Any]):
    try:
        with open(AUTOMATIONS_FILE, "w") as f:
            json.dump(automations, f, indent=2)
    except Exception:
        pass

# In-memory python dictionary for automations, loaded from file
AUTOMATIONS_DB: Dict[str, Any] = load_automations()

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
    return list(AUTOMATIONS_DB.values())

def get_automation_by_id(automation_id: str) -> Dict[str, Any]:
    return AUTOMATIONS_DB.get(automation_id)

async def create_new_automation(automation_data: Dict[str, Any]) -> Dict[str, Any]:
    new_id = str(uuid.uuid4())
    automation_data["id"] = new_id
    await populate_automation_colors(automation_data)
    AUTOMATIONS_DB[new_id] = automation_data
    save_automations_to_file(AUTOMATIONS_DB)
    return automation_data

async def update_existing_automation(automation_id: str, update_data: Dict[str, Any]) -> Dict[str, Any]:
    if automation_id not in AUTOMATIONS_DB:
        return None
    
    current_data = AUTOMATIONS_DB[automation_id]
    for key, value in update_data.items():
        current_data[key] = value
        
    await populate_automation_colors(current_data)
    AUTOMATIONS_DB[automation_id] = current_data
    save_automations_to_file(AUTOMATIONS_DB)
    return current_data

def delete_automation_by_id(automation_id: str) -> bool:
    if automation_id not in AUTOMATIONS_DB:
        return False
    
    del AUTOMATIONS_DB[automation_id]
    save_automations_to_file(AUTOMATIONS_DB)
    return True
