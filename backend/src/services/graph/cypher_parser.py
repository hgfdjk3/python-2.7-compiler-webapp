import re
from typing import Dict, List, Tuple, Any

class ParsedCypher:
    def __init__(self):
        self.nodes: List[str] = []
        self.edges: List[Tuple[str, str]] = []
        self.constraints: Dict[str, List[Tuple[str, str, bool]]] = {}

def parse_pseudo_cypher(query: str) -> ParsedCypher:
    """
    Parses a simplified pseudo-Cypher query for the Trace RSI engine.
    Supports only:
    MATCH (n1)-[]-(n2)...
    WHERE n1.prop =~ 'regex' AND NOT n2.prop =~ 'regex'
    """
    parsed = ParsedCypher()
    
    # Extract MATCH clause
    match_match = re.search(r'MATCH\s+(.+?)(?:\s+WHERE|$)', query, re.IGNORECASE | re.DOTALL)
    if not match_match:
        return parsed
        
    match_str = match_match.group(1).strip()
    
    # Parse nodes like (n1)-[]-(n2)
    # This is a naive split by edge representation -[]- or -[r]- or ->
    node_matches = re.findall(r'\((\w+)\)', match_str)
    parsed.nodes = list(dict.fromkeys(node_matches))  # keep unique, preserve order
    
    # Parse edges naively assuming sequential connections in the string
    for i in range(len(parsed.nodes) - 1):
        parsed.edges.append((parsed.nodes[i], parsed.nodes[i+1]))
        
    # Extract WHERE clause
    where_match = re.search(r'WHERE\s+(.+)$', query, re.IGNORECASE | re.DOTALL)
    if where_match:
        where_str = where_match.group(1).strip()
        # Split by AND
        conditions = re.split(r'\s+AND\s+', where_str, flags=re.IGNORECASE)
        
        for cond in conditions:
            cond = cond.strip()
            is_positive = True
            
            # Check for NOT
            if cond.upper().startswith("NOT "):
                is_positive = False
                cond = cond[4:].strip()
                
            # Parse `node.property =~ 'regex'`
            # Using a regex to extract node, property, and the regex pattern (allowing for single quotes)
            prop_match = re.match(r'(\w+)\.(\w+)\s*=~\s*\'([^\']*)\'', cond)
            if prop_match:
                node_var, prop_name, regex_pattern = prop_match.groups()
                if node_var not in parsed.constraints:
                    parsed.constraints[node_var] = []
                parsed.constraints[node_var].append((prop_name, regex_pattern, is_positive))
                
    return parsed
