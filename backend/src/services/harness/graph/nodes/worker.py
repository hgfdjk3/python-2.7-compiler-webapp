from typing import Any, Dict
from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI

from src.services.harness.graph.state import AgentState

async def worker_node(state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
    configurable = config.get("configurable", {})
    
    # 1. Setup LLM
    llm = configurable.get("model")
    if llm is None:
        model_name = configurable.get("model_name", "gpt-4o-mini")
        temperature = configurable.get("temperature", 0.7)
        llm = ChatOpenAI(model=model_name, temperature=temperature)

    # 2. Formulate prompt specifically for this task
    system_instruction = """You are a specialized worker node.
Execute the user's request to the best of your ability. Keep your answer concise and focused.
"""
    
    messages = [SystemMessage(content=system_instruction)] + list(state.get("messages", []))
    
    # 3. Invoke LLM
    response = await llm.ainvoke(messages)
    
    # Always route back to orchestrator for review
    return {
        "messages": [response],
        "next": "orchestrator"
    }
