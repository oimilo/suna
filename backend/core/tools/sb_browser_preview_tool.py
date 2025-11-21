from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata

from .browser_tool import BrowserTool


@tool_metadata(
    display_name="Browser Preview",
    description="Capture a lightweight snapshot (URL, title, screenshot) of the live Stagehand browser session without mutating the page state.",
    icon="Camera",
    color="bg-sky-100 dark:bg-sky-800/50",
    visible=True,
    weight=55,
)
class SandboxBrowserPreviewTool(BrowserTool):
    """
    Thin wrapper over the Stagehand browser automation stack that exposes a read-only
    preview endpoint. It is useful when the agent needs to show users what the sandbox
    browser currently looks like (e.g., before describing the next actions) without
    performing a new navigation or click.
    """

    def __init__(self, project_id: str, thread_id: str, thread_manager):
        super().__init__(project_id, thread_id, thread_manager)

    @openapi_schema(
        {
            "type": "function",
            "function": {
                "name": "browser_preview_state",
                "description": "Return the current browser URL, tab title, and latest screenshot from the Stagehand session without performing any actions.",
                "parameters": {
                    "type": "object",
                    "properties": {},
                },
            },
        }
    )
    async def browser_preview_state(self) -> ToolResult:
        return await self._execute_stagehand_api(
            "state",
            params=None,
            method="GET",
            message_type="browser_preview",
        )


