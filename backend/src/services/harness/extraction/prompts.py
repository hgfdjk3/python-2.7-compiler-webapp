from src.services.harness.extraction.schemas import ENTITY_TYPES_DESC, CONNECTION_TYPES_DESC

TRIAGE_SYSTEM = (
    "You decide whether new content contains facts, entities, architectural decisions, technical plans, "
    "or knowledge worth adding to a project knowledge library. "
    "Note: Proposed plans, technology stack choices, and architecture decisions ARE considered valuable knowledge. "
    "Answer quickly — do NOT extract anything yet, just decide yes or no."
)

ENTITY_EXTRACTION_SYSTEM = f"""You are a meticulous knowledge extraction agent. Your job is to analyze a chunk of new content and extract significant knowledge entities, proposing them for the database.

RULES:
1. Ignore mundane chat, UI tweaks, or generic conversation. ONLY extract highly interesting, novel concepts like architectural decisions, core logic, or project rules.
2. For each entity, you MUST provide a detailed, comprehensive description capturing the deep context, rationales, and the 'why'. Do NOT give 1-sentence descriptions.
3. If no significant knowledge is found, return empty lists.
4. Entity types: {ENTITY_TYPES_DESC}

MAPPING TO EXISTING ENTITIES:
1. Review the EXISTING LIBRARY ENTITIES provided below.
2. If an entity you are extracting already exists in the library (matches the concept or title closely), you MUST set `existing_id` to its ID.
3. If it's a completely new entity, leave `existing_id` null.

EXISTING LIBRARY ENTITIES:
{{existing_entities}}

Extract the facts and entities from the provided NEW CONTENT CHUNK and output them as structured data.
"""

CONNECTION_EXTRACTION_SYSTEM = f"""You are a knowledge architect. Your job is to analyze the extracted NEW ENTITIES, CURRENT ENTITIES, and the raw text to identify meaningful connections between them.

RULES:
1. Identify relationships only if they are clearly supported by the text or by obvious conceptual links.
2. Connection types: {CONNECTION_TYPES_DESC}
3. The `source_ref` and `target_ref` MUST be the EXACT ID of an existing entity (e.g. 'ent_abc123') OR the exact Title of a new entity.

CURRENT ENTITIES:
{{existing_entities}}

NEW ENTITIES:
{{new_entities}}

Provide the connections between these entities.
"""

SUMMARY_UPDATE_SYSTEM = """You are a project manager. Your job is to review the current project summary and the newly extracted knowledge, and determine if the summary should be updated.

RULES:
1. If the new content adds significant overall context to the project, provide a COMPLETE, REWRITTEN summary that merges the OLD summary with the NEW knowledge.
2. DO NOT output conversational text, patches, or commentary (e.g. 'No new entities...', 'However new content...'). Only output the final, polished summary paragraph(s).
3. If no update to the summary is needed, return null for summary_update.

CURRENT LIBRARY SUMMARY:
{current_summary}

NEWLY EXTRACTED ENTITIES:
{new_entities}
"""
