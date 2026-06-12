import os
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

from src.api.services.library_service import LibraryService
from src.api.services.projects_service import ProjectsService
from src.config import OPENAI_API_KEY

class ExtractedEntityConnection(BaseModel):
    entity_title: str = Field(description="The title of the related entity")
    connection_type: str = Field(description="The type of connection")

class ExtractedEntity(BaseModel):
    title: str = Field(description="The name or title of the entity")
    description: str = Field(description="A detailed description of the entity")
    type: str = Field(description="Type of the entity, e.g., 'person', 'place', 'concept', 'organization', 'source'")
    related_entities: List[ExtractedEntityConnection] = Field(description="Other entities this entity is connected to")
    
class ExtractionResult(BaseModel):
    new_summary: str = Field(description="A newly generated or updated overarching summary of the project library")
    entities: List[ExtractedEntity] = Field(description="List of entities extracted from the provided context")

class ExtractorAgent:
    def __init__(self, model_name: str = "gpt-4o-mini", temperature: float = 0.0):
        # Fallback to local default if nvapi is detected but standard model passed
        api_key = OPENAI_API_KEY or ""
        if api_key.startswith("nvapi-"):
            # Using deepseek or llama on nvidia endpoint
            base_url = "https://integrate.api.nvidia.com/v1"
            if model_name == "gpt-4o-mini":
                model_name = "meta/llama-3.1-70b-instruct"
        else:
            base_url = None

        self.llm = ChatOpenAI(
            model=model_name,
            api_key=api_key,
            base_url=base_url,
            temperature=temperature
        )
        self.structured_llm = self.llm.with_structured_output(ExtractionResult)

    def process_content(self, project_id: str, content: str, source_tool: str = "extractor_agent"):
        # 1. Fetch current library context
        project = ProjectsService.get_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
            
        current_summary = project.get("library_summary", {}).get("current_text", "")
        existing_entities = LibraryService.get_entities(project_id)
        
        # 2. Build context string
        context = f"CURRENT PROJECT SUMMARY:\n{current_summary}\n\n"
        context += "EXISTING ENTITIES:\n"
        for ent in existing_entities:
            state = ent.get("current_state") or {}
            title = state.get("title", "Unknown")
            desc = state.get("description", "")
            context += f"- [{ent['id']}] {title}: {desc}\n"
            
        # 3. Call LLM for extraction
        system_prompt = (
            "You are an AI tasked with maintaining a project's knowledge library. "
            "Given the current library context and the new content below, your job is to:\n"
            "1. Extract new relevant entities (people, places, concepts, etc.) or update existing ones based on the new content.\n"
            "2. Update the project summary to incorporate the new information seamlessly.\n"
            "You must output a structured list of entities and the updated summary. "
            "For existing entities that you wish to update, use the exact same title."
        )
        
        messages = [
            SystemMessage(content=system_prompt),
            HumanMessage(content=f"LIBRARY CONTEXT:\n{context}\n\nNEW CONTENT TO PROCESS:\n{content}")
        ]
        
        result: ExtractionResult = self.structured_llm.invoke(messages)
        
        # 4. Propose Summary Change
        if result.new_summary and result.new_summary != current_summary:
            summary_state = project.get("library_summary", {})
            summary_state["proposed_text"] = result.new_summary
            summary_state["status"] = "pending"
            ProjectsService.update_project(project_id, {"library_summary": summary_state})
            
        # 5. Propose Entity Changes
        title_to_id = {ent.get("current_state", {}).get("title", ""): ent["id"] for ent in existing_entities if ent.get("current_state")}
        
        for extracted_ent in result.entities:
            # Map related entities (try to resolve IDs if possible, else just use the title for now)
            related_conns = []
            for r in extracted_ent.related_entities:
                related_id = title_to_id.get(r.entity_title, "")
                related_conns.append({
                    "entity_id": related_id or r.entity_title, # Fallback to title if not found
                    "connection_type": r.connection_type
                })
                
            proposed_state = {
                "title": extracted_ent.title,
                "description": extracted_ent.description,
                "related_entities": related_conns,
                "source_tools": [source_tool]
            }
            
            existing_id = title_to_id.get(extracted_ent.title)
            
            LibraryService.propose_changes(
                project_id=project_id,
                entity_id=existing_id, # If None, will create a new entity proposal
                entity_type=extracted_ent.type,
                proposed_state=proposed_state
            )
            
        return result
