from typing import Optional, List, Dict, Any, Union
from composio_client import Composio
from core.utils.logger import logger
from pydantic import BaseModel

from .client import ComposioClient
from .toolkit_service import ToolkitService


class AuthConfig(BaseModel):
    id: str
    auth_scheme: str
    is_composio_managed: bool = True
    restrict_to_following_tools: List[str] = []
    toolkit_slug: str


class AuthConfigService:
    def __init__(self, api_key: Optional[str] = None):
        self.client = ComposioClient.get_client(api_key)
        self.toolkit_service = ToolkitService(api_key)
    
    def _convert_field_value(self, value: str, field_type: str) -> Union[str, bool, float]:
        if field_type == 'boolean':
            if isinstance(value, bool):
                return value
            return value.lower() in ('true', '1', 'yes', 'on')
        elif field_type == 'number' or field_type == 'double':
            try:
                return float(value)
            except (ValueError, TypeError):
                logger.warning(f"Failed to convert '{value}' to float, using as string")
                return str(value)
        else:
            return str(value)
    
    async def create_auth_config(
        self, 
        toolkit_slug: str, 
        initiation_fields: Optional[Dict[str, str]] = None,
        custom_auth_config: Optional[Dict[str, str]] = None,
        use_custom_auth: bool = False
    ) -> AuthConfig:
        try:
            logger.debug(f"Creating auth config for toolkit: {toolkit_slug}")
            logger.debug(f"Initiation fields: {initiation_fields}")
            logger.debug(f"Custom auth config provided: {bool(custom_auth_config)}")
            logger.debug(f"Use custom auth: {use_custom_auth}")

            detailed_toolkit = await self.toolkit_service.get_detailed_toolkit_info(toolkit_slug)
            available_schemes = []
            managed_schemes = []
            if detailed_toolkit:
                if detailed_toolkit.auth_schemes:
                    available_schemes.extend([scheme.upper() for scheme in detailed_toolkit.auth_schemes if scheme])
                if detailed_toolkit.managed_auth_schemes:
                    managed_schemes = [scheme.upper() for scheme in detailed_toolkit.managed_auth_schemes if scheme]
                    available_schemes.extend(managed_schemes)
            available_schemes = list(dict.fromkeys(available_schemes))

            provided_scheme = None
            if custom_auth_config:
                provided_scheme = custom_auth_config.get("auth_scheme") or custom_auth_config.get("authScheme")
            if not provided_scheme and initiation_fields:
                provided_scheme = initiation_fields.get("auth_scheme") or initiation_fields.get("authScheme")
            if provided_scheme:
                provided_scheme = str(provided_scheme).upper()

            preferred_scheme = provided_scheme
            if not preferred_scheme:
                if "OAUTH2" in available_schemes:
                    preferred_scheme = "OAUTH2"
                elif available_schemes:
                    preferred_scheme = available_schemes[0]
                else:
                    preferred_scheme = "OAUTH2"

            existing_configs = await self.list_auth_configs(toolkit_slug)
            matching_existing = next(
                (
                    cfg for cfg in existing_configs
                    if (cfg.auth_scheme or "").upper() == preferred_scheme
                ),
                None,
            )
            if not matching_existing and existing_configs:
                matching_existing = existing_configs[0]

            if matching_existing and not use_custom_auth:
                logger.debug(
                    "Reusing existing auth config %s for toolkit %s (scheme=%s)",
                    matching_existing.id,
                    toolkit_slug,
                    matching_existing.auth_scheme,
                )
                return matching_existing
            
            managed_scheme_set = set(managed_schemes)
            has_managed_for_preferred = preferred_scheme in managed_scheme_set if preferred_scheme else False

            def _merged_credentials() -> Dict[str, Any]:
                merged: Dict[str, Any] = {}
                if initiation_fields:
                    merged.update({k: v for k, v in initiation_fields.items() if v not in (None, "")})
                if custom_auth_config:
                    merged.update({k: v for k, v in custom_auth_config.items() if v not in (None, "")})
                for noise_key in ("auth_scheme", "authScheme", "profile_name", "profileId", "profile_id", "display_name"):
                    merged.pop(noise_key, None)
                return merged

            credentials = _merged_credentials()
            auth_config_name = (
                (initiation_fields or {}).get("auth_config_name")
                or (custom_auth_config or {}).get("name")
                or f"{toolkit_slug}-auth"
            )

            managed_attempt_error: Optional[Exception] = None
            if not use_custom_auth:
                try:
                    logger.debug(
                        "Attempting managed auth config for toolkit %s (scheme=%s, managed support=%s)",
                        toolkit_slug,
                        preferred_scheme,
                        has_managed_for_preferred
                    )
                    managed_payload = {
                        "type": "use_composio_managed_auth",
                        "name": auth_config_name
                    }
                    if preferred_scheme:
                        managed_payload["authScheme"] = preferred_scheme
                    if credentials:
                        managed_payload["credentials"] = credentials

                    response = self.client.auth_configs.create(
                        toolkit={"slug": toolkit_slug},
                        auth_config=managed_payload
                    )

                    auth_config_obj = response.auth_config
                    auth_config = AuthConfig(
                        id=auth_config_obj.id,
                        auth_scheme=auth_config_obj.auth_scheme,
                        is_composio_managed=getattr(auth_config_obj, 'is_composio_managed', True),
                        restrict_to_following_tools=getattr(auth_config_obj, 'restrict_to_following_tools', []),
                        toolkit_slug=toolkit_slug
                    )
                    logger.debug(
                        "Managed auth config succeeded for toolkit %s with id %s",
                        toolkit_slug,
                        auth_config.id
                    )
                    return auth_config
                except Exception as managed_err:
                    managed_attempt_error = managed_err
                    logger.warning(
                        "Managed auth config attempt failed for toolkit %s (scheme=%s). Falling back to custom auth. Error: %s",
                        toolkit_slug,
                        preferred_scheme,
                        managed_err,
                        exc_info=True
                    )

            logger.debug("Creating custom auth config (scheme=%s)", preferred_scheme)

            required_fields: List[str] = []
            if detailed_toolkit and detailed_toolkit.auth_config_details:
                for detail in detailed_toolkit.auth_config_details:
                    if not detail.fields:
                        continue
                    for field_group, requirement_map in detail.fields.items():
                        if preferred_scheme and field_group and field_group.upper() not in {preferred_scheme, f"{preferred_scheme}_AUTH"}:
                            continue
                        for requirement, fields in requirement_map.items():
                            for field in fields:
                                field_name = field.name or field.displayName
                                if not field_name:
                                    continue
                                if requirement == "required" or field.required:
                                    required_fields.append(field_name)
            missing_fields = [
                field for field in required_fields
                if not credentials.get(field)
            ]
            if missing_fields:
                error_details = f"Missing required credential fields for {toolkit_slug}: {', '.join(missing_fields)}"
                if managed_attempt_error:
                    error_details += f". Managed auth attempt failed with: {managed_attempt_error}"
                raise ValueError(error_details)

            auth_config_payload = {
                "type": "use_custom_auth",
                "name": auth_config_name,
                "authScheme": preferred_scheme,
                "credentials": credentials,
            }

            response = self.client.auth_configs.create(
                toolkit={
                    "slug": toolkit_slug
                },
                auth_config=auth_config_payload
            )
            
            auth_config_obj = response.auth_config
            
            auth_config = AuthConfig(
                id=auth_config_obj.id,
                auth_scheme=auth_config_obj.auth_scheme,
                is_composio_managed=getattr(auth_config_obj, 'is_composio_managed', False),
                restrict_to_following_tools=getattr(auth_config_obj, 'restrict_to_following_tools', []),
                toolkit_slug=toolkit_slug
            )
            
            logger.debug(f"Successfully created auth config: {auth_config.id}")
            return auth_config
            
        except Exception as e:
            logger.error(f"Failed to create auth config for {toolkit_slug}: {e}", exc_info=True)
            raise
    
    async def get_auth_config(self, auth_config_id: str) -> Optional[AuthConfig]:
        try:
            logger.debug(f"Fetching auth config: {auth_config_id}")
            
            response = self.client.auth_configs.get(auth_config_id)
            
            if not response:
                return None
            
            return AuthConfig(
                id=response.id,
                auth_scheme=response.auth_scheme,
                is_composio_managed=getattr(response, 'is_composio_managed', True),
                restrict_to_following_tools=getattr(response, 'restrict_to_following_tools', []),
                toolkit_slug=getattr(response, 'toolkit_slug', '')
            )
            
        except Exception as e:
            logger.error(f"Failed to get auth config {auth_config_id}: {e}", exc_info=True)
            raise
    
    async def list_auth_configs(self, toolkit_slug: Optional[str] = None) -> List[AuthConfig]:
        try:
            logger.debug(f"Listing auth configs for toolkit: {toolkit_slug}")
            
            response = self.client.auth_configs.list()
            response_items = getattr(response, 'items', [])

            items = []
            for item in response_items:
                toolkit_value = None
                if hasattr(item, 'toolkit_slug'):
                    toolkit_value = item.toolkit_slug
                elif hasattr(item, 'toolkit'):
                    toolkit_attr = getattr(item, 'toolkit')
                    if isinstance(toolkit_attr, str):
                        toolkit_value = toolkit_attr
                    elif hasattr(toolkit_attr, '__dict__'):
                        toolkit_value = toolkit_attr.__dict__.get('slug')
                elif isinstance(item, dict):
                    toolkit_value = item.get('toolkit_slug') or item.get('toolkit')

                if toolkit_slug and toolkit_value and toolkit_value != toolkit_slug:
                    continue

                items.append(item)
            
            auth_configs = []
            for item in items:
                auth_config = AuthConfig(
                    id=item.id,
                    auth_scheme=item.auth_scheme,
                    is_composio_managed=getattr(item, 'is_composio_managed', True),
                    restrict_to_following_tools=getattr(item, 'restrict_to_following_tools', []),
                    toolkit_slug=getattr(item, 'toolkit_slug', toolkit_slug or '')
                )
                auth_configs.append(auth_config)
            
            logger.debug(f"Successfully listed {len(auth_configs)} auth configs")
            return auth_configs
            
        except Exception as e:
            logger.error(f"Failed to list auth configs: {e}", exc_info=True)
            raise 