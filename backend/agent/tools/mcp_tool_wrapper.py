from typing import Any, Dict, List, Optional
from agentpress.tool import Tool, ToolResult, openapi_schema, xml_schema, ToolSchema, SchemaType
from mcp_module import mcp_manager
from utils.logger import logger
import inspect
from agent.tools.utils.mcp_connection_manager import MCPConnectionManager
from agent.tools.utils.custom_mcp_handler import CustomMCPHandler
from agent.tools.utils.dynamic_tool_builder import DynamicToolBuilder
from agent.tools.utils.mcp_tool_executor import MCPToolExecutor


class MCPToolWrapper(Tool):
    def __init__(self, mcp_configs: Optional[List[Dict[str, Any]]] = None):
        self.mcp_manager = mcp_manager
        self.mcp_configs = mcp_configs or []
        self._initialized = False
        self._schemas: Dict[str, List[ToolSchema]] = {}
        self._dynamic_tools = {}
        self._custom_tools = {}
        
        self.connection_manager = MCPConnectionManager()
        self.custom_handler = CustomMCPHandler(self.connection_manager)
        self.tool_builder = DynamicToolBuilder()
        self.tool_executor = None
        
        super().__init__()
        
    async def _ensure_initialized(self):
        if not self._initialized:
            await self._initialize_servers()
            await self._create_dynamic_tools()
            self._initialized = True
    
    async def _initialize_servers(self):
        standard_configs = [cfg for cfg in self.mcp_configs if not cfg.get('isCustom', False)]
        custom_configs = [cfg for cfg in self.mcp_configs if cfg.get('isCustom', False)]
        
        if standard_configs:
            await self._initialize_standard_servers(standard_configs)
        
        if custom_configs:
            await self.custom_handler.initialize_custom_mcps(custom_configs)
            
    async def _initialize_standard_servers(self, standard_configs: List[Dict[str, Any]]):
        for config in standard_configs:
            try:
                logger.info(f"Attempting to connect to MCP server: {config['qualifiedName']}")
                await self.mcp_manager.connect_server(config)
                logger.info(f"Successfully connected to MCP server: {config['qualifiedName']}")
            except Exception as e:
                logger.error(f"Failed to connect to MCP server {config['qualifiedName']}: {e}")
    
    async def _create_dynamic_tools(self):
        try:
            available_tools = self.mcp_manager.get_all_tools_openapi()
            custom_tools = self.custom_handler.get_custom_tools()
            
            logger.info(f"MCPManager returned {len(available_tools)} tools")
            logger.info(f"Custom handler returned {len(custom_tools)} custom tools")
            
            self._custom_tools = custom_tools
            
            self.tool_executor = MCPToolExecutor(custom_tools, self)
            
            dynamic_methods = self.tool_builder.create_dynamic_methods(
                available_tools, 
                custom_tools, 
                self._execute_mcp_tool
            )
            
            self._dynamic_tools = self.tool_builder.get_dynamic_tools()
            
            for method_name, method in dynamic_methods.items():
                setattr(self, method_name, method)
            
            self._schemas.update(self.tool_builder.get_schemas())
            
            logger.info(f"Created {len(self._dynamic_tools)} dynamic MCP tool methods")
            
        except Exception as e:
            logger.error(f"Error creating dynamic MCP tools: {e}")
    
    def _register_schemas(self):
        for name, method in inspect.getmembers(self, predicate=inspect.ismethod):
            if hasattr(method, 'tool_schemas'):
                self._schemas[name] = method.tool_schemas
                logger.debug(f"Registered schemas for method '{name}' in {self.__class__.__name__}")
        
        logger.debug(f"Initial registration complete for MCPToolWrapper")
    
    def get_schemas(self) -> Dict[str, List[ToolSchema]]:
        return self._schemas
    
    def __getattr__(self, name: str):
        method = self.tool_builder.find_method_by_name(name)
        if method:
            return method

        # Busca por método registrado
        for tool_data in self._dynamic_tools.values():
            if tool_data.get('method_name') == name:
                return tool_data.get('method')

        # Variações hífen/underscore e sufixo "clean"
        name_with_hyphens = name.replace('_', '-')
        name_with_underscores = name.replace('-', '_')
        for tool_name, tool_data in self._dynamic_tools.items():
            clean_suffix = tool_data.get('clean_tool_name') or ''
            if (
                tool_data.get('method_name') == name or
                tool_data.get('method_name') == name_with_underscores or
                tool_name == name_with_hyphens or
                clean_suffix == name or
                clean_suffix == name_with_hyphens or
                clean_suffix.replace('-', '_') == name_with_underscores
            ):
                return tool_data.get('method')

        raise AttributeError(f"'{self.__class__.__name__}' object has no attribute '{name}'")
    
    async def initialize_and_register_tools(self, tool_registry=None):
        await self._ensure_initialized()
        if tool_registry and (self._dynamic_tools or self._schemas):
            try:
                # Register all dynamic methods into the openapi registry, incluindo alias com hífen
                count = 0
                for method_name, schema_list in (self._schemas or {}).items():
                    for schema in schema_list:
                        try:
                            if hasattr(schema, 'schema_type') and schema.schema_type == SchemaType.OPENAPI:
                                tool_registry.tools[method_name] = {
                                    "instance": self,
                                    "schema": schema
                                }
                                alias = method_name.replace('_', '-')
                                if alias != method_name:
                                    tool_registry.tools[alias] = {
                                        "instance": self,
                                        "schema": schema
                                    }
                                count += 1
                        except Exception as _e:
                            logger.debug(f"Skip schema for {method_name}: {_e}")
                logger.info(f"Registered {count} MCP tool functions into registry (with hyphen aliases)")
            except Exception as e:
                logger.warning(f"Failed to register MCP tools in registry: {e}")
             
    async def get_available_tools(self) -> List[Dict[str, Any]]:
        await self._ensure_initialized()
        return self.mcp_manager.get_all_tools_openapi()
    
    async def _execute_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> ToolResult:
        await self._ensure_initialized()
        return await self.tool_executor.execute_tool(tool_name, arguments)

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "list_mcp_tools",
            "description": "List all available MCP tools with their fully qualified names to be used with call_mcp_tool.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    })
    async def list_mcp_tools(self) -> ToolResult:
        """Expose available MCP tools for discovery by the LLM."""
        await self._ensure_initialized()
        try:
            tools = self.mcp_manager.get_all_tools_openapi() or []
            # Normalize minimal view: name + description
            normalized = []
            for t in tools:
                try:
                    name = t.get('name') or t.get('operationId') or ''
                    desc = t.get('description') or ''
                    normalized.append({"name": name, "description": desc})
                except Exception:
                    continue
            return self.success_response({
                "message": f"Found {len(normalized)} MCP tool(s)",
                "tools": normalized,
                "tip": "Use call_mcp_tool with the exact 'name'"
            })
        except Exception as e:
            return self.fail_response(f"Failed to list MCP tools: {str(e)}")
    
    @openapi_schema({
        "type": "function",
        "function": {
            "name": "call_mcp_tool",
            "description": "Execute a tool from any connected MCP server. This is a fallback wrapper that forwards calls to MCP tools. The tool_name should be in the format 'mcp_{server}_{tool}' where {server} is the MCP server's qualified name and {tool} is the specific tool name.",
            "parameters": {
                "type": "object",
                "properties": {
                    "tool_name": {
                        "type": "string",
                        "description": "The full MCP tool name in format 'mcp_{server}_{tool}', e.g., 'mcp_exa_web_search_exa'"
                    },
                    "arguments": {
                        "type": "object",
                        "description": "The arguments to pass to the MCP tool, as a JSON object. The required arguments depend on the specific tool being called.",
                        "additionalProperties": True
                    }
                },
                "required": ["tool_name", "arguments"]
            }
        }
    })
    @xml_schema(
        tag_name="call-mcp-tool",
        mappings=[
            {"param_name": "tool_name", "node_type": "attribute", "path": "."},
            {"param_name": "arguments", "node_type": "content", "path": "."}
        ],
        example='''
        <function_calls>
        <invoke name="call_mcp_tool">
        <parameter name="tool_name">mcp_exa_web_search_exa</parameter>
        <parameter name="arguments">{"query": "latest developments in AI", "num_results": 10}</parameter>
        </invoke>
        </function_calls>
        '''
    )
    async def call_mcp_tool(self, tool_name: str, arguments: Dict[str, Any]) -> ToolResult:
        return await self._execute_mcp_tool(tool_name, arguments)
            
    async def cleanup(self):
        if self._initialized:
            try:
                await self.mcp_manager.disconnect_all()
            except Exception as e:
                logger.error(f"Error during MCP cleanup: {str(e)}")
            finally:
                self._initialized = False 