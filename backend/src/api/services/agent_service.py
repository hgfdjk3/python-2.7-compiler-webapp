import json
import asyncio
import logging
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from typing import Dict, Any
from langgraph.errors import GraphInterrupt

from src.services.harness.runner import AgentRunner
from src.api.schemas.ask import AskRequest
from src.api.utils.serialization import serialize_state
from src.api.routes.user import get_user_config_dict
from src.api.routes.connectors import get_connectors_dict
from src.api.services.conversations_service import ConversationsService

logger = logging.getLogger("agent_service")

class AgentService:
    """
    Service handling AI agent invocation logic and responses formatting (both JSON & SSE stream).
    """
    def __init__(self, runner: AgentRunner):
        self.runner = runner

    async def ask(self, body: AskRequest, username: str):
        if not body.message.strip() and not body.resume_decision:
            raise HTTPException(status_code=400, detail="Message cannot be empty")
            
        if not self.runner:
            raise HTTPException(status_code=500, detail="Agent runner is not initialized")

        if body.thread_id and body.project_id:
            title = body.message
            if len(title) > 50:
                title = title[:50] + "..."
            ConversationsService.create_conversation_metadata_if_not_exists(
                thread_id=body.thread_id,
                project_id=body.project_id,
                username=username,
                title=title
            )

        # Build user-scoped mcp_configs
        user_config = get_user_config_dict(username)
        enabled_connectors = user_config.get("enabled_connectors", [])
        user_headers = user_config.get("header_values", {})
        
        conversation = ConversationsService.get_conversation(body.thread_id, username)
        always_allowed_tools = []
        if conversation:
            always_allowed_tools = conversation.get("always_allowed_tools", [])

        
        connectors_db = get_connectors_dict()
        user_scoped_configs = {}
        for conn_id in enabled_connectors:
            if conn_id in connectors_db:
                conn_copy = connectors_db[conn_id].copy()
                if conn_id in user_headers:
                    conn_copy["header_values"] = user_headers[conn_id]
                user_scoped_configs[conn_id] = conn_copy

        if body.stream:
            return StreamingResponse(
                self._stream_generator(body, user_scoped_configs, always_allowed_tools, username),
                media_type="text/event-stream"
            )
        else:
            try:
                final_state = await self.runner.run(
                    thread_id=body.thread_id,
                    message=body.message,
                    system_instruction=body.system_instruction,
                    automation=body.automation,
                    resume_decision=body.resume_decision,
                    mcp_configs=user_scoped_configs,
                    always_allowed_tools=always_allowed_tools,
                    username=username
                )
                return serialize_state(final_state)
            except Exception as e:
                raise HTTPException(status_code=500, detail=str(e))

    async def _stream_generator(self, body: AskRequest, user_scoped_configs: Dict[str, Any], always_allowed_tools: list, username: str):
        queue = asyncio.Queue()

        async def worker():
            try:
                async for event in self.runner.stream_run(
                    thread_id=body.thread_id,
                    message=body.message,
                    system_instruction=body.system_instruction,
                    automation=body.automation,
                    resume_decision=body.resume_decision,
                    mcp_configs=user_scoped_configs,
                    always_allowed_tools=always_allowed_tools,
                    username=username
                ):
                    await queue.put(("data", event))
            except GraphInterrupt:
                pass
            except Exception as e:
                await queue.put(("error", e))
            finally:
                await queue.put(("done", None))

        task = asyncio.create_task(worker())

        try:
            while True:
                msg_type, payload = await queue.get()
                if msg_type == "done":
                    break
                elif msg_type == "error":
                    raise payload
                else:
                    serialized = serialize_state(payload)
                    yield f"data: {json.dumps(serialized)}\n\n"
        finally:
            logger.info(f"Stream generator finally block reached for project {body.project_id}")
            task.cancel()
            try:
                await asyncio.wait_for(task, timeout=2.0)
            except (asyncio.TimeoutError, asyncio.CancelledError):
                pass
