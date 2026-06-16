from typing import Any, Dict
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage, SystemMessage

import json

def serialize_message(msg: Any) -> Dict[str, Any]:
    """
    Converts LangChain message classes into clean, JSON-serializable dicts.
    """
    msg_type = "unknown"
    if isinstance(msg, HumanMessage):
        msg_type = "human"
    elif isinstance(msg, AIMessage):
        msg_type = "ai"
    elif isinstance(msg, ToolMessage):
        msg_type = "tool"
    elif isinstance(msg, SystemMessage):
        msg_type = "system"
        
    res = {
        "type": msg_type,
        "content": msg.content,
    }
    
    if hasattr(msg, "name") and msg.name:
        res["name"] = msg.name
        
    if isinstance(msg, ToolMessage) and getattr(msg, "tool_call_id", None):
        res["tool_call_id"] = msg.tool_call_id
        
    if isinstance(msg, AIMessage) and getattr(msg, "tool_calls", None):
        res["tool_calls"] = [
            {
                "name": tc["name"],
                "args": tc["args"],
                "id": tc.get("id")
            }
            for tc in msg.tool_calls
        ]
        
    if hasattr(msg, "id") and msg.id:
        res["id"] = msg.id
        
    if hasattr(msg, "additional_kwargs") and msg.additional_kwargs:
        res["additional_kwargs"] = msg.additional_kwargs
        
    return res

def serialize_state(state: Dict[str, Any]) -> Dict[str, Any]:
    """
    Recursively processes graph state outputs, transforming LangChain messages.
    """
    serialized = {}
    for key, value in state.items():
        if key == "messages" and isinstance(value, list):
            serialized[key] = [serialize_message(m) for m in value]
        elif isinstance(value, dict):
            serialized[key] = serialize_state(value)
        elif isinstance(value, list):
            serialized[key] = [serialize_state(v) if isinstance(v, dict) else v for v in value]
        else:
            serialized[key] = value
    return serialized
