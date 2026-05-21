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
from langchain_core.messages import AIMessage


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
    so the frontend can render the thought‑process card.

    This data is **not** part of the conversation history seen by the AI —
    it lives in the separate ``routing_metadata`` state field.
    """
    output = event["data"].get("output")
    if isinstance(output, dict) and "routing_metadata" in output:
        return wrap_message(AIMessage(content=output["routing_metadata"]))
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

