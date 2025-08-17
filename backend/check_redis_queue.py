#!/usr/bin/env python3
"""
Script para verificar se há mensagens na fila do Redis/Dramatiq
"""
import os
import redis
import json
from dotenv import load_dotenv

load_dotenv(".env.local")

# Usar a REDIS_URL correta
redis_url = "rediss://default:ARV7AAIjcDE3YzFhNmU3ZWVhYzU0ZDg4OTBlNzM4YzU1ZWFiNzI3Y3AxMA@communal-mullet-5499.upstash.io:6379"
redis_host = os.getenv('REDIS_HOST', 'redis')
redis_port = int(os.getenv('REDIS_PORT', 6379))
redis_password = os.getenv('REDIS_PASSWORD')

if redis_url:
    print(f"Conectando via REDIS_URL: {redis_url[:30]}...")
    # Desabilitar verificação SSL para Upstash
    import ssl
    ssl_context = ssl.create_default_context()
    ssl_context.check_hostname = False
    ssl_context.verify_mode = ssl.CERT_NONE
    redis_client = redis.from_url(
        redis_url, 
        decode_responses=True,
        ssl_cert_reqs=None
    )
elif redis_password:
    print(f"Conectando ao Redis: {redis_host}:{redis_port} com senha")
    # Produção com Upstash
    redis_client = redis.Redis(
        host=redis_host,
        port=redis_port,
        password=redis_password,
        ssl=True,
        ssl_cert_reqs=None,
        decode_responses=True
    )
else:
    print(f"Conectando ao Redis local: {redis_host}:{redis_port}")
    # Local
    redis_client = redis.Redis(
        host=redis_host,
        port=redis_port,
        decode_responses=True
    )

try:
    # Testar conexão
    redis_client.ping()
    print("✓ Conectado ao Redis com sucesso\n")
    
    # Listar todas as chaves
    print("=== Todas as chaves no Redis ===")
    all_keys = redis_client.keys('*')
    for key in all_keys[:20]:  # Limitar a 20 para não poluir
        print(f"  - {key}")
    if len(all_keys) > 20:
        print(f"  ... e mais {len(all_keys) - 20} chaves")
    print()
    
    # Verificar filas do Dramatiq
    print("=== Filas do Dramatiq ===")
    dramatiq_queues = [
        'dramatiq:default',
        'dramatiq:default.DQ',
        'dramatiq:default.XQ',
        'dramatiq:run_agent_background',
        'dramatiq:run_agent_background.DQ',
        'dramatiq:check_health',
    ]
    
    for queue in dramatiq_queues:
        length = redis_client.llen(queue)
        if length > 0:
            print(f"  {queue}: {length} mensagens")
            # Mostrar primeira mensagem sem remover
            first_msg = redis_client.lindex(queue, 0)
            if first_msg:
                try:
                    msg_data = json.loads(first_msg)
                    print(f"    Primeira mensagem: {msg_data.get('actor_name', 'unknown')} - {msg_data.get('message_id', 'no-id')[:8]}...")
                except:
                    print(f"    Primeira mensagem (raw): {first_msg[:100]}...")
        else:
            print(f"  {queue}: vazio")
    print()
    
    # Verificar agent runs ativos
    print("=== Agent Runs Ativos ===")
    agent_runs = redis_client.keys('agent_run:*')
    for run_key in agent_runs[:5]:
        print(f"  - {run_key}")
    if len(agent_runs) > 5:
        print(f"  ... e mais {len(agent_runs) - 5} runs")
    print()
    
    # Verificar active runs
    print("=== Active Runs ===")
    active_runs = redis_client.keys('active_run:*')
    for run_key in active_runs[:5]:
        value = redis_client.get(run_key)
        print(f"  - {run_key}: {value}")
    if len(active_runs) > 5:
        print(f"  ... e mais {len(active_runs) - 5} active runs")
    
except redis.ConnectionError as e:
    print(f"❌ Erro ao conectar ao Redis: {e}")
except Exception as e:
    print(f"❌ Erro: {e}")