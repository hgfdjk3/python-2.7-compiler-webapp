import json
import urllib.request
import urllib.parse
import ssl
from fastmcp import FastMCP

# Bypass SSL verification if local certificates are outdated
ssl._create_default_https_context = ssl._create_unverified_context

# Initialize the FastMCP server
mcp = FastMCP("Wikipedia App")

BASE_URL = "https://en.wikipedia.org/w/api.php"

@mcp.tool(name="search_wikipedia", description="Search for Wikipedia pages based on a query.")
def search_wikipedia(query: str, limit: int = 5) -> str:
    """
    Search Wikipedia for the given query and return a list of matching page titles and brief snippets.
    """
    params = {
        "action": "query",
        "list": "search",
        "srsearch": query,
        "srlimit": str(limit),
        "utf8": "1",
        "format": "json"
    }
    
    query_string = urllib.parse.urlencode(params)
    url = f"{BASE_URL}?{query_string}"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'AtomAgent/1.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        search_results = data.get("query", {}).get("search", [])
        if not search_results:
            return f"No results found for '{query}'."
            
        formatted_results = [f"Title: {res['title']}\nSnippet: {res['snippet']}..." for res in search_results]
        return "\n\n".join(formatted_results)
    except Exception as e:
        return f"Error searching Wikipedia: {str(e)}"

@mcp.tool(name="get_wikipedia_page", description="Get the content and links of a specific Wikipedia page.")
def get_wikipedia_page(title: str, include_links: bool = False) -> str:
    """
    Get the text content of a specific Wikipedia page. 
    Optionally includes a list of links (other pages) found on this page to travel between pages.
    """
    params = {
        "action": "query",
        "prop": "extracts|links" if include_links else "extracts",
        "titles": title,
        "format": "json",
        "explaintext": "1",
        "exintro": "0",
        "pllimit": "500"
    }
    
    query_string = urllib.parse.urlencode(params)
    url = f"{BASE_URL}?{query_string}"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'AtomAgent/1.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            data = json.loads(response.read().decode('utf-8'))
        
        pages = data.get("query", {}).get("pages", {})
        if not pages or "-1" in pages:
            return f"Page '{title}' not found."
            
        page = list(pages.values())[0]
        content = page.get("extract", "No content available.")
        
        result = f"=== Page: {page.get('title')} ===\n\n{content}\n"
        
        if include_links and "links" in page:
            links = [link["title"] for link in page["links"]]
            result += "\n=== Links on this page ===\n" + ", ".join(links)
            
        return result
    except Exception as e:
        return f"Error fetching Wikipedia page: {str(e)}"

if __name__ == "__main__":
    import sys
    port = 8016
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[-1])
        except ValueError:
            pass

    print(f"Starting Wikipedia MCP Server on http://localhost:{port}")
    mcp.run(transport="streamable-http", host="127.0.0.1", port=port, path="/sse")
