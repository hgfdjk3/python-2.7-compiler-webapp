"""
Standalone Library Extraction Agent.

Two-phase architecture for token efficiency:
  Phase 1 (Triage): A fast, cheap call that decides IF there is anything worth extracting.
                     Uses a tiny prompt and returns a boolean + brief rationale.
  Phase 2 (Extract): Only runs if Phase 1 says yes. Does the heavy lifting —
                     entity extraction, connection discovery, summary update.

Trigger modes:
  - Pre-processing:  User explicitly sends content (documents, notes, URLs) to be analyzed.
  - Post-processing: Fired automatically after a conversation ends. Receives the full
                     chat transcript and looks for new knowledge to propose.
"""

import logging
from typing import List, Optional, Dict, Any, Literal
from enum import Enum
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from src.api.services.library_service import LibraryService
from src.api.services.projects_service import ProjectsService
from src.config import OPENAI_API_KEY, OPENAI_BASE_URL

logger = logging.getLogger("extractor_agent")


# ──────────────────────────────────────────────
# Entity Type Taxonomy
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
    SOURCE = "source"  # a document, URL, file, etc.
    FILE = "file"
    DOCUMENT = "document"
    IP = "ip"
    COMPANY = "company"
    COUNTY = "county"

ENTITY_TYPES_DESC = ", ".join([f"'{t.value}'" for t in EntityType])


# ──────────────────────────────────────────────
# Connection Type Taxonomy
# ──────────────────────────────────────────────

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
    description: str = Field(description="Concise description capturing the key facts.")
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


# ──────────────────────────────────────────────
# LLM Factory (shared across agent instances)
# ──────────────────────────────────────────────

def _create_llm(model_name: str = "qwen/qwen3.5-122b-a10b", temperature: float = 0.0) -> ChatOpenAI:
    api_key = OPENAI_API_KEY or ""
    base_url = OPENAI_BASE_URL if api_key.startswith("nvapi-") else None

    if api_key.startswith("nvapi-") and model_name == "qwen/qwen3.5-122b-a10b":
        model_name = "meta/llama-3.1-70b-instruct"

    return ChatOpenAI(
        model=model_name,
        api_key=api_key,
        base_url=base_url,
        temperature=temperature,
    )


# ──────────────────────────────────────────────
# Context Builder  (token-efficient)
# ──────────────────────────────────────────────

def _build_library_context(project_id: str) -> str:
    """Builds a compact representation of the current library for the LLM."""
    project = ProjectsService.get_project(project_id)
    if not project:
        raise ValueError(f"Project '{project_id}' not found")

    summary = (project.get("library_summary") or {}).get("current_text", "")
    entities = LibraryService.get_entities(project_id)

    # Include all entities that have a current state (even if they have pending proposals)
    existing = [e for e in entities if e.get("current_state")]

    if not existing and not summary:
        return "The library is currently empty."

    lines = []
    if summary:
        lines.append(f"SUMMARY: {summary}")
    lines.append("")

    for ent in existing:
        state = ent["current_state"]
        conns = state.get("related_entities", [])
        conn_str = ""
        if conns:
            conn_parts = [f"{c.get('connection_type', '?')}->{c.get('entity_id', '?')}" for c in conns]
            conn_str = f" | links: {', '.join(conn_parts)}"
        lines.append(f"[{ent['id']}] ({ent.get('type', '?')}) {state.get('title', '?')}: {state.get('description', '')}{conn_str}")

    return "\n".join(lines)


# ──────────────────────────────────────────────
# Prompts
# ──────────────────────────────────────────────

TRIAGE_SYSTEM = (
    "You decide whether new content contains facts, entities, or knowledge worth adding to a project knowledge library. "
    "Answer quickly — do NOT extract anything yet, just decide yes or no."
)

EXTRACTION_SYSTEM = """You maintain a project knowledge library. Given the library's current state and new content, extract structured knowledge.

RULES:
- Entity types: {entity_types}
- Connection types: {connection_types}
- To UPDATE an existing entity set its 'existing_id'. To CREATE a new one leave 'existing_id' null.
- Connections can reference existing entity IDs OR the exact title of a new entity from this same batch.
- Keep descriptions concise — capture facts, not fluff.
- Only update the summary if meaningful new context warrants it. If you do, provide a COMPLETE, REWRITTEN summary that merges the OLD summary with the NEW knowledge, not too long!.
- DO NOT output conversational text, patches, or commentary (e.g. 'No new entities...', 'However new content...'). Only output the final, polished summary. Set summary_update to null if no update is needed.
- Do NOT duplicate entities that already exist unchanged.

CURRENT LIBRARY:
{library_context}"""


# ──────────────────────────────────────────────
# Core Processing Functions
# ──────────────────────────────────────────────

def _run_triage(llm: ChatOpenAI, content: str) -> TriageResult:
    """Phase 1: Quick check — is there anything worth extracting?"""
    structured = llm.with_structured_output(TriageResult)
    messages = [
        SystemMessage(content=TRIAGE_SYSTEM),
        HumanMessage(content=content[:3000]),  # Cap input for triage — we only need a sample
    ]
    return structured.invoke(messages)


def _run_extraction(llm: ChatOpenAI, content: str, library_context: str) -> ExtractionResult:
    """Phase 2: Full extraction with structured output."""
    system = EXTRACTION_SYSTEM.format(
        entity_types=ENTITY_TYPES_DESC,
        connection_types=CONNECTION_TYPES_DESC,
        library_context=library_context,
    )
    structured = llm.with_structured_output(ExtractionResult)
    messages = [
        SystemMessage(content=system),
        HumanMessage(content=f"NEW CONTENT:\n{content}"),
    ]
    return structured.invoke(messages)


