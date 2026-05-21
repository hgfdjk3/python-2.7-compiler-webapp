import pytest
from langchain_core.messages import HumanMessage, AIMessage, ToolMessage
from langchain_core.runnables import RunnableConfig
from langchain_core.messages.tool import ToolCall

from src.services.harness.graph.builder import create_graph

@pytest.mark.asyncio
async def test_graph_direct_flow(fake_llm, dummy_tool):
    """
    Tests that a prompt requiring no tools goes: chatbot -> __end__
    """
    fake_llm.responses = ["I can help you directly."]
    graph = create_graph(tools=[dummy_tool])
    
    inputs = {
        "messages": [HumanMessage(content="Hello")],
        "system_instruction": "Test system prompt",
        "metadata": {}
    }
    
    config = RunnableConfig(
        configurable={
            "thread_id": "test_1",
            "model": fake_llm,
        }
    )
    
    output = await graph.ainvoke(inputs, config=config)
    
    # The last message should be the assistant's direct reply
    assert len(output["messages"]) == 2  # 1 input + 1 output
    assert output["messages"][-1].content == "I can help you directly."


@pytest.mark.asyncio
async def test_graph_tool_flow(fake_llm, dummy_tool):
    """
    Tests that a prompt requiring tool invocation goes:
    chatbot -> tools -> chatbot -> __end__
    """
    # 1. First model call returns a tool execution request
    tool_call = ToolCall(
        name="add_numbers",
        args={"a": 5, "b": 3},
        id="call_abc123"
    )
    msg_with_tool_call = AIMessage(
        content="",
        tool_calls=[tool_call]
    )
    
    # 2. Second model call answers using the tool result
    final_reply = "The answer is 8."
    
    fake_llm.responses = [msg_with_tool_call, final_reply]
    graph = create_graph(tools=[dummy_tool])
    
    inputs = {
        "messages": [HumanMessage(content="Add 5 and 3")],
        "system_instruction": "Test system prompt",
        "metadata": {}
    }
    
    config = RunnableConfig(
        configurable={
            "thread_id": "test_2",
            "model": fake_llm,
        }
    )
    
    output = await graph.ainvoke(inputs, config=config)
    
    # Output messages list should contain:
    # 0: HumanMessage ("Add 5 and 3")
    # 1: AIMessage (requesting tool call)
    # 2: ToolMessage (result from tool node: "8")
    # 3: AIMessage (final response: "The answer is 8.")
    messages = output["messages"]
    assert len(messages) == 4
    assert isinstance(messages[1], AIMessage)
    assert len(messages[1].tool_calls) == 1
    assert isinstance(messages[2], ToolMessage)
    assert messages[2].content == "8"  # result of dummy_tool(a=5, b=3) which is 5 + 3 = 8
    assert messages[3].content == "The answer is 8."
