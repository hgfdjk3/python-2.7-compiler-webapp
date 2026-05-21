from typing import Annotated, Sequence, TypedDict, Optional
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    """
    State representing the agent's current workspace context, conversation, and execution plan.
    Uses LangGraph's add_messages reducer to append messages.
    """
    messages: Annotated[Sequence[BaseMessage], add_messages]
    system_instruction: str
    metadata: dict[str, str]
    
    # Supervisor routing field
    next: Optional[str]
    # Routing metadata for frontend display only (not part of conversation history)
    routing_metadata: Optional[str]


