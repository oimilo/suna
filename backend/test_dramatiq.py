#!/usr/bin/env python3
"""
Teste para verificar se o Dramatiq está funcionando
"""
import os
import sys
from dotenv import load_dotenv

# Carregar .env.local
load_dotenv(".env.local")

# Configurar variáveis para debug
os.environ['REDIS_HOST'] = 'communal-mullet-5499.upstash.io'
os.environ['REDIS_PORT'] = '6379'
os.environ['REDIS_PASSWORD'] = 'ARV7AAIjcDE3YzFhNmU3ZWVhYzU0ZDg4OTBlNzM4YzU1ZWFiNzI3Y3AxMA'
os.environ['REDIS_SSL'] = 'true'

print("=== Testando Dramatiq ===")
print(f"REDIS_HOST: {os.getenv('REDIS_HOST')}")
print(f"REDIS_PORT: {os.getenv('REDIS_PORT')}")
print(f"REDIS_PASSWORD: {os.getenv('REDIS_PASSWORD')[:10]}...")
print(f"REDIS_SSL: {os.getenv('REDIS_SSL')}")
print()

# Importar e testar
try:
    from run_agent_background import run_agent_background, check_health
    import dramatiq
    
    print("✓ Importação bem sucedida")
    print(f"Broker configurado: {dramatiq.get_broker()}")
    print()
    
    # Tentar enviar uma mensagem de teste
    print("Enviando mensagem de teste para check_health...")
    result = check_health.send(key="test_key_123")
    print(f"✓ Mensagem enviada: {result}")
    print()
    
    # Verificar se a mensagem foi para a fila
    import redis
    redis_client = redis.from_url(
        "rediss://default:ARV7AAIjcDE3YzFhNmU3ZWVhYzU0ZDg4OTBlNzM4YzU1ZWFiNzI3Y3AxMA@communal-mullet-5499.upstash.io:6379",
        ssl_cert_reqs=None
    )
    
    queues = [
        'dramatiq:default',
        'dramatiq:check_health',
    ]
    
    print("=== Estado das filas após envio ===")
    for queue in queues:
        length = redis_client.llen(queue)
        print(f"  {queue}: {length} mensagens")
    
except Exception as e:
    print(f"❌ Erro: {e}")
    import traceback
    traceback.print_exc()