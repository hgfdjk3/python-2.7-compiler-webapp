import os
import logging
from typing import Dict, Any, List

logger = logging.getLogger("connector_tools_service")

# In-memory tool to connector mapping cache: { tool_name: {"connector_id": str, "color": str} }
_TOOL_TO_CONNECTOR_MAPPING: Dict[str, Dict[str, Any]] = {}

def register_tool_mapping(tool_name: str, connector_id: str, color: str):
    """Registers a dynamic tool mapping from an active MCP server connection."""
    _TOOL_TO_CONNECTOR_MAPPING[tool_name] = {
        "connector_id": connector_id,
        "color": color
    }
    logger.info(f"Registered tool mapping: {tool_name} -> {connector_id} ({color})")

async def get_tool_mappings() -> Dict[str, Dict[str, Any]]:
    """
    Returns mapping of tool_name/tool_id -> {"connector_id": str, "color": str}.
    """
    return _TOOL_TO_CONNECTOR_MAPPING

def clear_connector_tools_cache():
    """Forces rebuilding cache (no-op since dynamic mappings are registered directly)."""
    pass

async def calculate_node_color(tools: List[str]) -> str:
    """Calculates the node color based on the most used tool's connector (prioritizing non-default colors)."""
    if not tools:
        return "#228be6"  # Default fallback blue

    tool_mappings = await get_tool_mappings()
    
    connector_counts = {}
    for tool_name in tools:
        mapping = tool_mappings.get(tool_name)
        if mapping:
            color = mapping["color"]
            connector_counts[color] = connector_counts.get(color, 0) + 1

    if not connector_counts:
        return "#228be6"  # Fallback to default if no tools have mappings

    # Find the color with the highest count
    most_used_color = "#228be6"
    max_count = 0
    for color, count in connector_counts.items():
        if count > max_count:
            max_count = count
            most_used_color = color
        elif count == max_count:
            # Tie breaker: prioritize non-default color
            if most_used_color == "#228be6" and color != "#228be6":
                most_used_color = color

    return most_used_color
