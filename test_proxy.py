#!/usr/bin/env python3
"""
Script para testar o endpoint de preview proxy localmente
"""
import requests
import json

# Configurações
BASE_URL = "https://prophet.build"  # ou http://localhost:8000 para teste local
PROJECT_ID = "5833ee3c-cfe6-4e3f-9ec6-668f7c8b764f"  # ID do projeto de teste
FILE_PATH = "index.html"

# Token JWT (você precisaria de um token válido)
# Por enquanto vamos só verificar se o endpoint existe
ENDPOINT = f"/api/preview/{PROJECT_ID}/{FILE_PATH}"

print(f"🔍 Testando endpoint: {ENDPOINT}")
print(f"📍 URL completa: {BASE_URL}{ENDPOINT}")

# Teste 1: Verificar se o endpoint responde (sem auth)
try:
    response = requests.get(f"{BASE_URL}{ENDPOINT}", timeout=5)
    print(f"📊 Status Code: {response.status_code}")
    
    if response.status_code == 401:
        print("✅ Endpoint existe! (retornou 401 - precisa de autenticação)")
    elif response.status_code == 403:
        print("✅ Endpoint existe! (retornou 403 - acesso negado)")
    elif response.status_code == 404:
        print("❌ Endpoint não encontrado (404)")
    elif response.status_code == 200:
        print("✅ Endpoint funcionou sem auth (inesperado)")
        print(f"📄 Content-Type: {response.headers.get('content-type')}")
    else:
        print(f"🤔 Resposta inesperada: {response.status_code}")
        
except requests.exceptions.RequestException as e:
    print(f"❌ Erro na requisição: {e}")

print("\n📝 Para testar completamente, você precisa:")
print("1. Um token JWT válido")
print("2. Um project_id que você tenha acesso")
print("3. Um arquivo que exista no sandbox")