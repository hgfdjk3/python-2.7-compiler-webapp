from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field

# ──────────────────────────────────────────────
# Entity & Connection Taxonomies
# ──────────────────────────────────────────────

class EntityType(str, Enum):
    PERSON = "person"
    ORGANIZATION = "organization"
    PLACE = "place"
    DATE = "date"
    EVENT = "event"
    CONCEPT = "concept"
    TECHNOLOGY = "technology"
    SOFTWARE = "software"
    HARDWARE = "hardware"
    SOURCE = "source"
    FILE = "file"
    DOCUMENT = "document"
    IP = "ip"
    COMPANY = "company"
    COUNTY = "county"

class ConnectionType(str, Enum):
    RELATED_TO = "related_to"
    CREATED_BY = "created_by"
    LOCATED_IN = "located_in"
    PART_OF = "part_of"
    HAPPENED_AT = "happened_at"
    USES = "uses"
    WORKS_AT = "works_at"
    DEPENDS_ON = "depends_on"
    MENTIONS = "mentions"

ENTITY_TYPES_DESC = ", ".join([f"'{t.value}'" for t in EntityType])
CONNECTION_TYPES_DESC = ", ".join([f"'{c.value}'" for c in ConnectionType])


# ──────────────────────────────────────────────
# Phase 1: Triage Schema
# ──────────────────────────────────────────────

class TriageResult(BaseModel):
    has_extractable_info: bool = Field(
        description="True if the content contains facts, entities, or knowledge worth storing in the project library."
    )
    reason: str = Field(
        description="One-sentence explanation of what was found or why nothing was found."
    )


# ──────────────────────────────────────────────
# Step 1: Entity Extraction Schema
# ──────────────────────────────────────────────

class EntityNode(BaseModel):
    existing_id: Optional[str] = Field(
        default=None,
        description="If updating an existing entity, put its ID here. Leave null for new entities."
    )
    title: str = Field(description="Name or title of the entity.")
    description: str = Field(description="Detailed and comprehensive description capturing the key facts, deep context, and rationales. Must be at least 2-3 sentences.")
    type: str = Field(description=f"One of: {ENTITY_TYPES_DESC}")

class EntityExtractionResult(BaseModel):
    entities: List[EntityNode] = Field(
        default_factory=list,
        description="Entities to create or update extracted from the text."
    )

# ──────────────────────────────────────────────
# Step 2: Connection Extraction Schema
# ──────────────────────────────────────────────

class ExtractedConnection(BaseModel):
    source_ref: str = Field(
        description="ID of the source entity (e.g. 'ent_abc123') OR the exact title of a new entity."
    )
    target_ref: str = Field(
        description="ID of the target entity (e.g. 'ent_abc123') OR the exact title of a new entity."
    )
    connection_type: str = Field(
        description=f"One of: {CONNECTION_TYPES_DESC}"
    )

class ConnectionExtractionResult(BaseModel):
    connections: List[ExtractedConnection] = Field(
        default_factory=list,
        description="Connections between the provided entities."
    )

# ──────────────────────────────────────────────
# Step 3: Summary Update Schema
# ──────────────────────────────────────────────

class SummaryUpdateResult(BaseModel):
    summary_update: Optional[str] = Field(
        default=None,
        description="A COMPLETE, rewritten project summary that merges the OLD summary with new knowledge. Do NOT return conversational text. Null if no update needed."
    )

