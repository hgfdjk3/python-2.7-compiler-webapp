from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import asyncio
from typing import Dict, Any, List, Optional
from src.api.services.connector_tools_service import clear_connector_tools_cache
from src.api.utils.db import get_collection

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

@router.post("/connectors", response_model=ConnectorResponse)
async def add_connector(connector: ConnectorCreate, request: Request):
    connectors_coll = get_collection("connectors")
    
    if connectors_coll.find_one({"_id": connector.id}):
        raise HTTPException(status_code=400, detail="Connector with this ID already exists")
    
    conn_dict = connector.model_dump()
    conn_dict["_id"] = conn_dict["id"]
    
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
async def update_connector(connector_id: str, connector: ConnectorCreate, request: Request):
    connectors_coll = get_collection("connectors")
    
    existing = connectors_coll.find_one({"_id": connector_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    if connector.id != connector_id and connectors_coll.find_one({"_id": connector.id}):
        raise HTTPException(status_code=400, detail="New Connector ID already exists")
    
    # If ID changed, delete the old one
    if connector.id != connector_id:
        connectors_coll.delete_one({"_id": connector_id})
        
    conn_dict = connector.model_dump()
    conn_dict["_id"] = conn_dict["id"]
    
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
async def delete_connector(connector_id: str, request: Request):
    connectors_coll = get_collection("connectors")
    
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

