"""
Automation Builder Node
───────────────────────
Generates a multi-stage automation workflow from a natural-language description.

Uses LLM structured output to produce nodes + edges matching the frontend
AutomationBuilder JSON format, with AI-driven tool selection per stage
from the available MCP tools.

Returns an AIMessage wrapped in an <automation> tag.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
import json
import logging
from langchain_core.messages import SystemMessage, AIMessage
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI

from src.services.harness.graph.state import AgentState

logger = logging.getLogger("automation_builder")


# ── Structured Output Schema ────────────────────────────────────────

class AutomationStage(BaseModel):
    """A single stage in an automation workflow."""
    title: str = Field(
        description="Short, action-oriented title for this stage (e.g. 'Trigger Event', 'Extract Data')."
    )
    description: str = Field(
        description="Concise description of what this stage does in the workflow."
    )
    tools: List[str] = Field(
        description="List of tool names/IDs this stage uses. Select from the available tools list."
    )


class AutomationResponse(BaseModel):
    """The structured response from the automation builder LLM."""
    is_vague: bool = Field(
        description="Set to True ONLY if the user's message is completely unrelated to creating an automation (e.g. general greeting like 'hello', 'who are you', 'tell me a joke'). Set to False if the request asks to build, create, or design any automation/workflow, even if it lacks details."
    )
    name: Optional[str] = Field(
        default=None,
        description="A short descriptive name for the automation workflow. Leave None if is_vague is True."
    )
    stages: Optional[List[AutomationStage]] = Field(
        default=None,
        description="Ordered list of 3-5 stages that make up the automation. Leave None/empty if is_vague is True."
    )


AUTOMATION_BUILDER_SYSTEM_PROMPT = """You are an automation workflow designer.
Given a user's description, design a multi-stage automation workflow.

Available tools from connected services:
{tools_info}

Guidelines:
- CRITICAL: Only set is_vague to True if the request is completely unrelated to building an automation (e.g. general greeting like 'hello', 'who are you', 'tell me a joke').
- If the request asks to build, design, or create any kind of automation, set is_vague to False.
- You can be creative and fill missing parts with your own ideas, using the available tools list.
- Design the workflow with 3-5 sequential stages.
- Each stage should have a clear, action-oriented title.
- Write concise descriptions explaining what each stage does.
- Select 1-4 appropriate tools from the available tools list for each stage.
- Use the exact tool names/IDs from the list above.
- Stages should flow logically: trigger/input → processing → output/action.
- Think about error handling, data transformation, and notification stages.
- If no tools are available, tell the user to connect tools to the agent.
"""


# ── Helper: Convert workflow to frontend JSON ────────────────────────

def workflow_to_frontend_json(name: str, stages: List[AutomationStage]) -> Dict[str, Any]:
    """
    Converts an AutomationResponse's stages into the exact JSON structure
    the frontend AutomationBuilder component expects (nodes + edges).
    """
    nodes = []
    edges = []

    for i, stage in enumerate(stages):
        node_id = str(i + 1)
        nodes.append({
            "id": node_id,
            "type": "automation",
            "position": {"x": 0, "y": 0},
            "data": {
                "title": stage.title,
                "description": stage.description,
                "tools": stage.tools,
            }
        })

        if i > 0:
            prev_id = str(i)
            edges.append({
                "id": f"e{prev_id}-{node_id}",
                "source": prev_id,
                "target": node_id,
                "type": "automation",
                "animated": True,
            })

    return {
        "name": name,
        "nodes": nodes,
        "edges": edges,
    }


# ── Node Function ────────────────────────────────────────────────────

async def automation_builder_node(state: AgentState, config: RunnableConfig) -> Dict[str, Any]:
    """
    Generates an automation workflow from the user's description.
    Returns the result as an AIMessage wrapped in an <automation> tag, or routes to clarifier.
    """
    configurable = config.get("configurable", {})

    llm = configurable.get("model")
    if llm is None:
        model_name = configurable.get("model_name", "gpt-4o-mini")
        temperature = configurable.get("temperature", 0.4)
        llm = ChatOpenAI(model=model_name, temperature=temperature)

    # Gather available tools for the prompt
    tools = configurable.get("tools", [])
    if tools:
        tools_list = []
        for t in tools:
            name = getattr(t, "name", str(t))
            desc = getattr(t, "description", "")
            tools_list.append(f"- {name}: {desc}")
        tools_info = "\n".join(tools_list)
    else:
        tools_info = "No external tools are currently connected. Use descriptive placeholder tool names."

    structured_llm = llm.with_structured_output(
        AutomationResponse, method="function_calling"
    ).with_retry(
        stop_after_attempt=3,
        wait_exponential_jitter=True,
    )

    system_prompt = AUTOMATION_BUILDER_SYSTEM_PROMPT.format(tools_info=tools_info)
    messages = [SystemMessage(content=system_prompt)] + list(state.get("messages", []))

    try:
        result: AutomationResponse | None = await structured_llm.ainvoke(messages)
    except Exception as e:
        logger.error(f"Automation builder structured output failed: {e}")
        result = None

    if not result or result.is_vague or not result.stages:
        logger.info("Automation request is vague or generation failed. Routing to clarifier node.")
        return {
            "next": "clarifier"
        }

    automation_json = workflow_to_frontend_json(result.name or "Automation Workflow", result.stages)
    logger.info(f"Generated automation '{result.name or 'Automation Workflow'}' with {len(result.stages)} stages")

    return {
        "messages": [AIMessage(content=f"<automation> {json.dumps(automation_json)} </automation>")],
        "next": "end"
    }
