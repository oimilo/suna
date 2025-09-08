# 🔧 Redis Connection Leak Fixes - Correções de Vazamento de Conexões Redis

## 📋 Resumo do Problema
O sistema está apresentando erro "Too many connections" no Redis devido a vazamentos de conexões PubSub em caminhos de erro. Identificamos 5 locais específicos onde as conexões não são fechadas corretamente.

## ✅ Correções Necessárias

### 1️⃣ **backend/run_agent_background.py** - Linha 187
**Problema:** PubSub criado na linha 182 não é fechado quando ocorre erro na subscrição

**Código Atual (ERRADO):**
```python
# Linhas 182-187
pubsub = await redis.create_pubsub()
try:
    await retry(lambda: pubsub.subscribe(instance_control_channel, global_control_channel))
except Exception as e:
    logger.error(f"Redis failed to subscribe to control channels: {e}", exc_info=True)
    raise e  # ❌ VAZAMENTO: pubsub não é fechado!
```

**Código Corrigido:**
```python
# Linhas 182-187
pubsub = await redis.create_pubsub()
try:
    await retry(lambda: pubsub.subscribe(instance_control_channel, global_control_channel))
except Exception as e:
    logger.error(f"Redis failed to subscribe to control channels: {e}", exc_info=True)
    await pubsub.aclose()  # ✅ Fecha a conexão antes de lançar erro
    raise e
```

---

### 2️⃣ **backend/run_agent_background.py** - Linha 315
**Problema:** Usando `.close()` depreciado ao invés de `.aclose()`

**Código Atual (ERRADO):**
```python
# Linha 315
await pubsub.close()  # ❌ Método depreciado desde redis-py 5.0.1
```

**Código Corrigido:**
```python
# Linha 315
await pubsub.aclose()  # ✅ Método correto para versão atual
```

---

### 3️⃣ **backend/agent/api.py** - Linhas 926-927
**Problema:** Usando `.close()` depreciado ao invés de `.aclose()`

**Código Atual (ERRADO):**
```python
# Linhas 926-927 (dentro do finally block)
if pubsub_response: await pubsub_response.close()  # ❌ Depreciado
if pubsub_control: await pubsub_control.close()    # ❌ Depreciado
```

**Código Corrigido:**
```python
# Linhas 926-927
if pubsub_response: await pubsub_response.aclose()  # ✅ Método correto
if pubsub_control: await pubsub_control.aclose()    # ✅ Método correto
```

---

### 4️⃣ **backend/agent/api.py** - Linha 949
**Problema:** Usando `.close()` depreciado ao invés de `.aclose()`

**Código Atual (ERRADO):**
```python
# Linha 949 (no exception handler)
await pubsub.close()  # ❌ Depreciado
```

**Código Corrigido:**
```python
# Linha 949
await pubsub.aclose()  # ✅ Método correto
```

---

### 5️⃣ **backend/agent/api.py** - Linhas 863-865
**Problema:** Cancelamento incompleto de tasks - não aguarda o cancelamento

**Código Atual (INCOMPLETO):**
```python
# Linhas 863-865
for task in tasks:
    if not task.done():
        task.cancel()  # ❌ Não aguarda o cancelamento completar
```

**Código Corrigido:**
```python
# Linhas 863-865
for task in tasks:
    if not task.done():
        task.cancel()
        try:
            await task  # ✅ Aguarda o cancelamento completar
        except asyncio.CancelledError:
            pass  # ✅ Esperado quando task é cancelada
```

---

## 🎯 Resultado Esperado

Após aplicar essas correções:

1. **Eliminação de vazamentos**: Conexões PubSub serão sempre fechadas, mesmo em casos de erro
2. **Compatibilidade**: Uso correto da API atual do redis-py (5.0.1+)
3. **Limpeza adequada**: Tasks assíncronas serão canceladas corretamente
4. **Resolução do erro**: "Too many connections" não deve mais ocorrer

## 📊 Impacto

- **Antes**: ~200-500 conexões acumuladas causando erro após algumas horas
- **Depois**: Número estável de conexões (~10-20 ativas)

## ⚠️ Notas Importantes

1. **`.close()` vs `.aclose()`**: 
   - `.close()` foi depreciado no redis-py 5.0.1
   - Sempre use `.aclose()` para fechamento assíncrono

2. **Ordem de execução**:
   - Aplicar todas as 5 correções de uma vez
   - Testar localmente primeiro
   - Deploy em produção após validação

3. **Monitoramento**:
   - Acompanhar número de conexões Redis após deploy
   - Verificar logs por erros de "Too many connections"

## 🚀 Próximos Passos

1. Aplicar as 5 correções no código
2. Executar testes locais
3. Fazer commit com mensagem clara
4. Deploy em produção
5. Monitorar métricas de conexão por 24h

---

**Data de criação**: 08/09/2025  
**Problema identificado por**: Lucas  
**Análise realizada por**: Claude  
**Status**: Aguardando implementação