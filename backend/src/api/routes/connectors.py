import json
import os
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Dict, Any, List, Optional

router = APIRouter()

# Resolve path to connectors.json in the backend directory
routes_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(routes_dir, "..", "..", ".."))
CONNECTORS_FILE = os.path.join(backend_dir, "connectors.json")

def load_connectors() -> Dict[str, Any]:
    if os.path.exists(CONNECTORS_FILE):
        try:
            with open(CONNECTORS_FILE, "r") as f:
                return json.load(f)
        except Exception as e:
            # Fallback or log error
            pass
    return {}

def save_connectors(connectors: Dict[str, Any]):
    try:
        with open(CONNECTORS_FILE, "w") as f:
            json.dump(connectors, f, indent=2)
    except Exception as e:
        pass

# In-memory python dictionary for MCP connectors, loaded from file
# Format: { "connector_id": { "id": "connector_id", "name": "...", "url": "...", "color": "...", "description": "..." } }
CONNECTORS_DB: Dict[str, Any] = load_connectors()

class ConnectorCreate(BaseModel):
    id: str
    name: str
    url: str
    color: str
    icon: Optional[str] = None
    description: str
    headers: Optional[Dict[str, str]] = None

class ConnectorResponse(BaseModel):
    id: str
    name: str
    url: str
    color: str
    icon: Optional[str] = None
    description: str
    headers: Optional[Dict[str, str]] = None

@router.get("/connectors", response_model=List[ConnectorResponse])
async def list_connectors():
    return list(CONNECTORS_DB.values())

@router.post("/connectors", response_model=ConnectorResponse)
async def add_connector(connector: ConnectorCreate, request: Request):
    if connector.id in CONNECTORS_DB:
        raise HTTPException(status_code=400, detail="Connector with this ID already exists")
    
    # Save in memory and to file
    CONNECTORS_DB[connector.id] = connector.model_dump()
    save_connectors(CONNECTORS_DB)
    
    # Reload AgentRunner graph
    agent_runner = getattr(request.app.state, "agent_runner", None)
    if agent_runner:
        await agent_runner.reload_mcp_servers(CONNECTORS_DB)
        
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
        
    CONNECTORS_DB[connector.id] = connector.model_dump()
    save_connectors(CONNECTORS_DB)
    
    # Reload AgentRunner graph
    agent_runner = getattr(request.app.state, "agent_runner", None)
    if agent_runner:
        await agent_runner.reload_mcp_servers(CONNECTORS_DB)
        
    return CONNECTORS_DB[connector.id]

@router.delete("/connectors/{connector_id}")
async def delete_connector(connector_id: str, request: Request):
    if connector_id not in CONNECTORS_DB:
        raise HTTPException(status_code=404, detail="Connector not found")
    
    del CONNECTORS_DB[connector_id]
    save_connectors(CONNECTORS_DB)
    
    # Reload AgentRunner graph
    agent_runner = getattr(request.app.state, "agent_runner", None)
    if agent_runner:
        await agent_runner.reload_mcp_servers(CONNECTORS_DB)
        
    return {"message": "Connector deleted"}