def _apply_extraction(project_id: str, result: ExtractionResult, source_tool: str) -> Dict[str, Any]:
    """Writes extraction results to the database as pending proposals."""
    project = ProjectsService.get_project(project_id)
    proposed_entities = []

    # 1. Propose summary update
    summary_proposed = False
    if result.summary_update:
        current_summary = (project.get("library_summary") or {}).get("current_text", "")
        if result.summary_update != current_summary:
            summary_state = project.get("library_summary") or {}
            summary_state["proposed_text"] = result.summary_update
            summary_state["status"] = "pending"
            ProjectsService.update_project(project_id, {"library_summary": summary_state})
            summary_proposed = True

    # 2. Build a title->id map from existing approved entities for connection resolution
    existing_entities = LibraryService.get_entities(project_id)
    title_to_id = {}
    for ent in existing_entities:
        state = ent.get("current_state") or ent.get("proposed_state") or {}
        title = state.get("title", "")
        if title:
            title_to_id[title.lower()] = ent["id"]

    # First pass: create/update all entities and collect new title->id mappings
    new_title_to_id: Dict[str, str] = {}
    entity_results = []

    for extracted in result.entities:
        proposed_state = {
            "title": extracted.title,
            "description": extracted.description,
            "related_entities": [],  # Will be resolved in second pass
            "source_tools": [source_tool],
        }

        entity_id = extracted.existing_id
        # Also check by title match if no explicit ID was given
        if not entity_id:
            entity_id = title_to_id.get(extracted.title.lower())

        saved = LibraryService.propose_changes(
            project_id=project_id,
            entity_id=entity_id,
            entity_type=extracted.type,
            proposed_state=proposed_state,
        )
        entity_results.append((extracted, saved))
        new_title_to_id[extracted.title.lower()] = saved["id"]
        proposed_entities.append(saved)

    # Merge title maps (existing + newly created)
    full_title_to_id = {**title_to_id, **new_title_to_id}

    # Second pass: resolve connections and update proposed_state with real IDs
    coll = LibraryService.get_entities.__func__  # just need the collection
    from src.api.utils.db import get_collection
    ent_coll = get_collection("library_entities")

    for extracted, saved in entity_results:
        if not extracted.connections:
            continue

        resolved_connections = []
        for conn in extracted.connections:
            # Try to resolve by ID first, then by title
            target_id = conn.target_ref
            if not target_id.startswith("ent_"):
                # It's a title reference — try to resolve
                resolved_id = full_title_to_id.get(conn.target_ref.lower())
                if resolved_id:
                    target_id = resolved_id

            resolved_connections.append({
                "entity_id": target_id,
                "connection_type": conn.connection_type,
            })

        # Update the proposed_state with resolved connections
        doc = ent_coll.find_one({"_id": saved["id"]})
        if doc and doc.get("proposed_state"):
            doc["proposed_state"]["related_entities"] = resolved_connections
            ent_coll.replace_one({"_id": saved["id"]}, doc)

    return {
        "summary_proposed": summary_proposed,
        "entities_proposed": len(proposed_entities),
        "entity_ids": [e["id"] for e in proposed_entities],
    }


# ──────────────────────────────────────────────
# Public API
# ──────────────────────────────────────────────

class ExtractorAgent:
    """
    Standalone extraction agent with two trigger modes:
    - preprocess(): User-initiated, processes raw content (docs, notes, URLs).
    - postprocess(): Auto-triggered after conversations, processes chat transcripts.
    """

    def __init__(self, model_name: str = "qwen/qwen3.5-122b-a10b", temperature: float = 0.0):
        self.llm = _create_llm(model_name, temperature)

    def preprocess(self, project_id: str, content: str, source_tool: str = "user_upload") -> Dict[str, Any]:
        """
        Pre-processing mode: User explicitly provides content to analyze.
        Always runs extraction (skips triage) since the user explicitly asked for it.
        """
        logger.info(f"[preprocess] project={project_id}, content_len={len(content)}")
        library_context = _build_library_context(project_id)
        result = _run_extraction(self.llm, content, library_context)
        return _apply_extraction(project_id, result, source_tool)

    def postprocess(self, project_id: str, conversation_messages: List[Dict[str, str]], source_tool: str = "conversation") -> Dict[str, Any]:
        """
        Post-processing mode: Auto-triggered after a conversation.
        Phase 1 (triage) runs first to avoid wasting tokens on trivial chats.
        """
        # Build a compact transcript — only user and assistant text, no tool calls
        transcript_lines = []
        for msg in conversation_messages:
            role = msg.get("role", "")
            text = msg.get("content", "")
            if role in ("user", "assistant", "human", "ai") and text:
                prefix = "USER" if role in ("user", "human") else "ASSISTANT"
                # Truncate very long individual messages
                if len(text) > 2000:
                    text = text[:2000] + "... [truncated]"
                transcript_lines.append(f"{prefix}: {text}")

        if not transcript_lines:
            logger.info(f"[postprocess] project={project_id} — empty transcript, skipping")
            return {"skipped": True, "reason": "empty_transcript"}

        transcript = "\n".join(transcript_lines)

        # Phase 1: Triage
        logger.info(f"[postprocess] project={project_id}, triage on {len(transcript)} chars")
        triage = _run_triage(self.llm, transcript)

        if not triage.has_extractable_info:
            logger.info(f"[postprocess] triage=skip, reason={triage.reason}")
            return {"skipped": True, "reason": triage.reason}

        # Phase 2: Extract
        logger.info(f"[postprocess] triage=extract, reason={triage.reason}")
        library_context = _build_library_context(project_id)
        result = _run_extraction(self.llm, transcript, library_context)
        return _apply_extraction(project_id, result, source_tool)
