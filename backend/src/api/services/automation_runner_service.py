import json
import uuid
from typing import Dict, Any, AsyncGenerator, Optional
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
from langchain_core.messages import HumanMessage, AIMessage

from src.services.harness.mcp.client import MCPClientManager
from src.services.harness.graph.automation_runner import create_automation_graph
from src.services.harness.graph.checkpointer import get_checkpointer
from src.api.services.automations_service import get_automation_by_id, save_automation_run
from datetime import datetime
from src.api.utils.serialization import serialize_state
from src.api.schemas.automations import AutomationRunRequest
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
            async with get_checkpointer() as checkpointer:
                graph = create_automation_graph(automation_data, all_tools=tools, checkpointer=checkpointer, model_name=model_name)
                
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
        node_states = {}
        start_time = datetime.utcnow()
        run_status = "success"
        
        try:
            model_name = get_default_model()
            async with get_checkpointer() as checkpointer:
                graph = create_automation_graph(automation_data, all_tools=tools, checkpointer=checkpointer, model_name=model_name)
                
                # Map node IDs to their titles for nice headers
                node_titles = {str(n["id"]): n.get("data", {}).get("title", f"Stage {n['id']}") for n in automation_data.get("nodes", [])}
                
                inputs = {"messages": []}
                if input_text:
                    inputs["messages"].append(HumanMessage(content=input_text))
                else:
                    inputs["messages"].append(HumanMessage(content="Begin the automation workflow. Follow your system instructions to complete your specific stage, then pass control to the next stage."))
                    
                config = {"configurable": {"thread_id": str(uuid.uuid4())}}
                
                current_node_id = None
                async for event in graph.astream_events(inputs, config=config, version="v2"):
                    event_type = event["event"]
                    name = event.get("name")
                    
                    # Check for stage starts
                    if event_type == "on_chain_start" and name in node_titles:
                        current_node_id = name
                        node_states[current_node_id] = {"status": "running", "content": "", "tools": []}
                        yield f"data: {json.dumps({'type': 'node_start', 'node_id': current_node_id})}\n\n"
                    
                    if not current_node_id:
                        continue
    
                    if event_type == "on_chat_model_stream":
                        chunk = event.get("data", {}).get("chunk")
                        if chunk and hasattr(chunk, "content") and chunk.content:
                            if current_node_id in node_states:
                                node_states[current_node_id]["content"] += chunk.content
                            yield f"data: {json.dumps({'type': 'node_chunk', 'node_id': current_node_id, 'content': chunk.content})}\n\n"
    
                    elif event_type == "on_tool_start":
                        # name is the tool name
                        input_data = event.get("data", {}).get("input")
                        if current_node_id in node_states:
                            node_states[current_node_id]["tools"].append({"name": name, "input": input_data, "output": None})
                        yield f"data: {json.dumps({'type': 'node_tool_start', 'node_id': current_node_id, 'tool_name': name, 'input': input_data})}\n\n"
    
                    elif event_type == "on_tool_end":
                        # output is the tool output
                        output_data = event.get("data", {}).get("output")
                        if hasattr(output_data, "content"):
                            output_data = output_data.content
                        if current_node_id in node_states:
                            for t in node_states[current_node_id]["tools"]:
                                if t["name"] == name and t["output"] is None:
                                    t["output"] = str(output_data)
                                    break
                        yield f"data: {json.dumps({'type': 'node_tool_end', 'node_id': current_node_id, 'tool_name': name, 'output': str(output_data)})}\n\n"
    
                    elif event_type == "on_chain_end" and name == current_node_id:
                        if current_node_id in node_states:
                            node_states[current_node_id]["status"] = "completed"
                        yield f"data: {json.dumps({'type': 'node_end', 'node_id': current_node_id})}\n\n"
                        current_node_id = None

        except Exception as e:
            run_status = "error"
            if current_node_id and current_node_id in node_states:
                node_states[current_node_id]["status"] = "error"
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
        finally:
            end_time = datetime.utcnow()
            duration_ms = int((end_time - start_time).total_seconds() * 1000)
            
            # Save the run
            save_automation_run({
                "automation_id": automation_data["id"],
                "status": run_status,
                "timestamp": start_time.isoformat() + "Z",
                "duration": f"{duration_ms}ms",
                "nodeExecutionStates": node_states
            })
            
            await mcp_manager.disconnect_all()
