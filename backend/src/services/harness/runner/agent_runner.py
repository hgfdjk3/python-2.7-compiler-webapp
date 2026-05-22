import logging
from typing import Any, Dict, AsyncGenerator, Optional
from langchain_core.messages import HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI

from src.config import OPENAI_API_KEY
from src.services.harness.graph.builder import create_graph
from src.services.harness.mcp.client import MCPClientManager
from src.services.harness.runner.stream_handlers import (
    handle_token_stream,
    handle_model_end,
    handle_orchestrator_end,
    handle_clarifier_end,
)


logger = logging.getLogger("agent_runner")


class AgentRunner:
    """
    Decoupled orchestrator and execution harness for the LangGraph agent.
    Manages the lifecycle of MCP server connections, compiles the workflow graph,
    and exposes synchronous/streaming execution entrypoints.
    """

    def __init__(
        self,
        mcp_configs: Optional[Dict[str, Dict[str, Any]]] = None,
        model_name: str = "gpt-4o-mini",
        temperature: float = 0.7,
    ):
        self.mcp_configs = mcp_configs or {}
        self.model_name = model_name
        self.temperature = temperature

        self.mcp_manager = MCPClientManager(self.mcp_configs)
        self.graph = None
        self.model = None
        self.tools = []

    # ── Lifecycle ────────────────────────────────────────────────────

    async def start(self):
        """
        Initializes the runner:
        - Establishes connections to all configured MCP servers.
        - Loads OpenAI Chat model.
        - Compiles LangGraph with resolved tools.
        """
        logger.info("Initializing AgentRunner...")

        api_key = OPENAI_API_KEY
        if not api_key:
            logger.warning("OPENAI_API_KEY is not set. Real model calls will fail.")
            api_key = "mock-key-for-testing"

        self.model = ChatOpenAI(
            model=self.model_name,
            temperature=self.temperature,
            api_key=api_key,
            streaming=True,
        )

        self.tools = await self.mcp_manager.connect_all()
        logger.info(f"Loaded {len(self.tools)} total tools from MCP servers.")

        self.graph = create_graph(tools=self.tools)
        logger.info("LangGraph workflow compiled successfully.")

    async def stop(self):
        """Performs cleanup, shutting down all active connections."""
        logger.info("Shutting down AgentRunner...")
        await self.mcp_manager.disconnect_all()
        logger.info("AgentRunner shutdown complete.")

    async def reload_mcp_servers(self, new_configs: Dict[str, Dict[str, Any]]):
        """
        Hot-reloads MCP servers with new configurations and recompiles the graph.
        """
        logger.info("Reloading MCP servers...")
        # Disconnect old
        await self.mcp_manager.disconnect_all()
        
        # Update configs and reconnect
        self.mcp_configs = new_configs
        self.mcp_manager.server_configs = new_configs
        self.tools = await self.mcp_manager.connect_all()
        logger.info(f"Loaded {len(self.tools)} total tools from reloaded MCP servers.")
        
        # Recompile graph
        self.graph = create_graph(tools=self.tools)
        logger.info("LangGraph workflow recompiled successfully.")


    async def __aenter__(self):
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()

    # ── Shared Helpers ───────────────────────────────────────────────

    def _prepare_config(self, thread_id: str) -> RunnableConfig:
        """Creates standard LangGraph execution config with context injection."""
        return {
            "configurable": {
                "thread_id": thread_id,
                "model": self.model,
                "tools": self.tools,
            }
        }

    def _build_inputs(
        self, message: str, system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """Builds the initial graph input dict from a user message."""
        inputs: Dict[str, Any] = {
            "messages": [HumanMessage(content=message)],
        }
        if system_instruction:
            inputs["system_instruction"] = system_instruction
        return inputs

    def _ensure_started(self) -> None:
        """Raises if the runner hasn't been initialised."""
        if not self.graph:
            raise RuntimeError(
                "AgentRunner is not started. Call 'start()' or use as a context manager."
            )

    # ── Synchronous Execution ────────────────────────────────────────

    async def run(
        self,
        thread_id: str,
        message: str,
        system_instruction: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Executes the agent workflow and returns the final state.

        Args:
            thread_id: Unique session / conversation identifier.
            message: User prompt.
            system_instruction: Optional system prompt override.
        """
        self._ensure_started()
        
        # Log accessible MCP tools for debugging
        tool_names = [t.name for t in self.tools]
        logger.info(f"[AgentRunner] Initiating run. Accessible MCP tools: {tool_names}")
        
        inputs = self._build_inputs(message, system_instruction)
        config = self._prepare_config(thread_id)
        return await self.graph.ainvoke(inputs, config=config)

    # ── Streaming Execution ──────────────────────────────────────────

    async def stream_run(
        self,
        thread_id: str,
        message: str,
        system_instruction: Optional[str] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams real-time token chunks, completed messages, and orchestrator
        routing metadata from the execution graph.

        Yields dicts of the shape ``{"chatbot": {"messages": [<message>]}}``.

        Event routing:
        ┌─────────────────────────┬────────────────────────────────────┐
        │ Event                   │ Behaviour                          │
        ├─────────────────────────┼────────────────────────────────────┤
        │ on_chat_model_stream    │ Forward token chunks (worker only) │
        │ on_chat_model_end       │ Fallback for non-streamed replies  │
        │ on_chain/node_end       │ Emit orchestrator routing metadata │
        └─────────────────────────┴────────────────────────────────────┘
        """
        self._ensure_started()
        
        # Log accessible MCP tools for debugging
        tool_names = [t.name for t in self.tools]
        logger.info(f"[AgentRunner] Initiating stream_run. Accessible MCP tools: {tool_names}")
        
        inputs = self._build_inputs(message, system_instruction)
        config = self._prepare_config(thread_id)

        tokens_streamed = False

        async for event in self.graph.astream_events(inputs, config=config, version="v2"):
            event_type = event.get("event")
            event_node = event.get("metadata", {}).get("langgraph_node")

            # ── Worker token stream (real-time chunks) ───────────
            if event_type == "on_chat_model_stream":
                result = handle_token_stream(event)
                if result:
                    tokens_streamed = True
                    yield result

            # ── Non-streamed model completion (fallback) ─────────
            elif event_type == "on_chat_model_end" and event_node not in ("orchestrator", "clarifier") and not tokens_streamed:
                result = handle_model_end(event)
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

