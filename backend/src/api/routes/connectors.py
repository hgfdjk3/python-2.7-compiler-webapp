import json
import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import asyncio
from typing import Dict, Any, List, Optional
from src.api.services.connector_tools_service import clear_connector_tools_cache

router = APIRouter()

# Resolve path to connectors.json in the backend directory
routes_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(routes_dir, "..", "..", ".."))
CONNECTORS_FILE = os.path.join(backend_dir, "connectors.json")


def load_connectors() -> Dict[str, Any]:
    connectors = {}
    if os.path.exists(CONNECTORS_FILE):
        try:
            with open(CONNECTORS_FILE, "r") as f:
                connectors = json.load(f)
        except Exception as e:
            # Fallback or log error
            pass
    return connectors

def save_connectors(connectors: Dict[str, Any]):
    try:
        # Strip header_values before saving to connectors.json
        connectors_to_save = {}
        for k, v in connectors.items():
            v_copy = v.copy()
            if "header_values" in v_copy:
                del v_copy["header_values"]
            connectors_to_save[k] = v_copy
            
        with open(CONNECTORS_FILE, "w") as f:
            json.dump(connectors_to_save, f, indent=2)
    except Exception as e:
        pass

# In-memory python dictionary for MCP connectors, loaded from file
# Format: { "connector_id": { "id": "connector_id", "name": "...", "url": "...", "color": "...", "description": "..." } }
CONNECTORS_DB: Dict[str, Any] = load_connectors()

def trigger_background_discovery():
    """Triggers background discovery of tools across all active connectors."""
    try:
        from src.services.harness.mcp.client import MCPClientManager
        mcp_manager = MCPClientManager(CONNECTORS_DB)
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
    for conn_id, conn in CONNECTORS_DB.items():
        conn_copy = conn.copy()
        conn_copy["tools"] = conn_to_tools.get(conn_id, [])
        result.append(conn_copy)
    return result

@router.post("/connectors", response_model=ConnectorResponse)
async def add_connector(connector: ConnectorCreate, request: Request):
    if connector.id in CONNECTORS_DB:
        raise HTTPException(status_code=400, detail="Connector with this ID already exists")
    
    conn_dict = connector.model_dump()
        
    # Save in memory and to file
    CONNECTORS_DB[connector.id] = conn_dict
    save_connectors(CONNECTORS_DB)
    
    # Update AgentRunner connectors configuration
    agent_runner = getattr(request.app.state, "agent_runner", None)
    if agent_runner:
        agent_runner.mcp_configs = CONNECTORS_DB
        
    clear_connector_tools_cache()
    trigger_background_discovery()
    return CONNECTORS_DB[connector.id]

@router.put("/connectors/{connector_id}", response_model=ConnectorResponse)
async def update_connector(connector_id: str, connector: ConnectorCreate, request: Request):
    if connector_id not in CONNECTORS_DB:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    if connector.id != connector_id and connector.id in CONNECTORS_DB:
        raise HTTPException(status_code=400, detail="New Connector ID already exists")
    
    # If ID changed, delete the old one
    if connector.id != connector_id:
        del CONNECTORS_DB[connector_id]
        
    conn_dict = connector.model_dump()
        
    CONNECTORS_DB[connector.id] = conn_dict
    save_connectors(CONNECTORS_DB)
    
    # Update AgentRunner connectors configuration
    agent_runner = getattr(request.app.state, "agent_runner", None)
    if agent_runner:
        agent_runner.mcp_configs = CONNECTORS_DB
        
    clear_connector_tools_cache()
    trigger_background_discovery()
    return CONNECTORS_DB[connector.id]

@router.delete("/connectors/{connector_id}")
async def delete_connector(connector_id: str, request: Request):
    if connector_id not in CONNECTORS_DB:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    del CONNECTORS_DB[connector_id]
    save_connectors(CONNECTORS_DB)
    
    # Update AgentRunner connectors configuration
    agent_runner = getattr(request.app.state, "agent_runner", None)
    if agent_runner:
        agent_runner.mcp_configs = CONNECTORS_DB
        
    clear_connector_tools_cache()
    trigger_background_discovery()
    return {"message": "Connector deleted"}
