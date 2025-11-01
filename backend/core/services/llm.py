"""
LLM API interface for making calls to various language models.

This module provides a unified interface for making API calls to different LLM providers
using LiteLLM with simplified error handling and clean parameter management.
"""

from typing import Union, Dict, Any, Optional, AsyncGenerator, List
import os
import asyncio
from collections import deque
import litellm
from litellm.router import Router
from litellm.files.main import ModelResponse

try:
    from litellm import ContextWindowExceededError
except ImportError:
    ContextWindowExceededError = Exception
from core.utils.logger import logger
from core.utils.config import config
from core.agentpress.error_processor import ErrorProcessor
from core.ai_models.ai_models import ModelCapability

# Configure LiteLLM
# os.environ['LITELLM_LOG'] = 'DEBUG'
# litellm.set_verbose = True  # Enable verbose logging
litellm.modify_params = True
litellm.drop_params = True

# Enable additional debug logging
# import logging
# litellm_logger = logging.getLogger("LiteLLM")
# litellm_logger.setLevel(logging.DEBUG)

# Constants
MAX_RETRIES = 3
provider_router = None


class LLMError(Exception):
    """Exception for LLM-related errors."""
    pass

def setup_api_keys() -> None:
    """Set up API keys from environment variables."""
    providers = [
        "OPENAI",
        "ANTHROPIC",
        "GROQ",
        "OPENROUTER",
        "XAI",
        "MORPH",
        "GEMINI",
        "OPENAI_COMPATIBLE",
    ]
    for provider in providers:
        key = getattr(config, f"{provider}_API_KEY")
        if key:
            # logger.debug(f"API key set for provider: {provider}")
            pass
        else:
            logger.warning(f"No API key found for provider: {provider}")

    # Set up OpenRouter API base if not already set
    if config.OPENROUTER_API_KEY and config.OPENROUTER_API_BASE:
        os.environ["OPENROUTER_API_BASE"] = config.OPENROUTER_API_BASE
        # logger.debug(f"Set OPENROUTER_API_BASE to {config.OPENROUTER_API_BASE}")


def setup_provider_router(openai_compatible_api_key: str = None, openai_compatible_api_base: str = None):
    global provider_router
    model_list = [
        {
            "model_name": "openai-compatible/*", # support OpenAI-Compatible LLM provider
            "litellm_params": {
                "model": "openai/*",
                "api_key": openai_compatible_api_key or config.OPENAI_COMPATIBLE_API_KEY,
                "api_base": openai_compatible_api_base or config.OPENAI_COMPATIBLE_API_BASE,
            },
        },
        {
            "model_name": "*", # supported LLM provider by LiteLLM
            "litellm_params": {
                "model": "*",
            },
        },
    ]
    
    fallbacks = [
        # Prefer fallback para modelos Anthropic diretos quando o principal estiver indisponível
        {
            "anthropic/claude-sonnet-4-5-20250929": [
                "anthropic/claude-sonnet-4-20250514",
                "anthropic/claude-3-7-sonnet-latest"
            ]
        },
        {
            "claude-sonnet-4-5-20250929": [
                "anthropic/claude-sonnet-4-20250514",
                "anthropic/claude-3-7-sonnet-latest"
            ]
        },
        {
            "anthropic/claude-haiku-4-5-20251001": [
                "anthropic/claude-3.5-haiku",
                "anthropic/claude-sonnet-4-5-20250929",
                "deepseek/deepseek-chat-v3.1"
            ]
        },
        {
            "claude-haiku-4-5-20251001": [
                "anthropic/claude-3.5-haiku",
                "anthropic/claude-sonnet-4-5-20250929",
                "deepseek/deepseek-chat-v3.1"
            ]
        },
        {
            "anthropic/claude-3.5-haiku": [
                "anthropic/claude-sonnet-4-5-20250929",
                "anthropic/claude-sonnet-4-20250514"
            ]
        },
        {
            "claude-3.5-haiku": [
                "anthropic/claude-sonnet-4-5-20250929",
                "anthropic/claude-sonnet-4-20250514"
            ]
        },
        # Lightweight auxiliary model fallback: GPT-5-nano -> DeepSeek Chat v3.1
        {
            "openai/gpt-5-nano": [
                "openrouter/deepseek/deepseek-chat-v3.1"
            ]
        },
    ]
    
    provider_router = Router(
        model_list=model_list,
        retry_after=15,
        fallbacks=fallbacks,
    )
    
    logger.info(f"Configured LiteLLM Router with {len(fallbacks)} fallback rules")

def _configure_openai_compatible(params: Dict[str, Any], model_name: str, api_key: Optional[str], api_base: Optional[str]) -> None:
    """Configure OpenAI-compatible provider setup."""
    if not model_name.startswith("openai-compatible/"):
        return
    
    # Check if have required config either from parameters or environment
    if (not api_key and not config.OPENAI_COMPATIBLE_API_KEY) or (
        not api_base and not config.OPENAI_COMPATIBLE_API_BASE
    ):
        raise LLMError(
            "OPENAI_COMPATIBLE_API_KEY and OPENAI_COMPATIBLE_API_BASE is required for openai-compatible models. If just updated the environment variables, wait a few minutes or restart the service to ensure they are loaded."
        )
    
    setup_provider_router(api_key, api_base)
    logger.debug(f"Configured OpenAI-compatible provider with custom API base")

