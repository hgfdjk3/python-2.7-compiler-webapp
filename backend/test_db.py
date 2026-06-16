import asyncio
from src.config import LANGGRAPH_POSTGRES_URI
from src.services.harness.graph.checkpointer import get_checkpointer
from src.services.harness.runner.agent_runner import AgentRunner
async def test():
    async with get_checkpointer() as cp:
        print('cp:', cp)
        runner = AgentRunner()
        history = await runner.get_history('test_thread')
        print('history:', history)
asyncio.run(test())
