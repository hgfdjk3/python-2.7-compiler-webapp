"""
Tool Approval Gate Node
───────────────────────
Intercepts tool calls from the worker node and checks if any tools
require user approval before execution. Uses LangGraph's interrupt()
mechanism to pause the graph and wait for user input.

Flow:
  worker → tool_approval → tools  (if approved or not flagged)
  worker → tool_approval → worker (if rejected / try-again, with rejection message)
"""

import logging
import json
from typing import Any, Dict
from langchain_core.callbacks.manager import adispatch_custom_event
from langchain_core.messages import AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langgraph.types import interrupt, Command

from src.services.harness.graph.state import AgentState
from src.api.services.connector_tools_service import get_tools_requiring_approval

logger = logging.getLogger("tool_approval")


async def tool_approval_node(state: AgentState, config: RunnableConfig) -> Command:
    """
    Checks the last AI message for tool calls. If any tool requires approval
    and hasn't been always-allowed by the user, interrupts execution and
    waits for user input.
    
    The interrupt value is a dict with tool call details that gets streamed
    to the frontend as an approval request.
    """
    configurable = config.get("configurable", {})
    always_allowed = set(configurable.get("always_allowed_tools", []))
    
    messages = state.get("messages", [])
    if not messages:
        return Command(goto="tools")
    
    last_message = messages[-1]
    
    # If the user resumed by sending a new message instead of choosing an approval option,
    # the last message will be a HumanMessage. Route back to orchestrator to handle it.
    from langchain_core.messages import HumanMessage
    if isinstance(last_message, HumanMessage):
        return Command(goto="orchestrator")
    
    # Only AIMessages can have tool_calls
    if not isinstance(last_message, AIMessage) or not last_message.tool_calls:
        return Command(goto="tools")
    
    # Check which tool calls need approval
    tool_call_names = [tc["name"] for tc in last_message.tool_calls]
    tools_needing_approval = get_tools_requiring_approval(tool_call_names)
    
    # Remove tools that user has always-allowed
    tools_to_ask = tools_needing_approval - always_allowed
    
    if not tools_to_ask:
        # All tools are either not flagged or always-allowed — proceed
        return Command(goto="tools")
    
    # We need approval for at least one tool. Interrupt for each one that needs it.
    # For simplicity, we ask about ALL flagged tools at once (first one found).
    for tc in last_message.tool_calls:
        if tc["name"] in tools_to_ask:
            approval_request = {
                "tool_name": tc["name"],
                "tool_args": tc["args"],
                "tool_call_id": tc["id"],
            }
            
            logger.info(f"Tool '{tc['name']}' requires approval. Interrupting graph.")
            
            # Dispatch custom event so the stream loop can yield it immediately
            await adispatch_custom_event(
                "approval_request",
                approval_request,
                config=config
            )
            
            # interrupt() pauses the graph. When resumed, it returns the human's response.
            decision = interrupt(approval_request)
            
            logger.info(f"Received approval decision: {decision}")
            
            if decision == "allow" or decision == "always_allow":
                # User approved — continue to tools
                return Command(goto="tools")
            
            elif decision == "try_again":
                # User wants the agent to try another approach.
                # Inject a rejection ToolMessage and route back to worker.
                rejection_messages = []
                for tc_inner in last_message.tool_calls:
                    if tc_inner["name"] in tools_to_ask:
                        rejection_messages.append(
                            ToolMessage(
                                content=f"Tool call rejected by user. The user declined to allow '{tc_inner['name']}'. Please try a different approach without using this tool.",
                                tool_call_id=tc_inner["id"],
                                name=tc_inner["name"],
                            )
                        )
                return Command(
                    goto="worker",
                    update={"messages": rejection_messages}
                )
            
            else:
                # decision == "reject" — abort the conversation
                rejection_messages = []
                for tc_inner in last_message.tool_calls:
                    if tc_inner["name"] in tools_to_ask:
                        rejection_messages.append(
                            ToolMessage(
                                content=f"Tool call rejected by user. Execution aborted.",
                                tool_call_id=tc_inner["id"],
                                name=tc_inner["name"],
                            )
                        )
                abort_message = AIMessage(
                    content="The tool call was rejected and the conversation has been stopped."
                )
                return Command(
                    goto="__end__",
                    update={"messages": rejection_messages + [abort_message]}
                )
    
    # Fallback: no tools needed approval after all
    return Command(goto="tools")
