from fastapi import APIRouter, HTTPException, Request, Header
from typing import List
from src.api.schemas.projects import ProjectCreate, ProjectUpdate, ProjectResponse
from src.api.services.projects_service import ProjectsService

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("", response_model=List[ProjectResponse])
async def get_projects():
    return ProjectsService.get_all_projects()

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str):
    project = ProjectsService.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project

from src.api.schemas.automations import AutomationResponse
from src.api.services.automations_service import get_automations_by_ids

@router.get("/{project_id}/automations", response_model=List[AutomationResponse])
async def get_project_automations(project_id: str):
    project = ProjectsService.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    automation_ids = project.get("automation_ids", [])
    if not automation_ids:
        return []
    return get_automations_by_ids(automation_ids)


@router.post("", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, x_username: str = Header(default=None)):
    data = project.model_dump()
    if x_username and x_username not in data.get('members', []):
        members = data.get('members', [])
        members.append(x_username)
        data['members'] = members
    return ProjectsService.create_project(data)

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, project: ProjectUpdate):
    update_data = project.model_dump(exclude_unset=True)
    updated = ProjectsService.update_project(project_id, update_data)
    if not updated:
        raise HTTPException(status_code=404, detail="Project not found")
    return updated

@router.delete("/{project_id}")
async def delete_project(project_id: str):
    success = ProjectsService.delete_project(project_id)
    if not success:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted successfully"}
