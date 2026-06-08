import logging
from typing import Any, Dict
from langchain_core.messages import SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI

from src.services.harness.graph.state import AgentState

logger = logging.getLogger("worker_node")

async def worker_node(state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
    configurable = config.get("configurable", {})
    
    # 1. Setup LLM
    llm = configurable.get("model")
    if llm is None:
        model_name = configurable.get("model_name", "gpt-4o-mini")
        temperature = configurable.get("temperature", 0.7)
        llm = ChatOpenAI(model=model_name, temperature=temperature)

    # Bind tools to the LLM if any are registered
    tools = configurable.get("tools", [])
    if tools:
        tool_names = [t.name for t in tools]
        logger.info(f"Worker node active. Binding tools: {tool_names}")
        llm = llm.bind_tools(tools)
    else:
        logger.info("Worker node active. No tools bound.")

    # 2. Formulate prompt specifically for this task
    system_instruction = """You are a specialized worker node.
Execute the user's request to the best of your ability. Keep your answer concise and focused.
"""
    
    messages = [SystemMessage(content=system_instruction)] + list(state.get("messages", []))
    
    # Sanitize history to prevent LLM crashes from old malformed ToolMessages (where content is a list of strings instead of a string)
    import json
    for m in messages:
        if isinstance(m, ToolMessage) and isinstance(m.content, list):
            try:
                m.content = json.dumps(m.content)
            except Exception:
                m.content = str(m.content)
    
    # 3. Invoke LLM
    response = await llm.ainvoke(messages)
    
    # Always route back to orchestrator for review
    return {
        "messages": [response],
        "next": "orchestrator"
    }
