from datetime import timedelta
from temporalio import workflow, activity


@activity.defn
async def execute_langgraph_automation(automation_id: str) -> dict:
    import httpx
    from src.api.services.automations_service import get_automation_by_id
    
    automation = get_automation_by_id(automation_id)
    if not automation:
        return {"status": "error", "error": "Automation not found"}
        
    username = automation.get("creator", "system")
    url = f"http://localhost:8000/api/v1/automations/{automation_id}/run"
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                url, 
                json={"stream": False},
                headers={"x-username": username},
                timeout=600.0
            )
            response.raise_for_status()
            
            return {
                "status": "success", 
                "result": response.json()
            }
    except Exception as e:
        return {"status": "error", "error": str(e)}

@workflow.defn
class AutomationWorkflow:
    @workflow.run
    async def run(self, automation_id: str) -> dict:
        result = await workflow.execute_activity(
            execute_langgraph_automation,
            automation_id,
            start_to_close_timeout=timedelta(minutes=10),
        )
        return result
