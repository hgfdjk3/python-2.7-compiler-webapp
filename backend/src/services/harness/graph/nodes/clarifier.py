"""
Clarifier Node
──────────────
When the orchestrator determines the user's request is ambiguous,
this node generates targeted clarifying questions — either multiple-choice
or free-text — and sends them to the frontend via a <clarification> tag.

The clarifier always routes to END so the user can respond.
The next user message re-enters the orchestrator with full context.
"""

from typing import Any, Dict, List, Optional, Literal
from pydantic import BaseModel, Field
import json
import logging
from langchain_core.messages import SystemMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI

from src.services.harness.graph.state import AgentState

logger = logging.getLogger("clarifier")


# ── Structured Output Schema ────────────────────────────────────────

class ClarificationQuestion(BaseModel):
    """A single clarifying question, optionally with multiple-choice options."""
    question: str = Field(
        description="The clarifying question to ask the user."
    )
    type: Literal["multiple_choice", "free_text"] = Field(
        description="Whether the question offers predefined choices or expects a free-text answer."
    )
    options: Optional[List[str]] = Field(
        default=None,
        description="Predefined answer choices. Required when type is 'multiple_choice', omit for 'free_text'."
    )


class ClarificationResponse(BaseModel):
    """Structured output from the clarifier LLM call."""
    context: str = Field(
        description="Brief summary of what you understood so far from the user's request."
    )
    questions: List[ClarificationQuestion] = Field(
        description="2-4 clarifying questions to ask the user. All questions must be in 'multiple_choice' format"
    )


CLARIFIER_SYSTEM_PROMPT = """You are a clarification assistant.
The supervisor has determined that the user's request is ambiguous or missing critical details.

Your job is to generate 2-4 specific, concise clarifying questions that would help
understand exactly what the user needs before work can begin.

Guidelines:
- Start with a very short summary of what you understood from the request.
- Use 'multiple_choice' questions when there are a small set of likely options (2-5 choices).
- Keep questions focused and actionable — avoid generic questions like "Can you elaborate?".
- Order questions from most important to least important.
- Do Not  use other as one of the options!
"""


# ── Node Function ────────────────────────────────────────────────────

async def clarifier_node(state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
    """
    Generates clarifying questions based on the ambiguous user request.
    Returns them as an AIMessage wrapped in a <clarification> tag.
    """
    # Retries on structured output failure before falling back.
    configurable = config.get("configurable", {})

    llm = configurable.get("model")
    if llm is None:
        model_name = configurable.get("model_name", "gpt-4o-mini")
        temperature = configurable.get("temperature", 0.3)
        llm = ChatOpenAI(model=model_name, temperature=temperature)

    structured_llm = llm.with_structured_output(ClarificationResponse, method="function_calling").with_retry(
        stop_after_attempt=10,
        wait_exponential_jitter=True
    )

    messages = [SystemMessage(content=CLARIFIER_SYSTEM_PROMPT)] + list(state.get("messages", []))

    # try:
    result: ClarificationResponse | None = await structured_llm.ainvoke(messages)
    # except Exception as e:
    #     logger.warning(f"Clarifier structured output failed: {e}")
    #     result = None

    if not result:
        return {"messages": [AIMessage(content="Please provide the model name for the clarification")]}
    clarification_json = json.dumps({
        "context": result.context,
        "questions": [q.model_dump() for q in result.questions]
    })
    print("clarification_json: ", clarification_json)
    return {
        "messages": [AIMessage(content=f"<clarification> {clarification_json} </clarification>")]
    }
