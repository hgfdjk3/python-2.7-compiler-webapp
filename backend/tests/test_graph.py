import pytest
from langchain_core.messages import HumanMessage, AIMessage
from langchain_core.runnables import RunnableConfig

from src.services.harness.graph.builder import create_graph
from src.services.harness.graph.nodes.orchestrator import Route

@pytest.mark.asyncio
async def test_graph_unreachable(fake_llm, dummy_tool):
    """
    Tests that if the orchestrator deems the goal unreachable, it returns immediately.
    """
    fake_route = Route(next="FINISH", reasoning="Cannot do this.")
    fake_llm.responses = [fake_route]
    
    graph = create_graph(tools=[dummy_tool])
    
    inputs = {
        "messages": [HumanMessage(content="Hello")],
        "system_instruction": "Test system prompt",
        "metadata": {}
    }
    
    config = RunnableConfig(
        configurable={
            "thread_id": "test_unreachable",
            "model": fake_llm,
        }
    )
    
    output = await graph.ainvoke(inputs, config=config)
    
    # Expect only the input message (orchestrator no longer adds to messages)
    assert len(output["messages"]) == 1
    assert output["next"] == "FINISH"
    assert output["routing_metadata"] == '<metadata> {"next": "FINISH", "reasoning": "Cannot do this."} </metadata>'

@pytest.mark.asyncio
async def test_graph_success(fake_llm, dummy_tool):
    """
    Tests that a reachable goal routes to worker, and then finishes.
    """
    route_to_worker = Route(next="worker", reasoning="Doing task")
    worker_response = AIMessage(content="Task completed")
    route_to_finish = Route(next="FINISH", reasoning="All done.")
    
    fake_llm.responses = [route_to_worker, worker_response, route_to_finish]
    
    graph = create_graph(tools=[dummy_tool])
    
    inputs = {
        "messages": [HumanMessage(content="Do the task")],
        "system_instruction": "",
        "metadata": {}
    }
    
    config = RunnableConfig(
        configurable={
            "thread_id": "test_success",
            "model": fake_llm,
        }
    )
    
    output = await graph.ainvoke(inputs, config=config)
    
    # Final output should have next == FINISH
    assert output["next"] == "FINISH"
    # output["messages"] should have human -> worker response (no orchestrator metadata in messages)
    assert len(output["messages"]) == 2
    assert output["messages"][1].content == "Task completed"
    # routing_metadata holds the last orchestrator decision
    assert output["routing_metadata"] == '<metadata> {"next": "FINISH", "reasoning": "All done."} </metadata>'


