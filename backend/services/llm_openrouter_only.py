"""
Configuração para forçar uso exclusivo do OpenRouter
"""

def force_openrouter_prefix(model_name: str) -> str:
    """
    Mapeia modelos para IDs compatíveis com OpenRouter.
    NOTA: OpenRouter não usa mais o prefixo 'openrouter/' - usa diretamente provider/model
    """
    if not model_name:
        return "google/gemini-2.5-pro"  # Agente padrão
    
    # Se já está no formato provider/model correto para OpenRouter, retorna como está
    openrouter_providers = ["anthropic/", "google/", "openai/", "meta-llama/", "x-ai/", "deepseek/", "nousresearch/"]
    if any(model_name.startswith(provider) for provider in openrouter_providers):
        return model_name
    
    # Mapeamento de modelos comuns para OpenRouter
    model_mappings = {
        # Claude models - todos os formatos possíveis
        "claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
        "anthropic/claude-3.5-sonnet": "anthropic/claude-3.5-sonnet",
        "anthropic/claude-3-5-sonnet-latest": "anthropic/claude-3.5-sonnet",
        "claude-sonnet-4": "anthropic/claude-sonnet-4",  # Claude 4 real
        "claude-sonnet-4-20250514": "anthropic/claude-sonnet-4",  # Claude 4 real
        "claude-sonnet-4-0": "anthropic/claude-sonnet-4",  # Claude 4 real
        "anthropic/claude-sonnet-4-20250514": "anthropic/claude-sonnet-4",  # Claude 4 real
        "anthropic/claude-sonnet-4": "anthropic/claude-sonnet-4",  # Claude 4 real
        "anthropic/claude-3-7-sonnet-latest": "anthropic/claude-3.7-sonnet",
        "sonnet-3.7": "anthropic/claude-3.7-sonnet",
        "sonnet-3.5": "anthropic/claude-3.5-sonnet",
        "claude-3-opus": "anthropic/claude-3-opus",
        
        # GPT models
        "gpt-4o": "openai/gpt-4o",
        "openai/gpt-4o": "openai/gpt-4o",
        "gpt-4.1": "openai/gpt-4.1",
        "openai/gpt-4.1": "openai/gpt-4.1",
        "gpt-4.1-mini": "openai/gpt-4.1-mini",
        "openai/gpt-4.1-mini": "openai/gpt-4.1-mini",
        "gpt-4.1-nano": "openai/gpt-4.1-nano",
        "openai/gpt-4.1-nano": "openai/gpt-4.1-nano",
        "gpt-4o-mini": "openai/gpt-4o-mini",
        "openai/gpt-4o-mini": "openai/gpt-4o-mini",
        "gpt-4": "openai/gpt-4",
        "openai/gpt-4": "openai/gpt-4",
        "gpt-3.5-turbo": "openai/gpt-3.5-turbo",
        
        # Google models
        "gemini-2.5-pro": "google/gemini-2.5-pro",
        "gemini/gemini-2.5-pro": "google/gemini-2.5-pro",
        "google/gemini-2.5-pro": "google/gemini-2.5-pro",
        "gemini-pro": "google/gemini-pro-1.5",
        "gemini-2.0-flash": "google/gemini-exp-1121:free",
        
        # xAI Grok models
        "xai/grok-4": "x-ai/grok-beta",  # Mapear para beta disponível
        "grok-4": "x-ai/grok-beta",
        "x-ai/grok-4": "x-ai/grok-beta",
        
        # DeepSeek models
        "deepseek/deepseek-chat": "deepseek/deepseek-chat",
        "deepseek-chat": "deepseek/deepseek-chat",
        "deepseek/deepseek-chat-v3-0324": "deepseek/deepseek-chat",
        "deepseek-v3": "deepseek/deepseek-chat",
        
        # Moonshot/Kimi
        "moonshotai/kimi-k2": "moonshotai/kimi-k2",
        
        # Others
        "llama-3.1-70b": "meta-llama/llama-3.1-70b-instruct",
        "mixtral-8x7b": "mistralai/mixtral-8x7b-instruct",
    }
    
    # Se tem mapeamento direto, usa
    if model_name in model_mappings:
        return model_mappings[model_name]
    
    # Se já está no formato provider/model, retorna como está
    if "/" in model_name:
        return model_name
    
    # Fallback - usa Gemini 2.5 Pro (agente padrão)
    return "google/gemini-2.5-pro"