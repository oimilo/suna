from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.agentpress.thread_manager import ThreadManager
from core.sandbox.tool_base import SandboxToolsBase
from core.utils.logger import logger
from core.utils.s3_upload_utils import upload_base64_image
from typing import Any, Dict, List, Optional
import asyncio
import json
import base64
import io
import traceback
import sentry_sdk
from PIL import Image
from core.utils.config import config

@tool_metadata(
    display_name="Web Browser",
    description="Browse websites, click buttons, fill forms, and extract information from web pages",
    icon="Globe",
    color="bg-cyan-100 dark:bg-cyan-800/50",
    weight=60,
    visible=True
)
class BrowserTool(SandboxToolsBase):
    """
    Browser Tool for browser automation using local Stagehand API.
    
    This tool provides browser automation capabilities using a local Stagehand API server,
    replacing the sandbox browser tool functionality.
    
    Only 4 core functions that can handle everything:
    - browser_navigate_to: Navigate to URLs
    - browser_act: Perform any action (click, type, scroll, dropdowns etc.)
    - browser_extract_content: Extract content from pages
    - browser_screenshot: Take screenshots
    """


    def __init__(self, project_id: str, thread_id: str, thread_manager: ThreadManager):
        super().__init__(project_id, thread_manager)
        self.thread_id = thread_id
        self.stagehand_host = config.STAGEHAND_API_HOST or "localhost"
        try:
            self.stagehand_port = int(config.STAGEHAND_API_PORT or 8004)
        except (TypeError, ValueError):
            self.stagehand_port = 8004

    def _stagehand_base_url(self, port: Optional[int] = None) -> str:
        target_port = port or self.stagehand_port
        return f"http://{self.stagehand_host}:{target_port}"

    def _candidate_stagehand_ports(self) -> List[int]:
        candidates: List[int] = []
        for port in [self.stagehand_port, 8004, 8003]:
            if port is None:
                continue
            try:
                port_int = int(port)
            except (TypeError, ValueError):
                continue
            if port_int not in candidates:
                candidates.append(port_int)
        return candidates

    def _sentry_enabled(self) -> bool:
        try:
            return bool(sentry_sdk.Hub.current and sentry_sdk.Hub.current.client)
        except Exception:
            return False

    def _stagehand_context(self) -> Dict[str, Any]:
        return {
            "project_id": getattr(self, "project_id", None),
            "thread_id": self.thread_id,
            "stagehand_host": self.stagehand_host,
            "stagehand_port": self.stagehand_port,
        }

    def _record_stagehand_breadcrumb(
        self,
        message: str,
        data: Optional[Dict[str, Any]] = None,
        level: str = "info",
    ) -> None:
        if not self._sentry_enabled():
            return
        breadcrumb_data = self._stagehand_context()
        if data:
            breadcrumb_data.update(data)
        sentry_sdk.add_breadcrumb(
            category="stagehand",
            message=message,
            data=breadcrumb_data,
            level=level,
        )

    def _capture_stagehand_event(
        self,
        message: str,
        *,
        extra: Optional[Dict[str, Any]] = None,
        level: str = "error",
    ) -> None:
        if not self._sentry_enabled():
            return
        with sentry_sdk.push_scope() as scope:
            context = self._stagehand_context()
            for key, value in context.items():
                if key in {"project_id", "thread_id"} and value is not None:
                    scope.set_tag(key, value)
                else:
                    scope.set_extra(key, value)
            if extra:
                for key, value in extra.items():
                    scope.set_extra(key, value)
            sentry_sdk.capture_message(message, level=level)
    
    def _validate_base64_image(self, base64_string: str, max_size_mb: int = 10) -> tuple[bool, str]:
        """
        Comprehensive validation of base64 image data.
        
        Args:
            base64_string (str): The base64 encoded image data
            max_size_mb (int): Maximum allowed image size in megabytes
            
        Returns:
            tuple[bool, str]: (is_valid, error_message)
        """
        try:
            # Check if data exists and has reasonable length
            if not base64_string or len(base64_string) < 10:
                return False, "Base64 string is empty or too short"
            
            # Remove data URL prefix if present (data:image/jpeg;base64,...)
            if base64_string.startswith('data:'):
                try:
                    base64_string = base64_string.split(',', 1)[1]
                except (IndexError, ValueError):
                    return False, "Invalid data URL format"
            
            # Check if string contains only valid base64 characters
            # Base64 alphabet: A-Z, a-z, 0-9, +, /, = (padding)
            import re
            if not re.match(r'^[A-Za-z0-9+/]*={0,2}$', base64_string):
                return False, "Invalid base64 characters detected"
            
            # Check if base64 string length is valid (must be multiple of 4)
            if len(base64_string) % 4 != 0:
                return False, "Invalid base64 string length"
            
            # Attempt to decode base64
            try:
                image_data = base64.b64decode(base64_string, validate=True)
            except Exception as e:
                return False, f"Base64 decoding failed: {str(e)}"
            
            # Check decoded data size
            if len(image_data) == 0:
                return False, "Decoded image data is empty"
            
            # Check if decoded data size exceeds limit
            max_size_bytes = max_size_mb * 1024 * 1024
            if len(image_data) > max_size_bytes:
                return False, f"Image size ({len(image_data)} bytes) exceeds limit ({max_size_bytes} bytes)"
            
            # Validate that decoded data is actually a valid image using PIL
            try:
                image_stream = io.BytesIO(image_data)
                with Image.open(image_stream) as img:
                    # Verify the image by attempting to load it
                    img.verify()
                    
                    # Check if image format is supported
                    supported_formats = {'JPEG', 'PNG', 'GIF', 'BMP', 'WEBP', 'TIFF'}
                    if img.format not in supported_formats:
                        return False, f"Unsupported image format: {img.format}"
                    
                    return True, "Image validation successful"
                    
            except Exception as e:
                return False, f"Image validation failed: {str(e)}"
                
        except Exception as e:
            return False, f"Image validation error: {str(e)}"
    
    async def _debug_sandbox_services(self) -> str:
        """Debug method to check what services are running in the sandbox"""
        try:
            await self._ensure_sandbox()
            
            # Check what processes are running
            ps_cmd = "ps aux | grep -E '(python|uvicorn|stagehand|node)' | grep -v grep"
            response = await self.sandbox.process.exec(ps_cmd, timeout=10)
            
            processes = response.result if response.exit_code == 0 else "Failed to get process list"
            
            # Check what ports are listening
            ports_to_check = sorted(set(self._candidate_stagehand_ports()))
            if ports_to_check:
                port_pattern = "|".join(str(port) for port in ports_to_check)
                netstat_cmd = (
                    f"netstat -tlnp 2>/dev/null | grep -E ':({port_pattern})' "
                    f"|| ss -tlnp 2>/dev/null | grep -E ':({port_pattern})' "
                    "|| echo 'No netstat/ss available'"
                )
            else:
                netstat_cmd = "echo 'No candidate ports to inspect'"
            response2 = await self.sandbox.process.exec(netstat_cmd, timeout=10)
            
            ports = response2.result if response2.exit_code == 0 else "Failed to get port info"
            
            debug_info = f"""
            === Sandbox Services Debug Info ===
            Running processes:
            {processes}

            Listening ports:
            {ports}

            === End Debug Info ===
            """
            return debug_info
            
        except Exception as e:
            return f"Error getting debug info: {e}"

    async def _check_stagehand_api_health(self) -> bool:
        """Check if the Stagehand API server is running and accessible"""
        try:
            await self._ensure_sandbox()
            candidates = self._candidate_stagehand_ports()
            failure_debug: Optional[str] = None

            for port in candidates:
                success, failure_debug = await self._attempt_stagehand_health_for_port(port)
                if success:
                    if port != self.stagehand_port:
                        self.stagehand_port = port
                        self._record_stagehand_breadcrumb(
                            "stagehand.port.detected",
                            {"port": port},
                        )
                    return True

            if not failure_debug:
                failure_debug = await self._debug_sandbox_services()
            logger.error("Stagehand API server failed to start after trying candidate ports")
            self._record_stagehand_breadcrumb(
                "stagehand.health_check.failed_all_ports",
                {"ports": candidates},
                level="error",
            )
            self._capture_stagehand_event(
                "Stagehand API server failed health check retries on all ports",
                extra={
                    "ports": candidates,
                    "debug_info": failure_debug,
                },
            )
            return False
                
        except Exception as e:
            logger.error(f"Error checking Stagehand API health: {e}")
            self._capture_stagehand_event(
                "Stagehand API health check raised exception",
                extra={"error": str(e)},
            )
            sentry_sdk.capture_exception(e)
            return False

    async def _attempt_stagehand_health_for_port(self, port: int) -> tuple[bool, Optional[str]]:
        max_retries = 5
        retry_delays = [1, 2, 3, 5, 5]
        debug_info: Optional[str] = None

        self._record_stagehand_breadcrumb(
            "stagehand.health_check.start",
            {"max_retries": max_retries, "port": port},
        )
        
        for attempt in range(max_retries):
            stagehand_health_url = f"{self._stagehand_base_url(port)}/api"
            curl_cmd = f"curl -s -X GET '{stagehand_health_url}' -H 'Content-Type: application/json'"
            
            if attempt > 0:
                logger.info(
                    f"Retrying Stagehand API health check on port {port} "
                    f"(attempt {attempt + 1}/{max_retries})..."
                )

            self._record_stagehand_breadcrumb(
                "stagehand.health_check.attempt",
                {"attempt": attempt + 1, "health_url": stagehand_health_url, "port": port},
            )
            
            response = await self.sandbox.process.exec(curl_cmd, timeout=10)
            
            if response.exit_code == 0:
                try:
                    result = json.loads(response.result)
                    if result.get("status") == "healthy":
                        logger.info(
                            f"✅ Stagehand API server is running and healthy on port {port}"
                        )
                        self._record_stagehand_breadcrumb(
                            "stagehand.health_check.success",
                            {"attempt": attempt + 1, "port": port},
                        )
                        return True, None
                    else:
                        logger.info(
                            "Stagehand API server responded but browser not initialized. Initializing..."
                        )
                        self._record_stagehand_breadcrumb(
                            "stagehand.health_check.unhealthy_response",
                            {"response": result, "port": port},
                            level="warning",
                        )
                        initialized = await self._attempt_stagehand_init_for_port(port, result)
                        if initialized:
                            return True, None
                except json.JSONDecodeError:
                    logger.warning(
                        f"Stagehand API server responded but with invalid JSON: {response.result}"
                    )
                    self._record_stagehand_breadcrumb(
                        "stagehand.health_check.invalid_json",
                        {"response": response.result, "port": port},
                        level="warning",
                    )
            elif response.exit_code == 7:
                logger.debug(
                    f"Browser API server not ready yet on port {port} (connection refused)"
                )
                self._record_stagehand_breadcrumb(
                    "stagehand.health_check.connection_refused",
                    {"attempt": attempt + 1, "port": port},
                    level="debug",
                )
            else:
                logger.debug(
                    f"Health check failed with exit code {response.exit_code} on port {port}"
                )
                self._record_stagehand_breadcrumb(
                    "stagehand.health_check.exec_failure",
                    {
                        "attempt": attempt + 1,
                        "exit_code": response.exit_code,
                        "response": response.result,
                        "port": port,
                    },
                    level="warning",
                )
            
            if attempt < max_retries - 1:
                await asyncio.sleep(retry_delays[attempt])
        
        debug_info = await self._debug_sandbox_services()
        return False, debug_info

    async def _attempt_stagehand_init_for_port(self, port: int, health_response: Dict[str, Any]) -> bool:
        env_vars = {"GEMINI_API_KEY": config.GEMINI_API_KEY}

        init_endpoints = [
            f"{self._stagehand_base_url(port)}/api/init",
            f"{self._stagehand_base_url(port)}/init",
        ]

        initialization_attempted = False

        for init_url in init_endpoints:
            initialization_attempted = True
            self._record_stagehand_breadcrumb(
                "stagehand.init.attempt",
                {"endpoint": init_url, "port": port},
            )
            init_cmd = (
                f"curl -s -X POST \"{init_url}\" "
                "-H \"Content-Type: application/json\" "
                "-d \"{\\\"api_key\\\": \\\"$GEMINI_API_KEY\\\"}\""
            )
            response = await self.sandbox.process.exec(init_cmd, timeout=90, env=env_vars)
            if response.exit_code == 0:
                try:
                    init_result = json.loads(response.result)
                    if init_result.get("status") == "healthy":
                        logger.info(
                            f"✅ Stagehand API server initialized successfully via {init_url}"
                        )
                        self._record_stagehand_breadcrumb(
                            "stagehand.init.success",
                            {"endpoint": init_url, "port": port},
                        )
                        return True
                    else:
                        logger.warning(
                            f"Stagehand API initialization failed via {init_url}: {init_result}"
                        )
                        self._record_stagehand_breadcrumb(
                            "stagehand.init.failure",
                            {"endpoint": init_url, "response": init_result, "port": port},
                            level="warning",
                        )
                except json.JSONDecodeError:
                    logger.warning(
                        f"Init endpoint returned invalid JSON from {init_url}: {response.result}"
                    )
                    self._record_stagehand_breadcrumb(
                        "stagehand.init.invalid_json",
                        {"endpoint": init_url, "response": response.result, "port": port},
                        level="warning",
                    )
            elif response.exit_code in (22,):
                logger.warning(
                    f"Stagehand API initialization endpoint {init_url} returned HTTP error: {response.result}"
                )
                self._record_stagehand_breadcrumb(
                    "stagehand.init.http_error",
                    {"endpoint": init_url, "response": response.result, "port": port},
                    level="warning",
                )
                continue
            else:
                logger.warning(
                    f"Stagehand API initialization request failed for {init_url}: {response.result}"
                )
                self._record_stagehand_breadcrumb(
                    "stagehand.init.exec_failure",
                    {
                        "endpoint": init_url,
                        "response": response.result,
                        "exit_code": response.exit_code,
                        "port": port,
                    },
                    level="warning",
                )

        if not initialization_attempted:
            logger.warning("Stagehand API initialization skipped (no endpoints attempted)")
            self._record_stagehand_breadcrumb(
                "stagehand.init.skipped",
                level="warning",
                data={"health_response": health_response, "port": port},
            )
        return False

    async def _execute_stagehand_api(self, endpoint: str, params: dict = None, method: str = "POST") -> ToolResult:
        """Execute a Stagehand action through the sandbox API"""
        try:
            # Check if Gemini API key is configured
            if not config.GEMINI_API_KEY:
                return self.fail_response("Browser tool is not available. GEMINI_API_KEY is not configured.")
            
            # Ensure sandbox is initialized
            await self._ensure_sandbox()
            
            # Check if Stagehand API server is running
            stagehand_healthy = await self._check_stagehand_api_health()
            
            if not stagehand_healthy:
                error_msg = "Stagehand API server is not running. Please ensure the Stagehand API server is running. Error: {response}"
                
                # Add debug information
                debug_info = await self._debug_sandbox_services()
                error_msg += f"\n\nDebug information:\n{debug_info}"
                
                logger.error(error_msg)
                self._capture_stagehand_event(
                    "Stagehand API unavailable when executing tool",
                    extra={"debug_info": debug_info, "endpoint": endpoint},
                )
                return self.fail_response(error_msg)
            
            
            # Build the curl command to call the local Stagehand API
            url = f"{self._stagehand_base_url()}/api/{endpoint}"  # curl runs inside the sandbox container
            
            if method == "GET" and params:
                query_params = "&".join([f"{k}={v}" for k, v in params.items()])
                url = f"{url}?{query_params}"
                curl_cmd = f"curl -s -X {method} '{url}' -H 'Content-Type: application/json'"
            else:
                curl_cmd = f"curl -s -X {method} '{url}' -H 'Content-Type: application/json'"
                if params:
                    json_data = json.dumps(params)
                    curl_cmd += f" -d '{json_data}'"
            
            # logger.debug(f"\033[95mExecuting curl command:\033[0m\n{curl_cmd}")
            
            response = await self.sandbox.process.exec(curl_cmd, timeout=30)  # Execute curl inside sandbox
            
            if response.exit_code == 0:
                try:
                    result = json.loads(response.result)
                    logger.debug(f"Stagehand API result: {result}")

                    logger.debug("Stagehand API request completed successfully")

                    if "screenshot_base64" in result:
                        try:
                            screenshot_data = result["screenshot_base64"]
                            is_valid, validation_message = self._validate_base64_image(screenshot_data)
                            
                            if is_valid:
                                logger.debug(f"Screenshot validation passed: {validation_message}")
                                image_url = await upload_base64_image(screenshot_data, "browser-screenshots")
                                result["image_url"] = image_url
                                logger.debug(f"Uploaded screenshot to {image_url}")
                            else:
                                logger.warning(f"Screenshot validation failed: {validation_message}")
                                result["image_validation_error"] = validation_message
                                
                            del result["screenshot_base64"]
                            
                        except Exception as e:
                            logger.error(f"Failed to process screenshot: {e}")
                            result["image_upload_error"] = str(e)
                    
                    result["input"] = params
                    added_message = await self.thread_manager.add_message(
                        thread_id=self.thread_id,
                        type="browser_state",
                        content=result,
                        is_llm_message=False
                    )

                    # Prepare clean response for agent (filter out internal metadata)
                    # Only include data that's useful for the agent's decision making
                    clean_result = {
                        "success": result.get("success", True),
                        "message": result.get("message", "Stagehand action completed successfully")
                    }

                    # Include only data that actually comes from browserApi.ts
                    if result.get("url"):
                        clean_result["url"] = result["url"]
                    if result.get("title"):
                        clean_result["title"] = result["title"]
                    if result.get("action"):
                        clean_result["action"] = result["action"]
                    if result.get("image_url"):  # This is screenshot_base64 converted to image_url
                        clean_result["image_url"] = result["image_url"]
                    
                    # Include any error context that's useful for the agent
                    if result.get("image_validation_error"):
                        clean_result["screenshot_issue"] = f"Screenshot processing issue: {result['image_validation_error']}"
                    if result.get("image_upload_error"):
                        clean_result["screenshot_issue"] = f"Screenshot upload issue: {result['image_upload_error']}"
                    clean_result["message_id"] = added_message.get("message_id")

                    if clean_result.get("success"):
                        return self.success_response(clean_result)
                    else:
                        # Handle error responses with helpful context  
                        error_msg = result.get("error", result.get("message", "Unknown error"))
                        clean_result["message"] = error_msg
                        return self.fail_response(clean_result)

                except json.JSONDecodeError as e:
                    logger.error(f"Failed to parse response JSON: {response.result} {e}")
                    return self.fail_response(f"Failed to parse response JSON: {response.result} {e}")
            else:
                # Check if it's a connection error (exit code 7)
                if response.exit_code == 7:
                    error_msg = (
                        f"Stagehand API server is not available on port {self.stagehand_port}. "
                        f"Please ensure the Stagehand API server is running. Error: {response}"
                    )
                    logger.error(error_msg)
                    self._capture_stagehand_event(
                        "Stagehand API connection refused during request",
                        extra={"endpoint": endpoint, "response": response.result},
                    )
                    return self.fail_response(error_msg)
                else:
                    logger.error(f"Stagehand API request failed: {response}")
                    self._capture_stagehand_event(
                        "Stagehand API request failed",
                        extra={"endpoint": endpoint, "response": response.result, "exit_code": response.exit_code},
                    )
                    return self.fail_response(f"Stagehand API request failed: {response}")

        except Exception as e:
            logger.error(f"Error executing Stagehand action: {e}")
            logger.debug(traceback.format_exc())
            self._capture_stagehand_event(
                "Stagehand tool execution raised exception",
                extra={"error": str(e), "endpoint": endpoint},
            )
            sentry_sdk.capture_exception(e)
            return self.fail_response(f"Error executing Stagehand action: {e}")
        finally:
            await self._schedule_stagehand_keepalive()

    # Core Functions Only
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "browser_navigate_to",
            "description": "Navigate to a specific url",
            "parameters": {
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The url to navigate to"
                    }
                },
                "required": ["url"]
            }
        }
    })
    async def browser_navigate_to(self, url: str) -> ToolResult:
        """Navigate to a URL using Stagehand."""
        logger.debug(f"Browser navigating to: {url}")
        return await self._execute_stagehand_api("navigate", {"url": url})
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "browser_act",
            "description": "Perform any browser action using natural language description. CRITICAL: This tool automatically provides a screenshot with every action. For data entry actions (filling forms, entering text, selecting options), you MUST review the provided screenshot to verify that displayed values exactly match what was intended. Report mismatches immediately. CRITICAL FILE UPLOAD RULE: ANY action that involves clicking, interacting with, or locating upload buttons, file inputs, resume upload sections, or any element that might trigger a choose file dialog MUST include the filePath parameter with filePath. This includes actions like 'click upload button', 'locate resume section', 'find file input' etc. Always err on the side of caution - if there's any possibility the action might lead to a file dialog, include filePath. This prevents accidental file dialog triggers without proper file handling.",
            "parameters": {
                "type": "object",
                "properties": {
                    "action": {
                        "type": "string",
                        "description": "The action to perform. Examples: 'click the login button', 'fill in the email field with %email%', 'scroll down to see more content', 'select option 2 from the dropdown', 'press Enter', 'go back', 'wait 5 seconds', 'click at coordinates 100,200', 'select United States from the country dropdown'"
                    },
                    "variables": {
                        "type": "object",
                        "description": "Variables to use in the action. Variables in the action string are referenced using %variable_name%. These variables are NOT shared with LLM providers for security.",
                        "additionalProperties": {"type": "string"},
                        "default": {}
                    },
                    "iframes": {
                        "type": "boolean",
                        "description": "Whether to include iframe content in the action. Set to true if the target element is inside an iframe.",
                        "default": True
                    },
                    "filePath": {
                        "type": "string",
                        "description": "CRITICAL: REQUIRED for ANY action that might involve file uploads. This includes: clicking upload buttons, locating resume sections, finding file inputs, scrolling to upload areas, or any action that could potentially trigger a file dialog. Always include this parameter when dealing with upload-related elements to prevent accidental file dialog triggers. The tool will automatically handle the file upload after the action is performed.",
                    }
                },
                "required": ["action"]
            }
        }
    })
    async def browser_act(self, action: str, variables: dict = None, iframes: bool = False, filePath: dict = None) -> ToolResult:
        """Perform any browser action using Stagehand."""
        logger.debug(f"Browser acting: {action} (variables={'***' if variables else None}, iframes={iframes}), filePath={filePath}")
        params = {"action": action, "iframes": iframes, "variables": variables}
        if filePath:
            params["filePath"] = filePath
        return await self._execute_stagehand_api("act", params)
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "browser_extract_content",
            "description": "Extract structured content from the current page using Stagehand",
            "parameters": {
                "type": "object",
                "properties": {
                    "instruction": {
                        "type": "string",
                        "description": "What content to extract (e.g., 'extract all product prices', 'get the main heading', 'extract apartment listings with address and price')"
                    },
                    "iframes": {
                        "type": "boolean",
                        "description": "Whether to include iframe content in the extraction. Set to true if the target content is inside an iframe.",
                        "default": True
                    }
                },
                "required": ["instruction"]
            }
        }
    })
    async def browser_extract_content(self, instruction: str, iframes: bool = False) -> ToolResult:
        """Extract structured content from the current page using Stagehand."""
        logger.debug(f"Browser extracting: {instruction} (iframes={iframes})")
        params = {"instruction": instruction, "iframes": iframes}
        return await self._execute_stagehand_api("extract", params)
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "browser_screenshot",
            "description": "Take a screenshot of the current page",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name for the screenshot",
                        "default": "screenshot"
                    }
                }
            }
        }
    })
    async def browser_screenshot(self, name: str = "screenshot") -> ToolResult:
        """Take a screenshot using Stagehand."""
        logger.debug(f"Browser taking screenshot: {name}")
        return await self._execute_stagehand_api("screenshot", {"name": name})
