from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
import asyncio
from typing import Dict, Any, List, Optional
from src.api.services.connector_tools_service import clear_connector_tools_cache
from src.api.utils.db import get_collection
from src.api.dependencies.auth import get_current_user

router = APIRouter()

def get_connectors_dict() -> Dict[str, Any]:
    connectors_coll = get_collection("connectors")
    connectors = {}
    for doc in connectors_coll.find():
        if "_id" in doc:
            doc["id"] = doc.pop("_id")
        connectors[doc["id"]] = doc
    return connectors

def trigger_background_discovery():
    """Triggers background discovery of tools across all active connectors."""
    try:
        from src.services.harness.mcp.client import MCPClientManager
        mcp_manager = MCPClientManager(get_connectors_dict())
        asyncio.create_task(mcp_manager.connect_all())
    except Exception:
        pass

class ConnectorCreate(BaseModel):
    id: str
    name: str
    url: str
    color: str
    icon: Optional[str] = None
    description: str
    headers: Optional[Dict[str, str]] = None
    headers_schema: Optional[Dict[str, str]] = None
    header_values: Optional[Dict[str, str]] = None
    publisher_name: Optional[str] = None
    developers: Optional[List[str]] = []

class ConnectorResponse(BaseModel):
    id: str
    name: str
    url: str
    color: str
    icon: Optional[str] = None
    description: str
    headers: Optional[Dict[str, str]] = None
    headers_schema: Optional[Dict[str, str]] = None
    header_values: Optional[Dict[str, str]] = None
    tools: Optional[List[str]] = None
    publisher_name: Optional[str] = None
    developers: Optional[List[str]] = []

@router.get("/connectors", response_model=List[ConnectorResponse])
async def list_connectors():
    from src.api.services.connector_tools_service import get_tool_mappings
    mappings = await get_tool_mappings()
    
    # Group tools by connector ID
    conn_to_tools = {}
    for tool_name, info in mappings.items():
        conn_id = info["connector_id"]
        if conn_id not in conn_to_tools:
            conn_to_tools[conn_id] = []
        conn_to_tools[conn_id].append(tool_name)
        
    result = []
    connectors_db = get_connectors_dict()
    for conn_id, conn in connectors_db.items():
        conn_copy = conn.copy()
        conn_copy["tools"] = conn_to_tools.get(conn_id, [])
        result.append(conn_copy)
    return result

@router.get("/developers/connectors", response_model=List[ConnectorResponse])
async def list_developer_connectors(username: str = Depends(get_current_user)):
    from src.api.services.connector_tools_service import get_tool_mappings
    mappings = await get_tool_mappings()
    
    # Group tools by connector ID
    conn_to_tools = {}
    for tool_name, info in mappings.items():
        conn_id = info["connector_id"]
        if conn_id not in conn_to_tools:
            conn_to_tools[conn_id] = []
        conn_to_tools[conn_id].append(tool_name)
        
    result = []
    connectors_db = get_connectors_dict()
    for conn_id, conn in connectors_db.items():
        is_dev = username in conn.get("developers", [])
        legacy_creator = conn.get("creator") == username
        if not is_dev and not legacy_creator and conn.get("developers") is not None:
            # If it has developers array and user isn't in it, hide it. 
            # If developers array is missing completely (legacy global), we can decide to show or hide it.
            # To be safe, hide it unless they are a legacy creator or it's a global connector without any developers/creator.
            if "developers" in conn or "creator" in conn:
                continue
        conn_copy = conn.copy()
        conn_copy["tools"] = conn_to_tools.get(conn_id, [])
        result.append(conn_copy)
    return result

