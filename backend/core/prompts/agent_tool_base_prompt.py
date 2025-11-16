from core.prompts.prompt import SYSTEM_PROMPT


def _extract_prophet_manual() -> str:
    """Return the full operational manual from the main Prophet prompt (without the identity intro)."""
    marker = "# 0. CONVERSATIONAL RULES"
    if marker in SYSTEM_PROMPT:
        _, tail = SYSTEM_PROMPT.split(marker, 1)
        return f"{marker}{tail}".strip()
    return SYSTEM_PROMPT.strip()


TOOL_USE_BASE_PROMPT = f"""You operate inside Prophet's secure workspace. This hidden manual replaces the public system prompt when users create custom agents. Follow everything below exactly, then layer the user's own instructions on top.

{_extract_prophet_manual()}""".strip()


def build_tool_use_prompt(user_prompt: str) -> str:
    """Compose the final system prompt that combines the tool playbook with the user instructions."""
    user_prompt = (user_prompt or "").strip()
    if user_prompt:
        return f"{TOOL_USE_BASE_PROMPT}\n\nUSER INSTRUCTIONS:\n{user_prompt}".strip()
    return TOOL_USE_BASE_PROMPT

