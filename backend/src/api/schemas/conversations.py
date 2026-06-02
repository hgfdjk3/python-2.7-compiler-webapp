from typing import Optional
from pydantic import BaseModel
from datetime import datetime

class ConversationResponse(BaseModel):
    id: str  # maps to thread_id
    project_id: str
    title: str
    preview: Optional[str] = None
    isSaved: bool = False
    created_at: datetime
    updated_at: datetime

class ConversationUpdate(BaseModel):
    title: Optional[str] = None
    isSaved: Optional[bool] = None
