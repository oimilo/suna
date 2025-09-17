# Otimizações Seguras para Redis (Sem Mudar Lógica)

## 1. Reduzir TTL das Listas
```bash
# Adicionar ao .env
REDIS_RESPONSE_LIST_TTL=3600  # 1 hora ao invés de 24h
```

## 2. Limpar Listas Antigas Automaticamente
Criar um job que limpa listas antigas:
```python
# cleanup_redis.py
async def cleanup_old_lists():
    pattern = "agent_run:*:responses"
    keys = await redis.keys(pattern)
    
    for key in keys:
        # Verificar se a lista tem mais de 1h
        ttl = await redis.ttl(key)
        if ttl < 0:  # Sem TTL definido
            await redis.expire(key, 3600)
```

## 3. Usar Redis com Mais Memória
No Upstash:
- Fazer upgrade para plano com mais memória
- Isso permite listas maiores sem lentidão

## 4. Otimizar no Frontend
```javascript
// Processar chunks em batch no frontend
let buffer = [];
let processTimeout;

function handleChunk(chunk) {
    buffer.push(chunk);
    
    clearTimeout(processTimeout);
    processTimeout = setTimeout(() => {
        // Processar todos os chunks de uma vez
        processBuffer(buffer);
        buffer = [];
    }, 50); // 50ms delay
}
```

## 5. Compressão de Mensagens
```python
import zlib
import base64

# Comprimir antes de salvar
def compress_message(msg):
    json_str = json.dumps(msg)
    compressed = zlib.compress(json_str.encode())
    return base64.b64encode(compressed).decode()

# Descomprimir ao ler
def decompress_message(compressed_str):
    compressed = base64.b64decode(compressed_str)
    json_str = zlib.decompress(compressed).decode()
    return json.loads(json_str)
```

## 6. Monitorar e Alertar
```python
# Adicionar monitoramento
async def check_list_size(key):
    size = await redis.llen(key)
    if size > 1000:
        logger.warning(f"Large Redis list detected: {key} has {size} items")
```

## 7. Configuração do Upstash
- **Eviction Policy**: `volatile-lru` (remove keys com TTL quando cheio)
- **Compression**: Habilitar se disponível no plano
- **Persistence**: Desabilitar para melhor performance

## Conclusão
Essas otimizações não mudam a lógica do Suna e são 100% seguras de implementar. O maior impacto virá de:
1. Reduzir TTL
2. Frontend com batching
3. Mais memória no Redis