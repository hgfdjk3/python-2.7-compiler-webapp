from typing import Optional
from pydantic import BaseModel

class AskRequest(BaseModel):
    message: str
    thread_id: Optional[str] = "default_api_session"
    project_id: Optional[str] = None
    system_instruction: Optional[str] = None
    stream: Optional[bool] = False
    automation: Optional[bool] = False
