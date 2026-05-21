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
    QualityTestCase(
        name="clearifier_asks_5_questions",
        node="clarifier",
        messages=[
            HumanMessage(content="ask me 5 questions"),
        ],
        eval_criteria=(
            "The clarifier output should contain exactly 5 <clarification> tag enclosing a JSON structure. "
            "The clarifier output should contain the questions."
        )
    ),
    QualityTestCase(
        name="clearifier_should_not_ask_type_of_question",
        node="clarifier",
        messages=[
            HumanMessage(content="Tell me something interesting about AI.")
        ],
        eval_criteria=(
            "The clarifier output should contain any <clarification> tags."
            "The JSON must contain multiple choice questions."
        )
    ),

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
