import logging
from typing import Any, Dict, AsyncGenerator, Optional
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from langgraph.checkpoint.memory import MemorySaver

from src.config import OPENAI_API_KEY
from src.services.harness.graph.builder import create_graph
from src.services.harness.mcp.client import MCPClientManager
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
        self.checkpointer = MemorySaver()

    def _prepare_config(self, thread_id: str, model: Any, tools: list) -> RunnableConfig:
        """Creates standard LangGraph execution config with context injection."""
        return {
            "configurable": {
                "thread_id": thread_id,
                "model": model,
                "tools": tools,
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
    ) -> Dict[str, Any]:
        """
        Executes the agent workflow and returns the final state.
        Dynamically manages the connection to MCP servers for the duration of this run.
        """
        mcp_manager = MCPClientManager(self.mcp_configs)
        tools = await mcp_manager.connect_all()
        try:
            model = self.model or ChatOpenAI(
                model=self.model_name,
                temperature=self.temperature,
                api_key=OPENAI_API_KEY or "mock-key-for-testing",
                streaming=True,
            )
            graph = create_graph(tools=tools, checkpointer=self.checkpointer)
            inputs = self._build_inputs(message, system_instruction, automation=automation)
            config = self._prepare_config(thread_id, model, tools)
            return await graph.ainvoke(inputs, config=config)
        finally:
            await mcp_manager.disconnect_all()

    async def stream_run(
        self,
        thread_id: str,
        message: str,
        system_instruction: Optional[str] = None,
        automation: bool = False,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams real-time events from the execution graph.
        Dynamically manages the connection to MCP servers for the duration of this run.
        """
        mcp_manager = MCPClientManager(self.mcp_configs)
        tools = await mcp_manager.connect_all()
        try:
            model = self.model or ChatOpenAI(
                model=self.model_name,
                temperature=self.temperature,
                api_key=OPENAI_API_KEY or "mock-key-for-testing",
                streaming=True,
            )
            graph = create_graph(tools=tools, checkpointer=self.checkpointer)
            inputs = self._build_inputs(message, system_instruction, automation=automation)
            config = self._prepare_config(thread_id, model, tools)

            tokens_streamed = False
            async for event in graph.astream_events(inputs, config=config, version="v2"):
                event_type = event.get("event")
                event_node = event.get("metadata", {}).get("langgraph_node")

                # ── Worker token stream (real-time chunks) ───────────
                if event_type == "on_chat_model_stream":
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
        finally:
            await mcp_manager.disconnect_all()
