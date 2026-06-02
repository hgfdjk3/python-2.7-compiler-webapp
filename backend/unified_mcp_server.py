import uvicorn
from fastapi import FastAPI

# Import the FastMCP instances from your existing scripts
from test_mcp_server import mcp as weather_mcp
from test_mcp_server_2 import mcp as math_mcp

from contextlib import AsyncExitStack, asynccontextmanager

# We use the http_app() method which returns a Starlette app
weather_app = weather_mcp.http_app(transport="streamable-http", path="/")
math_app = math_mcp.http_app(transport="streamable-http", path="/")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # FastMCP apps require their lifespans to be started to initialize their task groups
    async with AsyncExitStack() as stack:
        await stack.enter_async_context(weather_app.router.lifespan_context(weather_app))
        await stack.enter_async_context(math_app.router.lifespan_context(math_app))
        yield

app = FastAPI(title="Unified MCP Server", lifespan=lifespan)

# Mount the apps to their respective sub-paths
app.mount("/weather", weather_app)
app.mount("/math", math_app)

if __name__ == "__main__":
    print("Starting Unified MCP Server on http://0.0.0.0:9000")
    print(" - Weather MCP endpoint: http://localhost:9000/weather")
    print(" - Math MCP endpoint: http://localhost:9000/math")
    uvicorn.run(app, host="0.0.0.0", port=9000)
