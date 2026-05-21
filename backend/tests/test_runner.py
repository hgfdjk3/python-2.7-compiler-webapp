import pytest
from src.services.harness.runner import AgentRunner

@pytest.mark.asyncio
async def test_runner_context_manager_lifecycle(mock_mcp_manager):
    """
    Tests that AgentRunner correctly initializes, runs MCP connect,
    and disconnects within an async context manager lifecycle.
    """
    mcp_configs = {
        "test_server": {
            "command": "node",
            "args": ["dummy.js"]
        }
    }
    
    async with AgentRunner(mcp_configs=mcp_configs) as runner:
        assert runner.mcp_manager is not None
        # Assert mcp manager connect was called
        mock_mcp_manager.connect_all.assert_called_once()
        assert len(runner.tools) == 1
        assert runner.graph is not None

    # After exit block, assert disconnect was called
    mock_mcp_manager.disconnect_all.assert_called_once()


@pytest.mark.asyncio
async def test_runner_run(mock_mcp_manager, fake_llm):
    """
    Tests that runner.run executes the graph and returns correct outputs.
    """
    fake_llm.responses = ["Success response"]
    
    async with AgentRunner() as runner:
        # Override standard model with our mock fake LLM
        runner.model = fake_llm
        
        result = await runner.run(
            thread_id="thread_runner_1",
            message="Perform task",
            system_instruction="Keep it brief"
        )
        
        # Verify result contains the messages list
        assert "messages" in result
        assert len(result["messages"]) == 2  # Input Human + Output AI
        assert result["messages"][-1].content == "Success response"


@pytest.mark.asyncio
async def test_runner_stream_run(mock_mcp_manager, fake_llm):
    """
    Tests that runner.stream_run yields step-by-step update events.
    """
    fake_llm.responses = ["Stream response"]
    
    async with AgentRunner() as runner:
        runner.model = fake_llm
        
        events = []
        async for event in runner.stream_run(
            thread_id="thread_runner_2",
            message="Stream task"
        ):
            events.append(event)
            
        # Verify that we yielded events
        assert len(events) > 0
        # The chatbot node should have yielded an update event
        chatbot_events = [e for e in events if "chatbot" in e]
        assert len(chatbot_events) == 1
        assert "messages" in chatbot_events[0]["chatbot"]
        assert chatbot_events[0]["chatbot"]["messages"][0].content == "Stream response"
