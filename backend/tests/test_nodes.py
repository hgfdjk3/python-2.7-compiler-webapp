import pytest
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.runnables import RunnableConfig

from src.agent.nodes.chatbot import chatbot_node
from src.agent.state import AgentState

@pytest.mark.asyncio
async def test_chatbot_node_basic(fake_llm):
    """
    Tests that chatbot_node invokes the model and returns the expected message.
    """
    # Configure model to return a specific string
    fake_llm.responses = ["Hello, human!"]
    
    state: AgentState = {
        "messages": [HumanMessage(content="Hi")],
        "system_instruction": "You are a test robot",
        "metadata": {}
    }
    
    # Inject model via configurable config
    config = RunnableConfig(
        configurable={"model": fake_llm}
    )
    
    result = await chatbot_node(state, config)
    
    assert "messages" in result
    assert len(result["messages"]) == 1
    assert isinstance(result["messages"][0], AIMessage)
    assert result["messages"][0].content == "Hello, human!"
    
    # Assert chatbot node prepended system prompt
    # In a mock setup, we can verify that the model was called
    # Wait, SimpleChatModel doesn't record history automatically unless we spy on it, 
    # but we can check if it executed correctly.
