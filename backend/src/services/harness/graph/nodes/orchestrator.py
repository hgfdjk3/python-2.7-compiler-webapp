from typing import Any, Dict, Literal
from pydantic import BaseModel, Field
import json
import logging
from langchain_core.messages import SystemMessage
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI

from src.services.harness.graph.state import AgentState

logger = logging.getLogger("orchestrator")

class Route(BaseModel):
    next: Literal["worker", "clarifier", "FINISH"] = Field(
        description="The next node to route to. Choose 'worker' to perform a task, 'clarifier' to ask the user clarifying questions, or 'FINISH' if the request is complete or unreachable."
    )
    reasoning: str = Field(
        description="Explanation of why you are routing to this node. If 'FINISH', this will be shown to the user."
    )

ORCHESTRATOR_SYSTEM_PROMPT = """You are an AI Supervisor.
Your goal is to manage the conversation flow and determine the next step.

Analyze the conversation history:
1. If the user's latest request has already been successfully addressed, answered, or completed by the worker in the message history, route to 'FINISH'. Do NOT route to 'worker' again if the work is already done.
2. The 'worker' node is responsible for ALL conversation, answering questions, searching, and doing work. If the user's request requires new work, code changes, searching the codebase, or even just chatting/answering a simple question, ALWAYS route to 'worker'. Do not be lazy; let the worker search and try stuff.
3. Do NOT route to 'clarifier' unless the request is extremely ambiguous and lacks critical details that cannot be discovered by the worker exploring the workspace (e.g. "Deploy the server script for me" without specifying which script or environment).
4. If the user explicitly asks to create a new automation, workflow, or sequence of actions, print/send to the user the message <AutomationModeBlock>'.

Available Tools:
{tools_info}

In your reasoning, tell the user what you think and what you are doing. make it short.

you should not say model name, or any details about you. if any user asks about you, say that you are an Atom agent.
"""

async def orchestrator_node(state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
    configurable = config.get("configurable", {})
    
    llm = configurable.get("model")
    if llm is None:
        model_name = configurable.get("model_name", "gpt-4o-mini")
        temperature = configurable.get("temperature", 0.0)
        llm = ChatOpenAI(model=model_name, temperature=temperature)

    # Extract tools from configuration and format descriptions for the supervisor
    tools = configurable.get("tools", [])
    if tools:
        tools_list = []
        for t in tools:
            name = getattr(t, "name", str(t))
            desc = getattr(t, "description", "")
            tools_list.append(f"- {name}: {desc}")
        tools_info = "\n".join(tools_list)
    else:
        tools_info = "No tools are currently available."

    # Use structured output for routing
    structured_llm = llm.with_structured_output(Route, method="function_calling")
    
    system_prompt = ORCHESTRATOR_SYSTEM_PROMPT.format(tools_info=tools_info)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    
    try:
        route_result: Route | None = await structured_llm.ainvoke(messages)
    except Exception as e:
        logger.warning(f"Structured output parsing failed: {e}")
        route_result = None
    
    if not route_result:
        # Fallback if structured output fails or returns None
        fallback_json = json.dumps({
            "next": "FINISH",
            "reasoning": "The orchestrator could not determine the next step. Finishing the conversation."
        })
        return {
            "next": "FINISH",
            "routing_metadata": f"<metadata> {fallback_json} </metadata>"
        }
        
    route_json = json.dumps({
        "next": route_result.next,
        "reasoning": route_result.reasoning
    })
    return {
        "next": route_result.next,
        "routing_metadata": f"<metadata> {route_json} </metadata>"
    }

