# Fix Implementado: Otimização Redis para Streaming

## Problema Identificado
- **LRANGE(0, -1)** buscava TODA a lista a cada atualização
- Com conversas longas, isso significa buscar centenas/milhares de itens
- Latência de 155ms era causada por listas grandes, não pelo Redis em si

## Solução Aplicada
1. **Batch limitado**: Agora busca apenas 50 novos itens por vez
   - Antes: `LRANGE(start, -1)` (todos os itens)
   - Depois: `LRANGE(start, start+49)` (máximo 50 itens)

## Outras Otimizações Possíveis (Sem Mudar Lógica)

### 1. Ajustar TTL das Listas
```python
# Em services/redis.py
REDIS_KEY_TTL = 3600  # 1 hora ao invés de 24h para listas de streaming
```

### 2. Configurar Limite de Lista
```python
# Adicionar após cada RPUSH
await redis.ltrim(response_list_key, -1000, -1)  # Manter apenas últimos 1000 items
```

### 3. Usar Pipeline para Comandos Múltiplos
```python
# Em run_agent_background_simple.py
async with redis.pipeline() as pipe:
    pipe.rpush(response_list_key, response_json)
    pipe.publish(response_channel, "new")
    await pipe.execute()
```

### 4. Configuração Upstash
No console Upstash:
- **Eviction Policy**: allkeys-lru
- **Max Memory**: Definir limite apropriado
- **Compression**: Habilitar se disponível

## Resultados Esperados
- Latência de LRANGE: de 155ms → ~10-20ms
- Streaming mais fluido e responsivo
- Menor uso de memória no Redis
- Melhor escalabilidade com conversas longas

## Monitoramento
Para verificar se funcionou:
```python
# Adicione temporariamente em agent/api.py
import time
start = time.time()
new_responses_json = await redis.lrange(...)
logger.info(f"LRANGE took {(time.time()-start)*1000:.0f}ms for {len(new_responses_json)} items")
```