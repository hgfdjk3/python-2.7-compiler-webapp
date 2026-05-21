import json
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from typing import Dict, Any

from src.services.harness.runner import AgentRunner
from src.api.schemas.ask import AskRequest
from src.api.utils.serialization import serialize_state

class AgentService:
    """
    Service handling AI agent invocation logic and responses formatting (both JSON & SSE stream).
    """
    def __init__(self, runner: AgentRunner):
        self.runner = runner

    async def ask(self, body: AskRequest):
        if not body.message.strip():
            raise HTTPException(status_code=400, detail="Message cannot be empty")
            
        if not self.runner:
            raise HTTPException(status_code=500, detail="Agent runner is not initialized")

        if body.stream:
            return StreamingResponse(
                self._stream_generator(body),
                media_type="text/event-stream"
            )
        else:
            try:
                final_state = await self.runner.run(
                    thread_id=body.thread_id,
                    message=body.message,
                    system_instruction=body.system_instruction
                )
                return serialize_state(final_state)
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

    async def _stream_generator(self, body: AskRequest):
        try:
            async for event in self.runner.stream_run(
                thread_id=body.thread_id,
                message=body.message,
                system_instruction=body.system_instruction
            ):
                serialized = serialize_state(event)
                yield f"data: {json.dumps(serialized)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
