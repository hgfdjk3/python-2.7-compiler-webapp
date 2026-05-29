from fastapi import APIRouter, HTTPException, Request, Depends
from typing import List
from src.api.schemas.projects import ProjectCreate, ProjectUpdate, ProjectResponse
from src.api.services.projects_service import ProjectsService
from src.api.dependencies.auth import get_current_user

router = APIRouter(prefix="/projects", tags=["projects"])

@router.get("", response_model=List[ProjectResponse])
async def get_projects(username: str = Depends(get_current_user)):
    return ProjectsService.get_all_projects(username)

@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(project_id: str, username: str = Depends(get_current_user)):
    project = ProjectsService.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if username not in project.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized to access this project")
    return project

from src.api.schemas.automations import AutomationResponse
from src.api.services.automations_service import get_automations_by_ids

@router.get("/{project_id}/automations", response_model=List[AutomationResponse])
async def get_project_automations(project_id: str, username: str = Depends(get_current_user)):
    project = ProjectsService.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if username not in project.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized to access this project")
    
    automation_ids = project.get("automation_ids", [])
    if not automation_ids:
        return []
    return get_automations_by_ids(automation_ids)


@router.post("", response_model=ProjectResponse)
async def create_project(project: ProjectCreate, username: str = Depends(get_current_user)):
    data = project.model_dump()
    if username and username not in data.get('members', []):
        members = data.get('members', [])
        members.append(username)
        data['members'] = members
    return ProjectsService.create_project(data)

@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(project_id: str, project: ProjectUpdate, username: str = Depends(get_current_user)):
    existing_project = ProjectsService.get_project(project_id)
    if not existing_project:
        raise HTTPException(status_code=404, detail="Project not found")
    if username not in existing_project.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized to update this project")
        
    update_data = project.model_dump(exclude_unset=True)
    updated = ProjectsService.update_project(project_id, update_data)
    return updated

@router.delete("/{project_id}")
async def delete_project(project_id: str, username: str = Depends(get_current_user)):
    existing_project = ProjectsService.get_project(project_id)
    if not existing_project:
        raise HTTPException(status_code=404, detail="Project not found")
    if username not in existing_project.get("members", []):
        raise HTTPException(status_code=403, detail="Not authorized to delete this project")
        
    success = ProjectsService.delete_project(project_id)
    return {"message": "Project deleted successfully"}
