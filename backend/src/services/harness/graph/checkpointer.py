from typing import AsyncGenerator, Any
from contextlib import asynccontextmanager
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.postgres.aio import AsyncPostgresSaver
from src.config import LANGGRAPH_POSTGRES_URI

_memory_saver = None

@asynccontextmanager
async def get_checkpointer() -> AsyncGenerator[Any, None]:
    """
    Yields an AsyncPostgresSaver context manager if LANGGRAPH_POSTGRES_URI is set,
    otherwise yields a MemorySaver.
    """
    if LANGGRAPH_POSTGRES_URI:
        async with AsyncPostgresSaver.from_conn_string(LANGGRAPH_POSTGRES_URI) as checkpointer:
            await checkpointer.setup()
            yield checkpointer
    else:
        global _memory_saver
        if _memory_saver is None:
            _memory_saver = MemorySaver()
        yield _memory_saver
