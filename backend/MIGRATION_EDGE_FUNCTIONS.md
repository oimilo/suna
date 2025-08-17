# 🚀 Migração Dramatiq → Supabase Edge Functions

## 📋 Status da Migração

### ✅ Concluído
- [x] Configurar Edge Function no Supabase (`run-agent-trigger`)
- [x] Adicionar TRIGGER_SECRET no Supabase
- [x] Adicionar variáveis no .env.local:
  - `TRIGGER_SECRET=sk_trigger_7f9a8b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0`
  - `SUPABASE_EDGE_FUNCTION_URL=https://siangdfgebkbmmkwjjob.supabase.co/functions/v1`

### 🔄 Em Progresso
- [x] Criar código da Edge Function
- [x] Criar endpoint interno `/internal/execute-agent`
- [x] Modificar `execution_service.py` para usar Edge Function
- [ ] Deploy da Edge Function no Supabase
- [ ] Testar execução de triggers

### 📝 Pendente
- [ ] Testar execução de triggers
- [ ] Remover worker do DigitalOcean
- [ ] Limpar código do Dramatiq
- [ ] Documentar nova arquitetura

## 🎯 Referência: Commit 2cba5392

### Mudanças principais do commit original:
1. **Autenticação via Secret Header**
   - Header: `x-trigger-secret`
   - Validação: `hmac.compare_digest()`
   
2. **Estrutura do Webhook**
   ```python
   # Validação do secret
   secret = os.getenv("TRIGGER_WEBHOOK_SECRET")
   incoming_secret = request.headers.get("x-trigger-secret", "")
   if not hmac.compare_digest(incoming_secret, secret):
       raise HTTPException(status_code=401, detail="Unauthorized")
   ```

3. **pg_cron para agendamentos** (futuro)
   - Extensions: `pg_cron` e `pg_net`
   - Função SQL para agendar HTTP requests

4. **Remoção do QStash**
   - Removidas variáveis QSTASH_*
   - Removido cliente QStash

## 🏗️ Arquitetura Nova

```
ANTES (Quebrado):
Webhook → API → Dramatiq → Redis (Upstash incompatível) → Worker

DEPOIS (Funcionando):
Webhook → API → Supabase Edge Function → API Interna → Executa Agent
```

## 📦 Arquivos a Modificar

### 1. Edge Function (`supabase/functions/run-agent-trigger/index.ts`)
```typescript
// TODO: Implementar
- Receber POST com agent_run_id, thread_id, etc
- Validar x-trigger-secret
- Chamar API interna
- Retornar status
```

### 2. API Interna (`backend/agent/internal_api.py`)
```python
# TODO: Criar novo arquivo
- Endpoint /internal/execute-agent
- Validar secret interno
- Executar run_agent diretamente
- Streaming via Redis
```

### 3. Execution Service (`backend/triggers/execution_service.py`)
```python
# TODO: Modificar
- Remover: from run_agent_background import run_agent_background
- Adicionar: chamada para Supabase Edge Function
- Método _start_agent_execution() modificado
```

### 4. Limpeza (`backend/run_agent_background.py`)
```python
# TODO: Manter mas simplificar
- Remover configuração Dramatiq
- Manter função para execução direta (chamada pelo internal API)
```

## 🔑 Variáveis de Ambiente

### Backend (.env.local)
```bash
TRIGGER_SECRET=sk_trigger_7f9a8b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0
SUPABASE_EDGE_FUNCTION_URL=https://siangdfgebkbmmkwjjob.supabase.co/functions/v1
WEBHOOK_BASE_URL=https://prophet-milo-f3hr5.ondigitalocean.app
```

### Supabase Edge Function
```bash
TRIGGER_SECRET=sk_trigger_7f9a8b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0
SUPABASE_SERVICE_ROLE_KEY=(já configurado)
SUPABASE_URL=(já configurado)
```

## 🧪 Plano de Testes

1. **Teste Local**
   - Criar trigger via API
   - Enviar webhook de teste
   - Verificar execução async

2. **Teste Produção**
   - Deploy do backend
   - Trigger real
   - Monitorar logs Supabase

## 📊 Benefícios da Migração

- ✅ Remove dependência do Dramatiq/RabbitMQ
- ✅ Elimina worker do DigitalOcean ($24/mês economia)
- ✅ Usa infraestrutura Supabase existente
- ✅ Mais confiável e escalável
- ✅ Logs centralizados no Supabase

## 🚨 Riscos e Mitigações

| Risco | Mitigação |
|-------|-----------|
| Timeout Edge Function (150s) | Dividir execuções longas |
| Falha na autenticação | Validação dupla de secrets |
| Perda de mensagens | Redis para backup temporário |

## 📝 Notas de Implementação

- Edge Function usa Deno/TypeScript
- Manter compatibilidade com SSE existente
- Redis continua para pub/sub de respostas
- Não afeta chat normal com agents

---

**Última atualização**: 2025-01-27
**Status**: 🔄 Em andamento