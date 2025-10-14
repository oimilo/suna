import json
import asyncio
from typing import Dict, Any, Optional, Tuple
from agentpress.tool import ToolResult
from mcp import ClientSession, StdioServerParameters
from mcp.client.sse import sse_client
from mcp.client.stdio import stdio_client
from mcp.client.streamable_http import streamablehttp_client
from core.mcp_module import mcp_service as mcp_manager
from utils.logger import logger
from flags.flags import is_enabled


class MCPToolExecutor:
    def __init__(self, custom_tools: Dict[str, Dict[str, Any]], tool_wrapper=None):
        self.mcp_manager = mcp_manager
        self.custom_tools = custom_tools
        self.tool_wrapper = tool_wrapper
    
    async def execute_tool(self, tool_name: str, arguments: Dict[str, Any]) -> ToolResult:
        logger.info(f"Executing MCP tool {tool_name} with arguments {arguments}")
        
        try:
            requested = str(tool_name).strip()

            # STRICT: usar sempre nome remoto com hífen. Se vier provider:tool, retirar prefixo
            try:
                if await is_enabled("mcp_strict_remote_names"):
                    remote_name = requested.split(':', 1)[1] if ':' in requested else requested
                    # se houver versão underscore, preferir com hífen
                    remote_name = remote_name.replace('_', '-')
                    # procurar custom tool cujo original_name == remote_name
                    for key, info in self.custom_tools.items():
                        if (info.get('original_name') or '').strip() == remote_name:
                            return await self._execute_custom_tool(key, arguments)
                    # fallback: executar remoto direto no manager
                    return await self._execute_standard_tool(remote_name, arguments)
            except Exception:
                pass

            # 2) Tentar resolver provider:tool ou aliases mcp_*/custom_* para um custom_* existente
            #    - O nome "original" remoto é o que a sessão MCP conhece (ex.: supabase-insert-row)
            candidates_original: list[str] = []

            # provider:tool → tool
            if ':' in requested and not requested.startswith(('mcp_', 'custom_')):
                _, tool = requested.split(':', 1)
                candidates_original.append(tool)
                candidates_original.append(tool.replace('_', '-'))
                candidates_original.append(tool.replace('-', '_'))

            # mcp_provider_tool ou custom_provider_tool → tool
            import re as _re
            m = _re.match(r"^(?:mcp|custom)_[^_]+_(.+)$", requested)
            if m:
                t = m.group(1)
                candidates_original.append(t)
                candidates_original.append(t.replace('_', '-'))
                candidates_original.append(t.replace('-', '_'))

            # hífen/underscore simples
            candidates_original.append(requested)
            candidates_original.append(requested.replace('_', '-'))
            candidates_original.append(requested.replace('-', '_'))

            # Dedup preservando ordem
            seen = set()
            uniq_candidates = []
            for c in candidates_original:
                if c and c not in seen:
                    seen.add(c)
                    uniq_candidates.append(c)

            # Procurar um custom_tool cujo original_name bata com algum candidato
            try:
                match_key = None
                for key, info in self.custom_tools.items():
                    original = (info.get('original_name') or '').strip()
                    if not original:
                        continue
                    for c in uniq_candidates:
                        # Comparar em variações hífen/underscore
                        if original == c or original.replace('-', '_') == c or original.replace('_', '-') == c:
                            match_key = key
                            break
                    if match_key:
                        break
                if match_key:
                    return await self._execute_custom_tool(match_key, arguments)
            except Exception:
                pass

            # 3) Como fallback, tentar padrão "remoto" via manager (conexões padrão)
            #    Preferir forma com hífen, que é a mais comum em servidores MCP
            remote_name = None
            for c in uniq_candidates:
                if '-' in c:
                    remote_name = c
                    break
            if not remote_name:
                remote_name = uniq_candidates[0]
            return await self._execute_standard_tool(remote_name, arguments)
        except Exception as e:
            logger.error(f"Error executing MCP tool {tool_name}: {str(e)}")
            return self._create_error_result(f"Error executing tool: {str(e)}")
    
    async def _execute_standard_tool(self, tool_name: str, arguments: Dict[str, Any]) -> ToolResult:
        result = await self.mcp_manager.execute_tool(tool_name, arguments)
        
        if isinstance(result, dict):
            if result.get('isError', False):
                return self._create_error_result(result.get('content', 'Tool execution failed'))
            else:
                return self._create_success_result(result.get('content', result))
        else:
            return self._create_success_result(result)
    
    async def _execute_custom_tool(self, tool_name: str, arguments: Dict[str, Any]) -> ToolResult:
        tool_info = self.custom_tools[tool_name]
        custom_type = tool_info['custom_type']
        
        if custom_type == 'pipedream':
            return await self._execute_pipedream_tool(tool_name, arguments, tool_info)
        elif custom_type == 'sse':
            return await self._execute_sse_tool(tool_name, arguments, tool_info)
        elif custom_type == 'http':
            return await self._execute_http_tool(tool_name, arguments, tool_info)
        elif custom_type == 'json':
            return await self._execute_json_tool(tool_name, arguments, tool_info)
        else:
            return self._create_error_result(f"Unsupported custom MCP type: {custom_type}")
    
    async def _execute_pipedream_tool(self, tool_name: str, arguments: Dict[str, Any], tool_info: Dict[str, Any]) -> ToolResult:
        custom_config = tool_info['custom_config']
        original_tool_name = tool_info['original_name']
        
        external_user_id = await self._resolve_external_user_id(custom_config)
        if not external_user_id:
            return self._create_error_result("No external_user_id available")
        
        app_slug = custom_config.get('app_slug')
        oauth_app_id = custom_config.get('oauth_app_id')
        
        try:
            import os
            from pipedream.facade import PipedreamManager
            
            pipedream_manager = PipedreamManager()
            http_client = pipedream_manager._http_client
            
            access_token = await http_client._ensure_access_token()
            
            project_id = os.getenv("PIPEDREAM_PROJECT_ID")
            environment = os.getenv("PIPEDREAM_X_PD_ENVIRONMENT", "development")
            
            headers = {
                "Authorization": f"Bearer {access_token}",
                "x-pd-project-id": project_id,
                "x-pd-environment": environment,
                "x-pd-external-user-id": external_user_id,
                "x-pd-app-slug": app_slug,
            }
            
            if http_client.rate_limit_token:
                headers["x-pd-rate-limit"] = http_client.rate_limit_token
            
            if oauth_app_id:
                headers["x-pd-oauth-app-id"] = oauth_app_id
            
            url = "https://remote.mcp.pipedream.net"
            
            async with asyncio.timeout(30):
                async with streamablehttp_client(url, headers=headers) as (read_stream, write_stream, _):
                    async with ClientSession(read_stream, write_stream) as session:
                        await session.initialize()

                        # 1) Pré‑voo: buscar schema do tool e normalizar argumentos
                        schema = await self._get_tool_schema(session, original_tool_name)
                        normalized_args = self._normalize_arguments_by_schema(arguments or {}, schema)

                        # 2) Primeira execução
                        result = await session.call_tool(original_tool_name, normalized_args)
                        content = self._extract_content(result)

                        # 3) Detecção de erro de validação → uma reexecução com correções
                        if self._looks_like_argument_error(content):
                            retry_args = self._retry_corrections(normalized_args, schema, content)
                            try:
                                retry_result = await session.call_tool(original_tool_name, retry_args)
                                retry_content = self._extract_content(retry_result)
                                # Se ainda aparenta erro, devolver como erro estruturado com dicas de schema
                                if self._looks_like_argument_error(retry_content):
                                    return self._create_error_result(self._compose_schema_hint_message(retry_content, schema))
                                return self._create_success_result(retry_content)
                            except Exception as _e:
                                return self._create_error_result(self._compose_schema_hint_message(str(_e), schema))

                        return self._create_success_result(content)
                        
        except Exception as e:
            logger.error(f"Error executing Pipedream MCP tool: {str(e)}")
            return self._create_error_result(f"Error executing Pipedream tool: {str(e)}")
    
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
                        return self._create_success_result(self._extract_content(result))
                        
            except TypeError as e:
                if "unexpected keyword argument" in str(e):
                    async with sse_client(url) as (read, write):
                        async with ClientSession(read, write) as session:
                            await session.initialize()
                            result = await session.call_tool(original_tool_name, arguments)
                            return self._create_success_result(self._extract_content(result))
                else:
                    raise
    
    async def _execute_http_tool(self, tool_name: str, arguments: Dict[str, Any], tool_info: Dict[str, Any]) -> ToolResult:
        custom_config = tool_info['custom_config']
        original_tool_name = tool_info['original_name']
        
        url = custom_config['url']
        
        try:
            async with asyncio.timeout(30):
                async with streamablehttp_client(url) as (read, write, _):
                    async with ClientSession(read, write) as session:
                        await session.initialize()
                        result = await session.call_tool(original_tool_name, arguments)
                        return self._create_success_result(self._extract_content(result))
                        
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
                    return self._create_success_result(self._extract_content(result))
    
    async def _resolve_external_user_id(self, custom_config: Dict[str, Any]) -> str:
        profile_id = custom_config.get('profile_id')
        external_user_id = custom_config.get('external_user_id')
        
        if not profile_id:
            return external_user_id
        
        try:
            from services.supabase import DBConnection
            from utils.encryption import decrypt_data
            
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

    async def _get_tool_schema(self, session: Any, tool_name: str) -> Optional[Dict[str, Any]]:
        """Fetch input schema for a tool from the MCP server (list_tools)."""
        try:
            tools_result = await session.list_tools()
            tools = tools_result.tools if hasattr(tools_result, 'tools') else tools_result
            for t in tools:
                name = getattr(t, 'name', None)
                if name == tool_name:
                    # Some SDKs expose inputSchema; fallback to dict access
                    schema = getattr(t, 'inputSchema', None)
                    if schema is None and hasattr(t, 'input_schema'):
                        schema = getattr(t, 'input_schema')
                    # Convert dataclass/object to dict when possible
                    try:
                        if hasattr(schema, 'model_dump'):
                            return schema.model_dump()
                    except Exception:
                        pass
                    try:
                        return dict(schema) if isinstance(schema, dict) else None
                    except Exception:
                        return None
            return None
        except Exception:
            return None

    def _normalize_arguments_by_schema(self, args: Dict[str, Any], schema: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Normalize arguments using JSON Schema (properties/required/type coercion) and basic synonyms.

        This is provider‑agnostic and works for any Pipedream tool that exposes inputSchema over MCP.
        """
        if not schema or not isinstance(schema, dict):
            return args

        props = (schema.get('properties') or {}) if isinstance(schema.get('properties'), dict) else {}
        required = schema.get('required') or []

        normalized = dict(args) if isinstance(args, dict) else {}

        # Synonyms: map common aliases → canonical
        synonyms = {
            'instruction': ['query', 'text', 'prompt', 'message', 'q', 'search', 'keywords'],
        }
        for canonical, aliases in synonyms.items():
            if canonical not in normalized:
                for alias in aliases:
                    if alias in normalized and normalized[alias] not in (None, ''):
                        normalized[canonical] = normalized.pop(alias)
                        break

        # Coerce types
        for key, prop in props.items():
            if key not in normalized:
                continue
            expected_type = prop.get('type')
            try:
                val = normalized[key]
                if expected_type == 'string' and not isinstance(val, str):
                    normalized[key] = json.dumps(val) if isinstance(val, (dict, list)) else str(val)
                elif expected_type == 'number' and not isinstance(val, (int, float)):
                    normalized[key] = float(val) if val not in (None, '') else val
                elif expected_type == 'integer' and not isinstance(val, int):
                    normalized[key] = int(float(val)) if str(val).strip() != '' else val
                elif expected_type == 'boolean' and not isinstance(val, bool):
                    if isinstance(val, str):
                        normalized[key] = val.strip().lower() in ['1', 'true', 'yes', 'y']
                elif expected_type == 'array' and not isinstance(val, list):
                    if isinstance(val, str):
                        try:
                            j = json.loads(val)
                            if isinstance(j, list):
                                normalized[key] = j
                        except Exception:
                            normalized[key] = [val]
                elif expected_type == 'object' and not isinstance(val, dict):
                    if isinstance(val, str):
                        try:
                            j = json.loads(val)
                            if isinstance(j, dict):
                                normalized[key] = j
                        except Exception:
                            pass
            except Exception:
                # Best‑effort: keep original on failure
                pass

        # Drop unknown keys if additionalProperties is false
        if schema.get('additionalProperties') is False:
            normalized = {k: v for k, v in normalized.items() if k in props}

        # Ensure required placeholders exist if we have reasonable synonyms
        for r in required:
            if r not in normalized and r == 'instruction':
                # If nothing mapped, supply a minimal placeholder to trigger backend help
                normalized[r] = ''

        return normalized

    def _looks_like_argument_error(self, content: str) -> bool:
        if not isinstance(content, str):
            try:
                content = str(content)
            except Exception:
                return False
        lc = content.lower()
        return (
            'error parsing arguments' in lc
            or 'invalid_type' in lc
            or 'required' in lc
            or 'missing required' in lc
        )

    def _retry_corrections(self, args: Dict[str, Any], schema: Optional[Dict[str, Any]], content: str) -> Dict[str, Any]:
        """Attempt lightweight corrections for a single retry based on error text and schema."""
        corrected = dict(args)
        if not schema:
            return corrected
        props = schema.get('properties') or {}
        required = schema.get('required') or []

        # If an explicit required field is mentioned, ensure it exists by promoting common aliases
        for r in required:
            if r not in corrected:
                # Promote first available arg as string (very conservative)
                if r == 'instruction':
                    # nothing else to promote; leave empty string
                    corrected[r] = ''
        # If a property expects string but received undefined/empty, coerce
        for k, p in props.items():
            if k in corrected and (corrected[k] is None):
                if p.get('type') == 'string':
                    corrected[k] = ''
        return corrected

    def _compose_schema_hint_message(self, base_error: str, schema: Optional[Dict[str, Any]]) -> str:
        if not schema:
            return base_error
        props = schema.get('properties') or {}
        required = schema.get('required') or []
        try:
            prop_list = ', '.join(f"{k}:{(v.get('type') or 'any')}" for k, v in props.items()) if isinstance(props, dict) else ''
        except Exception:
            prop_list = ''
        return (
            f"{base_error}\n\nExpected parameters (from schema): {prop_list}."
            + (f" Required: {', '.join(required)}." if required else '')
        )
    
    def _create_success_result(self, content: Any) -> ToolResult:
        if self.tool_wrapper and hasattr(self.tool_wrapper, 'success_response'):
            return self.tool_wrapper.success_response(content)
        return ToolResult(
            success=True,
            content=str(content),
            metadata={}
        )
    
    def _create_error_result(self, error_message: str) -> ToolResult:
        if self.tool_wrapper and hasattr(self.tool_wrapper, 'fail_response'):
            return self.tool_wrapper.fail_response(error_message)
        return ToolResult(
            success=False,
            content=error_message,
            metadata={}
        ) 