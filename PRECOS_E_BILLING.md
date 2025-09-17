# Guia de Preços e Billing do Prophet

## 1. Como funciona a tabela messages

A tabela `messages` é **populada automaticamente** pelo sistema quando os usuários usam o chat:

### Estrutura da tabela
```sql
CREATE TABLE messages (
    message_id UUID PRIMARY KEY,
    thread_id UUID NOT NULL,
    type TEXT NOT NULL,
    content JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE,
    ...
);
```

### Dados de consumo
Quando uma conversa termina, o sistema salva automaticamente uma mensagem do tipo `assistant_response_end` com:

```json
{
  "type": "assistant_response_end",
  "content": {
    "usage": {
      "prompt_tokens": 1000,
      "completion_tokens": 500,
      "total_tokens": 1500
    },
    "model": "anthropic/claude-sonnet-4-20250514",
    ...
  }
}
```

**Você NÃO precisa popular esta tabela manualmente**. Ela é preenchida automaticamente conforme os usuários usam o sistema.

## 2. Como atualizar os preços dos modelos

Os preços dos modelos são definidos em **dois lugares**:

### A. Arquivo principal: `/backend/utils/constants.py`

```python
MODELS = {
    "anthropic/claude-sonnet-4-20250514": {
        "aliases": ["claude-sonnet-4"],
        "pricing": {
            "input_cost_per_million_tokens": 3.00,   # $3 por milhão de tokens
            "output_cost_per_million_tokens": 15.00   # $15 por milhão de tokens
        },
        "tier_availability": ["free", "paid"]
    },
    ...
}
```

### B. Multiplicador de preço: `/backend/services/billing.py`

```python
TOKEN_PRICE_MULTIPLIER = 1.5  # Aplica 50% de margem sobre o custo base
```

### Como calcular o preço final:
- Preço base do modelo: $3/milhão tokens entrada
- Com multiplicador 1.5x: $4.50/milhão tokens entrada

## 3. Passos para atualizar preços

### Opção 1: Mudar preço de um modelo específico
Edite o arquivo `/backend/utils/constants.py`:

```python
"openai/gpt-4o": {
    "pricing": {
        "input_cost_per_million_tokens": 2.50,   # Mude este valor
        "output_cost_per_million_tokens": 10.00   # E este
    },
}
```

### Opção 2: Mudar a margem de lucro global
Edite o arquivo `/backend/services/billing.py`:

```python
TOKEN_PRICE_MULTIPLIER = 2.0  # Muda de 1.5x para 2.0x (100% de margem)
```

### Opção 3: Adicionar novo modelo
Em `/backend/utils/constants.py`, adicione:

```python
"novo-modelo/nome": {
    "aliases": ["novo-modelo"],
    "pricing": {
        "input_cost_per_million_tokens": 5.00,
        "output_cost_per_million_tokens": 20.00
    },
    "tier_availability": ["paid"]  # ou ["free", "paid"]
}
```

## 4. Verificar consumo atual

Para ver o consumo de um usuário:

1. **Via API**:
   ```
   GET /api/billing/usage-logs
   ```

2. **Via banco de dados**:
   ```sql
   -- Ver todas as mensagens de consumo do mês atual
   SELECT 
       thread_id,
       content->>'model' as model,
       content->'usage'->>'prompt_tokens' as prompt_tokens,
       content->'usage'->>'completion_tokens' as completion_tokens,
       created_at
   FROM messages 
   WHERE type = 'assistant_response_end'
   AND created_at >= date_trunc('month', CURRENT_DATE)
   ORDER BY created_at DESC;
   ```

## 5. Resetar ou ajustar consumo

**ATENÇÃO**: O sistema calcula o consumo baseado nas mensagens existentes. Para ajustar:

1. **Deletar consumo antigo** (cuidado!):
   ```sql
   -- Remove registros de consumo de um período específico
   DELETE FROM messages 
   WHERE type = 'assistant_response_end'
   AND created_at < '2025-01-01';
   ```

2. **Criar crédito manual** (não recomendado - melhor usar Stripe):
   - Ajuste o plano do usuário no Stripe
   - Ou crie um sistema de créditos separado

## 6. Monitoramento

Para monitorar o consumo:

```sql
-- Consumo total por modelo este mês
SELECT 
    content->>'model' as model,
    COUNT(*) as num_calls,
    SUM((content->'usage'->>'total_tokens')::int) as total_tokens
FROM messages 
WHERE type = 'assistant_response_end'
AND created_at >= date_trunc('month', CURRENT_DATE)
GROUP BY content->>'model'
ORDER BY total_tokens DESC;
```

## 7. Importante

- A tabela `messages` é **auto-populada** - não precisa inserir dados manualmente
- O sistema usa data UTC para cálculos mensais
- Há um cutoff date em 30/06/2025 09:00 UTC - consumo antes disso é ignorado
- O multiplicador de 1.5x é aplicado globalmente a todos os modelos
- Os preços em `/backend/utils/constants.py` devem ser os custos reais dos provedores