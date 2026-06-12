from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from src.api.schemas.library import LibrarySummaryState

class ChatMeta(BaseModel):
    id: str = Field(default_factory=lambda: f"c{uuid.uuid4().hex[:8]}")
    name: str

class ProjectBase(BaseModel):
    name: str
    chats: List[ChatMeta] = Field(default_factory=list)
    automation_ids: List[str] = Field(default_factory=list)
    members: List[str] = Field(default_factory=list)
    library_summary: Optional[LibrarySummaryState] = Field(default_factory=LibrarySummaryState)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    chats: Optional[List[ChatMeta]] = None
    automation_ids: Optional[List[str]] = None
    library_summary: Optional[LibrarySummaryState] = None

class ProjectResponse(ProjectBase):
    id: str
