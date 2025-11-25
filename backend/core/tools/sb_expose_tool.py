import asyncio
import time
from typing import Optional
from urllib.parse import urlparse

from core.agentpress.thread_manager import ThreadManager
from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.sandbox.tool_base import SandboxToolsBase
from core.utils.config import config
from core.utils.logger import logger

@tool_metadata(
    display_name="Port Exposure",
    description="Share your local development servers with preview URLs",
    icon="Share",
    color="bg-indigo-100 dark:bg-indigo-800/50",
    weight=120,
    visible=True
)
class SandboxExposeTool(SandboxToolsBase):
    """Tool for exposing and retrieving preview URLs for sandbox ports."""

    def __init__(self, project_id: str, thread_manager: ThreadManager):
        super().__init__(project_id, thread_manager)

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "expose_port",
            "description": "Expose a port from the agent's sandbox environment to the public internet and get its preview URL. This is essential for making services running in the sandbox accessible to users, such as web applications, APIs, or other network services. The exposed URL can be shared with users to allow them to interact with the sandbox environment.",
            "parameters": {
                "type": "object",
                "properties": {
                    "port": {
                        "type": "integer",
                        "description": "The port number to expose. Must be a valid port number between 1 and 65535.",
                        "minimum": 1,
                        "maximum": 65535
                    }
                },
                "required": ["port"]
            }
        }
    })
    async def expose_port(self, port: int) -> ToolResult:
        try:
            # Ensure sandbox is initialized
            await self._ensure_sandbox()
            
            # Convert port to integer if it's a string
            port = int(port)
            
            # Validate port number
            if not 1 <= port <= 65535:
                return self.fail_response(f"Invalid port number: {port}. Must be between 1 and 65535.")

            # Check if something is actually listening on the port (for custom ports)
            if port not in [6080, 8080, 8003]:  # Skip check for known sandbox ports
                try:
                    port_check = await self.sandbox.process.exec(f"netstat -tlnp | grep :{port}", timeout=5)
                    if port_check.exit_code != 0:
                        return self.fail_response(f"No service is currently listening on port {port}. Please start a service on this port first.")
                except Exception:
                    # If we can't check, proceed anyway - the user might be starting a service
                    pass

            # Get the preview link for the specified port
            preview_link = await self.sandbox.get_preview_link(port)
            
            # Extract the actual URL from the preview link object
            raw_url = preview_link.url if hasattr(preview_link, 'url') else str(preview_link)
            proxy_url = self._build_proxy_url(raw_url)
            final_url = proxy_url or raw_url

            if proxy_url:
                logger.info(
                    "Rewrote Daytona preview URL to Prophet proxy",
                    sandbox_id=self.sandbox_id,
                    port=port,
                    raw_url=raw_url,
                    proxy_url=proxy_url,
                )

            message_suffix = " (via Prophet proxy)" if proxy_url else ""
            response_payload = {
                "url": final_url,
                "port": port,
                "message": (
                    f"Successfully exposed port {port} to the public. "
                    f"Users can now access this service at: {final_url}{message_suffix}"
                ),
            }
            if proxy_url:
                response_payload["raw_url"] = raw_url

            return self.success_response(response_payload)
                
        except ValueError:
            return self.fail_response(f"Invalid port number: {port}. Must be a valid integer between 1 and 65535.")
        except Exception as e:
            return self.fail_response(f"Error exposing port {port}: {str(e)}")

    def _build_proxy_url(self, raw_url: str) -> Optional[str]:
        """
        Convert a Daytona preview URL into the Prophet proxy URL when possible.
        Falls back to the original URL if configuration is missing.
        """
        base = config.DAYTONA_PREVIEW_BASE
        if not base:
            return None

        try:
            sandbox_id = self.sandbox_id
        except RuntimeError:
            return None

        try:
            parsed = urlparse(raw_url)
        except ValueError:
            logger.warning("Failed to parse Daytona preview URL %s", raw_url)
            return None

        base = base.rstrip("/")
        path = parsed.path.lstrip("/")
        proxy_url = f"{base}/{sandbox_id}"
        if path:
            proxy_url = f"{proxy_url}/{path}"
        if parsed.query:
            proxy_url = f"{proxy_url}?{parsed.query}"

        return proxy_url
