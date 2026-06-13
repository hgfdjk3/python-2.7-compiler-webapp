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
    SOURCE = "source"

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
# Phase 2: Extraction Schema
# ──────────────────────────────────────────────

class ExtractedConnection(BaseModel):
    target_ref: str = Field(
        description="ID of an existing entity (e.g. 'ent_abc123') OR the exact title of a new entity being created in this same batch."
    )
    connection_type: str = Field(
        description=f"One of: {CONNECTION_TYPES_DESC}"
    )

class ExtractedEntity(BaseModel):
    existing_id: Optional[str] = Field(
        default=None,
        description="If updating an existing entity, put its ID here. Leave null for new entities."
    )
    title: str = Field(description="Name or title of the entity.")
    description: str = Field(description="Detailed and comprehensive description capturing the key facts, deep context, and rationales. Must be at least 2-3 sentences.")
    type: str = Field(description=f"One of: {ENTITY_TYPES_DESC}")
    connections: List[ExtractedConnection] = Field(
        default_factory=list,
        description="Connections to other entities (both existing and new)."
    )

class ExtractionResult(BaseModel):
    summary_update: Optional[str] = Field(
        default=None,
        description="Updated project summary incorporating new knowledge. Null if no update needed."
    )
    entities: List[ExtractedEntity] = Field(
        default_factory=list,
        description="Entities to create or update."
    )


