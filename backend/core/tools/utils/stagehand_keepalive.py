import asyncio
from typing import Dict, Optional

from daytona_sdk import AsyncSandbox

from core.utils.logger import logger


class StagehandKeepaliveManager:
    """
    Coordinates lightweight keepalive pings to the Stagehand browser service
    that runs inside each sandbox. The first request against the Stagehand API
    after a cold boot can take several seconds because it needs to hydrate the
    Gemini-powered automation stack. By issuing a quick health-check curl after
    every tool run we keep the sandbox browser warm and dramatically reduce the
    latency of follow-up actions.
    """

    def __init__(self) -> None:
        self._tasks: Dict[str, asyncio.Task[None]] = {}
        self._lock = asyncio.Lock()

    async def schedule(
        self,
        sandbox: AsyncSandbox,
        sandbox_id: Optional[str],
        delay_seconds: float = 0.0,
    ) -> None:
        """
        Fire-and-forget keepalive ping for the provided sandbox. We ensure there is
        at most one in-flight ping per sandbox id to avoid hammering the local API.
        """

        if not sandbox_id:
            return

        async with self._lock:
            existing = self._tasks.get(sandbox_id)
            if existing and not existing.done():
                return

            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                # No running loop (e.g., during shutdown/tests); skip scheduling
                return

            self._tasks[sandbox_id] = loop.create_task(
                self._run_keepalive(sandbox, sandbox_id, delay_seconds)
            )

    async def _run_keepalive(
        self,
        sandbox: AsyncSandbox,
        sandbox_id: str,
        delay_seconds: float,
    ) -> None:
        try:
            if delay_seconds > 0:
                await asyncio.sleep(delay_seconds)

            command = (
                "curl -s -X GET 'http://localhost:8004/api' "
                "-H 'Content-Type: application/json' >/dev/null 2>&1 || true"
            )
            await sandbox.process.exec(command, timeout=15)
        except Exception as exc:
            logger.debug(
                "Stagehand keepalive failed",
                sandbox_id=sandbox_id,
                error=str(exc),
            )
        finally:
            async with self._lock:
                self._tasks.pop(sandbox_id, None)


stagehand_keepalive_manager = StagehandKeepaliveManager()


