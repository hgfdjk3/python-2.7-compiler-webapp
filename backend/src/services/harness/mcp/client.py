import asyncio
import logging
from typing import Any, Dict, List, Optional
from contextlib import AsyncExitStack
from langchain_core.tools import BaseTool

import re
import httpx
from mcp import ClientSession
from mcp.client.streamable_http import streamable_http_client
from langchain_mcp_adapters.tools import load_mcp_tools
from src.api.services.connector_tools_service import register_tool_mapping

logger = logging.getLogger("mcp_client_manager")

class MCPClientManager:
    """
    Manages connections to multiple MCP servers using SSE transport and exposes their tools
    as LangChain-compatible tools.
    """
    def __init__(self, server_configs: Dict[str, Dict[str, Any]], username: Optional[str] = None):
        """
        Args:
            server_configs: Dictionary mapping server_name -> dict containing:
                - url: str (SSE endpoint URL)
        """
        self.server_configs = server_configs
        self.username = username
        self.sessions: Dict[str, ClientSession] = {}
        # Maps server_name -> AsyncExitStack to manage that server's context managers
        self.exit_stacks: Dict[str, AsyncExitStack] = {}
        self.tools: List[BaseTool] = []
        
    async def connect_to_server(self, server_name: str, config: Dict[str, Any]) -> List[BaseTool]:
        """
        Connects to a single MCP server via SSE transport and fetches its tools.
        """
        url = config.get("url")
        # Use header_values (actual user input) if available, otherwise fallback to legacy headers
        base_headers = config.get("header_values") or config.get("headers") or {}
        
        headers = dict(base_headers) if isinstance(base_headers, dict) else {}
        if self.username:
            headers["x-user"] = self.username
        
        if not url:
            logger.error(f"No url specified for MCP server {server_name}")
            return []
            
        logger.info(f"Connecting to MCP server '{server_name}' at {url} with headers {headers}")
        print(f"DEBUG: MCP client connecting to {server_name} with headers: {headers}")
        
        exit_stack = AsyncExitStack()
        try:
            http_client = httpx.AsyncClient(headers=headers, follow_redirects=True)
            await exit_stack.enter_async_context(http_client)
            
            # Pre-flight HTTP ping to avoid anyio leak without crashing server logs
            parsed_url = httpx.URL(url)
            base_url = parsed_url.copy_with(path="/")
            try:
                await http_client.get(base_url, timeout=2.0)
            except Exception as e:
                raise Exception(f"Server at {url} is offline or unreachable") from e
            
            read, write, _ = await exit_stack.enter_async_context(
                streamable_http_client(url, http_client=http_client)
            )
            session = await exit_stack.enter_async_context(ClientSession(read, write))
            await session.initialize()
            
            # Keep exit stack and session for active server
            self.exit_stacks[server_name] = exit_stack
            self.sessions[server_name] = session
            return await load_mcp_tools(session)
            
        except Exception as e:
            logger.warning(f"Failed to connect to MCP server {server_name}: {e}")
            await exit_stack.aclose()
            return []
            
    async def connect_all(self) -> List[BaseTool]:
        """
        Connects to all configured MCP servers and caches their tools.
        If a server is already connected, it reloads tools from the active session.
        """
        all_tools = []
        for name, config in self.server_configs.items():
            if self.username:
                is_public = config.get("public") is True
                is_owner = (config.get("creator") == self.username) or (self.username in config.get("developers", [])) or (config.get("publisher_name") == self.username)
                if not is_public and not is_owner:
                    logger.warning(f"User {self.username} is not authorized to use connector {name}")
                    continue
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
                        async def safe_arun(*args, config=None, run_manager=None, orig=original_arun, t=tool, **kwargs):
                            if config is not None:
                                kwargs["config"] = config
                            elif getattr(orig, "__code__", None) and "config" in orig.__code__.co_varnames:
                                kwargs["config"] = {}
                            if run_manager is not None:
                                kwargs["run_manager"] = run_manager
                            try:
                                return await orig(*args, **kwargs)
                            except Exception as e:
                                err = f"Tool execution failed: {e}"
                                return (err, None) if getattr(t, "response_format", None) == "content_and_artifact" else err
                        tool._arun = safe_arun
                        
                    if original_run:
                        def safe_run(*args, config=None, run_manager=None, orig=original_run, t=tool, **kwargs):
                            if config is not None:
                                kwargs["config"] = config
                            elif getattr(orig, "__code__", None) and "config" in orig.__code__.co_varnames:
                                kwargs["config"] = {}
                            if run_manager is not None:
                                kwargs["run_manager"] = run_manager
                            try:
                                return orig(*args, **kwargs)
                            except Exception as e:
                                err = f"Tool execution failed: {e}"
                                return (err, None) if getattr(t, "response_format", None) == "content_and_artifact" else err
                        tool._run = safe_run
                        
                    color = config.get("color", "#228be6")
                    # Extract tags from MCP _meta field (propagated by langchain_mcp_adapters)
                    tool_meta = getattr(tool, "metadata", None) or {}
                    meta_block = tool_meta.get("_meta", {}) or {}
                    tool_tags = meta_block.get("tags", []) if isinstance(meta_block, dict) else []
                    display_name = meta_block.get("display_name") if isinstance(meta_block, dict) else None
                    display_description = meta_block.get("display_description") if isinstance(meta_block, dict) else None
                    
                    register_tool_mapping(tool.name, name, color, tags=tool_tags, display_name=display_name, display_description=display_description)
                    logger.info(f"Loaded tool: {tool.name} (tags={tool_tags}) display_name={display_name}")

                    # Guarantee that these display properties are invisible to the agent/LLM
                    # by forcefully stripping them out of the tool's metadata/schema
                    if isinstance(meta_block, dict):
                        meta_block.pop("display_name", None)
                        meta_block.pop("display_description", None)
                
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
