from typing import Annotated, Sequence, TypedDict
from langchain_core.messages import BaseMessage
from langgraph.graph.message import add_messages

class AgentState(TypedDict):
    """
    State representing the agent's current workspace context and conversation.
    Uses LangGraph's add_messages reducer to append messages.
    """
    messages: Annotated[Sequence[BaseMessage], add_messages]
    system_instruction: str
    # Keeps track of tool execution errors or MCP server states if needed.
    metadata: dict[str, str]
