import pytest
from langchain_core.messages import HumanMessage
from src.services.harness.runner import AgentRunner
from src.services.harness.graph.nodes.orchestrator import Route

@pytest.mark.asyncio
async def test_runner_context_manager_lifecycle(mock_mcp_manager):
    """
    Tests that the runner properly initializes and cleans up.
    """
    async with AgentRunner() as runner:
        assert runner.model is not None
        assert len(runner.tools) > 0
        assert runner.graph is not None

@pytest.mark.asyncio
async def test_runner_run(mock_mcp_manager, fake_llm):
    """
    Tests that runner.run executes the graph and returns correct outputs.
    """
    fake_route = Route(next="FINISH", reasoning="Success response")
    fake_llm.responses = [fake_route]

    async with AgentRunner() as runner:
        runner.model = fake_llm

        result = await runner.run(
            thread_id="thread_runner_1",
            message="Perform task",
            system_instruction="Keep it brief"
        )

        assert "messages" in result
        assert len(result["messages"]) == 2  # Input Human + Output AI (from FINISH route)
        assert result["messages"][-1].content == "Success response"
        
@pytest.mark.asyncio
async def test_runner_stream_run(mock_mcp_manager, fake_llm):
    """
    Tests that runner.stream_run yields step-by-step update events.
    """
    # Route to worker, then worker responds, then route to FINISH.
    route_to_worker = Route(next="worker", reasoning="Routing to worker")
    route_to_finish = Route(next="FINISH", reasoning="All done.")
    fake_llm.responses = [route_to_worker, "Worker response stream", route_to_finish]

    async with AgentRunner() as runner:
        runner.model = fake_llm

        events = []
        async for event in runner.stream_run(
            thread_id="thread_runner_2",
            message="Stream task"
        ):
            events.append(event)

        assert len(events) > 0
        
        # We expect at least the worker's chat model stream to yield events for the frontend
        chatbot_events = [e for e in events if "chatbot" in e]
        assert len(chatbot_events) >= 1
        assert "messages" in chatbot_events[0]["chatbot"]
        assert chatbot_events[0]["chatbot"]["messages"][0].content == "Worker response stream"
