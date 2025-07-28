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
        # Claude models
        "claude-3.5-sonnet": "openrouter/anthropic/claude-3.5-sonnet",
        "claude-sonnet-4": "openrouter/anthropic/claude-3.5-sonnet",
        "claude-3-opus": "openrouter/anthropic/claude-3-opus",
        
        # GPT models
        "gpt-4o": "openrouter/openai/gpt-4o",
        "gpt-4": "openrouter/openai/gpt-4",
        "gpt-3.5-turbo": "openrouter/openai/gpt-3.5-turbo",
        
        # Google models
        "gemini-pro": "openrouter/google/gemini-pro",
        "gemini-2.0-flash": "openrouter/google/gemini-2.0-flash-exp:free",
        
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