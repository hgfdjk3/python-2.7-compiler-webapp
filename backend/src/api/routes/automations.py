from fastapi import APIRouter, HTTPException
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

router = APIRouter()

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
async def create_automation(automation: AutomationCreate):
    return create_new_automation(automation.model_dump())

@router.put("/automations/{automation_id}", response_model=AutomationResponse)
async def update_automation(automation_id: str, automation: AutomationUpdate):
    updated_data = update_existing_automation(
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
