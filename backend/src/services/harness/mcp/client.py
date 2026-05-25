import asyncio
import logging
from typing import Any, Dict, List, Optional
from contextlib import AsyncExitStack
from langchain_core.tools import BaseTool

import re
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
        # Maps server_name -> AsyncExitStack to manage that server's context managers
        self.exit_stacks: Dict[str, AsyncExitStack] = {}
        self.tools: List[BaseTool] = []
        
    async def connect_to_server(self, server_name: str, config: Dict[str, Any]) -> List[BaseTool]:
        """
        Connects to a single MCP server via SSE transport and fetches its tools.
        """
        url = config.get("url")
        headers = config.get("headers")
        
        if not url:
            logger.error(f"No url specified for MCP server {server_name}")
            return []
            
        logger.info(f"Connecting to MCP server '{server_name}' at {url}")
        
        exit_stack = AsyncExitStack()
        try:
            read, write = await exit_stack.enter_async_context(sse_client(url, headers=headers))
            session = await exit_stack.enter_async_context(ClientSession(read, write))
            await session.initialize()
            
            # Keep exit stack and session for active server
            self.exit_stacks[server_name] = exit_stack
            self.sessions[server_name] = session
            return await load_mcp_tools(session)
            
        except Exception as e:
            logger.exception(f"Failed to connect to MCP server {server_name}: {e}")
            await exit_stack.aclose()
            return []
            
    async def connect_all(self) -> List[BaseTool]:
        """
        Connects to all configured MCP servers and caches their tools.
        If a server is already connected, it reloads tools from the active session.
        """
        all_tools = []
        for name, config in self.server_configs.items():
            try:
                if name in self.sessions:
                    logger.info(f"Reloading tools from active session for '{name}'...")
                    server_tools = await load_mcp_tools(self.sessions[name])
                else:
                    server_tools = await self.connect_to_server(name, config)
                
                # Prefix, sanitize, and wrap tool names to prevent collisions and crashes
                for tool in server_tools:
                    tool.name = re.sub(r"[^a-zA-Z0-9_]", "_", f"{tool.name}")
                    
                    # Store original invoke/run methods
                    original_arun = getattr(tool, "_arun", None)
                    original_run = getattr(tool, "_run", None)
                    
                    if original_arun:
                        async def safe_arun(*args, orig=original_arun, t=tool, **kwargs):
                            try:
                                return await orig(*args, **kwargs)
                            except Exception as e:
                                err = f"Tool execution failed: {e}"
                                return (err, None) if getattr(t, "response_format", None) == "content_and_artifact" else err
                        tool._arun = safe_arun
                        
                    if original_run:
                        def safe_run(*args, orig=original_run, t=tool, **kwargs):
                            try:
                                return orig(*args, **kwargs)
                            except Exception as e:
                                err = f"Tool execution failed: {e}"
                                return (err, None) if getattr(t, "response_format", None) == "content_and_artifact" else err
                        tool._run = safe_run
                        
                    logger.info(f"Loaded tool: {tool.name}")
                
                all_tools.extend(server_tools)
            except Exception as e:
                logger.error(f"Failed to load tools for {name}: {e}")
                # Clean up resources if session has failed
                self.sessions.pop(name, None)
                if name in self.exit_stacks:
                    try:
                        await self.exit_stacks[name].aclose()
                    except Exception:
                        pass
                    self.exit_stacks.pop(name, None)
            
        self.tools = all_tools
        return self.tools
        
    async def disconnect_all(self):
        """
        Gracefully shuts down all active MCP connections.
        """
        logger.info("Disconnecting all MCP servers...")
        # Close each server's exit stack in reverse order, which automatically exits their contexts
        for server_name, exit_stack in reversed(list(self.exit_stacks.items())):
            try:
                await exit_stack.aclose()
            except Exception as e:
                logger.warning(f"Error exiting MCP session/SSE contexts for {server_name}: {e}")
                
        self.exit_stacks.clear()
        self.sessions.clear()
        self.tools.clear()
        logger.info("Disconnected all MCP servers.")
