from typing import List, Optional, Any
from langchain_core.tools import BaseTool
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver

from src.services.harness.graph.state import AgentState
from src.services.harness.graph.nodes.orchestrator import orchestrator_node
from src.services.harness.graph.nodes.worker import worker_node

def route_orchestrator(state: AgentState):
    """
    Decides the next node to transition to based on the `next` routing field.
    """
    route = state.get("next")
    if route == "worker":
        return "worker"
    return END

def create_graph(tools: List[BaseTool], checkpointer: Optional[Any] = None) -> StateGraph:
    """
    Compiles the LangGraph StateGraph workflow for a multi-agent system.
    """
    # 1. Initialize the graph builder
    workflow = StateGraph(AgentState)

    # 2. Add nodes
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("worker", worker_node)
    
    # ToolNode executes the LLM's requested tool calls
    tool_node = ToolNode(tools)
    workflow.add_node("tools", tool_node)

    # 3. Add flow edges
    workflow.add_edge(START, "orchestrator")
    
    # Orchestrator decides if we need to run a worker or if we are done
    workflow.add_conditional_edges(
        "orchestrator", 
        route_orchestrator, 
        {"worker": "worker", END: END}
    )
    
    # From worker, we go back to orchestrator to evaluate
    workflow.add_edge("worker", "orchestrator")

    # 4. Compile with checkpointer
    if checkpointer is None:
        checkpointer = MemorySaver()
        
    return workflow.compile(checkpointer=checkpointer)
