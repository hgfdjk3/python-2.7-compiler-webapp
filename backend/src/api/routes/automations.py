from fastapi import APIRouter, HTTPException, Request
from typing import List

from src.api.schemas.automations import (
    AutomationCreate,
    AutomationUpdate,
    AutomationResponse
)
from src.api.services.automations_service import (
    get_all_automations,
    get_automation_by_id,
    create_new_automation,
    update_existing_automation,
    delete_automation_by_id
)
from src.api.services.projects_service import ProjectsService
from src.api.services.automation_runner_service import AutomationRunnerService
from src.api.schemas.automations import AutomationRunRequest, AutomationRunResponse
from src.api.routes.connectors import get_connectors_dict

router = APIRouter()
automation_runner = AutomationRunnerService(mcp_configs=get_connectors_dict())

@router.get("/automations", response_model=List[AutomationResponse])
async def list_automations():
    return get_all_automations()

@router.get("/automations/{automation_id}", response_model=AutomationResponse)
async def get_automation(automation_id: str):
    automation = get_automation_by_id(automation_id)
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
    return automation

@router.post("/automations", response_model=AutomationResponse)
async def create_automation(automation: AutomationCreate, request: Request):
    data = automation.model_dump()
    username = request.headers.get("x-username")
    if not username:
        raise HTTPException(status_code=401, detail="User not authenticated. Creator is required.")
        
    data["creator"] = username
        
    project_id = data.pop("project_id", None)
    
    result = await create_new_automation(data)
    
    if project_id:
        project = ProjectsService.get_project(project_id)
        if project:
            if "automation_ids" not in project:
                project["automation_ids"] = []
            if result["id"] not in project["automation_ids"]:
                project["automation_ids"].append(result["id"])
            ProjectsService.update_project(project_id, project)
            
    return result

@router.put("/automations/{automation_id}", response_model=AutomationResponse)
async def update_automation(automation_id: str, automation: AutomationUpdate):
    updated_data = await update_existing_automation(
        automation_id, 
        automation.model_dump(exclude_unset=True)
    )
    if not updated_data:
        raise HTTPException(status_code=404, detail="Automation not found")
    return updated_data

@router.delete("/automations/{automation_id}")
async def delete_automation(automation_id: str):
    success = delete_automation_by_id(automation_id)
    if not success:
        raise HTTPException(status_code=404, detail="Automation not found")
    return {"message": "Automation deleted"}

@router.post("/automations/{automation_id}/run")
async def run_automation(automation_id: str, request: AutomationRunRequest):
    return await automation_runner.run_automation(automation_id, request)
