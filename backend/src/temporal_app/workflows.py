from datetime import timedelta
from temporalio import workflow, activity

from src.api.services.automations_service import get_automation_by_id


@activity.defn
async def execute_langgraph_automation(automation_id: str) -> dict:
    from src.api.services.automation_runner_service import AutomationRunnerService
    from src.api.routes.connectors import get_connectors_dict
    from src.api.schemas.automations import AutomationRunRequest
    automation = get_automation_by_id(automation_id)
    runner = AutomationRunnerService(mcp_configs=get_connectors_dict())
    request = AutomationRunRequest(automation_data=None, stream=True)
    try:
        response = await runner.run_automation(automation_id, request, username=automation["creator"])

        return {"status": "success", "result": str(response)}
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
