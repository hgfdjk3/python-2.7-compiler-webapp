from fastapi import APIRouter, Request, Depends

from src.api.schemas.ask import AskRequest
from src.api.services.agent_service import AgentService
from src.api.dependencies.auth import get_current_user

router = APIRouter()

def get_agent_service(request: Request) -> AgentService:
    return AgentService(getattr(request.app.state, "agent_runner", None))

@router.post("/ask")
async def ask_endpoint(
    body: AskRequest, 
    service: AgentService = Depends(get_agent_service),
    username: str = Depends(get_current_user)
):
    """
    Main endpoint for sending prompts to the LangGraph agent.
    Delegates all execution and formatting logic to AgentService.
    """
    return await service.ask(body, username)
