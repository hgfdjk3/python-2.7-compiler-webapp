import logging
from typing import List, Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent

from src.config import OPENAI_API_KEY, OPENAI_BASE_URL
from src.api.services.projects_service import ProjectsService
from src.api.services.library_service import LibraryService

from src.services.harness.extraction.schemas import TriageResult, ExtractionResult
from src.services.harness.extraction.prompts import TRIAGE_SYSTEM, REACT_AGENT_SYSTEM
from src.services.harness.extraction.tools import get_extraction_tools

logger = logging.getLogger("extractor_agent")

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

def _run_triage(llm: ChatOpenAI, content: str) -> TriageResult:
    """Phase 1: Quick check — is there anything worth extracting?"""
    structured = llm.with_structured_output(TriageResult)
    messages = [
        SystemMessage(content=TRIAGE_SYSTEM),
        HumanMessage(content=content[:3000]),
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

    # First pass: create/update all entities
    new_title_to_id: Dict[str, str] = {}
    entity_results = []

    for extracted in result.entities:
        proposed_state = {
            "title": extracted.title,
            "description": extracted.description,
            "related_entities": [],
            "source_tools": [source_tool],
        }

        entity_id = extracted.existing_id
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

    # Merge title maps
    full_title_to_id = {**title_to_id, **new_title_to_id}

    # Second pass: resolve connections
    from src.api.utils.db import get_collection
    ent_coll = get_collection("library_entities")

    for extracted, saved in entity_results:
        if not extracted.connections:
            continue

        resolved_connections = []
        for conn in extracted.connections:
            target_id = conn.target_ref
            if not target_id.startswith("ent_"):
                resolved_id = full_title_to_id.get(conn.target_ref.lower())
                if resolved_id:
                    target_id = resolved_id

            resolved_connections.append({
                "entity_id": target_id,
                "connection_type": conn.connection_type,
            })

        doc = ent_coll.find_one({"_id": saved["id"]})
        if doc and doc.get("proposed_state"):
            doc["proposed_state"]["related_entities"] = resolved_connections
            ent_coll.replace_one({"_id": saved["id"]}, doc)

    return {
        "summary_proposed": summary_proposed,
        "entities_proposed": len(proposed_entities),
        "entity_ids": [e["id"] for e in proposed_entities],
    }

class ExtractorAgent:
    """
    Standalone multi-agent extraction pipeline:
    1. ReAct Agent researches the library.
    2. Structured Output Parser finalizes the result.
    """

    def __init__(self, model_name: str = "qwen/qwen3.5-122b-a10b", temperature: float = 0.0):
        self.llm = _create_llm(model_name, temperature)

    async def _run_extraction_pipeline(self, project_id: str, content: str) -> ExtractionResult:
        # 1. Setup ReAct Agent
        tools = get_extraction_tools(project_id)
        react_agent = create_react_agent(self.llm, tools=tools)
        
        project = ProjectsService.get_project(project_id)
        if project:
            project_name = project.get("name", "Unknown Project")
            project_desc = project.get("description", "No description provided.")
            summary_state = project.get("library_summary", {})
            lib_summary = summary_state.get("current_text", "No summary available yet.")
        else:
            project_name = "Unknown Project"
            project_desc = "No description provided."
            lib_summary = "No summary available yet."
            
        from src.api.services.library_service import LibraryService
        stats = LibraryService.get_library_stats(project_id)
        
        stats_str = f"Total entities: {stats['total']}\n"
        if stats['by_type']:
            stats_str += "Breakdown by type:\n"
            for t, c in stats['by_type'].items():
                stats_str += f"- {t}: {c}\n"
                
        full_summary = (
            f"Project Name: {project_name}\n"
            f"Project Description: {project_desc}\n\n"
            f"Library Summary: {lib_summary}\n\n"
            f"Library Statistics:\n{stats_str}"
        )
        
        system_message = REACT_AGENT_SYSTEM.format(
            library_summary=full_summary
        )
        
        messages = [
            SystemMessage(content=system_message),
            HumanMessage(content=f"NEW CONTENT:\n{content}")
        ]
        
        # Run the agent to research and draft
        agent_state = await react_agent.ainvoke({"messages": messages})
        final_agent_message = agent_state["messages"][-1].content
        
        # 2. Parse final output into strict JSON schema
        parser_system = (
            "You are the Knowledge Architect for this project. Your job is to read the research report "
            "provided by the extraction agent and carefully translate its findings into formal, structured library entities.\n\n"
            "You must understand the overarching purpose of the project and ensure the entities and connections "
            "you output perfectly align with the project's domain and existing architecture.\n\n"
            "--- PROJECT CONTEXT ---\n"
            f"{full_summary}\n\n"
            "--- INSTRUCTIONS ---\n"
            "1. Output valid data adhering strictly to the provided JSON schema.\n"
            "2. Ensure entity types and connection types are semantically correct and meaningful for this specific project.\n"
            "3. If the research report concluded no changes are needed, return empty lists."
        )
        
        structured_llm = self.llm.with_structured_output(ExtractionResult)
        final_result = await structured_llm.ainvoke([
            SystemMessage(content=parser_system),
            HumanMessage(content=f"RESEARCH REPORT:\n{final_agent_message}")
        ])
        
        return final_result

    async def preprocess(self, project_id: str, content: str, source_tool: str = "user_upload") -> Dict[str, Any]:
        logger.info(f"[preprocess] project={project_id}, content_len={len(content)}")
        result = await self._run_extraction_pipeline(project_id, content)
        return _apply_extraction(project_id, result, source_tool)

    def postprocess(self, project_id: str, conversation_messages: List[Dict[str, str]], source_tool: str = "conversation") -> Dict[str, Any]:
        import asyncio
        return asyncio.run(self.postprocess_async(project_id, conversation_messages, source_tool))

    async def postprocess_async(self, project_id: str, conversation_messages: List[Dict[str, str]], source_tool: str = "conversation") -> Dict[str, Any]:
        transcript_lines = []
        for msg in conversation_messages:
            role = msg.get("type") or msg.get("role", "")
            text = msg.get("content", "")
            if role in ("user", "assistant", "human", "ai") and text:
                prefix = "USER" if role in ("user", "human") else "ASSISTANT"
                if len(text) > 2000:
                    text = text[:2000] + "... [truncated]"
                transcript_lines.append(f"{prefix}: {text}")

        if not transcript_lines:
            logger.info(f"[postprocess] project={project_id} — empty transcript, skipping")
            return {"skipped": True, "reason": "empty_transcript"}

        transcript = "\n".join(transcript_lines)

        logger.info(f"[postprocess] project={project_id}, running extraction on {len(transcript)} chars (skipping triage for explicit manual request)")
        result = await self._run_extraction_pipeline(project_id, transcript)
        return _apply_extraction(project_id, result, source_tool)
