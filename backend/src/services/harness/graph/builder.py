from typing import List, Optional, Any
from langchain_core.tools import BaseTool
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver

from src.services.harness.graph.state import AgentState
from src.services.harness.graph.nodes.worker import worker_node
from src.services.harness.graph.nodes.clarifier import clarifier_node
from src.services.harness.graph.nodes.automation_builder import automation_builder_node
from src.services.harness.graph.nodes.tool_approval import tool_approval_node
from src.services.harness.graph.checkpointer import get_checkpointer

def route_start(state: AgentState):
    """
    Routes from START: if automation flag is set, go directly to automation_builder.
    Otherwise, follow normal worker flow.
    """
    if state.get("automation"):
        return "automation_builder"
    return "worker"

def route_worker(state: AgentState):
    """
    Routes from worker:
    - If next is 'clarifier', go to clarifier.
    - Otherwise use standard tools_condition.
    """
    if state.get("next") == "clarifier":
        return "clarifier"
    if tools_condition(state) == "tools":
        return "tool_approval"
    return END

def route_automation_builder(state: AgentState):
    """
    Decides the next node to transition to from automation_builder.
    Routes to clarifier if next is 'clarifier', otherwise ends the run.
    """
    if state.get("next") == "clarifier":
        return "clarifier"
    return END

def create_graph(tools: List[BaseTool], checkpointer: Optional[Any] = None) -> StateGraph:
    """
    Compiles the LangGraph StateGraph workflow for a multi-agent system.
    """
    # 1. Initialize the graph builder
    workflow = StateGraph(AgentState)

    # 2. Add nodes
    workflow.add_node("worker", worker_node)
    workflow.add_node("clarifier", clarifier_node)
    workflow.add_node("automation_builder", automation_builder_node)
    
    # Tool approval gate — checks if tools require user approval before execution
    workflow.add_node("tool_approval", tool_approval_node)
    
    # ToolNode executes the LLM's requested tool calls
    tool_node = ToolNode(tools)
    workflow.add_node("tools", tool_node)

    # 3. Add flow edges
    # Conditional start: automation requests bypass worker
    workflow.add_conditional_edges(
        START,
        route_start,
        {"automation_builder": "automation_builder", "worker": "worker"}
    )
    
    # Route from automation_builder to clarifier or END
    workflow.add_conditional_edges(
        "automation_builder", 
        route_automation_builder, 
        {"clarifier": "clarifier", END: END}
    )

    # From worker, go to tool_approval if tools are requested, clarifier if clarification needed, or END
    workflow.add_conditional_edges(
        "worker",
        route_worker,
        {
            "clarifier": "clarifier",
            "tool_approval": "tool_approval",
            END: END
        }
    )
    
    # tool_approval uses Command to route dynamically:
    #   - goto="tools" (approved) 
    #   - goto="worker" (try-again with rejection message)
    #   - goto="__end__" (reject/abort)
    
    # From tools, go back to worker so worker can compile/use the tool execution results
    workflow.add_edge("tools", "worker")
    
    # Clarifier always ends the run — user needs to respond
    workflow.add_edge("clarifier", END)

    # 4. Compile with checkpointer
    if checkpointer is None:
        checkpointer = get_checkpointer()
        
    return workflow.compile(checkpointer=checkpointer)


