import os
import logging
from typing import Any, Dict, List, AsyncGenerator, Optional
from langchain_core.messages import HumanMessage
from langchain_core.messages import AIMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI

from src.config import OPENAI_API_KEY
from src.services.harness.graph.builder import create_graph
from src.services.harness.mcp.client import MCPClientManager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
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
        temperature: float = 0.7
    ):
        # 1. Setup options
        self.mcp_configs = mcp_configs or {}
        self.model_name = model_name
        self.temperature = temperature
        
        # 2. Setup core components
        self.mcp_manager = MCPClientManager(self.mcp_configs)
        self.graph = None
        self.model = None
        self.tools = []

    async def start(self):
        """
        Initializes the runner:
        - Establishes connections to all configured MCP servers.
        - Loads OpenAI Chat model.
        - Compiles LangGraph with resolved tools.
        """
        logger.info("Initializing AgentRunner...")
        
        # Resolve OpenAI key
        api_key = OPENAI_API_KEY
        if not api_key:
            logger.warning("OPENAI_API_KEY environment variable is not set. Real model calls will fail.")
            api_key = "mock-key-for-testing"

        # Instantiate OpenAI ChatModel with streaming enabled
        self.model = ChatOpenAI(
            model=self.model_name,
            temperature=self.temperature,
            api_key=api_key,
            streaming=True
        )

        
        # Connect to MCP servers and fetch tools
        self.tools = await self.mcp_manager.connect_all()
        logger.info(f"Loaded {len(self.tools)} total tools from MCP servers.")
        
        # Compile LangGraph with the gathered tools
        self.graph = create_graph(tools=self.tools)
        logger.info("LangGraph workflow compiled successfully.")

    async def stop(self):
        """
        Performs cleanup, shutting down all child MCP server subprocesses.
        """
        logger.info("Shutting down AgentRunner...")
        await self.mcp_manager.disconnect_all()
        logger.info("AgentRunner shutdown complete.")

    async def __aenter__(self):
        await self.start()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.stop()

    def _prepare_config(self, thread_id: str) -> RunnableConfig:
        """
        Creates standard LangGraph execution configuration with context injection.
        """
        return {
            "configurable": {
                "thread_id": thread_id,
                "model": self.model,
                "tools": self.tools,
            }
        }

    async def run(
        self, 
        thread_id: str, 
        message: str, 
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Executes the agent workflow synchronously and returns the final state.
        
        Args:
            thread_id: Unique identifier for tracking conversation history/sessions.
            message: User query or prompt.
            system_instruction: Optional overriding prompt instruction.
        """
        if not self.graph:
            raise RuntimeError("AgentRunner is not started. Call 'start()' or use as a context manager.")
            
        inputs = {
            "messages": [HumanMessage(content=message)],
        }
        if system_instruction:
            inputs["system_instruction"] = system_instruction
            
        config = self._prepare_config(thread_id)
        
        # Execute graph (astream/ainvoke)
        final_state = await self.graph.ainvoke(inputs, config=config)
        return final_state

    async def stream_run(
        self, 
        thread_id: str, 
        message: str, 
        system_instruction: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Streams step-by-step token and node updates from the execution graph.
        """
        if not self.graph:
            raise RuntimeError("AgentRunner is not started. Call 'start()' or use as a context manager.")
            
        inputs = {
            "messages": [HumanMessage(content=message)],
        }
        if system_instruction:
            inputs["system_instruction"] = system_instruction
            
        config = self._prepare_config(thread_id)
        
        tokens_streamed = False
        async for event in self.graph.astream_events(inputs, config=config, version="v2"):
            event_type = event.get("event")
            if event_type == "on_chat_model_stream":
                chunk = event["data"]["chunk"]
                if chunk.content:
                    tokens_streamed = True
                    yield {
                        "chatbot": {
                            "messages": [chunk]
                        }
                    }
            elif event_type == "on_chat_model_end" and not tokens_streamed:
                output = event["data"].get("output")
                if output:
                    if hasattr(output, "generations") and output.generations:
                        message = output.generations[0][0].message
                    else:
                        message = output
                    yield {
                        "chatbot": {
                            "messages": [message]
                        }
                    }
            elif event_type in ("on_chain_end", "on_node_end") and event.get("name") == "orchestrator":
                output = event["data"].get("output")
                if isinstance(output, dict) and "routing_metadata" in output:
                    metadata_content = output["routing_metadata"]
                    yield {
                        "chatbot": {
                            "messages": [AIMessage(content=metadata_content)]
                        }
                    }