@router.post("/connectors", response_model=ConnectorResponse)
async def add_connector(connector: ConnectorCreate, request: Request, username: str = Depends(get_current_user)):
    connectors_coll = get_collection("connectors")
    
    if connectors_coll.find_one({"_id": connector.id}):
        raise HTTPException(status_code=400, detail="Connector with this ID already exists")
    
    conn_dict = connector.model_dump()
    conn_dict["_id"] = conn_dict["id"]
    
    if not conn_dict.get("developers"):
        conn_dict["developers"] = []
    if username not in conn_dict["developers"]:
        conn_dict["developers"].append(username)
        
    if not conn_dict.get("publisher_name"):
        conn_dict["publisher_name"] = username
    
    # Strip header_values before saving to DB, if necessary. 
    # Actually, previous code said: "Strip header_values before saving to connectors.json"
    # I should do that if it is a requirement. Let's do it in the DB document.
    db_dict = conn_dict.copy()
    if "header_values" in db_dict:
        del db_dict["header_values"]
        
    connectors_coll.insert_one(db_dict)
    
    # Update AgentRunner connectors configuration
    connectors_db = get_connectors_dict()
    agent_runner = getattr(request.app.state, "agent_runner", None)
    if agent_runner:
        agent_runner.mcp_configs = connectors_db
        
    clear_connector_tools_cache()
    trigger_background_discovery()
    return conn_dict

@router.put("/connectors/{connector_id}", response_model=ConnectorResponse)
async def update_connector(connector_id: str, connector: ConnectorCreate, request: Request, username: str = Depends(get_current_user)):
    connectors_coll = get_collection("connectors")
    
    existing = connectors_coll.find_one({"_id": connector_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Connector not found")
        
    is_dev = username in existing.get("developers", [])
    legacy_creator = existing.get("creator") == username
    if not is_dev and not legacy_creator and ("developers" in existing or "creator" in existing):
        raise HTTPException(status_code=403, detail="Not authorized to update this connector")
    
    if connector.id != connector_id and connectors_coll.find_one({"_id": connector.id}):
        raise HTTPException(status_code=400, detail="New Connector ID already exists")
    
    # If ID changed, delete the old one
    if connector.id != connector_id:
        connectors_coll.delete_one({"_id": connector_id})
        
    conn_dict = connector.model_dump()
    conn_dict["_id"] = conn_dict["id"]
    
    # Ensure username stays in developers array if they edit it
    if not conn_dict.get("developers"):
        conn_dict["developers"] = existing.get("developers", [])
    if username not in conn_dict["developers"]:
        conn_dict["developers"].append(username)
        
    # Preserve legacy creator field if it existed, just in case
    if "creator" in existing:
        conn_dict["creator"] = existing["creator"]
    
    db_dict = conn_dict.copy()
    if "header_values" in db_dict:
        del db_dict["header_values"]
        
    connectors_coll.replace_one({"_id": connector.id}, db_dict, upsert=True)
    
    connectors_db = get_connectors_dict()
    # Update AgentRunner connectors configuration
    agent_runner = getattr(request.app.state, "agent_runner", None)
    if agent_runner:
        agent_runner.mcp_configs = connectors_db
        
    clear_connector_tools_cache()
    trigger_background_discovery()
    return conn_dict

@router.delete("/connectors/{connector_id}")
async def delete_connector(connector_id: str, request: Request, username: str = Depends(get_current_user)):
    connectors_coll = get_collection("connectors")
    
    existing = connectors_coll.find_one({"_id": connector_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Connector not found")
        
    is_dev = username in existing.get("developers", [])
    legacy_creator = existing.get("creator") == username
    if not is_dev and not legacy_creator and ("developers" in existing or "creator" in existing):
        raise HTTPException(status_code=403, detail="Not authorized to delete this connector")
    
    result = connectors_coll.delete_one({"_id": connector_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    connectors_db = get_connectors_dict()
    # Update AgentRunner connectors configuration
    agent_runner = getattr(request.app.state, "agent_runner", None)
    if agent_runner:
        agent_runner.mcp_configs = connectors_db
        
    clear_connector_tools_cache()
    trigger_background_discovery()
    return {"message": "Connector deleted"}

