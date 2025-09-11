#!/usr/bin/env python3
"""
Rastrear execuções do workflow de monitoramento de planilha
"""

import asyncio
import json
from datetime import datetime, timedelta
from supabase import create_async_client

# Configurações
SUPABASE_URL = "https://siangdfgebkbmmkwjjob.supabase.co"
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpYW5nZGZnZWJrYm1ta3dqam9iIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzQ2NTIxOCwiZXhwIjoyMDY5MDQxMjE4fQ.3lGCX8yBR_KeoVzLK2K-2Z-wNjKkNkFxZbftCX9sJms"

WORKFLOW_ID = "637d1e96-03d3-4d57-b76b-41cd9591f206"

async def track_workflow_execution():
    client = await create_async_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    
    print("🔍 RASTREANDO EXECUÇÕES DO WORKFLOW DE MONITORAMENTO")
    print("=" * 60)
    print(f"Workflow ID: {WORKFLOW_ID}")
    print(f"Nome: Monitor Planilha Google Sheets")
    print("=" * 60)
    
    # 1. Verificar o workflow
    print("\n📋 DETALHES DO WORKFLOW:")
    workflow_result = await client.table('agent_workflows')\
        .select('*')\
        .eq('workflow_id', WORKFLOW_ID)\
        .execute()
    
    if workflow_result.data:
        workflow = workflow_result.data[0]
        print(f"✅ Workflow encontrado:")
        print(f"   Nome: {workflow.get('name')}")
        print(f"   Status: {workflow.get('status')}")
        print(f"   Agent ID: {workflow.get('agent_id')}")
        print(f"   Criado: {workflow.get('created_at')}")
        
        # Verificar os steps
        steps = workflow.get('steps', [])
        if steps:
            print(f"   Total de steps: {len(steps)}")
    else:
        print("❌ Workflow não encontrado")
        return
    
    # 2. Buscar trigger associado
    print("\n🎯 TRIGGER ASSOCIADO:")
    trigger_result = await client.table('agent_triggers')\
        .select('*')\
        .or_(f"workflow_id.eq.{WORKFLOW_ID},config->>workflow_id.eq.{WORKFLOW_ID}")\
        .execute()
    
    trigger_id = None
    if trigger_result.data:
        for trigger in trigger_result.data:
            print(f"✅ Trigger encontrado:")
            print(f"   ID: {trigger['trigger_id']}")
            print(f"   Nome: {trigger.get('name')}")
            print(f"   Tipo: {trigger.get('trigger_type')}")
            print(f"   Ativo: {'✅' if trigger.get('is_active') else '❌'}")
            
            config = trigger.get('config', {})
            if isinstance(config, str):
                try:
                    config = json.loads(config)
                except:
                    pass
            
            if config.get('workflow_id') == WORKFLOW_ID:
                trigger_id = trigger['trigger_id']
                print(f"   Execution Type: {config.get('execution_type')}")
                print(f"   Cron: {config.get('cron_expression')}")
                print(f"   QStash ID: {config.get('qstash_schedule_id')}")
                
                # Inputs do workflow
                workflow_input = config.get('workflow_input', {})
                if workflow_input:
                    print(f"\n   📝 Inputs configurados:")
                    print(f"      Planilha: {workflow_input.get('planilha_url', 'N/A')}")
                    print(f"      Email: {workflow_input.get('email_destino', 'N/A')}")
    else:
        print("❌ Nenhum trigger encontrado para este workflow")
    
    # 3. Buscar execuções recentes (agent_runs)
    print("\n🏃 EXECUÇÕES RECENTES:")
    
    # Buscar pela thread_id associada ao workflow
    # Primeiro, vamos buscar threads que podem estar relacionadas
    if workflow.get('agent_id'):
        runs_result = await client.table('agent_runs')\
            .select('*')\
            .eq('agent_id', workflow.get('agent_id'))\
            .order('created_at', desc=True)\
            .limit(10)\
            .execute()
        
        workflow_runs = []
        for run in runs_result.data or []:
            # Verificar se é relacionado ao workflow
            metadata = run.get('metadata', {})
            if isinstance(metadata, str):
                try:
                    metadata = json.loads(metadata)
                except:
                    pass
            
            # Verificar se menciona o workflow
            if (workflow.get('agent_id') == run.get('agent_id') or 
                WORKFLOW_ID in str(metadata) or
                'Monitor Planilha' in str(run)):
                workflow_runs.append(run)
        
        if workflow_runs:
            print(f"✅ Encontradas {len(workflow_runs)} execuções possíveis:")
            for i, run in enumerate(workflow_runs[:5], 1):
                status_emoji = {
                    'completed': '✅',
                    'running': '🔄',
                    'failed': '❌',
                    'pending': '⏳'
                }.get(run.get('status'), '❓')
                
                print(f"\n   {i}. {status_emoji} Run ID: {run['id'][:8]}...")
                print(f"      Status: {run.get('status')}")
                print(f"      Thread: {run.get('thread_id')[:8]}..." if run.get('thread_id') else "      Thread: N/A")
                print(f"      Criado: {run.get('created_at')[:19]}")
                
                if run.get('completed_at'):
                    print(f"      Finalizado: {run.get('completed_at')[:19]}")
                
                if run.get('error'):
                    print(f"      ❌ ERRO: {run['error'][:200]}...")
                    
                # Verificar mensagens na thread
                if run.get('thread_id'):
                    messages_result = await client.table('messages')\
                        .select('type, content, created_at')\
                        .eq('thread_id', run['thread_id'])\
                        .order('created_at', desc=True)\
                        .limit(3)\
                        .execute()
                    
                    if messages_result.data:
                        print(f"      📨 Últimas mensagens:")
                        for msg in messages_result.data:
                            content_preview = msg['content'][:100] if msg.get('content') else 'N/A'
                            print(f"         - {msg['type']}: {content_preview}...")
        else:
            print("❌ Nenhuma execução encontrada para este workflow")
    
    # 4. Verificar eventos de trigger (se houver trigger_id)
    if trigger_id:
        print(f"\n⏰ EVENTOS DO TRIGGER (últimas 24h):")
        yesterday = datetime.utcnow() - timedelta(hours=24)
        
        events_result = await client.table('trigger_events')\
            .select('*')\
            .eq('trigger_id', trigger_id)\
            .gte('timestamp', yesterday.isoformat())\
            .order('timestamp', desc=True)\
            .limit(10)\
            .execute()
        
        if events_result.data:
            print(f"✅ {len(events_result.data)} eventos encontrados:")
            for event in events_result.data[:5]:
                success_emoji = '✅' if event.get('success') else '❌'
                print(f"\n   {success_emoji} Evento: {event.get('event_id', 'N/A')[:8]}...")
                print(f"      Timestamp: {event.get('timestamp')[:19]}")
                print(f"      Sucesso: {event.get('success')}")
                if event.get('error_message'):
                    print(f"      Erro: {event.get('error_message')}")
                if event.get('response_data'):
                    print(f"      Response: {str(event.get('response_data'))[:100]}...")
        else:
            print("❌ Nenhum evento registrado nas últimas 24h")
    
    # 5. Buscar a última execução do nosso teste
    print("\n🧪 ÚLTIMA EXECUÇÃO DE TESTE:")
    test_run = await client.table('agent_runs')\
        .select('*')\
        .eq('id', 'ca3ea57c-6026-4795-9423-df396880a064')\
        .execute()
    
    if test_run.data:
        run = test_run.data[0]
        print(f"✅ Execução de teste encontrada:")
        print(f"   Status: {run.get('status')}")
        print(f"   Error: {run.get('error', 'Nenhum')}")
        print(f"   Thread: {run.get('thread_id')}")
    
    print("\n" + "=" * 60)
    print("✅ Rastreamento concluído!")

if __name__ == "__main__":
    asyncio.run(track_workflow_execution())