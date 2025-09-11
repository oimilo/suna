# 🔍 Debug de Triggers e Workflows - Documentação de Contexto

## 📅 Timeline do Debug (2 dias de investigação)

### Dia 1: Descoberta do Problema
- **Problema inicial**: Workflows executam mas usam ferramentas simuladas ao invés das integrações reais do Pipedream
- **Sintoma**: Workflows completam em menos de 1 segundo, indicando que não estão executando os passos reais

### Dia 2: Investigação Profunda
- **Descoberta chave**: Agent tem 2 MCPs Pipedream Gmail configurados no banco de dados
- **Problema real**: A configuração não está sendo passada corretamente para o WorkflowExecutor

## 🏗️ Arquitetura do Sistema

### Fluxo de Execução Completo

```
1. WEBHOOK TRIGGER
   └── /api/triggers/{trigger_id}/webhook
       └── triggers/execution_service.py
           └── WorkflowExecutor.execute_workflow()
               └── run_workflow_direct()
                   └── core/workflow_executor.py
                       └── Executa steps do workflow
```

### Componentes Principais

#### 1. **Trigger System** (`agent_triggers` table)
- **trigger_id**: `6832c764-5eca-4b6c-8386-528c7d011ded`
- **agent_id**: `025c750a-4945-408d-b2b3-ba83d06add94`
- **tipo**: webhook
- **enabled**: true

#### 2. **Agent Configuration** (`agents` + `agent_versions` tables)
- Agent tem versão ativa com configuração em JSON
- Configuração armazenada em `config.tools.custom_mcp`
- 2 MCPs Pipedream Gmail configurados:
  ```json
  {
    "name": "Gmail Pessoal",
    "type": "pipedream",
    "config": {
      "profile_id": "perfil-uuid-1",
      "external_user_id": "user_xyz",
      "app_slug": "gmail"
    },
    "enabledTools": ["gmail_send_email", "gmail_search"]
  }
  ```

#### 3. **Workflow** (`agent_workflows` table)
- **workflow_id**: `637d1e96-03d3-4d57-b76b-41cd9591f206`
- **nome**: "Monitor Planilha Google Sheets"
- **steps**: 5 passos incluindo `gmail_send_email`

## 🐛 Problema Identificado

### Raiz do Problema
O WorkflowExecutor não está recebendo/processando corretamente as configurações de MCP do agent.

### Cadeia de Eventos

1. **✅ Webhook recebe request** → OK
2. **✅ execution_service carrega agent_config** → OK (MCPs presentes)
3. **✅ execution_service passa config para run_workflow_direct** → OK
4. **✅ run_workflow_direct passa config para WorkflowExecutor** → OK
5. **❌ WorkflowExecutor._initialize_tools() não inicializa MCPs** → PROBLEMA
6. **❌ Workflow executa sem ferramentas reais** → Completa instantaneamente

## 🔧 Correções Aplicadas

### Commit `94443f87` - Fix validação de workflow
- Corrigido erro `'bool' object has no attribute 'get'`
- Garantido que `can_use_model` sempre retorna tupla com 3 valores

### Commit `ac475088` - Logging detalhado
- Adicionado logging em todos os pontos críticos:
  - `execution_service.py`: Log de MCPs carregados
  - `workflow_executor.py`: Log de configuração recebida
  - `workflow_executor.py`: Log de steps e execução de tools

## 📊 Estado Atual (Onde Estamos)

### ✅ O que está funcionando:
1. Agent tem MCPs Pipedream configurados no banco ✓
2. Configuração é carregada corretamente do versioning system ✓
3. Configuração é passada através da cadeia de execução ✓
4. Workflow tem steps definidos corretamente ✓

### ❌ O que ainda não funciona:
1. WorkflowExecutor não inicializa o MCP wrapper com as configurações
2. Tools não são registradas no thread_manager
3. Workflow completa sem executar os steps reais

### 🎯 Próximo Passo Crítico:
**Verificar por que `_initialize_tools` não está criando o MCP wrapper**

Possíveis causas:
1. `self.thread_manager` já existe e causa early return
2. Configuração não está no formato esperado
3. MCP wrapper falha silenciosamente na inicialização

## 📝 Scripts de Debug Criados

### 1. `check_agent_config.py`
Verifica configuração do agent no banco de dados
```bash
python3 check_agent_config.py
```

### 2. `test_webhook_detailed.py`
Testa webhook com payload completo
```bash
python3 test_webhook_detailed.py
```

### 3. `monitor_workflow_execution.py`
Monitora execução do workflow em tempo real
```bash
python3 monitor_workflow_execution.py
```

## 🔑 Informações Importantes

### IDs Chave:
- **Trigger ID**: `6832c764-5eca-4b6c-8386-528c7d011ded`
- **Agent ID**: `025c750a-4945-408d-b2b3-ba83d06add94`
- **Workflow ID**: `637d1e96-03d3-4d57-b76b-41cd9591f206`
- **Account ID**: `29e38efa-512a-47c0-9130-0ca0cedeb533`

### URLs:
- **Webhook**: `https://prophet-milo-f3hr5.ondigitalocean.app/api/triggers/{trigger_id}/webhook`
- **App**: `https://prophet-milo-f3hr5.ondigitalocean.app`

### Ambiente:
- **ENV_MODE**: production
- **Deploy**: DigitalOcean App Platform
- **Database**: Supabase (PostgreSQL)

## 🚀 Como Testar

1. **Verificar configuração do agent**:
   ```bash
   python3 check_agent_config.py
   ```
   Deve mostrar 2 MCPs Pipedream configurados

2. **Executar teste de webhook**:
   ```bash
   python3 test_webhook_detailed.py
   ```
   Retorna agent_run_id para monitorar

3. **Monitorar execução**:
   ```bash
   # Atualizar agent_run_id no script
   python3 monitor_workflow_execution.py
   ```
   Deve mostrar se Pipedream está sendo usado

## 🎬 Próximas Ações

1. **Aguardar deploy do commit `ac475088`** (logging detalhado)
2. **Executar teste novamente** para ver logs detalhados
3. **Identificar exatamente onde** a inicialização falha
4. **Corrigir problema específico** (provavelmente no `_initialize_tools`)
5. **Validar que tools Pipedream** são executadas

## 💡 Hipótese Principal

O problema está na inicialização do WorkflowExecutor que:
1. Não está criando uma nova instância para cada workflow
2. Está reutilizando uma instância sem MCPs configurados
3. Tem early return em `_initialize_tools` devido a `self.thread_manager` existente

**Solução provável**: Garantir que cada execução de workflow tenha sua própria instância de WorkflowExecutor ou resetar o estado antes de cada execução.

---

*Última atualização: 11/09/2025 20:27 BRT*
*Debug em progresso há: 2 dias*
*Estimativa para resolução: Muito próximo (1-2 tentativas)*