from pydantic import BaseModel, Field
from typing import List, Optional
import uuid

class ChatMeta(BaseModel):
    id: str = Field(default_factory=lambda: f"c{uuid.uuid4().hex[:8]}")
    name: str

class ProjectBase(BaseModel):
    name: str
    chats: List[ChatMeta] = Field(default_factory=list)
    automation_ids: List[str] = Field(default_factory=list)
    members: List[str] = Field(default_factory=list)

class ProjectCreate(ProjectBase):
    pass

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    chats: Optional[List[ChatMeta]] = None
    automation_ids: Optional[List[str]] = None

class ProjectResponse(ProjectBase):
    id: str
