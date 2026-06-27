import logging
from typing import Any, Dict
from langchain_core.messages import SystemMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langchain_core.tools import tool

from src.services.harness.graph.state import AgentState
from src.api.services.projects_service import ProjectsService

logger = logging.getLogger("worker_node")

@tool
def request_clarification(reason: str) -> str:
    """Use this tool if the user's request is extremely ambiguous, vague, or missing critical details that prevent you from completing the task. Provide a specific 'reason' explaining what information is missing. Calling this tool will pause your execution and ask the user for clarification."""
    return ""

async def worker_node(state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
    configurable = config.get("configurable", {})
    
    # 1. Setup LLM
    llm = configurable.get("model")
    if llm is None:
        model_name = configurable.get("model_name", "qwen/qwen3.5-122b-a10b")
        temperature = configurable.get("temperature", 0.7)
        llm = ChatOpenAI(model=model_name, temperature=temperature)

    # Bind tools to the LLM if any are registered
    tools = configurable.get("tools", [])
    worker_tools = list(tools)
    worker_tools.append(request_clarification)
    
    if worker_tools:
        tool_names = [getattr(t, 'name', str(t)) for t in worker_tools]
        logger.info(f"Worker node active. Binding tools: {tool_names}")
        llm = llm.bind_tools(worker_tools, parallel_tool_calls=False)
    else:
        logger.info("Worker node active. No tools bound.")

    project_id = configurable.get("project_id")
    library_context = ""
    if project_id:
        project = ProjectsService.get_project(project_id)
        if project:
            summary = (project.get("library_summary") or {}).get("current_text", "")
            if summary:
                library_context = f"\n\nProject Context (Library Summary):\n{summary}\n"

    extra_instruction = state.get("system_instruction", "")
    if extra_instruction:
        extra_instruction = f"\n\nContext & Instructions:\n{extra_instruction}\n"

    # 2. Formulate prompt specifically for this task
    system_instruction_str = f"""You are Atom's AI Agent. You are the brains and the execution engine of the operation.
Your goal is to execute the user's request to the best of your ability. Keep your answers concise, focused, and proactive.
Read the conversation history to see what you have already done so you don't repeat mistakes.

Additional Guidelines:
- If the user's request is extremely vague and lacks critical details that cannot be resolved by exploring the workspace (e.g., "Deploy the server" without specifying which one), you MUST call the `request_clarification` tool.
- If the user explicitly asks to create a new automation, workflow, or sequence of actions, print/send to the user the message <AutomationModeBlock>.
- You should not say your underlying model name or any details about your architecture. If a user asks who you are, say that you are an Atom agent.
- If the user is just saying "thanks" or "goodbye", or you can answer their question directly from history, simply respond without calling any tools.

{library_context}{extra_instruction}
"""
    
    messages = [SystemMessage(content=system_instruction_str)] + list(state.get("messages", []))
    
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
    
    # Intercept request_clarification tool call
    if hasattr(response, "tool_calls") and response.tool_calls:
        for tc in response.tool_calls:
            if tc["name"] == "request_clarification":
                logger.info("Worker requested clarification, routing to clarifier node.")
                reason = tc.get("args", {}).get("reason", "The user's request is ambiguous.")
                tool_msg = ToolMessage(
                    content=f"Clarification requested. Reason: {reason}",
                    tool_call_id=tc["id"],
                    name=tc["name"]
                )
                return {
                    "messages": [response, tool_msg],
                    "next": "clarifier",
                    "routing_metadata": reason
                }
    
    # Route back to standard flow (tools_condition handles the next routing)
    return {
        "messages": [response],
        "next": "tool_approval" # this gets overridden by route_worker if tools are present
    }
