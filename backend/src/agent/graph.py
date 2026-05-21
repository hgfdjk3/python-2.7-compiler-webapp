from typing import List, Optional, Any
from langchain_core.tools import BaseTool
from langchain_core.runnables import RunnableConfig
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver

from src.agent.state import AgentState
from src.agent.nodes.chatbot import chatbot_node

def create_graph(tools: List[BaseTool], checkpointer: Optional[Any] = None) -> StateGraph:
    """
    Compiles the LangGraph StateGraph workflow.
    
    Args:
        tools: List of tools the agent is permitted to execute.
        checkpointer: Custom checkpointer for session persistence (defaults to MemorySaver).
    """
    # 1. Initialize the graph builder
    workflow = StateGraph(AgentState)

    # 2. Add our modular nodes
    workflow.add_node("chatbot", chatbot_node)
    
    # ToolNode executes the LLM's requested tool calls
    tool_node = ToolNode(tools)
    workflow.add_node("tools", tool_node)

    # 3. Add flow edges
    workflow.add_edge(START, "chatbot")
    
    # Conditional edge routes to 'tools' if the chatbot returned tool calls, or END otherwise
    workflow.add_conditional_edges(
        "chatbot",
        tools_condition,
    )
    
    # From tools, we loop back to chatbot to evaluate the tool output
    workflow.add_edge("tools", "chatbot")

    # 4. Compile with checkpointer
    if checkpointer is None:
        checkpointer = MemorySaver()
        
    return workflow.compile(checkpointer=checkpointer)
