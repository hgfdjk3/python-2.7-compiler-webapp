import logging
from typing import List, Dict, Any

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from langgraph.prebuilt import create_react_agent

from src.config import OPENAI_API_KEY, OPENAI_BASE_URL
from src.api.services.projects_service import ProjectsService
from src.api.services.library_service import LibraryService

from src.services.harness.extraction.schemas import TriageResult, EntityNode, EntityExtractionResult, ExtractedConnection, ConnectionExtractionResult, SummaryUpdateResult
from src.services.harness.extraction.prompts import TRIAGE_SYSTEM, ENTITY_EXTRACTION_SYSTEM, CONNECTION_EXTRACTION_SYSTEM, SUMMARY_UPDATE_SYSTEM
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

def _apply_extraction(project_id: str, summary_update: Optional[str], entities: List[EntityNode], connections: List[ExtractedConnection], source_tool: str) -> Dict[str, Any]:
    """Writes extraction results to the database as pending proposals."""
    project = ProjectsService.get_project(project_id)
    proposed_entities = []

    # 1. Propose summary update
    summary_proposed = False
    if summary_update:
        current_summary = (project.get("library_summary") or {}).get("current_text", "")
        if summary_update != current_summary:
            summary_state = project.get("library_summary") or {}
            summary_state["proposed_text"] = summary_update
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
    
    for extracted in entities:
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
        new_title_to_id[extracted.title.lower()] = saved["id"]
        proposed_entities.append(saved)

    # Merge title maps
    full_title_to_id = {**title_to_id, **new_title_to_id}

    # Second pass: resolve connections
    from src.api.utils.db import get_collection
    from collections import defaultdict
    ent_coll = get_collection("library_entities")
    
    conns_by_source = defaultdict(list)
    for conn in connections:
        source_id = conn.source_ref
        if not source_id.startswith("ent_"):
            resolved_source = full_title_to_id.get(source_id.lower())
            if resolved_source:
                source_id = resolved_source
                
        target_id = conn.target_ref
        if not target_id.startswith("ent_"):
            resolved_target = full_title_to_id.get(target_id.lower())
            if resolved_target:
                target_id = resolved_target

        if source_id and target_id:
            conns_by_source[source_id].append({
                "entity_id": target_id,
                "connection_type": conn.connection_type,
            })

    for src_id, resolved_conns in conns_by_source.items():
        doc = ent_coll.find_one({"_id": src_id})
        if doc:
            proposed = doc.get("proposed_state")
            if not proposed:
                current = doc.get("current_state") or {}
                proposed = {
                    "title": current.get("title", ""),
                    "description": current.get("description", ""),
                    "related_entities": current.get("related_entities", []),
                    "source_tools": current.get("source_tools", [])
                }
                if source_tool not in proposed.get("source_tools", []):
                    proposed.setdefault("source_tools", []).append(source_tool)
            
            existing_conns = proposed.get("related_entities", [])
            proposed["related_entities"] = existing_conns + resolved_conns
            
            saved = LibraryService.propose_changes(
                project_id=project_id,
                entity_id=src_id,
                entity_type=doc.get("type"),
                proposed_state=proposed
            )
            if src_id not in [e["id"] for e in proposed_entities]:
                proposed_entities.append(saved)

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

    async def _run_extraction_pipeline(self, project_id: str, chunks: List[str]) -> Dict[str, Any]:
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
        existing_entities = LibraryService.get_entities(project_id)
        existing_context_lines = []
        for m in existing_entities:
            state = m.get("current_state") or m.get("proposed_state") or {}
            title = state.get("title", "Unknown")
            desc = state.get("description", "")
            existing_context_lines.append(f"ID: {m['id']} | Title: {title} | Type: {m.get('type')} | Desc: {desc[:150]}")
            
        existing_context = "\n".join(existing_context_lines) if existing_context_lines else "No existing entities found."
        
        # Step 1: Entity Extraction (per chunk)
        final_entities = await self.extract_entities(existing_context, chunks)
        
        # Step 2: Connection Extraction (global)
        raw_text = "\n".join(chunks)
        final_connections = await self.extract_connections(existing_context, final_entities, raw_text)
            
        # Step 3: Summary Update (global)
        final_summary = await self.update_summary(lib_summary, final_entities, raw_text)
            
        return {
            "summary_update": final_summary,
            "entities": final_entities,
            "connections": final_connections
        }

    async def extract_entities(self, existing_context: str, chunks: List[str]) -> List[EntityNode]:
        entity_system = ENTITY_EXTRACTION_SYSTEM.format(existing_entities=existing_context)
        entity_llm = self.llm.with_structured_output(EntityExtractionResult)
        
        import asyncio
        sem = asyncio.Semaphore(3)
        completed = 0
        total = len(chunks)
        
        async def process_chunk(chunk: str, i: int):
            nonlocal completed
            logger.info(f"[ExtractorAgent] Started Entity Extraction chunk {i+1}/{total}")
            async with sem:
                res = await entity_llm.ainvoke([
                    SystemMessage(content=entity_system),
                    HumanMessage(content=f"NEW CONTENT CHUNK:\n{chunk}")
                ])
                completed += 1
                logger.info(f"[ExtractorAgent] Finished Entity Extraction chunk {i+1}/{total}. Overall progress: {completed}/{total}.")
                return res

        tasks = [process_chunk(chunk, i) for i, chunk in enumerate(chunks)]
        entity_results: List[EntityExtractionResult] = await asyncio.gather(*tasks)
        
        final_entities = []
        for res in entity_results:
            final_entities.extend(res.entities)
            
        return final_entities
            
    async def extract_connections(self, existing_context: str, new_entities: List[EntityNode], raw_text: str) -> List[ExtractedConnection]:
        if not new_entities:
            return []
        new_entities_context = "\n".join([f"Title: {e.title} | Type: {e.type} | Desc: {e.description}" for e in new_entities])
        conn_system = CONNECTION_EXTRACTION_SYSTEM.format(
            existing_entities=existing_context,
            new_entities=new_entities_context
        )
        conn_llm = self.llm.with_structured_output(ConnectionExtractionResult)
        
        logger.info(f"[ExtractorAgent] Started Connection Extraction")
        if len(raw_text) > 80000:
            raw_text = raw_text[:80000] + "... [truncated]"
            
        conn_res = await conn_llm.ainvoke([
            SystemMessage(content=conn_system),
            HumanMessage(content=f"RAW TEXT:\n{raw_text}")
        ])
        logger.info(f"[ExtractorAgent] Finished Connection Extraction. Found {len(conn_res.connections)} connections.")
        return conn_res.connections
            
    async def update_summary(self, lib_summary: str, new_entities: List[EntityNode], raw_text: str) -> Optional[str]:
        if not new_entities:
            return None
        new_entities_context = "\n".join([f"Title: {e.title} | Type: {e.type} | Desc: {e.description}" for e in new_entities])
        summary_system = SUMMARY_UPDATE_SYSTEM.format(
            current_summary=lib_summary,
            new_entities=new_entities_context
        )
        summary_llm = self.llm.with_structured_output(SummaryUpdateResult)
        
        logger.info(f"[ExtractorAgent] Started Summary Update")
        if len(raw_text) > 80000:
            raw_text = raw_text[:80000] + "... [truncated]"
        summary_res = await summary_llm.ainvoke([
            SystemMessage(content=summary_system),
            HumanMessage(content=f"RAW TEXT:\n{raw_text}")
        ])
        logger.info(f"[ExtractorAgent] Finished Summary Update.")
        return summary_res.summary_update
        
    async def rethink_connections(self, project_id: str, entity_ids: Optional[List[str]] = None, topic: Optional[str] = None) -> Dict[str, Any]:
        """Runs the connection extractor over existing entities to find missing connections."""
        from src.api.services.library_service import LibraryService
        existing_entities = LibraryService.get_entities(project_id)
        if not existing_entities:
            return {"entities_proposed": 0, "summary_proposed": False, "entity_ids": []}

        existing_context_lines = []
        target_nodes = []
        
        for ent in existing_entities:
            state = ent.get("current_state") or ent.get("proposed_state") or {}
            title = state.get("title", "Unknown")
            desc = state.get("description", "")
            
            node = EntityNode(
                existing_id=ent["id"],
                title=title,
                description=desc,
                type=ent.get("type", "concept")
            )
            
            existing_context_lines.append(f"ID: {ent['id']} | Title: {title} | Type: {ent.get('type')} | Desc: {desc[:150]}")
            
            if not entity_ids or ent["id"] in entity_ids:
                target_nodes.append(node)

        existing_context = "\n".join(existing_context_lines)
        raw_text = topic if topic else "No raw text provided. Infer connections from descriptions."
        
        final_connections = await self.extract_connections(existing_context, target_nodes, raw_text)
        
        return _apply_extraction(project_id, None, [], final_connections, "rethink_connections")

    async def preprocess(self, project_id: str, content: str, source_tool: str = "user_upload") -> Dict[str, Any]:
        logger.info(f"[preprocess] project={project_id}, content_len={len(content)}")
        result = await self._run_extraction_pipeline(project_id, [content])
        return _apply_extraction(project_id, result["summary_update"], result["entities"], result["connections"], source_tool)

    async def extract_large_text(self, project_id: str, content: str, source_tool: str = "text_dump") -> Dict[str, Any]:
        logger.info(f"[extract_large_text] project={project_id}, content_len={len(content)}")
        
        # Chunk the content by lines
        lines = content.split('\n')
        chunks = []
        current_chunk = []
        current_len = 0
        for line in lines:
            if current_len + len(line) > 60000 and current_chunk:
                chunks.append("\n".join(current_chunk))
                current_chunk = []
                current_len = 0
            current_chunk.append(line)
            current_len += len(line) + 1
            
        if current_chunk:
            chunks.append("\n".join(current_chunk))

        logger.info(f"[extract_large_text] project={project_id}, running extraction pipeline on {len(chunks)} chunks")
        result = await self._run_extraction_pipeline(project_id, chunks)
        return _apply_extraction(project_id, result["summary_update"], result["entities"], result["connections"], source_tool)

    def postprocess(self, project_id: str, conversation_messages: List[Dict[str, str]], source_tool: str = "conversation") -> Dict[str, Any]:
        import asyncio
        return asyncio.run(self.postprocess_async(project_id, conversation_messages, source_tool))

    async def postprocess_async(self, project_id: str, conversation_messages: List[Dict[str, str]], source_tool: str = "conversation") -> Dict[str, Any]:
        transcript_lines = []
        for msg in conversation_messages:
            role = msg.get("type") or msg.get("role", "")
            text = msg.get("content", "")
            
            if role in ("user", "human"):
                if text:
                    transcript_lines.append(f"U: {text[:2000]}")
            elif role in ("assistant", "ai"):
                if text:
                    transcript_lines.append(f"A: {text[:2000]}")
                if "tool_calls" in msg:
                    for tc in msg["tool_calls"]:
                        name = tc.get("name", "")
                        args = tc.get("args", {})
                        transcript_lines.append(f"[{name}]({args})")
            elif role == "tool":
                if text:
                    # Keep tool outputs even shorter for token efficiency
                    transcript_lines.append(f"-> {str(text)[:1000]}")

        if not transcript_lines:
            logger.info(f"[postprocess] project={project_id} — empty transcript, skipping")
            return {"skipped": True, "reason": "empty_transcript"}

        # Chunk the transcript lines
        chunks = []
        current_chunk = []
        current_len = 0
        for line in transcript_lines:
            if current_len + len(line) > 60000 and current_chunk:
                chunks.append("\n".join(current_chunk))
                current_chunk = []
                current_len = 0
            current_chunk.append(line)
            current_len += len(line) + 1
            
        if current_chunk:
            chunks.append("\n".join(current_chunk))

        transcript_for_print = "\n".join(transcript_lines)
        print(f"\n--- EXTRACTOR TRANSCRIPT ---\n{transcript_for_print}\n----------------------------\n")

        logger.info(f"[postprocess] project={project_id}, running extraction pipeline on {len(chunks)} chunks")
        result = await self._run_extraction_pipeline(project_id, chunks)
        return _apply_extraction(project_id, result["summary_update"], result["entities"], result["connections"], source_tool)
