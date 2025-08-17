#!/usr/bin/env python3
"""
Teste para enviar mensagem diretamente ao Redis no formato Dramatiq
"""
import json
import redis
import uuid
from datetime import datetime

# Conectar ao Redis
redis_client = redis.from_url(
    "rediss://default:ARV7AAIjcDE3YzFhNmU3ZWVhYzU0ZDg4OTBlNzM4YzU1ZWFiNzI3Y3AxMA@communal-mullet-5499.upstash.io:6379",
    ssl_cert_reqs=None
)

# Criar mensagem no formato Dramatiq
message = {
    "queue_name": "default",
    "actor_name": "run_agent_background",
    "message_id": str(uuid.uuid4()),
    "message_timestamp": int(datetime.now().timestamp() * 1000),
    "args": [],
    "kwargs": {
        "agent_run_id": "test-run-123",
        "thread_id": "test-thread-456",
        "instance_id": "test",
        "project_id": "test-project",
        "model_name": "claude-3-sonnet",
        "enable_thinking": False,
        "reasoning_effort": "low",
        "stream": False,
        "enable_context_manager": True
    },
    "options": {}
}

# Enviar para a fila
queue_name = "dramatiq:default"
print(f"Enviando mensagem para {queue_name}...")
print(json.dumps(message, indent=2))

result = redis_client.rpush(queue_name, json.dumps(message))
print(f"✓ Mensagem enviada, posição na fila: {result}")

# Verificar
length = redis_client.llen(queue_name)
print(f"Fila agora tem {length} mensagens")