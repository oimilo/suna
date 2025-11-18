"""
Utility functions for retrieving user locale preferences from Supabase Auth.
"""

from typing import Optional

from core.services.supabase import DBConnection
from core.utils.logger import logger

# Supported locales (must match frontend)
SUPPORTED_LOCALES = ["en", "de", "it"]
DEFAULT_LOCALE = "en"


async def get_user_locale(user_id: str, client=None) -> str:
    """
    Get user's preferred locale from auth.users.raw_user_meta_data.

    Uses the get_user_metadata RPC function which queries auth.users.
    If PostgREST schema cache hasn't refreshed yet, this will fail gracefully
    and default to English.
    """

    try:
        supabase_client = client
        if supabase_client is None:
            db = DBConnection()
            await db.initialize()
            supabase_client = await db.client

        result = await supabase_client.rpc(
            "get_user_metadata", {"user_id": user_id}
        ).execute()

        logger.debug(f"🔍 RPC result for user {user_id}: {result}")
        logger.debug(
            "🔍 RPC result.data type: %s, value: %s", type(result.data), result.data
        )

        metadata: Optional[dict] = None
        if result.data:
            if isinstance(result.data, dict):
                metadata = result.data
            elif isinstance(result.data, list) and result.data:
                first_entry = result.data[0]
                metadata = first_entry if isinstance(first_entry, dict) else {}
            else:
                metadata = {}
                logger.warning(
                    "⚠️ Unexpected result.data type for user %s: %s",
                    user_id,
                    type(result.data),
                )

            logger.debug(f"🔍 Parsed metadata object: {metadata}")
            logger.debug(
                "🔍 Metadata keys: %s",
                list(metadata.keys()) if isinstance(metadata, dict) else "N/A",
            )

            locale = metadata.get("locale") if isinstance(metadata, dict) else None
            logger.debug(f"🔍 Extracted locale value: {locale}")

            if locale and locale in SUPPORTED_LOCALES:
                logger.debug(
                    "✅ Found user locale preference: %s for user %s", locale, user_id
                )
                return locale

            if locale:
                logger.warning(
                    "⚠️ Invalid locale '%s' for user %s, not supported: %s",
                    locale,
                    user_id,
                    SUPPORTED_LOCALES,
                )

        logger.debug(
            "⚠️ No locale preference found for user %s, using default: %s",
            user_id,
            DEFAULT_LOCALE,
        )
        return DEFAULT_LOCALE

    except Exception as exc:
        error_msg = str(exc)
        if "PGRST202" in error_msg or "Could not find the function" in error_msg:
            logger.debug(
                "RPC function not yet available in PostgREST cache for user %s. "
                "This is normal immediately after migration.",
                user_id,
            )
        else:
            logger.warning("Error fetching user locale for user %s: %s", user_id, exc)
        return DEFAULT_LOCALE


def get_locale_context_prompt(locale: str) -> str:
    """
    Generate a locale-specific context prompt to add to the system prompt.
    """

    locale_instructions = {
        "en": """## LANGUAGE PREFERENCE
The user has set their preferred language to English. You should respond in English and use English terminology throughout your responses.""",
        "de": """## SPRACHPREFERENZ
Der Benutzer hat Deutsch als bevorzugte Sprache eingestellt. Sie sollten auf Deutsch antworten und durchgehend deutsche Terminologie verwenden. Alle Ihre Antworten, Erklärungen und Interaktionen sollten in deutscher Sprache erfolgen.""",
        "it": """## PREFERENZA LINGUISTICA
L'utente ha impostato l'italiano come lingua preferita. Dovresti rispondere in italiano e utilizzare terminologia italiana in tutte le tue risposte. Tutte le tue risposte, spiegazioni e interazioni dovrebbero essere in italiano.""",
    }

    return locale_instructions.get(locale, locale_instructions["en"])


