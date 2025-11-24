import json
import os
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, Dict, List, Optional

from cryptography.fernet import Fernet

from core.services.supabase import DBConnection
from core.utils.logger import logger


@dataclass
class ManagedToolkitCredential:
    credential_id: str
    toolkit_slug: str
    auth_scheme: str
    payload: Dict[str, Any]
    account_id: Optional[str] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    is_active: bool = True
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    last_rotated_at: Optional[datetime] = None


class ManagedToolkitCredentialService:
    """
    Secure storage for toolkit-level secrets that are injected automatically
    into Composio auth configs. Payloads are encrypted at rest using the same
    Fernet key as other MCP credentials.
    """

    TABLE_NAME = "managed_toolkit_credentials"

    def __init__(self, db_connection: Optional[DBConnection] = None):
        self.db = db_connection or DBConnection()
        self._cipher: Optional[Fernet] = None

    def _get_encryption_key(self) -> bytes:
        key = os.getenv("ENCRYPTION_KEY") or os.getenv("MCP_CREDENTIAL_ENCRYPTION_KEY")
        if not key:
            raise ValueError(
                "ENCRYPTION_KEY (or MCP_CREDENTIAL_ENCRYPTION_KEY) must be set to manage toolkit credentials"
            )
        return key.encode() if isinstance(key, str) else key

    def _get_cipher(self) -> Fernet:
        if not self._cipher:
            self._cipher = Fernet(self._get_encryption_key())
        return self._cipher

    def _encrypt_payload(self, payload: Dict[str, Any]) -> str:
        serialized = json.dumps(payload, sort_keys=True)
        encrypted = self._get_cipher().encrypt(serialized.encode("utf-8"))
        return encrypted.decode("utf-8")

    def _decrypt_payload(self, encrypted_payload: str) -> Dict[str, Any]:
        decrypted = self._get_cipher().decrypt(encrypted_payload.encode("utf-8"))
        return json.loads(decrypted.decode("utf-8"))

    def _parse_timestamp(self, value: Optional[str]) -> Optional[datetime]:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            logger.warning("Could not parse timestamp value '%s'", value)
            return None

    def _build_record(self, row: Dict[str, Any]) -> ManagedToolkitCredential:
        payload = self._decrypt_payload(row["encrypted_payload"])
        metadata = row.get("metadata") or {}
        if isinstance(metadata, str):
            try:
                metadata = json.loads(metadata)
            except json.JSONDecodeError:
                metadata = {}

        return ManagedToolkitCredential(
            credential_id=row["credential_id"],
            account_id=row.get("account_id"),
            toolkit_slug=row["toolkit_slug"],
            auth_scheme=row.get("auth_scheme", "").upper(),
            payload=payload,
            metadata=metadata,
            is_active=row.get("is_active", True),
            created_at=self._parse_timestamp(row.get("created_at")),
            updated_at=self._parse_timestamp(row.get("updated_at")),
            last_rotated_at=self._parse_timestamp(row.get("last_rotated_at")),
        )

    async def list_credentials(
        self,
        toolkit_slug: Optional[str] = None,
        account_id: Optional[str] = None,
        *,
        include_inactive: bool = False,
        global_only: bool = False,
    ) -> List[ManagedToolkitCredential]:
        client = await self.db.client
        query = client.table(self.TABLE_NAME).select("*")

        if toolkit_slug:
            query = query.eq("toolkit_slug", toolkit_slug)
        if account_id:
            query = query.eq("account_id", account_id)
        elif global_only:
            query = query.is_("account_id", "null")
        if not include_inactive:
            query = query.eq("is_active", True)

        result = await query.order("updated_at", desc=True).execute()
        records = result.data or []
        return [self._build_record(row) for row in records]

    async def get_credentials(
        self, toolkit_slug: str, account_id: Optional[str] = None
    ) -> Optional[ManagedToolkitCredential]:
        client = await self.db.client

        def _base_query():
            return (
                client.table(self.TABLE_NAME)
                .select("*")
                .eq("toolkit_slug", toolkit_slug)
                .eq("is_active", True)
                .order("updated_at", desc=True)
                .limit(1)
            )

        if account_id:
            account_query = _base_query().eq("account_id", account_id)
            account_result = await account_query.maybe_single().execute()
            if account_result.data:
                return self._build_record(account_result.data)

        fallback_query = _base_query().is_("account_id", "null")
        fallback_result = await fallback_query.maybe_single().execute()
        if fallback_result.data:
            return self._build_record(fallback_result.data)

        return None

    async def upsert_credentials(
        self,
        toolkit_slug: str,
        auth_scheme: str,
        payload: Dict[str, Any],
        *,
        account_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        is_active: bool = True,
        last_rotated_at: Optional[datetime] = None,
    ) -> ManagedToolkitCredential:
        encrypted_payload = self._encrypt_payload(payload)
        auth_scheme_normalized = auth_scheme.upper()
        metadata_payload = metadata or {}

        row = {
            "account_id": account_id,
            "toolkit_slug": toolkit_slug,
            "auth_scheme": auth_scheme_normalized,
            "encrypted_payload": encrypted_payload,
            "metadata": metadata_payload,
            "is_active": is_active,
            "last_rotated_at": last_rotated_at.isoformat() if last_rotated_at else None,
        }

        client = await self.db.client
        result = (
            await client.table(self.TABLE_NAME)
            .upsert(row, on_conflict="account_id,toolkit_slug,auth_scheme")
            .select("*")
            .maybe_single()
            .execute()
        )

        if not result.data:
            raise RuntimeError(
                f"Failed to upsert managed credential for toolkit {toolkit_slug} ({auth_scheme_normalized})"
            )

        logger.info(
            "Managed toolkit credential stored",
            toolkit_slug=toolkit_slug,
            auth_scheme=auth_scheme_normalized,
            account_id=account_id,
        )
        return self._build_record(result.data)

    async def deactivate_credential(self, credential_id: str) -> None:
        client = await self.db.client
        await (
            client.table(self.TABLE_NAME)
            .update({"is_active": False})
            .eq("credential_id", credential_id)
            .execute()
        )
        logger.info("Managed toolkit credential deactivated", credential_id=credential_id)

