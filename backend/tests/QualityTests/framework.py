import os
import sys
import json
import logging
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from langchain_core.messages import BaseMessage, SystemMessage, AIMessage, HumanMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI

# Ensure backend root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from src.config import OPENAI_API_KEY
from src.services.harness.graph.nodes.orchestrator import orchestrator_node
from src.services.harness.graph.nodes.chatbot import chatbot_node
from src.services.harness.graph.nodes.clarifier import clarifier_node
from src.services.harness.graph.nodes.worker import worker_node

logger = logging.getLogger("quality_tests.framework")

# Map node string identifiers to their actual node async functions
NODE_MAP = {
    "orchestrator": orchestrator_node,
    "chatbot": chatbot_node,
    "clarifier": clarifier_node,
    "worker": worker_node,
}

@dataclass
class QualityTestCase:
    """
    Represents a declarative test case for evaluating agent node quality.
    """
    name: str
    node: str  # "orchestrator", "chatbot", "clarifier", "worker"
    messages: List[BaseMessage]
    eval_criteria: str
    system_instruction: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    temperature: float = 0.0
    tools: List[Any] = field(default_factory=list)


class EvaluationResult(BaseModel):
    """
    Structured model output for the LLM judge's evaluation.
    """
    passed: bool = Field(
        description="True if the output satisfies the evaluation criteria, False otherwise."
    )
    reasoning: str = Field(
        description="Detailed explanation of the decision, referencing the input messages, node output, and evaluation criteria."
    )


EVALUATOR_SYSTEM_PROMPT = """You are an expert AI Quality Assurance Judge.
Your task is to evaluate the output of a specific agent node in a LangGraph chatbot against a set of inputs and predefined evaluation criteria.

You will be given:
1. The name of the node that was executed.
2. The input messages/state provided to the node.
3. The actual output (state update) produced by the node.
4. The evaluation criteria that the output must satisfy.

Important guidelines:
- The output is a **state update dictionary**, not a direct user-facing response. It may contain fields like "next" (routing decision), "routing_metadata" (JSON with reasoning), or "messages" (a list of AI messages).
- For routing nodes (e.g., orchestrator), examine ALL fields including "routing_metadata" and any nested JSON within it to find the node's actual reasoning and response content.
- Evaluate **semantically**: check whether the output's meaning, intent, and behavior satisfy the criteria. Do NOT require an exact string match.
- The evaluation criteria describes what the output should convey or accomplish. If the output semantically satisfies the criteria — even if wrapped in metadata, JSON, or additional context — it **passes**.
- Only fail the evaluation if the output clearly contradicts or does not address the criteria.
"""

EVALUATOR_USER_TEMPLATE = """Node Name: {node_name}

Input Messages:
{input_messages}

System Instruction: {system_instruction}

Node Output (State Update):
{output_data}

Evaluation Criteria (the output should semantically satisfy this):
{eval_criteria}
"""


def format_messages(messages: List[BaseMessage]) -> str:
    """Formats a list of BaseMessages into a readable string for the LLM judge."""
    formatted = []
    for msg in messages:
        role = msg.__class__.__name__.replace("Message", "")
        # Handle message content (string or list of dicts)
        content = msg.content
        if isinstance(content, list):
            content = json.dumps(content)
        formatted.append(f"[{role}]: {content}")
    return "\n".join(formatted)


def format_output(output: Dict[str, Any]) -> str:
    """Formats the node output dictionary into a readable JSON-like string for the judge."""
    formatted_output = {}
    for k, v in output.items():
        if k == "messages" and isinstance(v, list):
            formatted_output[k] = [
                {
                    "role": msg.__class__.__name__.replace("Message", ""),
                    "content": msg.content
                }
                for msg in v
            ]
        else:
            formatted_output[k] = v
    return json.dumps(formatted_output, indent=2)


async def run_quality_test(test_case: QualityTestCase) -> EvaluationResult:
    """
    Runs a QualityTestCase by:
    1. Executing the target node with a real ChatOpenAI instance.
    2. Passing the input and output to an LLM evaluator.
    3. Returning the structured EvaluationResult.
    """
    node_func = NODE_MAP.get(test_case.node)
    if not node_func:
        raise ValueError(
            f"Unknown node '{test_case.node}'. Must be one of: {list(NODE_MAP.keys())}"
        )

    # Use the real API key configured in backend
    api_key = OPENAI_API_KEY
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY is not configured in the environment or .env file.")

    # Determine model configuration based on API key
    model_name = "gpt-4o-mini"
    evaluator_model_name = "gpt-4o-mini"
    if api_key.startswith("nvapi-"):
        model_name = "meta/llama-3.1-70b-instruct"
        evaluator_model_name = "meta/llama-3.1-8b-instruct"

    # Initialize the LLM to be used by the node under test
    node_llm = ChatOpenAI(
        model=model_name,
        temperature=test_case.temperature,
        api_key=api_key,
    )

    # Prepare LangGraph state and config
    state = {
        "messages": test_case.messages,
        "system_instruction": test_case.system_instruction or "",
        "metadata": test_case.metadata or {},
    }
    config = RunnableConfig(
        configurable={
            "model": node_llm,
            "tools": test_case.tools,
        }
    )

    # 1. Execute the node
    logger.info(f"Running node '{test_case.node}' for quality test '{test_case.name}'...")
    try:
        output = await node_func(state, config)
        print(output)
    except Exception as e:
        logger.error(f"Node execution failed: {e}")
        return EvaluationResult(
            passed=False,
            reasoning=f"Node execution failed with error: {str(e)}"
        )

    # 2. Use LLM-as-a-judge to evaluate the full node output against the criteria
    evaluator_llm = ChatOpenAI(
        model=evaluator_model_name,
        temperature=0.0,
        api_key=api_key,
    ).with_structured_output(EvaluationResult)

    judge_prompt = EVALUATOR_USER_TEMPLATE.format(
        node_name=test_case.node,
        input_messages=format_messages(test_case.messages),
        system_instruction=test_case.system_instruction or "(none)",
        output_data=format_output(output) if isinstance(output, dict) else str(output),
        eval_criteria=test_case.eval_criteria,
    )

    logger.info(f"Invoking LLM judge for test '{test_case.name}'...")
    evaluation: EvaluationResult = await evaluator_llm.ainvoke([
        SystemMessage(content=EVALUATOR_SYSTEM_PROMPT),
        HumanMessage(content=judge_prompt),
    ])
    return evaluation
