#!/usr/bin/env python3
"""
Testar se a correção do erro bool funcionou
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.billing import can_use_model

# Simular chamada como é feita no código
client = None  # Não é usado na função atual
user_id = "test-user-123"
model_name = "claude-sonnet-4-20250514"

print("🧪 Testando função can_use_model...")
print(f"   user_id: {user_id}")
print(f"   model_name: {model_name}")

try:
    # Chamar a função
    result = can_use_model(client, user_id, model_name)
    
    print(f"\n✅ Função retornou com sucesso!")
    print(f"   Tipo do retorno: {type(result)}")
    print(f"   Valor retornado: {result}")
    
    # Tentar desempacotar como o código faz
    can_use, model_message, allowed_models = result
    
    print(f"\n📊 Valores desempacotados:")
    print(f"   can_use: {can_use} (tipo: {type(can_use)})")
    print(f"   model_message: {model_message}")
    print(f"   allowed_models: {allowed_models}")
    
    # Verificar se o erro bool foi corrigido
    if isinstance(result, tuple) and len(result) == 3:
        print(f"\n🎉 SUCESSO! A função está retornando uma tupla com 3 valores!")
        print(f"   O erro 'bool' object has no attribute 'get' foi CORRIGIDO!")
    else:
        print(f"\n❌ PROBLEMA: O retorno não é uma tupla com 3 valores")
        
except Exception as e:
    print(f"\n❌ ERRO ao executar teste: {e}")
    import traceback
    traceback.print_exc()

print("\n✅ Teste concluído!")