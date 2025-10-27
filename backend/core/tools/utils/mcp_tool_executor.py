import json
import asyncio
import uuid
from typing import Dict, Any, Optional, Tuple

import structlog
from core.agentpress.tool import ToolResult
from mcp import ClientSession, StdioServerParameters
from mcp.client.sse import sse_client
from mcp.client.stdio import stdio_client
from mcp.client.streamable_http import streamablehttp_client
from core.mcp_module import mcp_service, ToolExecutionResult
from core.utils.logger import logger
from core.composio_integration.composio_service import get_integration_service
from core.services.supabase import DBConnection
from core.utils.config import config
from core.utils.s3_upload_utils import ensure_bucket_exists


class MCPToolExecutor:
    _COMPOSIO_SESSION_HEADER = "x-composio-session-id"
    _LARGE_CHAR_THRESHOLD = 4000
    _LARGE_ITEM_THRESHOLD = 20
    _MAX_PREVIEW_CHARS = 1200
    _MAX_PREVIEW_ITEMS = 10
    _DEFAULT_TOOL_BUCKET = "tool-outputs"

    def __init__(self, custom_tools: Dict[str, Dict[str, Any]], tool_wrapper=None):
        self.mcp_manager = mcp_service
        self.custom_tools = custom_tools
        self.tool_wrapper = tool_wrapper
    
    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> ToolResult:
        logger.debug(f"Executing MCP tool {tool_name} with arguments {arguments}")

        try:
            if tool_name in self.custom_tools:
                tool_info = self.custom_tools[tool_name]
                alias_for = tool_info.get('alias_for')
                if alias_for and alias_for in self.custom_tools:
                    logger.debug(f"Resolving MCP tool alias '{tool_name}' to '{alias_for}'")
                    tool_name = alias_for
                return await self._execute_custom_tool(tool_name, arguments)
            else:
                return await self._execute_standard_tool(tool_name, arguments)
        except Exception as e:
            logger.error(f"Error executing MCP tool {tool_name}: {str(e)}")
            return self._create_error_result(f"Error executing tool: {str(e)}")
    
    async def _execute_standard_tool(self, tool_name: str, arguments: Dict[str, Any]) -> ToolResult:
        result = await self.mcp_manager.execute_tool(tool_name, arguments)
        
        if isinstance(result, ToolExecutionResult):
            if not result.success:
                error_message = result.error
                if not error_message:
                    if isinstance(result.result, str) and result.result:
                        error_message = result.result
                    else:
                        error_message = "Tool execution failed"
                return self._create_error_result(error_message)
            
            payload = result.result if result.result is not None else ""
            processed_payload = await self._post_process_payload(tool_name, payload)
            return self._create_success_result(processed_payload)
        
        if isinstance(result, ToolResult):
            return result
        
        if isinstance(result, dict):
            if result.get('isError', False):
                return self._create_error_result(result.get('content', 'Tool execution failed'))
            else:
                processed_payload = await self._post_process_payload(tool_name, result.get('content', result))
                return self._create_success_result(processed_payload)
        else:
            processed_payload = await self._post_process_payload(tool_name, result)
            return self._create_success_result(processed_payload)
    
    async def _execute_custom_tool(self, tool_name: str, arguments: Dict[str, Any]) -> ToolResult:
        tool_info = self.custom_tools[tool_name]
        custom_type = tool_info['custom_type']
        
        if custom_type == 'composio':
            custom_config = tool_info['custom_config']
            profile_id = custom_config.get('profile_id')

            if not profile_id:
                return self._create_error_result("Missing profile_id for Composio tool")

            try:
                from core.composio_integration.composio_profile_service import ComposioProfileService
                from core.services.supabase import DBConnection

                db = DBConnection()
                profile_service = ComposioProfileService(db)
                mcp_url = await profile_service.get_mcp_url_for_runtime(profile_id)

                thread_id = self._get_thread_id()
                session_info = await self._ensure_composio_session(thread_id)

                modified_tool_info = self._build_composio_tool_info(
                    tool_info,
                    mcp_url,
                    session_info,
                )

                result = await self._execute_http_tool(tool_name, arguments, modified_tool_info)

                if self._should_retry_composio_error(result):
                    refreshed_session = await self._ensure_composio_session(thread_id, force_refresh=True)
                    if refreshed_session:
                        retry_tool_info = self._build_composio_tool_info(
                            tool_info,
                            mcp_url,
                            refreshed_session,
                        )
                        result = await self._execute_http_tool(tool_name, arguments, retry_tool_info)

                return result

            except Exception as e:
                logger.error(f"Failed to resolve Composio profile {profile_id}: {str(e)}")
                return self._create_error_result(f"Failed to resolve Composio profile: {str(e)}")

        elif custom_type == 'sse':
            return await self._execute_sse_tool(tool_name, arguments, tool_info)
        elif custom_type == 'http':
            return await self._execute_http_tool(tool_name, arguments, tool_info)
        elif custom_type == 'json':
            return await self._execute_json_tool(tool_name, arguments, tool_info)
        else:
            return self._create_error_result(f"Unsupported custom MCP type: {custom_type}")
    
    async def _execute_sse_tool(self, tool_name: str, arguments: Dict[str, Any], tool_info: Dict[str, Any]) -> ToolResult:
        custom_config = tool_info['custom_config']
        original_tool_name = tool_info['original_name']
        
        url = custom_config['url']
        headers = custom_config.get('headers', {})
        
        async with asyncio.timeout(30):
            try:
                async with sse_client(url, headers=headers) as (read, write):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        result = await session.call_tool(original_tool_name, arguments)
                        payload = self._extract_content(result)
                        processed_payload = await self._post_process_payload(tool_name, payload)
                        return self._create_success_result(processed_payload)
                        
            except TypeError as e:
                if "unexpected keyword argument" in str(e):
                    async with sse_client(url) as (read, write):
                        async with ClientSession(read, write) as session:
                            await session.initialize()
                            result = await session.call_tool(original_tool_name, arguments)
                            payload = self._extract_content(result)
                            processed_payload = await self._post_process_payload(tool_name, payload)
                            return self._create_success_result(processed_payload)
                else:
                    raise
    
    async def _execute_http_tool(self, tool_name: str, arguments: Dict[str, Any], tool_info: Dict[str, Any]) -> ToolResult:
        custom_config = tool_info['custom_config']
        original_tool_name = tool_info['original_name']
        
        url = custom_config['url']
        headers = custom_config.get('headers')

        try:
            async with asyncio.timeout(30):
                async with streamablehttp_client(url, headers=headers) as (read, write, _):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        result = await session.call_tool(original_tool_name, arguments)
                        payload = self._extract_content(result)
                        processed_payload = await self._post_process_payload(tool_name, payload)
                        return self._create_success_result(processed_payload)
                        
        except Exception as e:
            logger.error(f"Error executing HTTP MCP tool: {str(e)}")
            return self._create_error_result(f"Error executing HTTP tool: {str(e)}")
    
    async def _execute_json_tool(self, tool_name: str, arguments: Dict[str, Any], tool_info: Dict[str, Any]) -> ToolResult:
        custom_config = tool_info['custom_config']
        original_tool_name = tool_info['original_name']
        
        server_params = StdioServerParameters(
            command=custom_config["command"],
            args=custom_config.get("args", []),
            env=custom_config.get("env", {})
        )
        
        async with asyncio.timeout(30):
            async with stdio_client(server_params) as (read, write):
                async with ClientSession(read, write) as session:
                    await session.initialize()
                    result = await session.call_tool(original_tool_name, arguments)
                    payload = self._extract_content(result)
                    processed_payload = await self._post_process_payload(tool_name, payload)
                    return self._create_success_result(processed_payload)
    
    async def _resolve_external_user_id(self, custom_config: Dict[str, Any]) -> str:
        profile_id = custom_config.get('profile_id')
        external_user_id = custom_config.get('external_user_id')
        
        if not profile_id:
            return external_user_id
        
        try:
            from core.services.supabase import DBConnection
            from core.utils.encryption import decrypt_data
            
            db = DBConnection()
            supabase = await db.client
            
            result = await supabase.table('user_mcp_credential_profiles').select(
                'encrypted_config'
            ).eq('profile_id', profile_id).single().execute()
            
            if result.data:
                decrypted_config = decrypt_data(result.data['encrypted_config'])
                config_data = json.loads(decrypted_config)
                return config_data.get('external_user_id', external_user_id)
            
        except Exception as e:
            logger.error(f"Failed to resolve profile {profile_id}: {str(e)}")
        
        return external_user_id

    def _get_thread_id(self) -> Optional[str]:
        try:
            context_vars = structlog.contextvars.get_contextvars()
            return context_vars.get('thread_id')
        except Exception:
            return None

    def _get_thread_manager(self):
        if self.tool_wrapper and hasattr(self.tool_wrapper, 'thread_manager'):
            return getattr(self.tool_wrapper, 'thread_manager')
        return None

    async def _ensure_composio_session(
        self,
        thread_id: Optional[str],
        *,
        force_refresh: bool = False,
    ) -> Optional[Dict[str, Any]]:
        thread_manager = self._get_thread_manager()

        if thread_manager and thread_id:
            if force_refresh:
                thread_manager.clear_composio_session(thread_id)
            else:
                cached_session = thread_manager.get_composio_session(thread_id)
                if cached_session:
                    return cached_session

        try:
            integration_service = get_integration_service()
            session_info = await integration_service.start_mcp_session()

            if session_info and thread_manager and thread_id:
                thread_manager.set_composio_session(thread_id, session_info)

            return session_info
        except Exception as e:
            logger.warning(f"Unable to generate Composio session: {e}")
            return None

    def _build_composio_tool_info(
        self,
        tool_info: Dict[str, Any],
        mcp_url: str,
        session_info: Optional[Dict[str, Any]],
    ) -> Dict[str, Any]:
        updated_tool_info = tool_info.copy()
        base_config = tool_info.get('custom_config', {}) or {}
        custom_config = dict(base_config)
        custom_config['url'] = mcp_url

        session_id = None
        if isinstance(session_info, dict):
            session_id = session_info.get('id') or session_info.get('session_id')
            if session_id and str(session_id).startswith('local-'):
                session_id = None

        if session_id:
            headers = dict(custom_config.get('headers') or {})
            headers[self._COMPOSIO_SESSION_HEADER] = str(session_id)
            custom_config['headers'] = headers
            logger.debug("Attached Composio session header for MCP HTTP call")

        updated_tool_info['custom_config'] = custom_config
        return updated_tool_info

    def _should_retry_composio_error(self, result: ToolResult) -> bool:
        if not isinstance(result, ToolResult) or result.success:
            return False

        message = getattr(result, 'output', None)
        if message is None and hasattr(result, 'content'):
            message = getattr(result, 'content')

        if not message:
            return False

        message_text = str(message)
        lowered = message_text.lower()

        if '401' in message_text or '410' in message_text:
            return True

        if 'session' in lowered and ('expired' in lowered or 'invalid' in lowered):
            return True

        if 'unauthorized' in lowered or 'forbidden' in lowered:
            return True

        return False

    async def _post_process_payload(self, tool_name: str, payload: Any) -> Any:
        structured, raw_text = self._coerce_payload(payload)
        serialized = self._serialize_payload(structured, raw_text)
        serialized_size = len(serialized.encode('utf-8')) if serialized else 0

        if not self._is_large_payload(structured, serialized_size, raw_text):
            return structured if structured is not None else raw_text

        storage_url = None
        if serialized:
            storage_url = await self._persist_payload(serialized)

        summary = self._build_summary(structured, serialized_size, raw_text)
        preview = self._build_preview(structured, raw_text)

        response: Dict[str, Any] = {
            "tool_name": tool_name,
            "summary": summary,
            "preview": preview,
            "truncated": True,
        }

        if storage_url:
            response["storage"] = {
                "type": "supabase",
                "bucket": getattr(config, "SUPABASE_TOOL_OUTPUT_BUCKET", None) or self._DEFAULT_TOOL_BUCKET,
                "url": storage_url,
            }

        if structured is None and isinstance(preview, str):
            response["excerpt"] = preview

        return response

    def _coerce_payload(self, payload: Any) -> Tuple[Optional[Any], str]:
        if isinstance(payload, (dict, list)):
            try:
                raw_text = json.dumps(payload, ensure_ascii=False)
            except Exception:
                raw_text = str(payload)
            return payload, raw_text

        if isinstance(payload, str):
            text = payload.strip()
            if not text:
                return None, ""
            try:
                parsed = json.loads(text)
                if isinstance(parsed, (dict, list)):
                    return parsed, text
            except Exception:
                pass
            return None, text

        try:
            serialized = json.dumps(payload, ensure_ascii=False)
            return payload, serialized
        except Exception:
            return None, str(payload)

    def _serialize_payload(self, structured: Optional[Any], raw_text: str) -> Optional[str]:
        if structured is not None:
            try:
                return json.dumps(structured, ensure_ascii=False, indent=2)
            except Exception:
                pass
        return raw_text or None

    def _is_large_payload(self, structured: Optional[Any], size_bytes: int, raw_text: str) -> bool:
        if size_bytes >= self._LARGE_CHAR_THRESHOLD:
            return True

        if structured is not None:
            if isinstance(structured, list) and len(structured) > self._LARGE_ITEM_THRESHOLD:
                return True
            if isinstance(structured, dict) and len(structured) > self._LARGE_ITEM_THRESHOLD:
                return True

        if raw_text and raw_text.count("\n") > self._LARGE_ITEM_THRESHOLD:
            return True

        return False

    def _build_summary(self, structured: Optional[Any], size_bytes: int, raw_text: str) -> Dict[str, Any]:
        summary: Dict[str, Any] = {
            "approx_size_bytes": size_bytes,
        }

        if isinstance(structured, list):
            summary["kind"] = "list"
            summary["item_count"] = len(structured)
            sample = structured[0] if structured else None
            if isinstance(sample, dict):
                summary["sample_columns"] = list(sample.keys())[:15]
        elif isinstance(structured, dict):
            summary["kind"] = "object"
            summary["key_count"] = len(structured)
            summary["keys"] = list(structured.keys())[:20]
        else:
            summary["kind"] = "text"
            summary["char_count"] = len(raw_text)

        return summary

    def _build_preview(self, structured: Optional[Any], raw_text: str) -> Any:
        if isinstance(structured, list):
            return structured[: self._MAX_PREVIEW_ITEMS]
        if isinstance(structured, dict):
            preview: Dict[str, Any] = {}
            for idx, key in enumerate(structured.keys()):
                if idx >= self._MAX_PREVIEW_ITEMS:
                    break
                preview[key] = structured[key]
            return preview
        return raw_text[: self._MAX_PREVIEW_CHARS] if raw_text else ""

    async def _persist_payload(self, serialized: str) -> Optional[str]:
        try:
            db = DBConnection()
            client = await db.client
            bucket_name = getattr(config, "SUPABASE_TOOL_OUTPUT_BUCKET", None) or self._DEFAULT_TOOL_BUCKET
            await ensure_bucket_exists(client, bucket_name, public=True)

            filename = f"mcp/{uuid.uuid4()}.json"
            await client.storage.from_(bucket_name).upload(
                filename,
                serialized.encode('utf-8'),
                {"content-type": "application/json"},
            )

            public_url = await client.storage.from_(bucket_name).get_public_url(filename)
            return public_url
        except Exception as e:
            logger.warning(f"Failed to persist MCP payload: {e}")
            return None

    def _extract_content(self, result) -> str:
        if hasattr(result, 'content'):
            content = result.content
            if isinstance(content, list):
                text_parts = []
                for item in content:
                    if hasattr(item, 'text'):
                        text_parts.append(item.text)
                    else:
                        text_parts.append(str(item))
                return "\n".join(text_parts)
            elif hasattr(content, 'text'):
                return content.text
            else:
                return str(content)
        else:
            return str(result)
    
    def _create_success_result(self, content: Any) -> ToolResult:
        if self.tool_wrapper and hasattr(self.tool_wrapper, 'success_response'):
            return self.tool_wrapper.success_response(content)
        if isinstance(content, str):
            output_text = content
        else:
            try:
                output_text = json.dumps(content, ensure_ascii=False, indent=2)
            except Exception:
                output_text = str(content)
        return ToolResult(success=True, output=output_text)

    def _create_error_result(self, error_message: str) -> ToolResult:
        if self.tool_wrapper and hasattr(self.tool_wrapper, 'fail_response'):
            return self.tool_wrapper.fail_response(error_message)
        return ToolResult(success=False, output=error_message)
