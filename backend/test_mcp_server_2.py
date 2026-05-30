import sys
import uvicorn
from mcp.server.fastmcp import FastMCP
from starlette.routing import Route
from fastmcp.server.dependencies import get_http_headers

# Initialize the FastMCP server
mcp = FastMCP("Math Mock Data App")


@mcp.tool()
def get_math_grades(student: str) -> str:
    """Get the math grades for a given student (Mock data)."""
    headers = get_http_headers(include_all=True)
    print(f"Tool get_math_grades called with headers. Type: {type(headers)}, vars: {headers}")
    student_lower = student.lower()
    if "alice" in student_lower:
        return "Grade: A+ (98%)"
    elif "bob" in student_lower:
        return "Grade: B- (82%)"
    else:
        return f"Grade: C (75%) for {student}"

@mcp.tool()
def get_recent_equations() -> str:
    """Get a list of recently solved mathematical equations (Mock data)."""
    headers = get_http_headers(include_all=True)
    print(f"Tool get_recent_equations called with headers. Type: {type(headers)}, vars: {headers}")
    return """
    Recent Equations:
    - 2x + 5 = 15 => x = 5
    - y = mx + b (Linear Equation)
    - e^(i*pi) + 1 = 0 (Euler's Identity)
    """

@mcp.tool()
def get_math_constants() -> dict:
    """Return common mathematical constants (Mock data)."""
    headers = get_http_headers(include_all=True)
    print(f"Tool get_math_constants called with headers. Type: {type(headers)}, vars: {headers}")
    return {
        "pi": 3.14159,
        "e": 2.71828,
        "phi": 1.61803,
        "sqrt2": 1.41421
    }

app = mcp.sse_app()

# Map the root route "/" to the SSE endpoint to handle connections to the root URL
sse_route = next(r for r in app.routes if getattr(r, "path", None) == "/sse")
app.routes.insert(0, Route("/", endpoint=sse_route.endpoint, methods=["GET"]))

if __name__ == "__main__":
    # Default port is 8013 for this second test server. If a port number is passed as an argument, use it.
    port = 8014
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[-1])
        except ValueError:
            pass

    print(f"Starting Second Test MCP Server on http://localhost:{port}")
    uvicorn.run("test_mcp_server_2:app", host="127.0.0.1", port=port, reload=True)
