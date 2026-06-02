"""
Stream Event Handlers
─────────────────────
Reusable functions that process individual LangGraph streaming events
and return SSE‑ready envelopes for the frontend.

Each handler follows the same contract:
    Input:  A raw event dict from ``graph.astream_events()``.
    Output: ``{"chatbot": {"messages": [<message>]}}`` or ``None``.
"""

from typing import Any, Dict, Optional
import json
from langchain_core.messages import AIMessage, ToolMessage

def wrap_message(msg) -> Dict[str, Any]:
    """Wraps a LangChain message in the SSE‑friendly envelope the frontend expects."""
    return {"chatbot": {"messages": [msg]}}


def handle_token_stream(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extracts a content chunk from a ``on_chat_model_stream`` event.

    Returns the wrapped chunk if it contains content, otherwise ``None``.
    """
    chunk = event["data"]["chunk"]
    if chunk.content:
        return wrap_message(chunk)
    return None


def handle_model_end(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extracts the final message from a ``on_chat_model_end`` event.

    Used as a fallback when the model did not stream tokens
    (e.g. structured‑output calls that return in one shot).
    """
    output = event["data"].get("output")
    if not output:
        return None

    if hasattr(output, "generations") and output.generations:
        msg = output.generations[0][0].message
    else:
        msg = output
    return wrap_message(msg)


def handle_orchestrator_end(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Emits the orchestrator's routing decision as a synthetic ``AIMessage``
    so the frontend can render the thought‑process card. Also emits any
    messages explicitly returned by the orchestrator.
    """
    output = event["data"].get("output")
    if isinstance(output, dict):
        content = ""
        if "messages" in output and output["messages"]:
            content += output["messages"][0].content + "\n"
        if "routing_metadata" in output:
            content += output["routing_metadata"]
            
        if content:
            return wrap_message(AIMessage(content=content.strip()))
    return None


def handle_clarifier_end(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extracts the clarifier's output message when the clarifier node finishes.
    This contains the clarifying questions wrapped in a <clarification> tag.
    """
    output = event["data"].get("output")
    if isinstance(output, dict) and "messages" in output:
        messages = output["messages"]
        if messages and len(messages) > 0:
            return wrap_message(messages[0])
    return None


def handle_tool_start(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extracts the tool name and input when a tool starts execution,
    and returns a synthetic AIMessage containing a <tool_call> tag.
    """
    import json
    name = event.get("name")
    tool_input = event.get("data", {}).get("input")
    
    payload = {
        "name": name,
        "input": tool_input
    }
    
    try:
        payload_str = json.dumps(payload)
    except Exception:
        payload_str = json.dumps({"name": name, "input": str(tool_input)})
        
    return wrap_message(AIMessage(content=f'<toolcall name="{name}"> {payload_str} '))


def handle_tool_end(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extracts the tool name and output when a tool finishes execution,
    and returns a synthetic AIMessage containing a <tool_output> tag.
    """

    
    name = event.get("name")
    tool_output = event.get("data", {}).get("output")
    
    if isinstance(tool_output, ToolMessage):
        output_content = tool_output.content
    elif isinstance(tool_output, (dict, list)):
        try:
            output_content = json.dumps(tool_output)
        except Exception:
            output_content = str(tool_output)
    else:
        output_content = str(tool_output)
        
    payload = {
        "name": name,
        "output": output_content
    }
    
    try:
        payload_str = json.dumps(payload)
    except Exception:
        payload_str = json.dumps({"name": name, "output": str(output_content)})
        
    return wrap_message(AIMessage(content=f" {payload_str} </toolcall>"))


def handle_automation_builder_end(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Extracts the automation builder's output when the node finishes.
    This contains the generated automation workflow wrapped in an <automation> tag.
    """
    output = event["data"].get("output")
    if isinstance(output, dict) and "messages" in output:
        messages = output["messages"]
        if messages and len(messages) > 0:
            return wrap_message(messages[0])
    return None


