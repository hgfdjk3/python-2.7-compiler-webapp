import uuid
import asyncio
from typing import Any, Dict, List, Optional
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage

from ...services.graph.graph_interface import IGraphDatabase
from .query_manager import TraceQueryManager
from .trace_graph import create_trace_graph
from ...services.harness.mcp.client import MCPClientManager
from ...config import OPENAI_API_KEY

class TraceHarness:
    """
    The core Recursive Self-Improvement (RSI) loop for the Trace intelligence agent.
    """

    def __init__(self, trace_id: str, goal: str, rules: str, initial_query: str, graph_db: IGraphDatabase):
        self.trace_id = trace_id or str(uuid.uuid4())
        self.goal = goal
        self.rules = rules
        self.graph_db = graph_db
        self.query_manager = TraceQueryManager(self.graph_db, initial_query)
        self.is_running = False
        
        self.current_score = 0
        self.iterations = 0
        self.latest_context = []

    def start(self):
        """
        Starts the RSI loop in a background task.
        """
        self.is_running = True
        asyncio.create_task(self._run_loop())
        
    def stop(self):
        """
        Manually halts the RSI loop.
        """
        self.is_running = False

    async def _run_loop(self):
        """
        The main iterative RSI loop powered by LangGraph.
        """
        # Initialize MCP Tools (assuming an empty dict for global mcp_configs loads the default ones)
        # Note: In a real implementation, we'd inject user configs here.
        mcp_manager = MCPClientManager({})
        tools = await mcp_manager.connect_all()
        
        try:
            model = ChatOpenAI(
                model="qwen/qwen3.5-122b-a10b", # From main AgentRunner config
                temperature=0.7,
                api_key=OPENAI_API_KEY or "mock-key-for-testing",
            )
            
            trace_graph = create_trace_graph()
            config = {
                "configurable": {
                    "tools": tools,
                    "model": model,
                    "graph_db": self.graph_db,
                    "query_manager": self.query_manager
                },
                "recursion_limit": 10
            }
            
            # Initial state
            state = {
                "messages": [HumanMessage(content=f"Begin Trace for goal: {self.goal}")],
                "current_score": self.current_score,
                "latest_context": self.latest_context,
                "goal": self.goal,
                "benchmark_query": self.query_manager.get_query()
            }
            
            while self.is_running:
                self.iterations += 1
                
                # Execute one step of the Trace StateGraph
                final_state = await trace_graph.ainvoke(state, config=config)
                
                self.current_score = final_state.get("current_score", self.current_score)
                self.latest_context = final_state.get("latest_context", self.latest_context)
                state["messages"] = final_state.get("messages", state["messages"])
                
                # Check Win Condition
                if self.current_score >= 10:  # Example arbitrary threshold
                    self.is_running = False
                    break
                    
                # Break if the agent didn't call any tools (graph finished without updating score)
                # Or wait for a bit before next loop to avoid hitting APIs too fast
                await asyncio.sleep(1)
                
        finally:
            await mcp_manager.disconnect_all()
            
    def get_status(self) -> Dict[str, Any]:
        return {
            "trace_id": self.trace_id,
            "status": "running" if self.is_running else "stopped",
            "iterations": self.iterations,
            "current_score": self.current_score,
            "benchmark_query": self.query_manager.get_query(),
        }
