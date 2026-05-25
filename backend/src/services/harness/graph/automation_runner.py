import operator
from typing import TypedDict, Annotated, List, Any, Dict, Optional
from langchain_core.messages import AnyMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent, ToolNode
from langgraph.checkpoint.memory import MemorySaver

from src.config import OPENAI_API_KEY

class AutomationState(TypedDict):
    messages: Annotated[List[AnyMessage], operator.add]

def create_automation_graph(
    automation_data: Dict[str, Any], 
    all_tools: List[BaseTool],
    model_name: str = "gpt-4o-mini",
    temperature: float = 0.1
) -> StateGraph:
    """
    Dynamically compiles a LangGraph StateGraph from an automation JSON definition.
    Each node in the automation becomes a react agent subgraph that has access only
    to the tools specified for that stage.
    """
    workflow = StateGraph(AutomationState)

    raw_nodes = automation_data.get("nodes", [])
    raw_edges = automation_data.get("edges", [])

    # Prune 'Trigger' nodes since they are just UI placeholders
    nodes_to_remove = set()
    for n in raw_nodes:
        title = n.get("data", {}).get("title", "").lower()
        if "trigger" in title:
            nodes_to_remove.add(n["id"])

    nodes = [n for n in raw_nodes if n["id"] not in nodes_to_remove]
    edges = [e for e in raw_edges if e["source"] not in nodes_to_remove and e["target"] not in nodes_to_remove]

    tool_map = {t.name: t for t in all_tools}
    
    # Pre-process edges to find incoming/outgoing for each node
    incoming_edges = {n["id"]: [] for n in nodes}
    outgoing_edges = {n["id"]: [] for n in nodes}
    for e in edges:
        if e["target"] in incoming_edges:
            incoming_edges[e["target"]].append(e["source"])
        if e["source"] in outgoing_edges:
            outgoing_edges[e["source"]].append(e["target"])

    start_nodes = [n["id"] for n in nodes if not incoming_edges[n["id"]]]
    end_nodes = [n["id"] for n in nodes if not outgoing_edges[n["id"]]]

    for n in nodes:
        node_id = n["id"]
        data = n.get("data", {})
        title = data.get("title", f"Stage {node_id}")
        desc = data.get("description", "")
        tool_names = data.get("tools", [])

        # Get specific tools for this node
        node_tools = [tool_map[t] for t in tool_names if t in tool_map]

        # Define the system prompt for this stage
        automation_type = automation_data.get("automation_type", "manual")
        system_prompt = f"Automation Type: {automation_type}\nStage: {title}\nTask: {desc}\n\nExecute this stage of the automation workflow. Do your task directly without waiting for user input. Use the provided tools if necessary. Summarize the result when done."

        # Create a react agent for this stage
        model = ChatOpenAI(
            model=model_name,
            temperature=temperature,
            api_key=OPENAI_API_KEY or "mock-key-for-testing"
        )
        
        stage_agent = create_react_agent(
            model=model,
            tools=node_tools,
            prompt=system_prompt
        )

        # Create a closure to capture the agent and avoid variable binding issues in loops
        def create_node_func(agent, n_id):
            async def node_function(state: AutomationState, config: RunnableConfig):
                # The react agent expects a state with 'messages'
                # We invoke it with the current accumulated messages
                res = await agent.ainvoke({"messages": state["messages"]}, config)
                
                # The agent returns the full list of messages.
                # We only want to return the newly added messages to the parent graph's state.
                # State accumulation via operator.add will append them.
                new_messages = res["messages"][len(state["messages"]):]
                return {"messages": new_messages}
            node_function.__name__ = str(n_id)
            return node_function

        workflow.add_node(str(node_id), create_node_func(stage_agent, node_id))

    # Connect START to all start nodes
    for sn in start_nodes:
        workflow.add_edge(START, str(sn))

    # Connect edges
    for e in edges:
        source_id = e["source"]
        target_id = e["target"]
        workflow.add_edge(str(source_id), str(target_id))

    # END is implicitly reached when a node has no outgoing edges
    for en in end_nodes:
        workflow.add_edge(str(en), END)

    return workflow.compile(checkpointer=MemorySaver())
