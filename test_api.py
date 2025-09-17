#!/usr/bin/env python3
"""
Testar quais endpoints existem no Prophet
"""
import requests

BASE_URL = "https://prophet.build"

endpoints = [
    "/api/preview/test/test.html",
    "/api/agents/preview/test/test.html", 
    "/preview/test/test.html",
    "/api/thread/test/agent/start",  # Sabemos que este existe
]

print("🔍 Testando endpoints no Prophet:\n")

for endpoint in endpoints:
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", timeout=3)
        status = response.status_code
        
        if status == 401:
            result = "✅ Existe (precisa auth)"
        elif status == 403:
            result = "✅ Existe (acesso negado)"
        elif status == 404:
            result = "❌ Não encontrado"
        elif status == 405:
            result = "⚠️  Método não permitido"
        elif status in [200, 201]:
            result = "✅ Sucesso"
        else:
            result = f"🤔 Status: {status}"
            
        print(f"{endpoint:40} → {result}")
        
    except Exception as e:
        print(f"{endpoint:40} → ❌ Erro: {str(e)[:30]}")

print("\n📝 Nota: O endpoint /api/preview/ deveria retornar 401 (auth required)")