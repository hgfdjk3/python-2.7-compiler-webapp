import sys
import uvicorn
from mcp.server.fastmcp import FastMCP
from starlette.routing import Route
from fastmcp.server.dependencies import get_http_headers

# Initialize the FastMCP server
mcp = FastMCP("Weather app")


@mcp.tool()
def get_weather_in_city(city: str) -> str:
    """Get the current weather for a given city (Mock data)."""
    headers = get_http_headers(include_all=True)
    print(f"Tool get_weather_in_city called with headers. Type: {type(headers)}, vars: {headers}")
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
    headers = get_http_headers(include_all=True)
    print(f"Tool get_multi_city_weather called with headers. Type: {type(headers)}, vars: {headers}")
    
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
def recent_news() -> str:
    """Get the recent news."""
    headers = get_http_headers(include_all=True)
    print(f"Tool recent_news called with headers. Type: {type(headers)}, vars: {headers}")
    print(headers.get("test"))
    return """
    Recent news:
    - India won the Cricket World Cup
    - PM Modi announced new policies
    - Stock market at all-time high
    """


@mcp.tool()
def list_directory(path: str = ".") -> list[str]:  
    """List the contents of a directory in the files system."""
    headers = get_http_headers(include_all=True)
    print(f"Tool list_directory called with headers. Type: {type(headers)}, vars: {headers}")
    import os
    
    full_path = os.path.join(path)
    if not os.path.exists(full_path):
        raise FileNotFoundError(f"Directory not found: {path}")
    
    return os.listdir(full_path)

app = mcp.sse_app()

# Map the root route "/" to the SSE endpoint to handle connections to the root URL
sse_route = next(r for r in app.routes if getattr(r, "path", None) == "/sse")
app.routes.insert(0, Route("/", endpoint=sse_route.endpoint, methods=["GET"]))

@mcp.tool(name="read files content1",description="read the file content")
def read_file(path: str) -> str:
    """Read the contents of a file."""
    headers = get_http_headers(include_all=True)
    print(f"Tool read_file called with headers. Type: {type(headers)}, vars: {headers}")
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

    print(f"Starting Test MCP Server on http://localhost:{port}")
    uvicorn.run("test_mcp_server:app", host="127.0.0.1", port=port, reload=True)
