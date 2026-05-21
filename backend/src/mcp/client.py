import asyncio
import logging
from typing import Any, Dict, List, Optional
from pydantic import Field, create_model

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from langchain_core.tools import StructuredTool, BaseTool

logger = logging.getLogger("mcp_client_manager")

def json_schema_to_pydantic(schema_name: str, input_schema: Dict[str, Any]) -> Any:
    """
    Dynamically constructs a Pydantic V2 model from an MCP JSON Schema.
    """
    properties = input_schema.get("properties", {})
    required = input_schema.get("required", [])
    
    fields = {}
    for field_name, prop in properties.items():
        type_str = prop.get("type", "string")
        description = prop.get("description", "")
        
        # Map JSON schema types to Python types
        py_type: Any = str
        if type_str == "integer":
            py_type = int
        elif type_str == "number":
            py_type = float
        elif type_str == "boolean":
            py_type = bool
        elif type_str == "array":
            py_type = list
        elif type_str == "object":
            py_type = dict
            
        # Pydantic v2 dynamic field setup
        default_val = ... if field_name in required else None
        fields[field_name] = (py_type, Field(default=default_val, description=description))
        
    return create_model(schema_name, **fields)


class MCPClientManager:
    """
    Manages connections to multiple MCP servers and exposes their tools
    as LangChain-compatible tools.
    """
    def __init__(self, server_configs: Dict[str, Dict[str, Any]]):
        """
        Args:
            server_configs: Dictionary mapping server_name -> dict containing:
                - command: str
                - args: List[str]
                - env: Optional[Dict[str, str]]
        """
        self.server_configs = server_configs
        self.sessions: Dict[str, ClientSession] = {}
        self.exit_stacks: List[Any] = [] # Stores async context stack cleanups
        self.tools: List[BaseTool] = []
        
    async def connect_to_server(self, server_name: str, config: Dict[str, Any]) -> List[BaseTool]:
        """
        Connects to a single MCP server via stdio transport and fetches its tools.
        """
        command = config.get("command")
        args = config.get("args", [])
        env = config.get("env")
        
        if not command:
            logger.error(f"No command specified for MCP server {server_name}")
            return []
            
        server_params = StdioServerParameters(
            command=command,
            args=args,
            env=env
        )
        
        logger.info(f"Connecting to MCP server '{server_name}' using: {command} {' '.join(args)}")
        
        try:
            # We manage stdio client using an async context manager entry
            # Since stdio_client returns an async context manager, we need to enter it
            read_write_ctx = stdio_client(server_params)
            read, write = await read_write_ctx.__aenter__()
            
            session_ctx = ClientSession(read, write)
            session = await session_ctx.__aenter__()
            
            # Store contexts for cleanup
            self.exit_stacks.append((read_write_ctx, session_ctx))
            self.sessions[server_name] = session
            
            # Initialize connection
            await session.initialize()
            
            # Retrieve tools from server
            response = await session.list_tools()
            converted_tools = []
            
            for mcp_tool in response.tools:
                tool_name = f"{server_name}_{mcp_tool.name}"
                schema = mcp_tool.inputSchema
                
                # Build dynamic args schema
                args_schema = json_schema_to_pydantic(f"{tool_name}Schema", schema)
                
                # Wrap tool call in coroutine closure
                async def build_caller(s=session, orig_name=mcp_tool.name):
                    async def caller(**kwargs) -> str:
                        res = await s.call_tool(orig_name, arguments=kwargs)
                        text_blocks = []
                        for block in res.content:
                            if hasattr(block, "text") and block.text:
                                text_blocks.append(block.text)
                            elif isinstance(block, dict) and block.get("type") == "text":
                                text_blocks.append(block.get("text", ""))
                        return "\n".join(text_blocks)
                    return caller
                
                langchain_tool = StructuredTool(
                    name=tool_name,
                    description=mcp_tool.description or f"MCP tool: {mcp_tool.name}",
                    func=None,
                    coroutine=await build_caller(),
                    args_schema=args_schema
                )
                converted_tools.append(langchain_tool)
                logger.info(f"Loaded MCP tool: {tool_name}")
                
            return converted_tools
            
        except Exception as e:
            logger.exception(f"Failed to connect to MCP server {server_name}: {e}")
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
                logger.warning(f"Error exiting stdio transport context: {e}")
                
        self.exit_stacks.clear()
        self.sessions.clear()
        self.tools.clear()
        logger.info("Disconnected all MCP servers.")
