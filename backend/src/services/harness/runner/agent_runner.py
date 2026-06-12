import logging
from typing import Any, Dict, AsyncGenerator, Optional
from langchain_core.messages import HumanMessage, AIMessage
from src.api.utils.serialization import serialize_message
from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver
from langgraph.types import Command
from langgraph.errors import GraphInterrupt

from src.config import OPENAI_API_KEY
from src.services.harness.graph.builder import create_graph
from src.services.harness.mcp.client import MCPClientManager
from src.services.harness.graph.checkpointer import get_checkpointer
from src.services.harness.runner.stream_handlers import (
    handle_token_stream,
    handle_model_end,
    handle_orchestrator_end,
    handle_clarifier_end,
    handle_tool_start,
    handle_tool_end,
    handle_automation_builder_end,
)

logger = logging.getLogger("agent_runner")

class AgentRunner:
    """
    Decoupled orchestrator and execution harness for the LangGraph agent.
    Dynamically connects to MCP servers for each run to support user-specific tools.
    """

    def __init__(
        self,
        mcp_configs: Optional[Dict[str, Dict[str, Any]]] = None,
        model_name: str = "gpt-4o-mini",
        temperature: float = 0.7,
        model: Optional[Any] = None,
    ):
        self.mcp_configs = mcp_configs or {}
        self.model_name = model_name
        self.temperature = temperature
        self.model = model

    def _prepare_config(self, thread_id: str, model: Any, tools: list, always_allowed_tools: list = None) -> RunnableConfig:
        """Creates standard LangGraph execution config with context injection."""
        return {
            "configurable": {
                "thread_id": thread_id,
                "model": model,
                "tools": tools,
                "always_allowed_tools": always_allowed_tools or [],
            }
        }

    def _build_inputs(
        self, message: str, system_instruction: Optional[str] = None, automation: bool = False
    ) -> Dict[str, Any]:
        """Builds the initial graph input dict from a user message."""
        inputs: Dict[str, Any] = {
            "messages": [HumanMessage(content=message)],
        }
        if system_instruction:
            inputs["system_instruction"] = system_instruction
        if automation:
            inputs["automation"] = True
        return inputs

    async def run(
        self,
        thread_id: str,
        message: str,
        system_instruction: Optional[str] = None,
        automation: bool = False,
        resume_decision: Optional[str] = None,
        mcp_configs: Optional[Dict[str, Any]] = None,
        always_allowed_tools: Optional[list] = None,
        username: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes the agent workflow and returns the final state.
        Dynamically manages the connection to MCP servers for the duration of this run.
        """
        configs_to_use = mcp_configs if mcp_configs is not None else self.mcp_configs
        mcp_manager = MCPClientManager(configs_to_use, username=username)
        tools = await mcp_manager.connect_all()
        try:
            model = self.model or ChatOpenAI(
                model=self.model_name,
                temperature=self.temperature,
                api_key=OPENAI_API_KEY or "mock-key-for-testing",
                streaming=True,
            )
            async with get_checkpointer() as checkpointer:
                graph = create_graph(tools=tools, checkpointer=checkpointer)
                if resume_decision:
                    inputs = Command(resume=resume_decision)
                else:
                    inputs = self._build_inputs(message, system_instruction, automation=automation)
                config = self._prepare_config(thread_id, model, tools, always_allowed_tools)
                try:
                    return await graph.ainvoke(inputs, config=config)
                except GraphInterrupt:
                    state = await graph.aget_state(config)
                    return state.values
        finally:
            await mcp_manager.disconnect_all()

    async def stream_run(
        self,
        thread_id: str,
        message: str,
        system_instruction: Optional[str] = None,
        automation: bool = False,
        resume_decision: Optional[str] = None,
        mcp_configs: Optional[Dict[str, Any]] = None,
        always_allowed_tools: Optional[list] = None,
        username: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams real-time events from the execution graph.
        Dynamically manages the connection to MCP servers for the duration of this run.
        """
        configs_to_use = mcp_configs if mcp_configs is not None else self.mcp_configs
        mcp_manager = MCPClientManager(configs_to_use, username=username)
        tools = await mcp_manager.connect_all()
        try:
            model = self.model or ChatOpenAI(
                model=self.model_name,
                temperature=self.temperature,
                api_key=OPENAI_API_KEY or "mock-key-for-testing",
                streaming=True,
            )
            async with get_checkpointer() as checkpointer:
                graph = create_graph(tools=tools, checkpointer=checkpointer)
                if resume_decision:
                    inputs = Command(resume=resume_decision)
                else:
                    inputs = self._build_inputs(message, system_instruction, automation=automation)
                config = self._prepare_config(thread_id, model, tools, always_allowed_tools)
    
                tokens_streamed = False
                async for event in graph.astream_events(inputs, config=config, version="v2"):
                    event_type = event.get("event")
                    event_node = event.get("metadata", {}).get("langgraph_node")
    
                    # ── Worker token stream (real-time chunks) ───────────
                    if event_type == "on_chat_model_stream" and event_node != "orchestrator":
                        result = handle_token_stream(event)
                        if result:
                            tokens_streamed = True
                            yield result
    
                    # ── Non-streamed model completion (fallback) ─────────
                    elif event_type == "on_chat_model_end" and event_node not in ("orchestrator", "clarifier", "automation_builder") and not tokens_streamed:
                        result = handle_model_end(event)
                        if result:
                            yield result
    
                    # ── Tool execution start ─────────────────────────────
                    elif event_type == "on_tool_start":
                        result = handle_tool_start(event)
                        if result:
                            yield result
    
                    # ── Tool execution end ───────────────────────────────
                    elif event_type == "on_tool_end":
                        result = handle_tool_end(event)
                        if result:
                            yield result
    
                    # ── Orchestrator routing metadata (frontend only) ────
                    elif event_type in ("on_chain_end", "on_node_end") and event.get("name") == "orchestrator":
                        result = handle_orchestrator_end(event)
                        if result:
                            yield result
    
                    # ── Clarifier output (yield clarifying questions) ────
                    elif event_type in ("on_chain_end", "on_node_end") and event.get("name") == "clarifier":
                        result = handle_clarifier_end(event)
                        if result:
                            yield result
    
                    # ── Automation builder output (yield generated workflow) ────
                    elif event_type in ("on_chain_end", "on_node_end") and event.get("name") == "automation_builder":
                        result = handle_automation_builder_end(event)
                        if result:
                            yield result

                    # ── Custom events (e.g. tool approval requests) ────
                    elif event_type == "on_custom_event" and event.get("name") == "approval_request":
                        import json
                        tool_name = event.get("data", {}).get("tool_name")
                        tool_args = event.get("data", {}).get("tool_args")
                        tool_call_id = event.get("data", {}).get("tool_call_id")
                        
                        try:
                            payload_str = json.dumps({"name": tool_name, "input": tool_args})
                        except Exception:
                            payload_str = json.dumps({"name": tool_name, "input": str(tool_args)})
                            
                        # Inject into the text stream so the frontend's markdown parser renders the ToolBlock
                        from src.services.harness.runner.stream_handlers import wrap_message
                        yield wrap_message(AIMessage(content=f'<approve-tool name="{tool_name}" id="{tool_call_id}"> {payload_str} </approve-tool>'))
        finally:
            await mcp_manager.disconnect_all()

    async def get_history(self, thread_id: str) -> list:
        """
        Retrieves the message history from the checkpointer for a given thread_id.
        """
        
        @tool
        def dummy_tool() -> str:
            """Dummy tool to satisfy ToolNode initialization."""
            return "dummy"
        
        async with get_checkpointer() as checkpointer:
            # Reconstruct empty graph just to use aget_state with checkpointer
            graph = create_graph(tools=[dummy_tool], checkpointer=checkpointer)
            config = {"configurable": {"thread_id": thread_id}}
            snapshot = await graph.aget_state(config)
            
            if not snapshot or not snapshot.values:
                return []
                
            messages = snapshot.values.get("messages", [])
            return [serialize_message(m) for m in messages]

