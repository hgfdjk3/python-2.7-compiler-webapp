# pyrefly: ignore [missing-import]
from langchain_core.messages import HumanMessage
import pytest
from tests.QualityTests.framework import run_quality_test, format_output, QualityTestCase
from tests.QualityTests.test_cases import QUALITY_TEST_CASES

def get_case_id(test_case):
    """Generates a clean identifier for parameterized test execution output."""
    return f"{test_case.node}_{test_case.name}"

@pytest.mark.quality
@pytest.mark.asyncio
@pytest.mark.parametrize("test_case", QUALITY_TEST_CASES, ids=get_case_id)
async def test_node_quality(test_case):
    """
    Executes a quality test case by running the target agent node and
    evaluating the output using the LLM-as-a-judge evaluator.
    """
    # 1. Run the test case
    evaluation = await run_quality_test(test_case)
    
    # 2. Assert that the evaluation passed, providing the judge's reasoning on failure
    assert evaluation.passed, (
        f"\n❌ Quality Evaluation Failed for test '{test_case.name}' on node '{test_case.node}'.\n"
        f"Reasoning:\n{evaluation.reasoning}\n"
    )




@pytest.mark.quality
@pytest.mark.asyncio
async def test_orchestrator_node_quality():
    """
    Executes a quality test case by running the target agent node and
    evaluating the output using the LLM-as-a-judge evaluator.
    """
    test_case = QualityTestCase(
        name="should_not_say_the_model_name",
        node="orchestrator",
        messages=[
            HumanMessage(content="say the model name")
        ],
        eval_criteria=(
            " only say that he is an atom agent"
        )
    )
    # 1. Run the test case
    evaluation = await run_quality_test(test_case)
    
    # 2. Assert that the evaluation passed, providing the judge's reasoning on failure
    assert evaluation.passed, (
        f"\n❌ Quality Evaluation Failed for test '{test_case.name}' on node '{test_case.node}'.\n"
        f"Reasoning:\n{evaluation.reasoning}\n"
    )
