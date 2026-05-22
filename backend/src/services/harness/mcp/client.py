import asyncio
import logging
from typing import Any, Dict, List, Optional
from langchain_core.tools import BaseTool

from mcp import ClientSession
from mcp.client.sse import sse_client
from langchain_mcp_adapters.tools import load_mcp_tools

logger = logging.getLogger("mcp_client_manager")

class MCPClientManager:
    """
    Manages connections to multiple MCP servers using SSE transport and exposes their tools
    as LangChain-compatible tools.
    """
    def __init__(self, server_configs: Dict[str, Dict[str, Any]]):
        """
        Args:
            server_configs: Dictionary mapping server_name -> dict containing:
                - url: str (SSE endpoint URL)
        """
        self.server_configs = server_configs
        self.sessions: Dict[str, ClientSession] = {}
        self.exit_stacks: List[Any] = [] # Stores async context stack cleanups
        self.tools: List[BaseTool] = []
        
    async def connect_to_server(self, server_name: str, config: Dict[str, Any]) -> List[BaseTool]:
        """
        Connects to a single MCP server via SSE transport and fetches its tools using langchain-mcp-adapters.
        """
        url = config.get("url")
        headers = config.get("headers")
        
        if not url:
            logger.error(f"No url specified for MCP server {server_name}")
            return []
            
        logger.info(f"Connecting to MCP server '{server_name}' at {url} with headers keys: {list(headers.keys()) if headers else 'None'}")
        
        read_write_ctx = None
        session_ctx = None
        try:
            # We manage SSE client using an async context manager entry
            read_write_ctx = sse_client(url, headers=headers)
            read, write = await read_write_ctx.__aenter__()
            
            session_ctx = ClientSession(read, write)
            session = await session_ctx.__aenter__()
            
            # Initialize connection
            await session.initialize()
            
            # Retrieve and convert tools using langchain-mcp-adapters
            converted_tools = await load_mcp_tools(session)
            
            # Prefix tool names to avoid collisions across servers
            import re
            for tool in converted_tools:
                sanitized_name = f"{server_name}_{tool.name}"
                sanitized_name = re.sub(r"[^a-zA-Z0-9_]", "_", sanitized_name)
                tool.name = sanitized_name
                logger.info(f"Loaded MCP tool: {tool.name}")
                
            # Success! Add contexts to active stack
            self.exit_stacks.append((read_write_ctx, session_ctx))
            self.sessions[server_name] = session
            return converted_tools
            
        except Exception as e:
            logger.exception(f"Failed to connect to MCP server {server_name}: {e}")
            # Gracefully clean up on failure
            if session_ctx:
                try:
                    await session_ctx.__aexit__(None, None, None)
                except Exception:
                    pass
            if read_write_ctx:
                try:
                    await read_write_ctx.__aexit__(None, None, None)
                except Exception:
                    pass
            return []
            
    async def connect_all(self) -> List[BaseTool]:
        """
        Connects to all configured MCP servers and caches their tools.
        """
        all_tools = []
        for name, config in self.server_configs.items():
            server_tools = await self.connect_to_server(name, config)
            all_tools.extend(server_tools)
        self.tools = all_tools
        return self.tools
        
    async def disconnect_all(self):
        """
        Gracefully shuts down all active MCP connections.
        """
        # Close in reverse order of initialization
        for read_write_ctx, session_ctx in reversed(self.exit_stacks):
            try:
                await session_ctx.__aexit__(None, None, None)
            except Exception as e:
                logger.warning(f"Error exiting MCP session context: {e}")
            try:
                await read_write_ctx.__aexit__(None, None, None)
            except Exception as e:
                logger.warning(f"Error exiting SSE transport context: {e}")
                
        self.exit_stacks.clear()
        self.sessions.clear()
        self.tools.clear()
        logger.info("Disconnected all MCP servers.")
