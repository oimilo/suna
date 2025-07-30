"""
Configuração para forçar uso exclusivo do OpenRouter
"""

def force_openrouter_prefix(model_name: str) -> str:
    """
    Garante que todos os modelos usem o prefixo openrouter/
    """
    if not model_name:
        return "openrouter/anthropic/claude-3.5-sonnet"
    
    # Se já tem openrouter/, retorna como está
    if model_name.startswith("openrouter/"):
        return model_name
    
    # Mapeamento de modelos comuns para OpenRouter
    model_mappings = {
        # Claude models - todos os formatos possíveis
        "claude-3.5-sonnet": "openrouter/anthropic/claude-3.5-sonnet",
        "anthropic/claude-3.5-sonnet": "openrouter/anthropic/claude-3.5-sonnet",
        "anthropic/claude-3-5-sonnet-latest": "openrouter/anthropic/claude-3.5-sonnet",
        "claude-sonnet-4": "openrouter/anthropic/claude-3.5-sonnet",  # Mapear para 3.5 que existe
        "anthropic/claude-sonnet-4-20250514": "openrouter/anthropic/claude-3.5-sonnet",  # Mapear para 3.5
        "anthropic/claude-3-7-sonnet-latest": "openrouter/anthropic/claude-3.7-sonnet",
        "sonnet-3.7": "openrouter/anthropic/claude-3.7-sonnet",
        "sonnet-3.5": "openrouter/anthropic/claude-3.5-sonnet",
        "claude-3-opus": "openrouter/anthropic/claude-3-opus",
        
        # GPT models
        "gpt-4o": "openrouter/openai/gpt-4o",
        "openai/gpt-4o": "openrouter/openai/gpt-4o",
        "gpt-4.1": "openrouter/openai/gpt-4",  # Mapear 4.1 para 4
        "openai/gpt-4.1": "openrouter/openai/gpt-4",
        "gpt-4.1-mini": "openrouter/openai/gpt-4o-mini",
        "openai/gpt-4.1-mini": "openrouter/openai/gpt-4o-mini",
        "gpt-4": "openrouter/openai/gpt-4",
        "openai/gpt-4": "openrouter/openai/gpt-4",
        "gpt-3.5-turbo": "openrouter/openai/gpt-3.5-turbo",
        
        # Google models
        "gemini/gemini-2.5-pro": "openrouter/google/gemini-pro-1.5",  # Mapear para versão disponível
        "google/gemini-2.5-pro": "openrouter/google/gemini-pro-1.5",
        "gemini-pro": "openrouter/google/gemini-pro-1.5",
        "gemini-2.0-flash": "openrouter/google/gemini-exp-1121:free",
        
        # xAI Grok models
        "xai/grok-4": "openrouter/x-ai/grok-beta",  # Mapear para beta disponível
        "grok-4": "openrouter/x-ai/grok-beta",
        "x-ai/grok-4": "openrouter/x-ai/grok-beta",
        
        # DeepSeek models
        "deepseek/deepseek-chat": "openrouter/deepseek/deepseek-chat",
        "deepseek-chat": "openrouter/deepseek/deepseek-chat",
        "deepseek/deepseek-chat-v3-0324": "openrouter/deepseek/deepseek-chat",
        "deepseek-v3": "openrouter/deepseek/deepseek-chat",
        
        # Moonshot/Kimi
        "moonshotai/kimi-k2": "openrouter/moonshotai/kimi-k2",
        
        # Others
        "llama-3.1-70b": "openrouter/meta-llama/llama-3.1-70b-instruct",
        "mixtral-8x7b": "openrouter/mistralai/mixtral-8x7b-instruct",
    }
    
    # Se tem mapeamento direto, usa
    if model_name in model_mappings:
        return model_mappings[model_name]
    
    # Tenta adicionar prefixo openrouter/
    # Assume formato provider/model
    if "/" in model_name:
        return f"openrouter/{model_name}"
    
    # Fallback - usa Claude 3.5 Sonnet
    return "openrouter/anthropic/claude-3.5-sonnet"