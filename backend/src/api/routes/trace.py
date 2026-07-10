import uuid
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from ...services.graph.graphlite_service import GraphliteService
from ...agents.trace.trace_harness import TraceHarness

router = APIRouter(prefix="/trace", tags=["trace"])

# In a real system, we'd use a proper dependency injection and store state in DB/Redis.
# For now, we keep active traces in memory.
active_traces: Dict[str, TraceHarness] = {}

# We share a single graphlite service instance for simplicity in this PoC
graph_service = GraphliteService(db_path="trace_graph.db")

class TraceStartRequest(BaseModel):
    goal: str
    rules: str
    initial_query: str

class TraceResponse(BaseModel):
    trace_id: str
    status: str

@router.post("/start", response_model=TraceResponse)
async def start_trace(request: TraceStartRequest, background_tasks: BackgroundTasks):
    trace_id = str(uuid.uuid4())
    
    # Initialize the harness
    harness = TraceHarness(
        trace_id=trace_id,
        goal=request.goal,
        rules=request.rules,
        initial_query=request.initial_query,
        graph_db=graph_service
    )
    
    # Store in memory
    active_traces[trace_id] = harness
    
    # Start the harness RSI loop
    harness.start()
    
    # In a full async system we'd run the loop here:
    # background_tasks.add_task(harness._run_loop)
    
    return TraceResponse(trace_id=trace_id, status="started")

@router.get("/{trace_id}/status")
async def get_trace_status(trace_id: str):
    if trace_id not in active_traces:
        raise HTTPException(status_code=404, detail="Trace not found")
        
    harness = active_traces[trace_id]
    return harness.get_status()

@router.post("/{trace_id}/stop")
async def stop_trace(trace_id: str):
    if trace_id not in active_traces:
        raise HTTPException(status_code=404, detail="Trace not found")
        
    harness = active_traces[trace_id]
    harness.stop()
    return {"trace_id": trace_id, "status": "stopped"}
