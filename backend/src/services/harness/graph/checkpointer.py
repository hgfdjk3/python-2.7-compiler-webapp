from typing import AsyncGenerator, Any
from contextlib import asynccontextmanager
import asyncio
from langgraph.checkpoint.base import BaseCheckpointSaver
from langgraph.checkpoint.memory import MemorySaver
from langgraph.checkpoint.postgres import PostgresSaver
from src.config import LANGGRAPH_POSTGRES_URI

_memory_saver = None

class ThreadedAsyncWrapper(BaseCheckpointSaver):
    def __init__(self, sync_saver):
        self.sync_saver = sync_saver
        self.serde = sync_saver.serde

    def get_tuple(self, config): return self.sync_saver.get_tuple(config)
    def get(self, config): return self.sync_saver.get(config)
    def put(self, config, checkpoint, metadata, new_versions): return self.sync_saver.put(config, checkpoint, metadata, new_versions)
    def put_writes(self, config, writes, task_id, task_path=""): return self.sync_saver.put_writes(config, writes, task_id, task_path)
    def list(self, config, *, filter=None, before=None, limit=None): return self.sync_saver.list(config, filter=filter, before=before, limit=limit)
    def setup(self): return self.sync_saver.setup()
    
    async def aget_tuple(self, config):
        return await asyncio.to_thread(self.get_tuple, config)

    async def aget(self, config):
        return await asyncio.to_thread(self.get, config)

    async def aput(self, config, checkpoint, metadata, new_versions):
        return await asyncio.to_thread(self.put, config, checkpoint, metadata, new_versions)

    async def aput_writes(self, config, writes, task_id, task_path=""):
        return await asyncio.to_thread(self.put_writes, config, writes, task_id, task_path)

    async def alist(self, config, *, filter=None, before=None, limit=None):
        def _get_all():
            return list(self.list(config, filter=filter, before=before, limit=limit))
        results = await asyncio.to_thread(_get_all)
        for r in results:
            yield r

@asynccontextmanager
async def get_checkpointer() -> AsyncGenerator[Any, None]:
    """
    Yields an async-compatible wrapper for PostgresSaver if LANGGRAPH_POSTGRES_URI is set,
    otherwise yields a MemorySaver.
    """
    if LANGGRAPH_POSTGRES_URI:
        with PostgresSaver.from_conn_string(LANGGRAPH_POSTGRES_URI) as checkpointer:
            checkpointer.setup()
            yield ThreadedAsyncWrapper(checkpointer)
    else:
        global _memory_saver
        if _memory_saver is None:
            _memory_saver = MemorySaver()
        yield _memory_saver
