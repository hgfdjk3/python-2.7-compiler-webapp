from fastapi import APIRouter, HTTPException, Depends, Request
from typing import List, Any
from src.api.schemas.conversations import ConversationResponse, ConversationUpdate
from src.api.services.conversations_service import ConversationsService
from src.api.dependencies.auth import get_current_user

router = APIRouter(tags=["conversations"])

@router.get("/projects/{project_id}/conversations", response_model=List[ConversationResponse])
async def get_project_conversations(project_id: str, username: str = Depends(get_current_user)):
    return ConversationsService.get_conversations(project_id, username)

@router.get("/conversations/{thread_id}")
async def get_conversation(thread_id: str, request: Request, username: str = Depends(get_current_user)):
    metadata = ConversationsService.get_conversation(thread_id, username)
    if not metadata:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    agent_runner = getattr(request.app.state, "agent_runner", None)
    if not agent_runner:
        raise HTTPException(status_code=500, detail="Agent runner not initialized")
        
    history = await agent_runner.get_history(thread_id)
    return {
        "metadata": metadata,
        "history": history
    }

@router.patch("/conversations/{thread_id}", response_model=ConversationResponse)
async def update_conversation(thread_id: str, data: ConversationUpdate, username: str = Depends(get_current_user)):
    metadata = ConversationsService.get_conversation(thread_id, username)
    if not metadata:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    update_dict = data.model_dump(exclude_unset=True)
    if not update_dict:
        return metadata
        
    return ConversationsService.update_conversation(thread_id, username, update_dict)

@router.delete("/conversations/{thread_id}")
async def delete_conversation(thread_id: str, username: str = Depends(get_current_user)):
    success = ConversationsService.delete_conversation(thread_id, username)
    if not success:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"message": "Conversation deleted successfully"}
