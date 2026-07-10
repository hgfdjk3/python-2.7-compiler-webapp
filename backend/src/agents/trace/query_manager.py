from typing import Any, Dict, List
from ...services.graph.graph_interface import IGraphDatabase
from ...services.graph.cypher_parser import parse_pseudo_cypher

class TraceQueryManager:
    """
    Manages the benchmark query for the Trace RSI loop.
    Evaluates the graph state and calculates the fitness score.
    """

    def __init__(self, graph_db: IGraphDatabase, initial_query: str):
        self.graph_db = graph_db
        self.current_query = initial_query

    def evaluate_score(self) -> Dict[str, Any]:
        """
        Runs the current benchmark query against the graph and calculates a fitness score.
        Calculates 'Partial Progress' based on how many required nodes and paths were found.
        """
        results = self.graph_db.run_query(self.current_query)
        parsed_query = parse_pseudo_cypher(self.current_query)
        
        score = 0
        total_possible = 0
        
        # Scoring Nodes
        if parsed_query.nodes:
            node_weight = 50 / len(parsed_query.nodes)
            for node_var in parsed_query.nodes:
                total_possible += node_weight
                # If the results dict contains matches for this node variable
                if results.get("nodes", {}).get(node_var):
                    score += node_weight
                    
        # Scoring Paths (Edges)
        if parsed_query.edges:
            edge_weight = 50 / len(parsed_query.edges)
            for edge in parsed_query.edges:
                total_possible += edge_weight
                # If ANY full path was found, we give full edge points.
                # In a more advanced version, we'd verify the specific edge connection.
                if len(results.get("paths", [])) > 0:
                    score += edge_weight
                    
        # If no nodes/edges parsed, just return 0
        if total_possible == 0:
            score = 0
            
        return {
            "score": round(score),
            "matches": results,
            "query_used": self.current_query
        }

    def branch_and_update_query(self, node_var: str, property_name: str, dead_end_regex: str) -> None:
        """
        Dynamically updates the cypher/regex query to avoid a dead end.
        Appends an AND NOT condition to explicitly exclude the bad path.
        """
        # Example: AND NOT n2.content =~ 'bad_pattern'
        exclusion_clause = f" AND NOT {node_var}.{property_name} =~ '{dead_end_regex}'"
        self.current_query += exclusion_clause
        
    def get_query(self) -> str:
        return self.current_query
