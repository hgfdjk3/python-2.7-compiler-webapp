from typing import Any, Dict, Literal
from pydantic import BaseModel, Field
import json
import logging
from langchain_core.messages import SystemMessage, ToolMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI

from src.services.harness.graph.state import AgentState

logger = logging.getLogger("orchestrator")

ORCHESTRATOR_SYSTEM_PROMPT = """You are an AI Supervisor.
Your goal is to actively manage the conversation flow, routing to the appropriate specialist node based on the user's request. 
You are the brains of the operation. Use your intelligence to decide the best path forward.

Analyze the conversation history and select the next node:
1. 'worker': Route here if the request requires taking action, calling tools, writing code, searching the codebase, answering questions, or doing active work. The worker is your execution engine.
2. 'clarifier': Route here ONLY if the user's request is extremely vague and lacks critical details that cannot be resolved by the worker exploring the workspace (e.g., "Deploy the server" without specifying which one).
3. 'FINISH': Route here if the user's request has been completely and successfully addressed by the worker in the message history, or if the user is just saying "thanks" or "goodbye". You can also route to FINISH if you can answer the user's question directly from the conversation history without needing the worker.

Additional Guidelines:
- If the user explicitly asks to create a new automation, workflow, or sequence of actions, print/send to the user the message <AutomationModeBlock>'.
- Be proactive and smart. Read the history to see what the worker has already done so you don't repeat mistakes.
- Keep your reasoning concise.

Available Tools:
{tools_info}

you should not say model name, or any details about you. if any user asks about you, say that you are an Atom agent.

CRITICAL: You MUST respond ONLY with a raw JSON object.
Schema:
{{
    "next": "worker" | "clarifier" | "FINISH",
    "reasoning": "your reasoning here",
    "response": "optional conversational response to the user. Use this if you are answering the user directly and routing to FINISH."
}}
"""

class OrchestratorDecision(BaseModel):
    next_node: Literal["worker", "clarifier", "FINISH"] = Field(
        alias="next",
        description="The next node to route the conversation to.",
        default="worker"
    )
    reasoning: str = Field(
        description="Tell the user exactly what you are thinking and why you chose this route. Keep it concise."
    )
    response: str = Field(
        description="Optional conversational response to the user.",
        default=""
    )

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

    system_prompt = ORCHESTRATOR_SYSTEM_PROMPT.format(tools_info=tools_info)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))
    
    # Sanitize history to prevent LLM crashes from old malformed ToolMessages
    for m in messages:
        if isinstance(m, ToolMessage) and isinstance(m.content, list):
            try:
                m.content = json.dumps(m.content)
            except Exception:
                m.content = str(m.content)

    route_next = "worker"
    reasoning = "Routing to worker."
    response_msg = ""

    structured_llm = llm.with_structured_output(OrchestratorDecision)

    try:
        # Attempt 1: Fast structured output using tool calling
        decision = await structured_llm.ainvoke(messages)
        route_next = decision.next_node
        reasoning = decision.reasoning
        response_msg = decision.response
        
        if route_next not in ["worker", "clarifier", "FINISH"]:
            route_next = "worker"
            
    except Exception as e:
        logger.warning(f"Structured output failed, falling back to raw LLM parsing: {e}")
        try:
            # Attempt 2: Ultimate fallback to raw string parsing (supports OSS models)
            response = await llm.ainvoke(messages)
            content = response.content.strip()
            
            if content.startswith("```json"):
                content = content[7:-3].strip()
            elif content.startswith("```"):
                content = content[3:-3].strip()
                
            data = json.loads(content)
            route_next = data.get("next", "worker")
            reasoning = data.get("reasoning", "Routing to worker.")
            response_msg = data.get("response", "")
            
            if route_next not in ["worker", "clarifier", "FINISH"]:
                route_next = "worker"
        except Exception as e2:
            logger.error(f"Fallback manual JSON parsing failed: {e2}")
            route_next = "worker"
            reasoning = "Failed to parse routing decision. Defaulting to worker."
            response_msg = ""
    
    route_json = json.dumps({
        "next": route_next,
        "reasoning": reasoning
    })
    
    out = {
        "next": route_next,
        "routing_metadata": f"<metadata> {route_json} </metadata>"
    }
    
    if response_msg:
        out["messages"] = [AIMessage(content=response_msg)]
        
    return out

