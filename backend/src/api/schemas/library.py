from pydantic import BaseModel, Field
from typing import List, Optional

class EntityConnection(BaseModel):
    entity_id: str
    connection_type: str

class EntityState(BaseModel):
    title: str = ""
    description: str = ""
    related_entities: List[EntityConnection] = Field(default_factory=list)
    source_tools: List[str] = Field(default_factory=list)

class Entity(BaseModel):
    id: str
    project_id: str
    type: str  # e.g., 'person', 'place', 'concept', 'source', 'product', 'tool', 'company', 'ip', 'county', 'file'
    status: str = "approved"  # "pending" or "approved"
    current_state: Optional[EntityState] = None
    proposed_state: Optional[EntityState] = None

class ProposeEntityRequest(BaseModel):
    type: Optional[str] = None
    proposed_state: Optional[EntityState] = None
    # If proposed_state is None, it means the proposal is to delete the entity

class LibrarySummaryState(BaseModel):
    status: str = "approved"  # "pending" or "approved"
    current_text: str = ""
    proposed_text: Optional[str] = None

class ProposeSummaryRequest(BaseModel):
    proposed_text: str
