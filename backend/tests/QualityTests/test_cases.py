from langchain_core.messages import HumanMessage, AIMessage
from tests.QualityTests.framework import QualityTestCase

# Define all quality test cases in a centralized list.
# To add a new test, simply append a new QualityTestCase to this list.
QUALITY_TEST_CASES = [
    # ── Orchestrator Node Quality Tests ──────────────────────────────────
    QualityTestCase(
        name="orchestrator_routes_to_clarifier_on_ambiguous_request",
        node="orchestrator",
        messages=[
            HumanMessage(content="Deploy the server script for me.")
        ],
        eval_criteria=(
            "The orchestrator should route to 'clarifier' because the request is highly ambiguous: "
            "it does not specify what server script, where to deploy it, or what environment is being used."
        )
    ),
    # QualityTestCase(
    #     name="orchestrator_routes_to_worker_on_clear_task",
    #     node="orchestrator",
    #     messages=[
    #         HumanMessage(content="Please run the calculator tool to add 15 and 27.")
    #     ],
    #     eval_criteria=(
    #         "The orchestrator should route to 'worker' because the user's request is specific, "
    #         "identifies a clear task, and requests tool/task execution."
    #     )
    # ),
    # QualityTestCase(
    #     name="orchestrator_routes_to_finish_on_simple_greeting",
    #     node="orchestrator",
    #     messages=[
    #         HumanMessage(content="Hi there! Just wanted to say hello.")
    #     ],
    #     eval_criteria=(
    #         "The orchestrator should route to 'FINISH' because this is a simple conversational greeting "
    #         "that does not require executing tools or performing tasks."
    #     )
    # ),

    # # ── Clarifier Node Quality Tests ──────────────────────────────────────
    # QualityTestCase(
    #     name="clarifier_asks_about_ambiguous_deployment",
    #     node="clarifier",
    #     messages=[
    #         HumanMessage(content="Deploy the server script for me.")
    #     ],
    #     eval_criteria=(
    #         "The clarifier output must contain a <clarification> tag enclosing a JSON structure. "
    #         "The JSON must contain specific, helpful clarifying questions regarding the deployment "
    #         "(e.g., asking what script, which hosting provider/server, or deployment method)."
    #     )
    # ),

    # # ── Chatbot Node Quality Tests ────────────────────────────────────────
    # QualityTestCase(
    #     name="chatbot_answers_simple_factual_question",
    #     node="chatbot",
    #     messages=[
    #         HumanMessage(content="What is the capital of France?")
    #     ],
    #     eval_criteria=(
    #         "The chatbot must correctly state that the capital of France is Paris. "
    #         "The response should be polite, accurate, and concise."
    #     )
    # ),

    # # ── Worker Node Quality Tests ─────────────────────────────────────────
    # QualityTestCase(
    #     name="worker_performs_concise_response",
    #     node="worker",
    #     messages=[
    #         HumanMessage(content="Can you summarize the purpose of Python virtual environments in one sentence?")
    #     ],
    #     eval_criteria=(
    #         "The worker node's message content must be a concise, one-sentence summary of Python "
    #         "virtual environments (e.g., mentioning isolating dependencies or packages)."
    #     )
    # )
]
