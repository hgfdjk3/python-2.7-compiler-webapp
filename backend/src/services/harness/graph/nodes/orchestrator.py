from typing import Any, Dict, Literal
from pydantic import BaseModel, Field
import json
from langchain_core.messages import SystemMessage
from langchain_core.messages import AIMessage
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
Your goal is to manage the conversation flow and determine the next step.

Analyze the conversation history:
1. If the user's latest request has already been successfully addressed, answered, or completed by the worker in the message history, route to 'FINISH'. Do NOT route to 'worker' again if the work is already done.
2. If the user's request requires new work that has NOT yet been done, or if the worker's previous attempt was incomplete or requires correction/refinement, route to 'worker'.
3. If the request is simple (greetings, chit-chat), impossible, or does not require task execution, route to 'FINISH' and provide a helpful response.
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
        
    route_json = json.dumps({
        "next": route_result.next,
        "reasoning": route_result.reasoning
    })
    return {
        "next": route_result.next,
        "routing_metadata": f"<metadata> {route_json} </metadata>"
    }

