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

Analyze the input, the node's output, and the evaluation criteria. Be strict but fair.
Determine if the output meets the criteria.
"""

EVALUATOR_USER_TEMPLATE = """Node Name: {node_name}

Input Messages:
{input_messages}

System Instruction: {system_instruction}

Output (State Update):
{output_data}

Evaluation Criteria:
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

    # 2. Set up the LLM Evaluator (using structured output)
    evaluator_llm = ChatOpenAI(
        model=evaluator_model_name,
        temperature=0.0,
        api_key=api_key,
    )
    structured_evaluator = evaluator_llm.with_structured_output(EvaluationResult)

    # Format data for evaluator prompt
    input_messages_str = format_messages(test_case.messages)
    output_data_str = format_output(output)

    user_prompt = EVALUATOR_USER_TEMPLATE.format(
        node_name=test_case.node,
        input_messages=input_messages_str,
        system_instruction=test_case.system_instruction or "None",
        output_data=output_data_str,
        eval_criteria=test_case.eval_criteria,
    )

    logger.info(f"Invoking LLM judge for quality test '{test_case.name}'...")
    
    # 3. Evaluate the output using the LLM judge
    try:
        evaluation: EvaluationResult = await structured_evaluator.ainvoke(
            [
                SystemMessage(content=EVALUATOR_SYSTEM_PROMPT),
                HumanMessage(content=user_prompt)
            ]
        )
        return evaluation
    except Exception as e:
        logger.error(f"LLM Judge evaluation failed: {e}")
        return EvaluationResult(
            passed=False,
            reasoning=f"LLM Judge evaluation failed with error: {str(e)}"
        )
