from fastapi import APIRouter, HTTPException, Request, Depends
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
    delete_automation_by_id,
    get_automation_runs
)
from src.api.services.projects_service import ProjectsService
from src.api.services.automation_runner_service import AutomationRunnerService
from src.api.schemas.automations import AutomationRunRequest, AutomationRunResponse
from src.api.routes.connectors import get_connectors_dict
from src.api.dependencies.auth import get_current_user

router = APIRouter()
automation_runner = AutomationRunnerService(mcp_configs=get_connectors_dict())

@router.get("/automations", response_model=List[AutomationResponse])
async def list_automations(username: str = Depends(get_current_user)):
    return get_all_automations(username)

@router.get("/automations/{automation_id}", response_model=AutomationResponse)
async def get_automation(automation_id: str, username: str = Depends(get_current_user)):
    automation = get_automation_by_id(automation_id)
    if not automation:
        raise HTTPException(status_code=404, detail="Automation not found")
        
    if automation.get("creator") != username:
        # Check if user is in any project that contains this automation
        projects = ProjectsService.get_all_projects(username)
        has_access = any(automation_id in p.get("automation_ids", []) for p in projects)
        if not has_access:
            raise HTTPException(status_code=403, detail="Not authorized to access this automation")
            
    return automation

@router.post("/automations", response_model=AutomationResponse)
async def create_automation(automation: AutomationCreate, request: Request, username: str = Depends(get_current_user)):
    data = automation.model_dump()
    data["creator"] = username
        
    project_id = data.pop("project_id", None)
    
    if project_id:
        project = ProjectsService.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        if username not in project.get("members", []):
            raise HTTPException(status_code=403, detail="Not authorized to add automation to this project")
    
    result = await create_new_automation(data)
    
    if project_id:
        if "automation_ids" not in project:
            project["automation_ids"] = []
        if result["id"] not in project["automation_ids"]:
            project["automation_ids"].append(result["id"])
        ProjectsService.update_project(project_id, project)
            
    return result

@router.put("/automations/{automation_id}", response_model=AutomationResponse)
async def update_automation(automation_id: str, automation: AutomationUpdate, username: str = Depends(get_current_user)):
    existing = get_automation_by_id(automation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Automation not found")
    if existing.get("creator") != username:
        raise HTTPException(status_code=403, detail="Not authorized to update this automation")

    updated_data = await update_existing_automation(
        automation_id, 
        automation.model_dump(exclude_unset=True)
    )
    return updated_data

@router.delete("/automations/{automation_id}")
async def delete_automation(automation_id: str, username: str = Depends(get_current_user)):
    existing = get_automation_by_id(automation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Automation not found")
    if existing.get("creator") != username:
        raise HTTPException(status_code=403, detail="Not authorized to delete this automation")

    success = delete_automation_by_id(automation_id)
    return {"message": "Automation deleted"}

@router.post("/automations/{automation_id}/run")
async def run_automation(automation_id: str, request: AutomationRunRequest, username: str = Depends(get_current_user)):
    existing = get_automation_by_id(automation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Automation not found")
    if existing.get("creator") != username:
        # Check if user is in any project that contains this automation
        projects = ProjectsService.get_all_projects(username)
        has_access = any(automation_id in p.get("automation_ids", []) for p in projects)
        if not has_access:
            raise HTTPException(status_code=403, detail="Not authorized to run this automation")

    return await automation_runner.run_automation(automation_id, request)

@router.get("/automations/{automation_id}/runs")
async def list_automation_runs(automation_id: str, username: str = Depends(get_current_user)):
    existing = get_automation_by_id(automation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Automation not found")
    if existing.get("creator") != username:
        projects = ProjectsService.get_all_projects(username)
        has_access = any(automation_id in p.get("automation_ids", []) for p in projects)
        if not has_access:
            raise HTTPException(status_code=403, detail="Not authorized to access runs for this automation")

    return get_automation_runs(automation_id)
