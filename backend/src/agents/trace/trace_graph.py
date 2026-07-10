import operator
import json
from typing import Annotated, Sequence, TypedDict, Any, List, Dict
from pydantic import BaseModel, Field

from langchain_core.messages import BaseMessage, SystemMessage, HumanMessage, AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, START, END
from langgraph.prebuilt import ToolNode

# Models for Extraction
class ExtractedNode(BaseModel):
    id: str = Field(description="A unique identifier for the entity (e.g. email, URL, name)")
    properties: Dict[str, str] = Field(description="Key-value pairs describing the entity")

class ExtractedEdge(BaseModel):
    source_id: str = Field(description="The ID of the source node")
    target_id: str = Field(description="The ID of the target node")
    relation: str = Field(description="The type of relationship")

class ExtractionResult(BaseModel):
    nodes: List[ExtractedNode] = Field(description="Entities extracted from the text")
    edges: List[ExtractedEdge] = Field(description="Relationships extracted between nodes")

# Graph State
class TraceState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    current_score: int
    latest_context: List[Dict[str, Any]]
    goal: str
    benchmark_query: str

# Nodes
async def agent_node(state: TraceState, config: RunnableConfig):
    model = config["configurable"]["model"]
    tools = config["configurable"]["tools"]
    
    # Bind tools to the model
    llm_with_tools = model.bind_tools(tools)
    
    # Inject current score and context into the prompt
    sys_prompt = f"""You are Trace, an autonomous intelligence research agent.
Your Goal: {state['goal']}

CURRENT FITNESS SCORE: {state['current_score']} (higher is better)
CURRENT BENCHMARK QUERY: {state['benchmark_query']}
LATEST GRAPH MATCHES: {json.dumps(state['latest_context'])}

Your task is to call tools to find information that improves your fitness score by satisfying the benchmark query.
Analyze the latest matches and decide your next tool call.
"""
    messages = [SystemMessage(content=sys_prompt)] + list(state["messages"])
    response = await llm_with_tools.ainvoke(messages)
    return {"messages": [response]}

async def extractor_node(state: TraceState, config: RunnableConfig):
    # Only run extraction if the last message was a tool message
    last_message = state["messages"][-1]
    if not isinstance(last_message, ToolMessage):
        return {}
        
    model = config["configurable"]["model"]
    # We use a structured output LLM to parse the tool response
    extractor_llm = model.with_structured_output(ExtractionResult)
    
    extract_prompt = f"""Extract intelligence entities and relationships from the following text.
Text: {last_message.content}
"""
    try:
        result = await extractor_llm.ainvoke([HumanMessage(content=extract_prompt)])
        # We pass the extraction result forward via a dummy AIMessage, or we could add a new field to TraceState
        # For simplicity, we'll serialize it as an AIMessage containing the JSON so the rsi_manager can read it.
        return {"messages": [AIMessage(content=result.model_dump_json(), name="extractor_results")]}
    except Exception as e:
        return {"messages": [AIMessage(content=f"Extraction failed: {str(e)}", name="extractor_results")]}

def rsi_manager_node(state: TraceState, config: RunnableConfig):
    graph_db = config["configurable"]["graph_db"]
    query_manager = config["configurable"]["query_manager"]
    
    last_message = state["messages"][-1]
    
    # 1. Ingest entities if extraction was successful
    if last_message.name == "extractor_results" and "Extraction failed" not in last_message.content:
        data = json.loads(last_message.content)
        for node in data.get("nodes", []):
            graph_db.add_node(node["id"], node.get("properties", {}))
        for edge in data.get("edges", []):
            graph_db.add_edge(edge["source_id"], edge["target_id"], edge["relation"])
            
    # 2. Evaluate new score
    evaluation = query_manager.evaluate_score()
    new_score = evaluation["score"]
    matches = evaluation["matches"]
    
    # 3. Check for dead ends (pseudo logic: if score hasn't improved in X turns, prune)
    # We'll just update state for now. The branch_and_update_query could be triggered by the LLM 
    # if we gave it a specific tool to "mark_dead_end".
    
    return {
        "current_score": new_score,
        "latest_context": matches,
        "benchmark_query": query_manager.get_query()
    }

def route_after_agent(state: TraceState):
    last_message = state["messages"][-1]
    if getattr(last_message, "tool_calls", None):
        return "tools"
    # If no tools called, we assume it's done or stuck
    return END

def create_trace_graph() -> StateGraph:
    workflow = StateGraph(TraceState)
    
    workflow.add_node("agent", agent_node)
    
    # ToolNode is standard langgraph prebuilt for executing bound tools
    # The tools list will be passed via config or injected dynamically.
    # To use ToolNode dynamically from config, we can wrap it.
    async def dynamic_tool_node(state: TraceState, config: RunnableConfig):
        tools = config["configurable"]["tools"]
        node = ToolNode(tools)
        return await node.ainvoke(state)
        
    workflow.add_node("tools", dynamic_tool_node)
    workflow.add_node("extractor", extractor_node)
    workflow.add_node("rsi_manager", rsi_manager_node)
    
    workflow.add_edge(START, "agent")
    workflow.add_conditional_edges("agent", route_after_agent, {"tools": "tools", END: END})
    workflow.add_edge("tools", "extractor")
    workflow.add_edge("extractor", "rsi_manager")
    workflow.add_edge("rsi_manager", END)
    
    return workflow.compile()
