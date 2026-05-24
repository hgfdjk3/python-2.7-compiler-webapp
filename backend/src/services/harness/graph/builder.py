from typing import List, Optional, Any
from langchain_core.tools import BaseTool
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode, tools_condition
from langgraph.checkpoint.memory import MemorySaver

from src.services.harness.graph.state import AgentState
from src.services.harness.graph.nodes.orchestrator import orchestrator_node
from src.services.harness.graph.nodes.worker import worker_node
from src.services.harness.graph.nodes.clarifier import clarifier_node
from src.services.harness.graph.nodes.automation_builder import automation_builder_node

def route_start(state: AgentState):
    """
    Routes from START: if automation flag is set, go directly to automation_builder.
    Otherwise, follow normal orchestrator flow.
    """
    if state.get("automation"):
        return "automation_builder"
    return "orchestrator"

def route_orchestrator(state: AgentState):
    """
    Decides the next node to transition to based on the `next` routing field.
    """
    route = state.get("next")
    if route == "worker":
        return "worker"
    if route == "clarifier":
        return "clarifier"
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
    workflow.add_node("orchestrator", orchestrator_node)
    workflow.add_node("worker", worker_node)
    workflow.add_node("clarifier", clarifier_node)
    workflow.add_node("automation_builder", automation_builder_node)
    
    # ToolNode executes the LLM's requested tool calls
    tool_node = ToolNode(tools)
    workflow.add_node("tools", tool_node)

    # 3. Add flow edges
    # Conditional start: automation requests bypass orchestrator
    workflow.add_conditional_edges(
        START,
        route_start,
        {"automation_builder": "automation_builder", "orchestrator": "orchestrator"}
    )
    
    # Orchestrator decides: worker (do work), clarifier (ask questions), or END (done)
    workflow.add_conditional_edges(
        "orchestrator", 
        route_orchestrator, 
        {"worker": "worker", "clarifier": "clarifier", END: END}
    )
    
    # Route from automation_builder to clarifier or END
    workflow.add_conditional_edges(
        "automation_builder", 
        route_automation_builder, 
        {"clarifier": "clarifier", END: END}
    )


    # From worker, go to tools if worker wants to execute tools, otherwise back to orchestrator
    workflow.add_conditional_edges(
        "worker",
        tools_condition,
        {
            "tools": "tools",
            END: "orchestrator"
        }
    )
    
    # From tools, go back to worker so worker can compile/use the tool execution results
    workflow.add_edge("tools", "worker")
    
    # Clarifier always ends the run — user needs to respond
    workflow.add_edge("clarifier", END)
    
    # Automation builder always ends — returns the generated workflow
    workflow.add_edge("automation_builder", END)

    # 4. Compile with checkpointer
    if checkpointer is None:
        checkpointer = MemorySaver()
        
    return workflow.compile(checkpointer=checkpointer)

