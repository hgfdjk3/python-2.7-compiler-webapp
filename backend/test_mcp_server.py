import sys
import uvicorn
from mcp.server.fastmcp import FastMCP
from starlette.routing import Route

# Initialize the FastMCP server
mcp = FastMCP("Weather app")


@mcp.tool()
def get_weather_in_city(city: str) -> str:
    """Get the current weather for a given city (Mock data)."""
    city_lower = city.lower()
    if "london" in city_lower:
        return "Rainy and 15°C"
    elif "new york" in city_lower:
        return "Sunny and 22°C"
    else:
        return f"Mild and 20°C in {city}"

@mcp.tool()
def get_multi_city_weather(cities: list[str]) -> str:
    """Get the current weather for multiple cities."""
    
    weather_results = []
    for city in cities:
        # This could call an external API or use the logic from get_weather
        if "london" in city.lower():
            weather_results.append(f"{city}: Rainy and 15°C")
        elif "new york" in city.lower():
            weather_results.append(f"{city}: Sunny and 22°C")
        else:
            weather_results.append(f"{city}: Mild and 20°C")
    
    return "\n".join(weather_results)


@mcp.tool()
def list_directory(path: str = ".") -> list[str]:  
    """List the contents of a directory in the files ystem."""
    import os
    
    full_path = os.path.join(path)
    if not os.path.exists(full_path):
        raise FileNotFoundError(f"Directory not found: {path}")
    
    return os.listdir(full_path)

@mcp.tool()
def read_file(path: str,Field) -> str:
    """Read the contents of a file."""
    import os
    
    full_path = os.path.join(path)
    if not os.path.exists(full_path):
        raise FileNotFoundError(f"File not found: {path}")
    
    with open(full_path, "r") as f:
        return f.read()

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
