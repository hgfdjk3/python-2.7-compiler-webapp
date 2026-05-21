from typing import Any, Dict, Literal
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI

from src.services.harness.graph.state import AgentState

class Route(BaseModel):
    next: Literal["worker", "FINISH"] = Field(
        description="The next node to route to. Choose 'worker' if a task needs to be performed, or 'FINISH' if the user's request is complete or unreachable."
    )
    reasoning: str = Field(
        description="Explanation of why you are routing to this node. If 'FINISH', this will be shown to the user."
    )

ORCHESTRATOR_SYSTEM_PROMPT = """You are an AI Supervisor. 
Your goal is to understand the user's intent. 
If the user's request requires work to be done (e.g. answering a complex question, performing a task), route to 'worker'.
If the request is simple, already completed, or impossible, route to 'FINISH' and provide a helpful response in 'reasoning'.
"""

async def orchestrator_node(state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
    configurable = config.get("configurable", {})
    
    llm = configurable.get("model")
    if llm is None:
        model_name = configurable.get("model_name", "gpt-4o-mini")
        temperature = configurable.get("temperature", 0.0)
        llm = ChatOpenAI(model=model_name, temperature=temperature)

    # Use structured output for routing
    structured_llm = llm.with_structured_output(Route)
    
    messages = [SystemMessage(content=ORCHESTRATOR_SYSTEM_PROMPT)] + list(state.get("messages", []))
    
    route_result: Route | None = await structured_llm.ainvoke(messages)
    
    if not route_result:
        # Fallback if structured output fails
        return {
            "next": "FINISH",
            "messages": [AIMessage(content="I'm sorry, I couldn't process that request.")]
        }
        
    updates = {"next": route_result.next}
    
    if route_result.next == "FINISH":
        updates["messages"] = [AIMessage(content=route_result.reasoning)]
        
    return updates

