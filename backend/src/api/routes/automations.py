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
import uuid
from temporalio.client import Client, ScheduleActionStartWorkflow, ScheduleSpec, Schedule, ScheduleUpdate, ScheduleUpdateInput
from src.api.dependencies.temporal import get_temporal_client
from src.temporal_app.workflows import AutomationWorkflow
from src.api.utils.temporal.models import ScheduleConfig
from src.api.utils.temporal.parser import parse_schedule_to_spec_and_state

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
        projects = ProjectsService.get_all_projects(username)
        has_access = any(automation_id in p.get("automation_ids", []) for p in projects)
        if not has_access:
            raise HTTPException(status_code=403, detail="Not authorized to access this automation")
            
    return automation

@router.post("/automations", response_model=AutomationResponse)
async def create_automation(automation: AutomationCreate, request: Request, username: str = Depends(get_current_user), temporal_client: Client = Depends(get_temporal_client)):
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
    automation_id = result["id"]
    
    if project_id:
        if "automation_ids" not in project:
            project["automation_ids"] = []
        if automation_id not in project["automation_ids"]:
            project["automation_ids"].append(automation_id)
        ProjectsService.update_project(project_id, project)

    schedule_config = automation.schedule_config
    if schedule_config:
        schedule_id = f"schedule-{automation_id}"
        try:
            config_model = ScheduleConfig.model_validate(schedule_config)
            schedule_spec, schedule_state = parse_schedule_to_spec_and_state(config_model)
        except (ValueError, TypeError) as val_err:
            raise HTTPException(status_code=400, detail=f"Invalid schedule configuration: {str(val_err)}")
        except Exception as parse_err:
            raise HTTPException(status_code=400, detail=f"Failed to parse schedule: {str(parse_err)}")

        try:
            await temporal_client.create_schedule(
                schedule_id,
                Schedule(
                    action=ScheduleActionStartWorkflow(
                        "AutomationWorkflow",
                        args=[automation_id],
                        id=f"wf-{automation_id}",
                        task_queue="automations-task-queue",
                    ),
                    spec=schedule_spec,
                    state=schedule_state,
                ),
            )
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create schedule in Temporal: {str(e)}")
            
    return result

@router.put("/automations/{automation_id}", response_model=AutomationResponse)
async def update_automation(automation_id: str, automation: AutomationUpdate, username: str = Depends(get_current_user), temporal_client: Client = Depends(get_temporal_client)):
    existing = get_automation_by_id(automation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Automation not found")
    if existing.get("creator") != username:
        raise HTTPException(status_code=403, detail="Not authorized to update this automation")

    update_dict = automation.model_dump(exclude_unset=True)
    updated_data = await update_existing_automation(
        automation_id, 
        update_dict
    )
    
    if "schedule_config" in update_dict:
        schedule_id = f"schedule-{automation_id}"
        handle = temporal_client.get_schedule_handle(schedule_id)
        
        schedule_config = update_dict["schedule_config"]
        if not schedule_config:
            try:
                await handle.delete()
            except Exception:
                pass
        else:
            try:
                config_model = ScheduleConfig.model_validate(schedule_config)
                schedule_spec, schedule_state = parse_schedule_to_spec_and_state(config_model)
            except (ValueError, TypeError) as val_err:
                raise HTTPException(status_code=400, detail=f"Invalid schedule configuration: {str(val_err)}")
            except Exception as parse_err:
                raise HTTPException(status_code=400, detail=f"Failed to parse schedule: {str(parse_err)}")

            try:
                async def update_func(input: ScheduleUpdateInput) -> ScheduleUpdate:
                    input.description.schedule.spec = schedule_spec
                    input.description.schedule.state = schedule_state
                    return ScheduleUpdate(schedule=input.description.schedule)
                    
                await handle.update(update_func)
            except Exception as e:
                try:
                    await temporal_client.create_schedule(
                        schedule_id,
                        Schedule(
                            action=ScheduleActionStartWorkflow(
                                "AutomationWorkflow",
                                args=[automation_id],
                                id=f"wf-{automation_id}",
                                task_queue="automations-task-queue",
                            ),
                            spec=schedule_spec,
                            state=schedule_state,
                        ),
                    )
                except Exception as create_e:
                    raise HTTPException(status_code=500, detail=f"Failed to update/create schedule in Temporal: {str(create_e)}")

    return updated_data

@router.delete("/automations/{automation_id}")
async def delete_automation(automation_id: str, username: str = Depends(get_current_user), temporal_client: Client = Depends(get_temporal_client)):
    existing = get_automation_by_id(automation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Automation not found")
    if existing.get("creator") != username:
        raise HTTPException(status_code=403, detail="Not authorized to delete this automation")

    success = delete_automation_by_id(automation_id)
    
    schedule_id = f"schedule-{automation_id}"
    handle = temporal_client.get_schedule_handle(schedule_id)
    try:
        await handle.delete()
    except Exception:
        pass

    return {"message": "Automation deleted"}

@router.post("/automations/run")
async def run_unsaved_automation(request: AutomationRunRequest, username: str = Depends(get_current_user)):
    if not request.automation_data:
        raise HTTPException(status_code=400, detail="Automation data is required for unsaved runs")
    return await automation_runner.run_unsaved_automation(request, username)

@router.post("/automations/{automation_id}/run")
async def run_automation(automation_id: str, request: AutomationRunRequest = None, username: str = Depends(get_current_user)):
    existing = get_automation_by_id(automation_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Automation not found")
    if existing.get("creator") != username:
        projects = ProjectsService.get_all_projects(username)
        has_access = any(automation_id in p.get("automation_ids", []) for p in projects)
        if not has_access:
            raise HTTPException(status_code=403, detail="Not authorized to run this automation")

    return await automation_runner.run_automation(automation_id, request, username)

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
