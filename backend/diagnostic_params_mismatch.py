#!/usr/bin/env python3
"""
Diagnóstico completo de parâmetros esperados vs recebidos
Identifica possíveis descompassos e problemas de tipos
"""

import asyncio
import json
from datetime import datetime
from supabase import create_async_client
from pydantic import BaseModel, ValidationError
from typing import Dict, Any, Optional, List

# Configurações
SUPABASE_URL = "https://siangdfgebkbmmkwjjob.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYW5nZGZnZWJrYm1ta3dqam9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ2NTIxOCwiZXhwIjoyMDY5MDQxMjE4fQ.3lGCX8yBR_KeoVzLK2K-2Z-wNjKkNkFxZbftCX9sJms"

# Modelo esperado pelo internal_api.py
class ExecuteAgentRequest(BaseModel):
    agent_run_id: str
    thread_id: str
    project_id: str
    agent_config: Dict[str, Any]
    model_name: str = "anthropic/claude-sonnet-4-20250514"
    enable_thinking: bool = False
    reasoning_effort: str = "low"
    trigger_variables: Optional[Dict[str, Any]] = {}

async def diagnostic():
    client = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    print("🔍 DIAGNÓSTICO DE PARÂMETROS E TIPOS")
    print("=" * 70)
    
    # 1. Verificar triggers configurados
    print("\n📋 1. TRIGGERS CONFIGURADOS:")
    print("-" * 70)
    
    triggers_result = await client.table('agent_triggers')\
        .select('*')\
        .eq('is_active', True)\
        .execute()
    
    issues_found = []
    
    for trigger in triggers_result.data:
        print(f"\n🔸 Trigger: {trigger['name']} ({trigger['trigger_id'][:8]}...)")
        config = trigger.get('config', {})
        
        # Verificar config como string vs dict
        if isinstance(config, str):
            try:
                config = json.loads(config)
                print(f"   ⚠️  Config armazenado como STRING, precisou converter")
                issues_found.append(f"Trigger {trigger['trigger_id']}: config armazenado como string")
            except:
                print(f"   ❌ Config inválido como JSON: {config[:100]}...")
                issues_found.append(f"Trigger {trigger['trigger_id']}: config JSON inválido")
                continue
        
        # Verificar campos obrigatórios
        execution_type = config.get('execution_type')
        workflow_id = config.get('workflow_id')
        agent_prompt = config.get('agent_prompt')
        workflow_input = config.get('workflow_input')
        
        print(f"   execution_type: {execution_type}")
        print(f"   workflow_id: {workflow_id}")
        print(f"   agent_prompt: {agent_prompt[:50] if agent_prompt else None}...")
        print(f"   workflow_input: {workflow_input}")
        
        # Validações de consistência
        if execution_type == 'workflow' and not workflow_id:
            print(f"   ❌ ERRO: execution_type='workflow' mas workflow_id está vazio!")
            issues_found.append(f"Trigger {trigger['trigger_id']}: workflow sem workflow_id")
        
        if execution_type == 'agent' and not agent_prompt:
            print(f"   ❌ ERRO: execution_type='agent' mas agent_prompt está vazio!")
            issues_found.append(f"Trigger {trigger['trigger_id']}: agent sem agent_prompt")
        
        if execution_type == 'workflow' and agent_prompt:
            print(f"   ⚠️  AVISO: execution_type='workflow' mas agent_prompt está preenchido (será ignorado)")
        
        if execution_type == 'agent' and workflow_id:
            print(f"   ⚠️  AVISO: execution_type='agent' mas workflow_id está preenchido (será ignorado)")
    
    # 2. Verificar workflows
    print("\n\n📋 2. WORKFLOWS ATIVOS:")
    print("-" * 70)
    
    workflows_result = await client.table('agent_workflows')\
        .select('*')\
        .eq('status', 'active')\
        .execute()
    
    for workflow in workflows_result.data:
        workflow_id = workflow.get('workflow_id') or workflow.get('id')
        print(f"\n🔸 Workflow: {workflow['name']} ({workflow_id[:8] if workflow_id else 'N/A'}...)")
        print(f"   Agent ID: {workflow['agent_id']}")
        print(f"   Status: {workflow['status']}")
        
        # Verificar se tem trigger associado
        trigger_with_workflow = await client.table('agent_triggers')\
            .select('trigger_id, name')\
            .or_(f"workflow_id.eq.{workflow_id},config->>workflow_id.eq.{workflow_id}")\
            .execute()
        
        if trigger_with_workflow.data:
            print(f"   ✅ Tem trigger associado: {trigger_with_workflow.data[0]['name']}")
        else:
            print(f"   ⚠️  Sem trigger associado")
    
    # 3. Simular payload para ExecuteAgentRequest
    print("\n\n📋 3. VALIDAÇÃO DE PAYLOAD:")
    print("-" * 70)
    
    # Payload de teste típico para workflow
    test_payload_workflow = {
        "agent_run_id": "test-run-id",
        "thread_id": "test-thread-id",
        "project_id": "test-project-id",
        "agent_config": {
            "agent_id": "test-agent-id",
            "name": "Test Agent"
        },
        "trigger_variables": {
            "planilha_url": "https://sheets.google.com/test",
            "email_destino": "test@example.com"
        },
        "workflow_id": "test-workflow-id",  # Este campo NÃO existe no modelo!
        "execution_type": "workflow"  # Este campo NÃO existe no modelo!
    }
    
    print("\n🔸 Teste 1: Payload típico de workflow")
    try:
        request = ExecuteAgentRequest(**test_payload_workflow)
        print("   ✅ Payload válido")
    except ValidationError as e:
        print(f"   ❌ ERRO de validação:")
        for error in e.errors():
            if error['type'] == 'extra_forbidden':
                print(f"      Campo extra não permitido: {error['loc'][0]}")
                issues_found.append(f"Campo extra em payload: {error['loc'][0]}")
    
    # Payload corrigido
    test_payload_correto = {
        "agent_run_id": "test-run-id",
        "thread_id": "test-thread-id", 
        "project_id": "test-project-id",
        "agent_config": {
            "agent_id": "test-agent-id",
            "name": "Test Agent",
            # Campos do workflow devem ir dentro do agent_config!
            "workflow_id": "test-workflow-id",
            "execution_type": "workflow"
        },
        "trigger_variables": {
            "planilha_url": "https://sheets.google.com/test",
            "email_destino": "test@example.com"
        }
    }
    
    print("\n🔸 Teste 2: Payload corrigido")
    try:
        request = ExecuteAgentRequest(**test_payload_correto)
        print("   ✅ Payload válido")
        print(f"   agent_config contém: {list(request.agent_config.keys())}")
    except ValidationError as e:
        print(f"   ❌ ERRO de validação: {e}")
    
    # 4. Verificar execuções recentes com erros
    print("\n\n📋 4. EXECUÇÕES RECENTES COM ERROS:")
    print("-" * 70)
    
    failed_runs = await client.table('agent_runs')\
        .select('id, created_at, error, metadata')\
        .eq('status', 'failed')\
        .order('created_at', desc=True)\
        .limit(5)\
        .execute()
    
    for run in failed_runs.data:
        print(f"\n🔸 Run {run['id'][:8]}... ({run['created_at'][:19]})")
        error = run.get('error', '')
        
        # Analisar tipos de erro
        if 'bool' in error.lower() and 'object has no attribute' in error.lower():
            print(f"   ❌ Erro de tipo BOOL: função retornando bool em vez de dict")
            issues_found.append(f"Run {run['id']}: erro de retorno bool")
        elif 'project' in error.lower() and 'not found' in error.lower():
            print(f"   ❌ Project não encontrado")
            issues_found.append(f"Run {run['id']}: project_id inválido")
        elif 'workflow_id' in error.lower():
            print(f"   ❌ Erro relacionado a workflow_id")
            issues_found.append(f"Run {run['id']}: problema com workflow_id")
        else:
            print(f"   ❌ Erro: {error[:100]}...")
    
    # 5. Resumo de problemas encontrados
    print("\n\n📊 RESUMO DE PROBLEMAS ENCONTRADOS:")
    print("=" * 70)
    
    if not issues_found:
        print("✅ Nenhum problema crítico encontrado!")
    else:
        for i, issue in enumerate(issues_found, 1):
            print(f"{i}. {issue}")
    
    # 6. Recomendações
    print("\n\n💡 RECOMENDAÇÕES:")
    print("=" * 70)
    print("""
1. ESTRUTURA DO PAYLOAD:
   - workflow_id e execution_type devem ir DENTRO de agent_config
   - NÃO devem ser campos raiz do payload
   
2. VALIDAÇÃO DE TIPOS:
   - Sempre verificar se config é dict antes de acessar campos
   - Converter de string para dict se necessário
   
3. CAMPOS OBRIGATÓRIOS:
   - Para workflow: workflow_id dentro de agent_config
   - Para agent: agent_prompt dentro de agent_config
   
4. TRIGGER_VARIABLES:
   - Para workflow: deve conter workflow_input como dict
   - Campos específicos do workflow (planilha_url, email_destino, etc)
   
5. PROJECT_ID:
   - Deve ser um project_id válido do banco
   - Verificar se o project existe antes de executar
    """)
    
    print("\n✅ Diagnóstico concluído!")

if __name__ == "__main__":
    asyncio.run(diagnostic())