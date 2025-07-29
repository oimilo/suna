# Planos de Preços - Prophet

## 💎 Estrutura de Planos

### 🆓 **Gratuito**
- **Preço**: R$ 0
- **Modelos disponíveis**:
  - DeepSeek-V3 (rápido e eficiente)
  - Kimi (k1.5-72b - bom para tarefas longas)
- **Limites**:
  - 50 mensagens/dia
  - 2 agentes customizados
  - Integrações básicas (5 ferramentas)
- **Ideal para**: Testar a plataforma

### 🚀 **Starter**
- **Preço**: R$ 29/mês
- **Modelos disponíveis**:
  - Todos do plano Gratuito +
  - GPT-3.5 Turbo
  - Claude 3 Haiku
  - Gemini 1.5 Flash
- **Limites**:
  - 1.000 mensagens/mês
  - 5 agentes customizados
  - Todas as integrações
  - Histórico de 30 dias
- **Ideal para**: Uso pessoal e pequenos projetos

### 💼 **Pro**
- **Preço**: R$ 99/mês
- **Modelos disponíveis**:
  - Todos do Starter +
  - GPT-4o
  - Claude 3.5 Sonnet
  - Gemini 1.5 Pro
  - Llama 3.1 405B
- **Limites**:
  - 5.000 mensagens/mês
  - 20 agentes customizados
  - Workflows ilimitados
  - Histórico de 90 dias
  - Prioridade no suporte
- **Ideal para**: Profissionais e pequenas empresas

### 🏢 **Business**
- **Preço**: R$ 299/mês
- **Modelos disponíveis**:
  - Todos os modelos disponíveis
  - Incluindo GPT-4 Turbo
  - Claude 3 Opus
  - Modelos customizados
- **Limites**:
  - 20.000 mensagens/mês
  - Agentes ilimitados
  - API access
  - Histórico ilimitado
  - Suporte prioritário
  - White-label básico
- **Ideal para**: Empresas e equipes

### 🏆 **Enterprise**
- **Preço**: Personalizado
- **Recursos**:
  - Volume ilimitado
  - SLA garantido
  - Deploy on-premise
  - White-label completo
  - Treinamento personalizado
  - Gerente de conta dedicado

## 💰 Comparação com Concorrentes

| Recurso | Prophet | ChatGPT Plus | Claude Pro |
|---------|---------|--------------|------------|
| Preço | R$ 29-299 | R$ 100 | R$ 100 |
| Múltiplos Modelos | ✅ | ❌ | ❌ |
| Agentes Customizados | ✅ | ⚠️ | ❌ |
| Integrações | ✅ 2700+ | ⚠️ Limitado | ❌ |
| Workflows | ✅ | ❌ | ❌ |

## 🎯 Estratégia de Preços

### Por que esses valores?
1. **Gratuito**: Gerar adoção, testar produto
2. **R$ 29**: Menor que Netflix, acessível para pessoas físicas
3. **R$ 99**: Menor que ChatGPT Plus, mais recursos
4. **R$ 299**: Preço de SaaS B2B brasileiro típico

### Custos estimados por usuário:
- **API costs** (média):
  - Gratuito: ~R$ 2/mês
  - Starter: ~R$ 10/mês
  - Pro: ~R$ 40/mês
  - Business: ~R$ 150/mês

### Margens:
- Starter: 65% margem
- Pro: 60% margem
- Business: 50% margem

## 🔧 Implementação no Stripe

### Produtos:
```javascript
// Stripe Product IDs
const PRODUCTS = {
  starter: 'prod_starter_prophet',
  pro: 'prod_pro_prophet',
  business: 'prod_business_prophet'
}

// Price IDs (BRL)
const PRICES = {
  starter_monthly: 'price_starter_2900',
  pro_monthly: 'price_pro_9900',
  business_monthly: 'price_business_29900'
}
```

### Metadados por plano:
```json
{
  "starter": {
    "message_limit": 1000,
    "agent_limit": 5,
    "models": ["deepseek-v3", "kimi", "gpt-3.5-turbo", "claude-3-haiku"],
    "features": ["all_integrations", "30_day_history"]
  }
}
```

## 📊 Projeções

### Conversão esperada:
- Free → Starter: 5%
- Starter → Pro: 20%
- Pro → Business: 10%

### MRR em 12 meses (1000 usuários):
- 50 Starter: R$ 1.450
- 40 Pro: R$ 3.960
- 10 Business: R$ 2.990
- **Total MRR**: R$ 8.400

## 🚀 Diferenciais

1. **Múltiplos modelos** em todos os planos pagos
2. **Preço em Real** sem surpresas
3. **Foco em automação** não só chat
4. **Integrações brasileiras** (em desenvolvimento)

## 📝 Próximos Passos

1. Criar produtos no Stripe
2. Implementar billing_manager.py
3. Adicionar limites no backend
4. Criar página de pricing
5. Implementar upgrade/downgrade flow