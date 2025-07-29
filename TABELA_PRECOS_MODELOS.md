# Tabela de Preços dos Modelos AI - Prophet

## Modelos Ativos (com preços base antes do multiplicador 1.5x)

### Modelos Free + Paid

| Modelo | Entrada ($/milhão tokens) | Saída ($/milhão tokens) | Tier |
|--------|---------------------------|-------------------------|------|
| **Claude Sonnet 4** | $3.00 | $15.00 | Free + Paid |
| `anthropic/claude-sonnet-4-20250514` | | | |
| **Kimi K2** | $1.00 | $3.00 | Free + Paid |
| `openrouter/moonshotai/kimi-k2` | | | |
| **DeepSeek Chat** | $0.14 | $0.28 | Free + Paid |
| `openrouter/deepseek/deepseek-chat` | | | |

### Modelos Somente Paid

| Modelo | Entrada ($/milhão tokens) | Saída ($/milhão tokens) | Tier |
|--------|---------------------------|-------------------------|------|
| **Grok 4** | $5.00 | $15.00 | Paid |
| `xai/grok-4` | | | |
| **Gemini 2.5 Pro** | $1.25 | $10.00 | Paid |
| `gemini/gemini-2.5-pro` | | | |
| **GPT-4o** | $2.50 | $10.00 | Paid |
| `openai/gpt-4o` | | | |
| **GPT-4.1** | $15.00 | $60.00 | Paid |
| `openai/gpt-4.1` | | | |
| **GPT-4.1 Mini** | $1.50 | $6.00 | Paid |
| `openai/gpt-4.1-mini` | | | |
| **Claude 3.7 Sonnet** | $3.00 | $15.00 | Paid |
| `anthropic/claude-3-7-sonnet-latest` | | | |
| **Claude 3.5 Sonnet** | $3.00 | $15.00 | Paid |
| `anthropic/claude-3-5-sonnet-latest` | | | |

## Modelos Comentados (não ativos)

| Modelo | Entrada ($/milhão tokens) | Saída ($/milhão tokens) | Status |
|--------|---------------------------|-------------------------|--------|
| DeepSeek Chat (antiga) | $0.38 | $0.89 | Comentado |
| Qwen3 235B | $0.13 | $0.60 | Comentado |
| Gemini Flash 2.5 | $0.15 | $0.60 | Comentado |
| DeepSeek Chat v3 | $0.38 | $0.89 | Comentado |

## Cálculo do Preço Final para o Usuário

**Multiplicador atual: 1.5x**

### Exemplos:
- **Claude Sonnet 4**: 
  - Entrada: $3.00 × 1.5 = **$4.50/milhão tokens**
  - Saída: $15.00 × 1.5 = **$22.50/milhão tokens**

- **DeepSeek Chat** (mais barato):
  - Entrada: $0.14 × 1.5 = **$0.21/milhão tokens**
  - Saída: $0.28 × 1.5 = **$0.42/milhão tokens**

- **GPT-4.1** (mais caro):
  - Entrada: $15.00 × 1.5 = **$22.50/milhão tokens**
  - Saída: $60.00 × 1.5 = **$90.00/milhão tokens**

## Comparação de Custos

### Para 1 milhão de tokens de entrada + 500k tokens de saída:

| Modelo | Custo Base | Custo com 1.5x | 
|--------|------------|----------------|
| DeepSeek Chat | $0.28 | $0.42 |
| Kimi K2 | $2.50 | $3.75 |
| Gemini 2.5 Pro | $6.25 | $9.38 |
| Claude Sonnet 4 | $10.50 | $15.75 |
| GPT-4o | $7.50 | $11.25 |
| GPT-4.1 | $45.00 | $67.50 |

## Notas Importantes

1. **Todos os preços são em USD**
2. **O multiplicador 1.5x é aplicado globalmente** em `/backend/services/billing.py`
3. **Modelos Free**: Disponíveis no plano gratuito ($5 de crédito)
4. **Modelos Paid**: Disponíveis apenas em planos pagos
5. **Para ativar modelos comentados**: Remova os comentários em `/backend/utils/constants.py`

## Como o Sistema Escolhe Preços

1. Primeiro verifica em `HARDCODED_MODEL_PRICES` (do arquivo constants.py)
2. Se não encontrar, usa a biblioteca `litellm` como fallback
3. Aplica o multiplicador 1.5x
4. Calcula o custo total baseado nos tokens usados