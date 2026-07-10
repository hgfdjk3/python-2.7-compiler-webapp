from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional

class IGraphDatabase(ABC):
    """
    Abstract interface for Graph Database operations.
    Allows swapping implementations (e.g. from graphlite to Memgraph).
    """

    @abstractmethod
    def add_node(self, node_id: str, properties: Dict[str, Any]) -> None:
        """
        Add a node to the graph with its properties.
        """
        pass

    @abstractmethod
    def add_edge(self, source_id: str, target_id: str, edge_type: str, properties: Optional[Dict[str, Any]] = None) -> None:
        """
        Create a relationship between two nodes.
        """
        pass

    @abstractmethod
    def run_query(self, query: str, parameters: Optional[Dict[str, Any]] = None) -> Any:
        """
        Execute a cypher-like query or regex search on the graph.
        Returns the matching nodes/edges.
        """
        pass

    @abstractmethod
    def get_node(self, node_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve a node and its properties by ID.
        """
        pass

    @abstractmethod
    def get_neighbors(self, node_id: str) -> List[Dict[str, Any]]:
        """
        Retrieve all immediate neighbors of a given node.
        """
        pass
