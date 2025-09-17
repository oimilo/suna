# Otimizações de Streaming do Chat

## Problemas Identificados

1. **Overhead de Processamento por Chunk**
   - Cada chunk passa por múltiplas conversões JSON
   - Parsing desnecessário de metadata em cada iteração
   - Múltiplos yields por chunk

2. **Ineficiência do Redis**
   - Busca todos os itens da lista a cada novo sinal
   - Deveria buscar apenas os novos itens incrementalmente

3. **Buffering Não Otimizado**
   - Não há batching de chunks pequenos
   - Cada caractere pode gerar um evento separado

## Soluções Propostas

### 1. Implementar Micro-batching
```python
# Em response_processor.py
BATCH_SIZE = 5  # Acumular 5 chunks antes de enviar
BATCH_TIMEOUT = 0.1  # Ou enviar após 100ms

async def batch_chunks(chunks):
    buffer = []
    last_send = time.time()
    
    async for chunk in chunks:
        buffer.append(chunk)
        
        if len(buffer) >= BATCH_SIZE or (time.time() - last_send) > BATCH_TIMEOUT:
            yield merge_chunks(buffer)
            buffer = []
            last_send = time.time()
    
    if buffer:
        yield merge_chunks(buffer)
```

### 2. Otimizar Redis Polling
```python
# Em agent/api.py - linha ~846
# Ao invés de:
new_responses_json = await redis.lrange(response_list_key, new_start_index, -1)

# Usar:
# Buscar apenas um batch limitado
BATCH_LIMIT = 10
new_responses_json = await redis.lrange(response_list_key, new_start_index, new_start_index + BATCH_LIMIT - 1)
```

### 3. Reduzir JSON Operations
```python
# Criar um cache de JSON strings para evitar re-serialização
json_cache = {}

def cached_json_dumps(obj):
    key = id(obj)
    if key not in json_cache:
        json_cache[key] = json.dumps(obj)
    return json_cache[key]
```

### 4. Configuração de Streaming do LLM
```python
# Verificar se o modelo está configurado para streaming otimizado
stream_options = {
    "chunk_size": 20,  # Chunks maiores ao invés de caractere por caractere
    "buffer_size": 512,  # Buffer interno maior
}
```

### 5. Frontend - Debounce de Renderização
```javascript
// No frontend, fazer debounce da renderização
const RENDER_DELAY = 50; // ms
let renderTimeout;

function handleStreamChunk(chunk) {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(() => {
        renderContent(accumulatedContent);
    }, RENDER_DELAY);
}
```

## Impacto no Modelo LLM

O modelo LLM em si geralmente não é o gargalo principal. Os problemas são:
- **Latência de rede** entre o servidor e o provedor LLM
- **Overhead de processamento** no pipeline de streaming
- **Serialização/deserialização** excessiva

## Próximos Passos

1. Implementar micro-batching no response_processor.py
2. Otimizar o polling do Redis para buscar apenas novos itens
3. Adicionar métricas de timing para identificar gargalos específicos
4. Considerar WebSockets ao invés de SSE para comunicação bidirecional