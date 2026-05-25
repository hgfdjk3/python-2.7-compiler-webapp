from pydantic import BaseModel
from typing import Dict, Any, List, Optional

class AutomationCreate(BaseModel):
    name: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    automation_type: str
    schedule_config: Optional[Dict[str, Any]] = None

class AutomationUpdate(BaseModel):
    name: Optional[str] = None
    nodes: Optional[List[Dict[str, Any]]] = None
    edges: Optional[List[Dict[str, Any]]] = None
    automation_type: Optional[str] = None
    schedule_config: Optional[Dict[str, Any]] = None

class AutomationResponse(BaseModel):
    id: str
    name: str
    nodes: List[Dict[str, Any]]
    edges: List[Dict[str, Any]]
    automation_type: str
    schedule_config: Optional[Dict[str, Any]] = None

class AutomationRunRequest(BaseModel):
    input_text: Optional[str] = None
    stream: Optional[bool] = False

class AutomationRunResponse(BaseModel):
    status: str
    messages: List[Dict[str, Any]]
