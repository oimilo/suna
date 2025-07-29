"""
Teste para verificar se todos os modelos estão usando OpenRouter
"""
from services.llm_openrouter_only import force_openrouter_prefix

# Testa diferentes formatos de modelo
test_models = [
    "claude-3.5-sonnet",
    "gpt-4o", 
    "openrouter/anthropic/claude-3.5-sonnet",
    "anthropic/claude-3-opus",
    "gemini-pro",
    "llama-3.1-70b",
    "",  # vazio
    None,  # None
]

print("Testando conversão de modelos para OpenRouter:\n")

for model in test_models:
    converted = force_openrouter_prefix(model if model else "")
    print(f"'{model}' -> '{converted}'")