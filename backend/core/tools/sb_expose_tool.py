from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.sandbox.tool_base import SandboxToolsBase
from core.agentpress.thread_manager import ThreadManager
import asyncio
import os
from urllib.parse import urljoin, urlparse, urlunparse

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

    _DEFAULT_PROXY_BASE_URL = "https://www.prophet.build"

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

            # Get the preview link for the specified port (ensures the preview is available at provider)
            preview_link = await self.sandbox.get_preview_link(port)
            original_url = preview_link.url if hasattr(preview_link, 'url') else str(preview_link)

            # Build unique per-project proxy URL (backup logic)
            proxy_url = self._build_proxy_url(self._get_proxy_base_url(), self.project_id, port)

            return self.success_response({
                "url": original_url,
                "original_url": original_url,
                "proxy_url": proxy_url,
                "port": port,
                "message": (
                    f"Successfully exposed port {port}. "
                    f"Project proxy: {proxy_url}  |  Direct preview: {original_url}"
                )
            })
                
        except ValueError:
            return self.fail_response(f"Invalid port number: {port}. Must be a valid integer between 1 and 65535.")
        except Exception as e:
            return self.fail_response(f"Error exposing port {port}: {str(e)}")

    @classmethod
    def _build_proxy_url(cls, base_url: str, project_id: str, port: int) -> str:
        """Compose an absolute proxy URL for the exposed port."""
        normalized_base = (base_url or "").strip() or cls._DEFAULT_PROXY_BASE_URL
        # Ensure trailing slash so urljoin appends relative segments correctly
        normalized_base = normalized_base.rstrip('/') + '/'
        relative_path = f"api/preview/{project_id}/p/{port}/"
        return urljoin(normalized_base, relative_path)

    @classmethod
    def _normalize_base_candidate(cls, raw_candidate: str | None) -> str | None:
        if not raw_candidate:
            return None

        candidate = raw_candidate.strip()
        if not candidate:
            return None

        if candidate.startswith("//"):
            candidate = f"https:{candidate}"
        elif "//" not in candidate:
            candidate = f"https://{candidate.lstrip('/')}"

        parsed = urlparse(candidate)
        if not parsed.netloc:
            return None

        scheme = parsed.scheme or "https"
        netloc = parsed.netloc

        path = (parsed.path or "").rstrip('/')
        if path.endswith('/api'):
            path = path[:-4]
        path = path.rstrip('/')

        if path and not path.startswith('/'):
            path = f"/{path}"

        base_url = urlunparse((scheme, netloc, path, '', '', '')).rstrip('/')
        return base_url or None

    def _get_proxy_base_url(self) -> str:
        candidates = [
            os.getenv("NEXT_PUBLIC_BACKEND_URL"),
            os.getenv("BACKEND_URL"),
            os.getenv("APP_BACKEND_URL"),
            os.getenv("NEXT_PUBLIC_APP_URL"),
            os.getenv("APP_URL"),
        ]

        for raw_candidate in candidates:
            normalized = self._normalize_base_candidate(raw_candidate)
            if normalized:
                return normalized

        return self._DEFAULT_PROXY_BASE_URL
