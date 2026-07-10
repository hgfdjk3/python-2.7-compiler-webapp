import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
from wikipedia_mcp_server import search_wikipedia, get_wikipedia_page

print("--- Testing search_wikipedia ---")
search_results = search_wikipedia("Quantum computing", limit=2)
print(search_results)

print("\n--- Testing get_wikipedia_page ---")
page_content = get_wikipedia_page("Quantum computing", include_links=True)
# Just print the first 500 characters and last 500 characters of the content
print(page_content[:500])
print("... [TRUNCATED] ...")
print(page_content[-500:])
