import json
from typing import Union, Dict, Any

from core.agentpress.tool import Tool, ToolResult, openapi_schema, tool_metadata
from core.tools.data_providers.LinkedinProvider import LinkedinProvider
from core.tools.data_providers.YahooFinanceProvider import YahooFinanceProvider
from core.tools.data_providers.AmazonProvider import AmazonProvider
from core.tools.data_providers.ZillowProvider import ZillowProvider
from core.tools.data_providers.TwitterProvider import TwitterProvider

@tool_metadata(
    display_name="Data Providers",
    description="Access data from LinkedIn, Yahoo Finance, Amazon, Zillow, and Twitter",
    icon="Database",
    color="bg-lime-100 dark:bg-lime-800/50",
    weight=140,
    visible=True
)
class DataProvidersTool(Tool):
    """Tool for making requests to various data providers."""

    def __init__(self):
        super().__init__()

        self.register_data_providers = {
            "linkedin": LinkedinProvider(),
            "yahoo_finance": YahooFinanceProvider(),
            "amazon": AmazonProvider(),
            "zillow": ZillowProvider(),
            "twitter": TwitterProvider()
        }

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "get_data_provider_endpoints",
            "description": "Get available endpoints for a specific data provider",
            "parameters": {
                "type": "object",
                "properties": {
                    "service_name": {
                        "type": "string",
                        "description": "The name of the data provider (e.g., 'linkedin', 'twitter', 'zillow', 'amazon', 'yahoo_finance')"
                    }
                },
                "required": ["service_name"]
            }
        }
    })
    async def get_data_provider_endpoints(
        self,
        service_name: str
    ) -> ToolResult:
        """
        Get available endpoints for a specific data provider.
        
        Parameters:
        - service_name: The name of the data provider (e.g., 'linkedin')
        """
        try:
            if not service_name:
                return self.fail_response("Data provider name is required.")
                
            if service_name not in self.register_data_providers:
                available = ", ".join(self.register_data_providers.keys())
                return self.fail_response(
                    f"'{service_name}' is not a supported data provider. "
                    f"Available providers: {available}. "
                    "If you meant an authenticated app (e.g., Trello, Google Calendar, Slack), "
                    "use the Composio MCP discovery workflow instead of the data providers tool."
                )
                
            endpoints = self.register_data_providers[service_name].get_endpoints()
            return self.success_response(endpoints)
            
        except Exception as e:
            error_message = str(e)
            simplified_message = f"Error getting data provider endpoints: {error_message[:200]}"
            if len(error_message) > 200:
                simplified_message += "..."
            return self.fail_response(simplified_message)

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "execute_data_provider_call",
            "description": "Execute a call to a specific data provider endpoint",
            "parameters": {
                "type": "object",
                "properties": {
                    "service_name": {
                        "type": "string",
                        "description": "The name of the API service (e.g., 'linkedin')"
                    },
                    "route": {
                        "type": "string",
                        "description": "The key of the endpoint to call"
                    },
                    "payload": {
                        "type": "object",
                        "description": "The payload to send with the API call"
                    }
                },
                "required": ["service_name", "route"]
            }
        }
    })
    async def execute_data_provider_call(
        self,
        service_name: str,
        route: str,
        payload: Union[Dict[str, Any], str, None] = None
    ) -> ToolResult:
        """
        Execute a call to a specific data provider endpoint.
        
        Parameters:
        - service_name: The name of the data provider (e.g., 'linkedin')
        - route: The key of the endpoint to call
        - payload: The payload to send with the data provider call (dict or JSON string)
        """
        try:
            # Handle payload - it can be either a dict or a JSON string
            if isinstance(payload, str):
                try:
                    payload = json.loads(payload)
                except json.JSONDecodeError as e:
                    return self.fail_response(f"Invalid JSON in payload: {str(e)}")
            elif payload is None:
                payload = {}
            # If payload is already a dict, use it as-is

            if not service_name:
                return self.fail_response("service_name is required.")

            if not route:
                return self.fail_response("route is required.")
                
            if service_name not in self.register_data_providers:
                available = ", ".join(self.register_data_providers.keys())
                return self.fail_response(
                    f"Bloqueado: '{service_name}' não faz parte do catálogo de data_providers. "
                    f"Somente serviços públicos são aceitos: {available}. "
                    "Se você está trabalhando com um app gerenciado via Composio/MCP (Google Calendar, Trello, Slack, etc.), "
                    "continue no fluxo MCP usando discover_user_mcp_servers/configure_profile_for_agent + call_mcp_tool em vez de execute_data_provider_call."
                )
            
            data_provider = self.register_data_providers[service_name]
            if route == service_name:
                return self.fail_response(
                    f"route '{route}' must reference a specific endpoint, not the provider name."
                )
            
            if route not in data_provider.get_endpoints().keys():
                return self.fail_response(
                    f"O endpoint '{route}' não existe para o data_provider '{service_name}'. "
                    "Reveja os endpoints com get_data_provider_endpoints. "
                    "Se a intenção era acionar uma ação MCP autenticada, volte para o fluxo Composio (discover → configure → call_mcp_tool)."
                )
            
            
            result = data_provider.call_endpoint(route, payload)
            return self.success_response(result)
            
        except Exception as e:
            error_message = str(e)
            print(error_message)
            simplified_message = f"Error executing data provider call: {error_message[:200]}"
            if len(error_message) > 200:
                simplified_message += "..."
            return self.fail_response(simplified_message)
