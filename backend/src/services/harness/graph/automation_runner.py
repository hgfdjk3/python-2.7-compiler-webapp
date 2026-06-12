import operator
from typing import TypedDict, Annotated, List, Any, Dict, Optional
from langchain_core.messages import AnyMessage, HumanMessage, SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.tools import BaseTool, tool
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import create_react_agent, ToolNode

from src.config import OPENAI_API_KEY

class AutomationState(TypedDict):
    messages: Annotated[List[AnyMessage], operator.add]
    node_outputs: Annotated[Dict[str, Any], operator.ior]
    is_stopped: bool

@tool
def stop_execution(reason: str):
    """Use this tool to stop the entire automation early (e.g., if a condition is not met or a failure occurs)."""
    return f"Execution stopped. Reason: {reason}"

def create_automation_graph(
    automation_data: Dict[str, Any], 
    all_tools: List[BaseTool],
    checkpointer: Any,
    model_name: str = "qwen/qwen3.5-122b-a10b",
    temperature: float = 0.0
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

        # Get specific tools for this node and append the stop tool
        node_tools = [tool_map[t] for t in tool_names if t in tool_map]
        node_tools.append(stop_execution)

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
        def create_node_func(agent, n_id, prev_node_ids):
            async def node_function(state: AutomationState, config: RunnableConfig):
                import json
                
                # Gather inputs from previous stages
                prev_outputs = {str(p): state.get("node_outputs", {}).get(str(p)) for p in prev_node_ids}
                messages_to_pass = list(state.get("messages", []))
                
                # Filter None values from prev_outputs
                prev_outputs = {k: v for k, v in prev_outputs.items() if v is not None}
                if prev_outputs:
                    input_msg = HumanMessage(content=f"Inputs from previous stages:\n{json.dumps(prev_outputs)}")
                    messages_to_pass.append(input_msg)

                # We invoke the agent with the injected messages
                res = await agent.ainvoke({"messages": messages_to_pass}, config)
                
                # The agent returns the full list of messages. We extract just the new ones.
                new_messages = res["messages"][len(messages_to_pass):]
                
                is_stopped = False
                final_output = ""
                
                for msg in reversed(new_messages):
                    if msg.type == "ai" and msg.content:
                        final_output = msg.content
                        break
                        
                for msg in new_messages:
                    if msg.type == "ai" and hasattr(msg, "tool_calls"):
                        for call in msg.tool_calls:
                            if call.get("name") == "stop_execution":
                                is_stopped = True
                                
                return {
                    "messages": new_messages,
                    "node_outputs": {str(n_id): final_output},
                    "is_stopped": is_stopped
                }
            node_function.__name__ = str(n_id)
            return node_function

        workflow.add_node(str(node_id), create_node_func(stage_agent, node_id, incoming_edges.get(node_id, [])))

    # Connect START to all start nodes
    for sn in start_nodes:
        workflow.add_edge(START, str(sn))

    # Define router for conditional edges
    def should_continue(state: AutomationState):
        if state.get("is_stopped", False):
            return "__end__"
        return "continue"

    # Connect edges using conditional logic
    for source_id, targets in outgoing_edges.items():
        if str(source_id) not in [str(n["id"]) for n in nodes]:
            continue # skipped node
            
        if not targets:
            # End nodes
            workflow.add_conditional_edges(
                str(source_id),
                should_continue,
                {"__end__": END, "continue": END}
            )
        else:
            # Note: We do a parallel fan-out manually if there are multiple targets
            # Since langgraph v0.2 supports returning a list of nodes, we can use a wrapper
            def route_targets(state: AutomationState, t=targets):
                if state.get("is_stopped", False):
                    return "__end__"
                valid_targets = [str(x) for x in t if str(x) in [str(n["id"]) for n in nodes]]
                if len(valid_targets) == 1:
                    return valid_targets[0]
                return valid_targets
            
            # Map dynamic targets to their physical nodes for validation
            target_map = {"__end__": END}
            for t in targets:
                if str(t) in [str(n["id"]) for n in nodes]:
                    target_map[str(t)] = str(t)
                    
            workflow.add_conditional_edges(
                str(source_id),
                route_targets,
                target_map
            )

    return workflow.compile(checkpointer=checkpointer)
