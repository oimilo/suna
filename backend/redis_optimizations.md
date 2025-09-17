# Otimizações Redis (Upstash) sem Mudar o Código

## Configurações do Upstash

### 1. Verificar Região
O Upstash permite múltiplas regiões. A latência pode variar de 5ms (mesma região) para 200ms+ (região distante).

**Como verificar:**
1. Acesse console.upstash.com
2. Veja a região do seu database
3. Compare com a região do seu servidor

### 2. Habilitar Eviction Policy
No console Upstash, configure:
- **Eviction**: allkeys-lru (remove chaves menos usadas quando cheio)
- **Max Memory Policy**: Defina um limite apropriado

### 3. Usar Edge Caching (Upstash Pro)
O Upstash Pro oferece edge caching global que reduz latência significativamente.

## Otimizações de Configuração

### 1. Pipeline de Comandos
Ao invés de múltiplos comandos separados, use pipeline:

```python
# Em vez de:
await redis.rpush(key, value1)
await redis.publish(channel, "new")
await redis.expire(key, 3600)

# Use pipeline (sem mudar lógica, apenas agrupa comandos):
async with redis.pipeline() as pipe:
    pipe.rpush(key, value1)
    pipe.publish(channel, "new")
    pipe.expire(key, 3600)
    await pipe.execute()
```

### 2. Aumentar TTL
O código usa 24h de TTL. Para streaming, pode ser menor:
```python
REDIS_KEY_TTL = 3600  # 1 hora ao invés de 24h
```

### 3. Configurações de Rede

#### No servidor (não no código):
```bash
# Aumentar buffer de rede do sistema
echo 'net.core.rmem_max = 134217728' >> /etc/sysctl.conf
echo 'net.core.wmem_max = 134217728' >> /etc/sysctl.conf
sysctl -p
```

#### Variáveis de ambiente:
```env
# Adicionar ao .env
REDIS_SOCKET_KEEPALIVE_OPTIONS="1:1:3"  # keepalive mais agressivo
REDIS_CONNECTION_POOL_MAX_SIZE=256  # Dobrar conexões se necessário
```

## Monitoramento

### 1. Métricas do Upstash
No dashboard Upstash você pode ver:
- **Commands/sec**: Se está muito alto, pode estar no limite
- **Latency**: Tempo médio de resposta
- **Memory Usage**: Se está perto do limite

### 2. Adicionar Log de Performance
Temporariamente, adicione logs para medir latência:

```python
import time

# No stream_agent_run
start = time.time()
new_responses_json = await redis.lrange(response_list_key, new_start_index, -1)
logger.info(f"Redis lrange took {(time.time() - start)*1000:.1f}ms for {len(new_responses_json)} items")
```

## Alternativas Gratuitas/Baratas

### 1. Redis Local (Desenvolvimento)
Se estiver testando localmente:
```bash
# Docker local Redis (super rápido)
docker run -d -p 6379:6379 redis:alpine
REDIS_URL=redis://localhost:6379
```

### 2. Railway Redis
- $5/mês para 1GB
- Latência menor se na mesma região

### 3. Render Redis
- Plano gratuito disponível
- Boa performance para projetos pequenos

## Solução Mais Provável

**O problema provavelmente NÃO é o Redis**, mas sim:

1. **Tamanho dos chunks do LLM** - Cada caractere gera um evento
2. **Latência do modelo** - Modelos maiores são mais lentos
3. **Processamento JavaScript** - Frontend processando muitos eventos

Para confirmar, adicione esse log temporário:
```python
# Em response_processor.py
logger.info(f"Chunk size: {len(chunk_content)} chars")
```

Se os chunks forem muito pequenos (1-5 caracteres), o problema é o streaming do LLM, não o Redis!