def _add_tools_config(params: Dict[str, Any], tools: Optional[List[Dict[str, Any]]], tool_choice: str) -> None:
    """Add tools configuration to parameters."""
    if tools is None:
        return
    
    params.update({
        "tools": tools,
        "tool_choice": tool_choice
    })
    # logger.debug(f"Added {len(tools)} tools to API parameters")


def _has_image_content(messages: List[Dict[str, Any]]) -> bool:
    """Detect if any message contains image content requiring a vision-capable model."""
    for message in messages or []:
        content = message.get("content")
        if isinstance(content, list):
            for item in content:
                if not isinstance(item, dict):
                    continue
                item_type = item.get("type")
                if item_type in {"image_url", "input_image", "image"}:
                    return True
                if item.get("image_url"):
                    return True
        elif isinstance(content, dict):
            item_type = content.get("type")
            if item_type in {"image_url", "input_image", "image"}:
                return True
            if content.get("image_url"):
                return True
    return False


async def make_llm_api_call(
    messages: List[Dict[str, Any]],
    model_name: str,
    response_format: Optional[Any] = None,
    temperature: float = 0,
    max_tokens: Optional[int] = None,
    tools: Optional[List[Dict[str, Any]]] = None,
    tool_choice: str = "auto",
    api_key: Optional[str] = None,
    api_base: Optional[str] = None,
    stream: bool = True,  # Always stream for better UX
    top_p: Optional[float] = None,
    model_id: Optional[str] = None,
    headers: Optional[Dict[str, str]] = None,
    extra_headers: Optional[Dict[str, str]] = None,
) -> Union[Dict[str, Any], AsyncGenerator, ModelResponse]:
    """Make an API call to a language model using LiteLLM."""
    logger.info(f"Making LLM API call to model: {model_name} with {len(messages)} messages")
    
    # Prepare parameters using centralized model configuration
    from core.ai_models import model_manager
    resolved_model_name = model_manager.resolve_model_id(model_name) or model_name
    original_model_name = resolved_model_name
    # logger.debug(f"Model resolution: '{model_name}' -> '{resolved_model_name}'")
    
    # Only pass headers/extra_headers if they are not None to avoid overriding model config
    override_params = {
        "messages": messages,
        "temperature": temperature,
        "response_format": response_format,
        "top_p": top_p,
        "stream": stream,
        "api_key": api_key,
        "api_base": api_base
    }
    
    # Only add headers if they are provided (not None)
    if headers is not None:
        override_params["headers"] = headers
    if extra_headers is not None:
        override_params["extra_headers"] = extra_headers
    
    try:
        preferred_vision_model_id = "openai/gpt-4o-mini"
        contains_images = _has_image_content(messages)

        model_queue = deque()
        attempted_models = set()

        def enqueue(target_model: Optional[str], *, front: bool = False):
            if not target_model:
                return
            canonical = model_manager.resolve_model_id(target_model) or target_model
            if canonical in attempted_models:
                return
            if canonical in model_queue:
                return
            if front:
                model_queue.appendleft(canonical)
            else:
                model_queue.append(canonical)

        preferred_model_canonical = model_manager.resolve_model_id(preferred_vision_model_id) or preferred_vision_model_id

        preferred_candidates_raw = [
            preferred_vision_model_id,
            "openai/gpt-4o",
            "gemini/gemini-2.5-flash-lite",
            "openrouter/google/gemini-2.5-flash-lite",
        ]

        preferred_candidates: List[str] = []
        for candidate in preferred_candidates_raw:
            canonical = model_manager.resolve_model_id(candidate) or candidate
            model_entry = model_manager.get_model(canonical)
            if model_entry and model_entry.supports_vision:
                preferred_candidates.append(canonical)

        forced_preferred = False
        if contains_images and config.OPENAI_API_KEY and model_manager.get_model(preferred_model_canonical):
            if preferred_model_canonical != original_model_name:
                enqueue(preferred_model_canonical, front=True)
                forced_preferred = True
        enqueue(original_model_name)

        if not model_queue:
            enqueue(resolved_model_name)

        last_exception: Optional[Exception] = None

        while model_queue:
            current_model = model_queue.popleft()
            attempted_models.add(current_model)

            try:
                params = model_manager.get_litellm_params(current_model, **override_params)

                if model_id:
                    params["model_id"] = model_id

                if stream:
                    params["stream_options"] = {"include_usage": True}

                _configure_openai_compatible(params, current_model, api_key, api_base)
                _add_tools_config(params, tools, tool_choice)

                response = await provider_router.acompletion(**params)

                if hasattr(response, '__aiter__') and stream:
                    return _wrap_streaming_response(response)

                return response

            except Exception as e:
                last_exception = e
                error_message = str(e)

                # Handle context window overflow by retrying with larger-context models
                if isinstance(e, ContextWindowExceededError) or "prompt is too long" in error_message.lower():
                    logger.warning(
                        "Context window exceeded for model '%s' (%s). Attempting larger-context fallbacks.",
                        current_model,
                        error_message
                    )
                    large_context_fallbacks = [
                        "anthropic/claude-3.5-haiku",
                        "anthropic/claude-sonnet-4-5-20250929",
                        "anthropic/claude-sonnet-4-20250514",
                        "anthropic/claude-3-7-sonnet-latest"
                    ]
                    for candidate in large_context_fallbacks:
                        enqueue(candidate)
                    if model_queue:
                        continue

                if forced_preferred and current_model == (model_manager.resolve_model_id(preferred_vision_model_id) or preferred_vision_model_id):
                    logger.warning(
                        f"Vision preference '{current_model}' failed ({error_message}). "
                        "Falling back to user-selected model."
                    )
                    forced_preferred = False
                    if original_model_name not in attempted_models:
                        enqueue(original_model_name, front=True)
                        continue

                if contains_images and "image input" in error_message.lower():
                    for candidate in preferred_candidates:
                        enqueue(candidate)

                    fallback_model = model_manager.select_best_model(
                        tier="free",
                        required_capabilities=[ModelCapability.VISION],
                        prefer_cheaper=True
                    )
                    if fallback_model and fallback_model.id not in attempted_models:
                        enqueue(fallback_model.id)

                    fallback_model_paid = model_manager.select_best_model(
                        tier="paid",
                        required_capabilities=[ModelCapability.VISION],
                        prefer_cheaper=True
                    )
                    if fallback_model_paid and fallback_model_paid.id not in attempted_models:
                        enqueue(fallback_model_paid.id)

                if model_queue:
                    continue

                raise e

        if last_exception:
            raise last_exception
        
    except Exception as e:
        error_message = str(e)

        if "image input" in error_message.lower():
            current_model = model_manager.get_model(resolved_model_name)
            needs_vision_fallback = (not current_model) or (not current_model.supports_vision)

            if needs_vision_fallback:
                preferred_ids = [
                    "openai/gpt-4o-mini",
                    "openai/gpt-4o",
                    "gemini/gemini-2.5-flash-lite",
                    "openrouter/google/gemini-2.5-flash-lite",
                ]

                fallback_model = None
                for candidate_id in preferred_ids:
                    candidate = model_manager.get_model(candidate_id)
                    if candidate and candidate.supports_vision and candidate.id != resolved_model_name:
                        fallback_model = candidate
                        break

                if (not fallback_model):
                    fallback_model = model_manager.select_best_model(
                        tier="free",
                        required_capabilities=[ModelCapability.VISION],
                        prefer_cheaper=True
                    )

                if (not fallback_model) or fallback_model.id == resolved_model_name:
                    fallback_model = model_manager.select_best_model(
                        tier="paid",
                        required_capabilities=[ModelCapability.VISION],
                        prefer_cheaper=True
                    )

                if fallback_model and fallback_model.id != resolved_model_name:
                    logger.warning(
                        f"🔄 Vision fallback: model '{resolved_model_name}' rejected image input. "
                        f"Retrying with '{fallback_model.id}'."
                    )
                    try:
                        resolved_model_name = fallback_model.id
                        params = model_manager.get_litellm_params(resolved_model_name, **override_params)

                        if model_id:
                            params["model_id"] = model_id

                        if stream:
                            params["stream_options"] = {"include_usage": True}

                        _configure_openai_compatible(params, resolved_model_name, api_key, api_base)
                        _add_tools_config(params, tools, tool_choice)

                        response = await provider_router.acompletion(**params)

                        if hasattr(response, '__aiter__') and stream:
                            return _wrap_streaming_response(response)

                        return response
                    except Exception as fallback_error:
                        logger.error(
                            f"Vision fallback model '{fallback_model.id}' failed: {fallback_error}"
                        )
                        e = fallback_error

        # Use ErrorProcessor to handle the error consistently
        processed_error = ErrorProcessor.process_llm_error(e, context={"model": model_name})
        ErrorProcessor.log_error(processed_error)
        raise LLMError(processed_error.message)

async def _wrap_streaming_response(response) -> AsyncGenerator:
    """Wrap streaming response to handle errors during iteration."""
    try:
        async for chunk in response:
            yield chunk
    except Exception as e:
        # Convert streaming errors to processed errors
        processed_error = ErrorProcessor.process_llm_error(e)
        ErrorProcessor.log_error(processed_error)
        raise LLMError(processed_error.message)

setup_api_keys()
setup_provider_router()


if __name__ == "__main__":
    from litellm import completion
    import os

    setup_api_keys()

    response = completion(
        model="bedrock/anthropic.claude-sonnet-4-20250115-v1:0",
        messages=[{"role": "user", "content": "Hello! Testing 1M context window."}],
        max_tokens=100,
        extra_headers={
            "anthropic-beta": "context-1m-2025-08-07"  # 👈 Enable 1M context
        }
    )
