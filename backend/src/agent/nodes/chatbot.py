from typing import Any, Dict
from langchain_core.messages import SystemMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI

from src.agent.state import AgentState
from src.agent.prompts import DEFAULT_SYSTEM_INSTRUCTION

async def chatbot_node(state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
    """
    Main node that invokes the LLM. 
    Retrieves the LLM instance from the config to allow unit test mocking.
    """
    # 1. Retrieve the model and tool bindings from configuration
    configurable = config.get("configurable", {})
    
    # Allow injection of a mock LLM for testing, or default to ChatOpenAI
    llm = configurable.get("model")
    if llm is None:
        model_name = configurable.get("model_name", "gpt-4o-mini")
        temperature = configurable.get("temperature", 0.7)
        llm = ChatOpenAI(model=model_name, temperature=temperature)

    # 2. Gather tools if present in configuration
    tools = configurable.get("tools", [])
    if tools:
        llm = llm.bind_tools(tools)

    # 3. Formulate prompt (prepend system instruction if present)
    system_instruction = state.get("system_instruction") or DEFAULT_SYSTEM_INSTRUCTION
    
    messages = [SystemMessage(content=system_instruction)] + list(state["messages"])

    # 4. Invoke LLM asynchronously
    response = await llm.ainvoke(messages)
    
    return {"messages": [response]}
