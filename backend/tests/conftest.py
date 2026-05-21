import os
import sys
import pytest
from typing import Any, List, Optional
from langchain_core.language_models.chat_models import SimpleChatModel
from langchain_core.messages import BaseMessage, AIMessage
from langchain_core.outputs import ChatGeneration, ChatResult
from langchain_core.tools import tool, BaseTool
from langchain_core.runnables import RunnableLambda

# Add src directory to path so imports work correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

class FakeChatModel(SimpleChatModel):
    """
    Highly modular fake LLM for testing. Overrides _generate to support
    returning text replies or complex messages (e.g. with tool calls).
    """
    responses: List[Any] = []
    index: int = 0
    bound_tools: List[Any] = []

    def _call(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> str:
        # Fallback if _generate is not called, but _generate is preferred
        return "Fake message"

    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Optional[Any] = None,
        **kwargs: Any,
    ) -> ChatResult:
        if not self.responses:
            msg = AIMessage(content="Default fake response")
        else:
            res = self.responses[self.index]
            self.index = (self.index + 1) % len(self.responses)
            if isinstance(res, str):
                msg = AIMessage(content=res)
            else:
                msg = res
                
        generation = ChatGeneration(message=msg)
        return ChatResult(generations=[generation])

    def bind_tools(self, tools: List[Any], **kwargs: Any) -> Any:
        self.bound_tools = tools
        return self

    def with_structured_output(self, schema: Any, **kwargs: Any) -> Any:
        async def fake_invoke(prompt):
            res = self.responses[self.index]
            self.index = (self.index + 1) % len(self.responses)
            return res
        return RunnableLambda(fake_invoke)

    @property
    def _llm_type(self) -> str:
        return "fake-chat-model"


@pytest.fixture
def fake_llm():
    """
    Provides a FakeChatModel that can be pre-configured with replies.
    """
    return FakeChatModel()


@pytest.fixture
def dummy_tool() -> BaseTool:
    """
    A simple dummy tool to test tool calling flow.
    """
    @tool
    def add_numbers(a: int, b: int) -> int:
        """Adds two numbers."""
        return a + b
    return add_numbers


@pytest.fixture
def mock_mcp_manager(mocker, dummy_tool):
    """
    Mocks MCPClientManager to prevent actual network/subprocess spawning
    during runner tests, returning a mock set of tools instead.
    """
    mock_mgr = mocker.patch("src.services.harness.runner.MCPClientManager", autospec=True)
    instance = mock_mgr.return_value
    
    # Configure mock responses
    instance.connect_all = mocker.AsyncMock(return_value=[dummy_tool])
    instance.disconnect_all = mocker.AsyncMock()
    instance.tools = [dummy_tool]
    
    return instance
