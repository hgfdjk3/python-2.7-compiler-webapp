import json
from typing import List, Dict, Any, Optional
from langchain_core.tools import tool
from src.api.services.library_service import LibraryService

def get_extraction_tools(project_id: str) -> List[Any]:
    """Factory to create context-aware tools for the extractor agent."""

    @tool
    def search_library(query: str) -> str:
        """Search the existing project library for entities matching the query (by title or description)."""
        # Run search query directly in MongoDB via the service
        entities = LibraryService.search_entities(project_id, query)
        results = []
        for ent in entities:
            state = ent.get("current_state", {})
            title = state.get("title", "")
            desc = state.get("description", "")
            results.append({
                "id": ent.get("id"),
                "title": title,
                "type": ent.get("type"),
                "description": desc[:100] + "..." if len(desc) > 100 else desc
            })
        
        if not results:
            return f"No entities found matching '{query}'."
        return json.dumps(results, indent=2)

    @tool
    def get_entity_details(entity_id: str) -> str:
        """Get the full details of a specific entity by its ID, including its connections."""
        ent = LibraryService.get_entity(project_id, entity_id)
        if ent:
            return json.dumps({
                "id": ent.get("id"),
                "type": ent.get("type"),
                "status": ent.get("status"),
                "current_state": ent.get("current_state")
            }, indent=2)
        return f"Entity with ID '{entity_id}' not found."

    return [search_library, get_entity_details]
