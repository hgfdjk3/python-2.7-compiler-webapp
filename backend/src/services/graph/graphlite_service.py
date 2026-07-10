import json
import re
import sqlite3
import graphlite
from typing import Any, Dict, List, Optional
from .graph_interface import IGraphDatabase
from .cypher_parser import parse_pseudo_cypher

def sqlite_regexp(expr, item):
    if item is None:
        return False
    try:
        reg = re.compile(expr)
        return reg.search(item) is not None
    except Exception:
        return False

class GraphliteService(IGraphDatabase):
    """
    A concrete implementation of IGraphDatabase using graphlite for edges 
    and standard SQLite for node properties (to support string UUIDs and properties).
    """

    def __init__(self, db_path: str):
        self.db_path = db_path
        # We initialize standard sqlite to hold node properties and id mappings
        self.conn = sqlite3.connect(db_path, check_same_thread=False)
        self.conn.create_function("REGEXP", 2, sqlite_regexp)
        self.cursor = self.conn.cursor()
        
        self.cursor.execute("""
            CREATE TABLE IF NOT EXISTS nodes (
                node_id TEXT PRIMARY KEY,
                int_id INTEGER UNIQUE,
                properties TEXT
            )
        """)
        self.conn.commit()
        
        # graphlite only works with ints, so we use int_id for graphlite relations
        self.graph = graphlite.connect(db_path + ".graphlite", graphs=['relation'])

    def _get_or_create_int_id(self, node_id: str) -> int:
        self.cursor.execute("SELECT int_id FROM nodes WHERE node_id = ?", (node_id,))
        row = self.cursor.fetchone()
        if row:
            return row[0]
        # Assign a new int_id
        self.cursor.execute("SELECT MAX(int_id) FROM nodes")
        max_id = self.cursor.fetchone()[0]
        new_id = (max_id or 0) + 1
        self.cursor.execute("INSERT INTO nodes (node_id, int_id, properties) VALUES (?, ?, ?)", 
                            (node_id, new_id, "{}"))
        self.conn.commit()
        return new_id

    def add_node(self, node_id: str, properties: Dict[str, Any]) -> None:
        int_id = self._get_or_create_int_id(node_id)
        props_str = json.dumps(properties)
        self.cursor.execute("UPDATE nodes SET properties = ? WHERE node_id = ?", (props_str, node_id))
        self.conn.commit()

    def add_edge(self, source_id: str, target_id: str, edge_type: str, properties: Optional[Dict[str, Any]] = None) -> None:
        src_int = self._get_or_create_int_id(source_id)
        tgt_int = self._get_or_create_int_id(target_id)
        
        with self.graph.transaction() as tr:
            tr.store(graphlite.V(src_int).relation(tgt_int))
        
    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        self.cursor.execute("SELECT properties FROM nodes WHERE node_id = ?", (node_id,))
        row = self.cursor.fetchone()
        if row:
            return json.loads(row[0])
        return None

    def get_neighbors(self, node_id: str) -> List[Dict[str, Any]]:
        src_int = self._get_or_create_int_id(node_id)
        # Find all target ints from source int
        # graphlite: graph.find(V(src_int).relation) returns an iterable of targets
        targets = list(self.graph.find(graphlite.V(src_int).relation))
        
        neighbors = []
        for tgt_int in targets:
            self.cursor.execute("SELECT node_id, properties FROM nodes WHERE int_id = ?", (tgt_int,))
            row = self.cursor.fetchone()
            if row:
                nid, props = row
                prop_dict = json.loads(props)
                prop_dict['_id'] = nid
                neighbors.append(prop_dict)
        return neighbors

    def run_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> Any:
        """
        Executes a pseudo-Cypher query using the cypher_parser.
        Returns a dictionary representing matched nodes and paths.
        """
        parsed = parse_pseudo_cypher(query)
        if not parsed.nodes:
            return {"nodes": {}, "paths": []}
            
        # 1. Find potential candidate nodes for each variable in the query
        candidates: Dict[str, List[Dict[str, Any]]] = {}
        
        for node_var in parsed.nodes:
            constraints = parsed.constraints.get(node_var, [])
            
            # Base query fetches all nodes. We'll filter them down.
            # In a real heavy DB, we'd build the SQL dynamically.
            self.cursor.execute("SELECT node_id, properties FROM nodes")
            
            valid_nodes = []
            for row in self.cursor.fetchall():
                nid, props_str = row
                props = json.loads(props_str)
                
                # Check constraints
                is_valid = True
                for prop_name, regex_pattern, is_positive in constraints:
                    val = str(props.get(prop_name, ""))
                    # Simple regex check
                    match = re.search(regex_pattern, val)
                    
                    if is_positive and not match:
                        is_valid = False
                        break
                    elif not is_positive and match:
                        is_valid = False
                        break
                        
                if is_valid:
                    props["_id"] = nid
                    valid_nodes.append(props)
                    
            candidates[node_var] = valid_nodes
            
        # 2. Check edges (paths) using graphlite if edges exist in query
        matched_paths = []
        # If there's only 1 node and no edges
        if len(parsed.nodes) == 1:
            return {"nodes": candidates, "paths": [[n] for n in candidates[parsed.nodes[0]]]}
            
        # Recursive path finder is overkill for this mock, so we'll just check linear paths
        # corresponding to the edges array.
        # Edge format: (node_var1, node_var2)
        
        # This is a naive implementation: we just check if ANY path exists that matches the structure.
        # In a real DB, we do an optimized graph traversal.
        for e1, e2 in parsed.edges:
            for n1 in candidates.get(e1, []):
                n1_int = self._get_or_create_int_id(n1["_id"])
                
                # Targets in graphlite
                targets = list(self.graph.find(graphlite.V(n1_int).relation))
                
                for n2 in candidates.get(e2, []):
                    n2_int = self._get_or_create_int_id(n2["_id"])
                    if n2_int in targets:
                        matched_paths.append([n1, n2])
                        
        return {
            "nodes": candidates,
            "paths": matched_paths
        }
