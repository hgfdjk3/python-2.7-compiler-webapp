import sys
import uvicorn
from mcp.server.fastmcp import FastMCP
from starlette.routing import Route

# Initialize the FastMCP server
mcp = FastMCP("Test-MCP-Server")

@mcp.tool()
def add(a: float, b: float) -> float:
    """Add two numbers together."""
    return a + b

@mcp.tool()
def get_weather(city: str) -> str:
    """Get the current weather for a given city (Mock data)."""
    city_lower = city.lower()
    if "london" in city_lower:
        return "Rainy and 15°C"
    elif "new york" in city_lower:
        return "Sunny and 22°C"
    else:
        return f"Mild and 20°C in {city}"

@mcp.tool()
def echo(message: str) -> str:
    """Echoes back the message provided."""
    return f"Server Echo: {message}"

if __name__ == "__main__":
    # Default port is 8012. If a port number is passed as an argument, use it.
    port = 8012
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[-1])
        except ValueError:
            pass

    app = mcp.sse_app()
    
    # Map the root route "/" to the SSE endpoint to handle connections to the root URL
    sse_route = next(r for r in app.routes if getattr(r, "path", None) == "/sse")
    app.routes.insert(0, Route("/", endpoint=sse_route.endpoint, methods=["GET"]))

    print(f"Starting Test MCP Server on http://localhost:{port}")
    uvicorn.run(app, host="127.0.0.1", port=port)
