from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, Request
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from src.api.schemas.library import Entity, ProposeEntityRequest, ProposeSummaryRequest, EditSummaryRequest, LibrarySummaryState, EditEntityRequest
from src.api.services.library_service import LibraryService
from src.api.services.projects_service import ProjectsService
from src.api.dependencies.auth import get_current_user
from src.services.harness.extraction.agent import ExtractorAgent

router = APIRouter(prefix="/projects/{project_id}/library", tags=["library"])

# ── Pre-processing endpoint ──────────────────────────────

class ExtractRequest(BaseModel):
    content: str
    source_tool: str = "user_upload"

@router.post("/extract")
async def extract_from_content(
    project_id: str,
    request: ExtractRequest,
    username: str = Depends(get_current_user),
):
    """Pre-processing: User explicitly sends content to be analyzed by the extraction agent."""
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")

    extractor = ExtractorAgent()
    result = await extractor.preprocess(project_id, request.content, request.source_tool)
    return {"message": "Extraction completed", "status": "success", "result": result}

class ExtractConversationRequest(BaseModel):
    thread_id: str

@router.post("/extract-conversation")
async def extract_from_conversation(
    project_id: str,
    request: ExtractConversationRequest,
    fastapi_request: Request,
    username: str = Depends(get_current_user),
):
    """Post-processing: Explicitly triggers the extraction agent on a past conversation."""
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")

    runner = fastapi_request.app.state.agent_runner
    history = await runner.get_history(request.thread_id)
    
    if not history:
        raise HTTPException(status_code=404, detail="Conversation history not found")

    extractor = ExtractorAgent()
    result = await extractor.postprocess_async(project_id, history)
    
    return {"message": "Conversation extraction completed", "status": "success", "result": result}

@router.get("/entities", response_model=List[Entity])
async def get_library_entities(project_id: str, username: str = Depends(get_current_user)):
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")
        
    return LibraryService.get_entities(project_id)

@router.post("/entities", response_model=Entity)
async def propose_entity_change(
    project_id: str, 
    request: ProposeEntityRequest, 
    entity_id: Optional[str] = None, 
    username: str = Depends(get_current_user)
):
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")
        
    try:
        updated = LibraryService.propose_changes(
            project_id=project_id,
            entity_id=entity_id,
            entity_type=request.type,
            proposed_state=request.proposed_state.model_dump() if request.proposed_state else None
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/entities/{entity_id}", response_model=Entity)
async def edit_entity(
    project_id: str,
    entity_id: str,
    request: EditEntityRequest,
    username: str = Depends(get_current_user)
):
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")
        
    try:
        updated = LibraryService.edit_entity(
            project_id=project_id,
            entity_id=entity_id,
            entity_type=request.type,
            current_state=request.current_state.model_dump() if request.current_state else None
        )
        return updated
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/entities/{entity_id}/approve")
async def approve_entity_proposal(project_id: str, entity_id: str, username: str = Depends(get_current_user)):
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")
        
    updated = LibraryService.approve_proposal(entity_id)
    if not updated:
        return {"deleted": True, "id": entity_id, "status": "already_processed"}
    return updated

@router.post("/entities/{entity_id}/reject")
async def reject_entity_proposal(project_id: str, entity_id: str, username: str = Depends(get_current_user)):
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")
        
    updated = LibraryService.reject_proposal(entity_id)
    if not updated:
        return {"deleted": True, "id": entity_id, "status": "already_processed"}
    return updated

@router.put("/summary")
async def propose_summary_change(project_id: str, request: ProposeSummaryRequest, username: str = Depends(get_current_user)):
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")
        
    summary = project.get("library_summary", {})
    summary["proposed_text"] = request.proposed_text
    summary["status"] = "pending"
    
    ProjectsService.update_project(project_id, {"library_summary": summary})
    return {"message": "Summary change proposed", "library_summary": summary}

@router.put("/summary/edit")
async def edit_summary(project_id: str, request: EditSummaryRequest, username: str = Depends(get_current_user)):
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")
        
    summary = project.get("library_summary", {})
    summary["current_text"] = request.current_text
    
    ProjectsService.update_project(project_id, {"library_summary": summary})
    return {"message": "Summary updated", "library_summary": summary}
@router.post("/summary/approve")
async def approve_summary_change(project_id: str, username: str = Depends(get_current_user)):
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")
        
    summary = project.get("library_summary", {})
    if summary.get("status") == "pending":
        summary["current_text"] = summary.get("proposed_text")
        summary["proposed_text"] = None
        summary["status"] = "approved"
        ProjectsService.update_project(project_id, {"library_summary": summary})
        
    return {"message": "Summary change approved", "library_summary": summary}

@router.post("/summary/reject")
async def reject_summary_change(project_id: str, username: str = Depends(get_current_user)):
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")
        
    summary = project.get("library_summary", {})
    if summary.get("status") == "pending":
        summary["proposed_text"] = None
        summary["status"] = "approved"
        ProjectsService.update_project(project_id, {"library_summary": summary})
        
    return {"message": "Summary change rejected", "library_summary": summary}

@router.post("/approve-all")
async def approve_all_changes(project_id: str, username: str = Depends(get_current_user)):
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Approve summary if pending
    summary = project.get("library_summary", {})
    if summary.get("status") == "pending":
        summary["current_text"] = summary.get("proposed_text")
        summary["proposed_text"] = None
        summary["status"] = "approved"
        ProjectsService.update_project(project_id, {"library_summary": summary})
        
    # Approve all entities
    updated_entities = LibraryService.approve_all_proposals(project_id)
    
    return {
        "message": "All pending changes approved", 
        "summary": summary,
        "entities_approved": len(updated_entities)
    }

@router.post("/reject-all")
async def reject_all_changes(project_id: str, username: str = Depends(get_current_user)):
    project = ProjectsService.get_project(project_id)
    if not project or (username and username not in project.get("members", [])):
        raise HTTPException(status_code=404, detail="Project not found")
        
    # Reject summary if pending
    summary = project.get("library_summary", {})
    if summary.get("status") == "pending":
        summary["proposed_text"] = None
        summary["status"] = "approved"
        ProjectsService.update_project(project_id, {"library_summary": summary})
        
    # Reject all entities
    updated_entities = LibraryService.reject_all_proposals(project_id)
    
    return {
        "message": "All pending changes rejected", 
        "summary": summary,
        "entities_rejected": len(updated_entities)
    }
