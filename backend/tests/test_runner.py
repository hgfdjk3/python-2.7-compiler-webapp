import pytest
from langchain_core.messages import HumanMessage
from src.services.harness.runner import AgentRunner
from src.services.harness.graph.nodes.orchestrator import Route

@pytest.mark.asyncio
async def test_runner_lifecycle_calls(mock_mcp_manager, fake_llm):
    """
    Tests that the runner properly connects and disconnects MCP clients per run.
    """
    fake_route = Route(next="FINISH", reasoning="Success response")
    fake_llm.responses = [fake_route]
    
    runner = AgentRunner(model=fake_llm)
    await runner.run(
        thread_id="thread_runner_lifecycle",
        message="test"
    )
    
    assert mock_mcp_manager.connect_all.call_count == 1
    assert mock_mcp_manager.disconnect_all.call_count == 1

@pytest.mark.asyncio
async def test_runner_run(mock_mcp_manager, fake_llm):
    """
    Tests that runner.run executes the graph and returns correct outputs.
    """
    fake_route = Route(next="FINISH", reasoning="Success response")
    fake_llm.responses = [fake_route]

    runner = AgentRunner(model=fake_llm)
    result = await runner.run(
        thread_id="thread_runner_1",
        message="Perform task",
        system_instruction="Keep it brief"
    )

    assert "messages" in result
    assert len(result["messages"]) == 1  # Only the input HumanMessage
    assert result["routing_metadata"] == '<metadata> {"next": "FINISH", "reasoning": "Success response"} </metadata>'
        
@pytest.mark.asyncio
async def test_runner_stream_run(mock_mcp_manager, fake_llm):
    """
    Tests that runner.stream_run yields step-by-step update events.
    """
    # Route to worker, then worker responds, then route to FINISH.
    route_to_worker = Route(next="worker", reasoning="Routing to worker")
    route_to_finish = Route(next="FINISH", reasoning="All done.")
    fake_llm.responses = [route_to_worker, "Worker response stream", route_to_finish]

    runner = AgentRunner(model=fake_llm)
    events = []
    async for event in runner.stream_run(
        thread_id="thread_runner_2",
        message="Stream task"
    ):
        events.append(event)

    assert len(events) > 0
    
    # Collect all chatbot events
    chatbot_events = [e for e in events if "chatbot" in e]
    assert len(chatbot_events) >= 2  # At least: orchestrator metadata + worker response
    
    # Extract all message contents
    contents = [e["chatbot"]["messages"][0].content for e in chatbot_events]
    
    # The worker's response should appear in the stream
    assert any("Worker response stream" in c for c in contents), f"Worker response not found in: {contents}"
    
    # The orchestrator metadata should also appear
    assert any("<metadata>" in c for c in contents), f"Metadata not found in: {contents}"


@pytest.mark.asyncio
async def test_runner_stream_clarifier(mock_mcp_manager, fake_llm):
    """
    Tests that runner.stream_run yields clarifier questions.
    """
    from src.services.harness.graph.nodes.clarifier import ClarificationResponse, ClarificationQuestion
    
    route_to_clarifier = Route(next="clarifier", reasoning="Need clarification")
    clarifier_response = ClarificationResponse(
        context="Context details",
        questions=[
            ClarificationQuestion(question="What port?", type="free_text")
        ]
    )
    fake_llm.responses = [route_to_clarifier, clarifier_response]

    runner = AgentRunner(model=fake_llm)
    events = []
    async for event in runner.stream_run(
        thread_id="thread_runner_3",
        message="Ambiguous request"
    ):
        events.append(event)

    assert len(events) > 0
    
    chatbot_events = [e for e in events if "chatbot" in e]
    assert len(chatbot_events) >= 2  # At least orchestrator + clarifier
    
    contents = [e["chatbot"]["messages"][0].content for e in chatbot_events]
    
    # Clarifier output should be in the stream
    assert any("<clarification>" in c for c in contents), f"Clarification tag not found in: {contents}"
    assert any("What port?" in c for c in contents), f"Question text not found in: {contents}"
