import json
import uuid
from typing import Dict, Any, AsyncGenerator, Optional
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage

from src.services.harness.mcp.client import MCPClientManager
from src.services.harness.graph.automation_runner import create_automation_graph
from src.api.services.automations_service import get_automation_by_id
from src.api.utils.serialization import serialize_state
from src.api.schemas.automations import AutomationRunRequest
from src.services.harness.runner.stream_handlers import (
    handle_token_stream,
    handle_model_end,
    handle_tool_start,
    handle_tool_end,
)
from src.config import OPENAI_API_KEY

def get_default_model():
    api_key = OPENAI_API_KEY or ""
    if api_key.startswith("nvapi-"):
        return "openai/gpt-oss-120b"
    return "gpt-4o-mini"

class AutomationRunnerService:
    def __init__(self, mcp_configs: Optional[Dict[str, Dict[str, Any]]] = None):
        self.mcp_configs = mcp_configs or {}

    async def run_automation(self, automation_id: str, request: AutomationRunRequest):
        automation_data = get_automation_by_id(automation_id)
        if not automation_data:
            raise HTTPException(status_code=404, detail="Automation not found")

        if request.stream:
            return StreamingResponse(
                self._stream_generator(automation_data, request.input_text),
                media_type="text/event-stream"
            )
        else:
            return await self._run_sync(automation_data, request.input_text)

    async def _run_sync(self, automation_data: Dict[str, Any], input_text: Optional[str]) -> Dict[str, Any]:
        mcp_manager = MCPClientManager(self.mcp_configs)
        tools = await mcp_manager.connect_all()
        try:
            model_name = get_default_model()
            graph = create_automation_graph(automation_data, all_tools=tools, model_name=model_name)
            
            inputs = {"messages": []}
            if input_text:
                inputs["messages"].append(HumanMessage(content=input_text))
            else:
                inputs["messages"].append(HumanMessage(content="Begin the automation workflow. Follow your system instructions to complete your specific stage, then pass control to the next stage."))
                
            config = {"configurable": {"thread_id": str(uuid.uuid4())}}
            
            final_state = await graph.ainvoke(inputs, config=config)
            
            return {
                "status": "success",
                "messages": serialize_state(final_state).get("messages", [])
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            await mcp_manager.disconnect_all()

    async def _stream_generator(self, automation_data: Dict[str, Any], input_text: Optional[str]) -> AsyncGenerator[str, None]:
        mcp_manager = MCPClientManager(self.mcp_configs)
        tools = await mcp_manager.connect_all()
        try:
            model_name = get_default_model()
            graph = create_automation_graph(automation_data, all_tools=tools, model_name=model_name)
            
            # Map node IDs to their titles for nice headers
            node_titles = {str(n["id"]): n.get("data", {}).get("title", f"Stage {n['id']}") for n in automation_data.get("nodes", [])}
            
            inputs = {"messages": []}
            if input_text:
                inputs["messages"].append(HumanMessage(content=input_text))
            else:
                inputs["messages"].append(HumanMessage(content="Begin the automation workflow. Follow your system instructions to complete your specific stage, then pass control to the next stage."))
                
            config = {"configurable": {"thread_id": str(uuid.uuid4())}}
            
            tokens_streamed = False
            async for event in graph.astream_events(inputs, config=config, version="v2"):
                event_type = event["event"]
                name = event.get("name")
                
                # Check for stage starts
                if event_type == "on_chain_start" and name in node_titles:
                    # Yield a stage header as an AI message
                    header_msg = AIMessage(content=f"\n\n### ⚡ Stage: {node_titles[name]}\n\n---\n\n")
                    yield f"data: {json.dumps(serialize_state({'chatbot': {'messages': [header_msg]}}))}\n\n"
                
                if event_type == "on_chat_model_stream":
                    result = handle_token_stream(event)
                    if result:
                        tokens_streamed = True
                        yield f"data: {json.dumps(serialize_state(result))}\n\n"

                elif event_type == "on_chat_model_end" and not tokens_streamed:
                    # In automations, nodes might just be the react agent nodes
                    result = handle_model_end(event)
                    if result:
                        yield f"data: {json.dumps(serialize_state(result))}\n\n"

                elif event_type == "on_tool_start":
                    result = handle_tool_start(event)
                    if result:
                        yield f"data: {json.dumps(serialize_state(result))}\n\n"

                elif event_type == "on_tool_end":
                    result = handle_tool_end(event)
                    if result:
                        yield f"data: {json.dumps(serialize_state(result))}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            await mcp_manager.disconnect_all()
