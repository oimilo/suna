# Upstream Merge Plan - Dezembro 2025

> **Documento de investigação para o merge do upstream `kortix-ai/suna` para `oimilo/suna` (Prophet)**

## 📊 Resumo Executivo

| Métrica | Valor |
|---------|-------|
| **Baseline Prophet** | `b00b431c4` (2025-12-05) |
| **Upstream HEAD** | `4b1048116` (2025-12-09) |
| **Commits pendentes** | 164 |
| **Backend** | +10,539 / -3,440 linhas |
| **Frontend** | +16,772 / -9,892 linhas |
| **Mobile** | +20,711 / -7,115 linhas (ignorável) |
| **Tempo estimado merge** | ~2-3 semanas (com Kortix Computer) |

---

## 🏗️ Arquitetura de Mudanças

O upstream fez uma **refatoração arquitetural significativa** que muda fundamentalmente como o agente carrega e executa ferramentas.

### Antes (Prophet atual)
```
┌─────────────────────────────────────────────┐
│  System Prompt GIGANTE (~15-20k tokens)     │
│  - Documentação completa de TODAS as tools  │
│  - Exemplos detalhados de cada função       │
│  - Parâmetros e schemas inline              │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  run_agent_background.py                    │
│  - Carrega TODAS as tools no startup        │
│  - ~2-5s de latência inicial                │
└─────────────────────────────────────────────┘
```

### Depois (Upstream novo)
```
┌─────────────────────────────────────────────┐
│  System Prompt MÍNIMO (~2.5k tokens)        │
│  - Apenas ÍNDICE de tools disponíveis       │
│  - Sem documentação detalhada               │
└─────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────┐
│  Bootstrap Mode (Fase A - ≤500ms)           │
│  - ThreadManager + DB apenas                │
│  - Agente já pode responder!                │
└─────────────────────────────────────────────┘
         │
         ▼ (background)
┌─────────────────────────────────────────────┐
│  Enrichment (Fase B - background)           │
│  - MCP tools, KB, cache warmup              │
│  - Roda enquanto agente já responde         │
└─────────────────────────────────────────────┘
         │
         ▼ (sob demanda)
┌─────────────────────────────────────────────┐
│  JIT Tool Loading                           │
│  - initialize_tools(["browser_tool"])       │
│  - Schemas carregados do Redis cache        │
└─────────────────────────────────────────────┘
```

---

## 📁 Novos Diretórios/Módulos

### 1. `backend/core/jit/` (NOVO - 1,839 linhas)

Sistema de carregamento Just-In-Time de ferramentas.

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `__init__.py` | 40 | Exports do módulo |
| `config.py` | 65 | Configuração JIT (quais tools são JIT vs preload) |
| `dependencies.py` | 137 | Resolução de dependências entre tools |
| `detector.py` | 62 | Detecta quais tools o agente vai precisar |
| `function_map.py` | 41 | Mapa de funções disponíveis |
| `loader.py` | 340 | **Core**: Carrega tools sob demanda |
| `mcp_loader.py` | 332 | Loader específico para MCPs |
| `mcp_registry.py` | 364 | Registry com cache Redis para MCPs |
| `mcp_tool_wrapper.py` | 91 | Wrapper para execução de MCP tools |
| `result_types.py` | 121 | Tipos de resultado padronizados |
| `tool_cache.py` | 246 | Cache de schemas em Redis (24h TTL) |

**Impacto Prophet:** 
- ✅ Código novo, não conflita
- ⚠️ Precisa integrar com nosso `xml_tool_parser.py` custom

### 2. `backend/core/run/` (NOVO - 1,550 linhas)

Refatoração do runner do agente em módulos separados.

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `__init__.py` | 49 | Exports |
| `agent_runner.py` | 726 | **Core**: Nova classe AgentRunner |
| `config.py` | 16 | Configuração do runner |
| `mcp_manager.py` | 69 | Gerenciador de MCPs |
| `prompt_manager.py` | 434 | **Core**: Construtor de prompts dinâmico |
| `tool_manager.py` | 256 | Gerenciador de registro de tools |

**Impacto Prophet:**
- 🔴 `run_agent_background.py` será MUITO diferente (+183/-117 linhas)
- 🔴 Precisamos preservar: Redis TTL (6h), proxy URLs, LTRIM

**Mudanças principais no upstream:**
```python
# 1. Novo import do core_prompt
from core.prompts.core_prompt import get_core_system_prompt

# 2. Cache do core prompt no boot do worker
_STATIC_CORE_PROMPT = None
# ... no initialize():
_STATIC_CORE_PROMPT = get_core_system_prompt()

# 3. TTL reduzido (upstream usa 1h, nós usamos 6h)
REDIS_RESPONSE_LIST_TTL = 3600  # upstream: 1h
# Prophet usa: REDIS_RESPONSE_LIST_TTL = 3600 * 6  # 6h

# 4. Invalidação de cache após agent run
from core.runtime_cache import invalidate_running_runs_cache
from core.billing.shared.cache_utils import invalidate_account_state_cache
```

---

## 📝 Mudanças por Área

### Área 1: Sistema de Prompts

**Commits relevantes:**
- `0e2eae349` - tool calling architecture refactor, reduce system prompt
- `84da461f8` - add caching, prompt bootstrap
- `e80342701` - fix stream, color prompt, rem old docs tool

**Arquivos modificados:**

| Arquivo | Mudança | Conflito? |
|---------|---------|-----------|
| `prompts/core_prompt.py` | +153 linhas (NOVO) | ❌ Novo |
| `prompts/prompt.py` | +197 / -97 linhas | 🔴 **ALTO** - temos custom |
| `prompts/agent_builder_prompt.py` | Minor | ❌ Baixo |
| `prompts/presentation_agent_prompt.md` | Minor | ❌ Baixo |

**Customizações Prophet a preservar:**
```python
# prompt.py - Referências "Prophet" em vez de "Suna"
# prompt.py - URLs prophet.build
```

### Área 2: AgentPress (Thread/Response Processing)

**Commits relevantes:**
- `0e2eae349` - tool calling architecture refactor
- `72143a12f` - handle mcps not loaded in cache
- `3ebe7a7ee` - decoupled MCP execution

**Arquivos modificados:**

| Arquivo | Mudança | Conflito? |
|---------|---------|-----------|
| `agentpress/mcp_registry.py` | +233 linhas | 🟡 Médio |
| `agentpress/response_processor.py` | +172 / -xx linhas | 🔴 **ALTO** |
| `agentpress/thread_manager.py` | +44 linhas | 🟡 Médio |
| `agentpress/native_tool_parser.py` | +33 linhas | 🟡 Médio |

**Customizações Prophet a preservar:**
```python
# xml_tool_parser.py - Fallback para XML truncado
# response_processor.py - max_xml_tool_calls = 3
```

### Área 3: Tools

**Commits relevantes:**
- `e80342701` - rem old docs tool (DELETOU sb_docs_tool.py!)
- `819369cdb` - fix tool collision with custom MCPs
- `38a76c89b` - auto clear images after 3 images

**Arquivos modificados:**

| Arquivo | Mudança | Conflito? |
|---------|---------|-----------|
| `tools/sb_docs_tool.py` | **DELETADO** (-916 linhas) | ⚠️ Verificar uso |
| `tools/message_tool.py` | -117 linhas (simplificado) | 🟡 Médio |
| `tools/expand_msg_tool.py` | +86 / -xx linhas | 🟡 Médio |
| `tools/tool_guide_registry.py` | -2 linhas | ❌ Baixo |

**Customizações Prophet a preservar:**
```python
# sb_files_tool.py - _build_proxy_url()
# sb_expose_tool.py - _build_proxy_url()
# sb_upload_file_tool.py - normalize_filename()
```

### Área 4: Frontend - Thread/Hooks

**Commits relevantes:**
- `761d90bbe` - race condition in thread page on agent start
- `b629021ae` - thread ui resets after loading
- `96c548dca` - optimistic thread ui

**Arquivos modificados:**

| Arquivo | Mudança | Conflito? |
|---------|---------|-----------|
| `hooks/messages/useAgentStream.ts` | +88 linhas | 🟡 Médio (já aplicamos parte) |
| `hooks/messages/useThreadToolCalls.ts` | +128 linhas | 🟡 Médio |
| `hooks/threads/page/use-thread-data.ts` | +38 linhas | 🟡 Médio |
| `components/thread/ThreadComponent.tsx` | Minor | ❌ Baixo |

**Customizações Prophet a preservar:**
```typescript
// prophet-loader.tsx - Nossa animação de loading
// html-renderer.tsx - Retry com exponential backoff
```

### Área 5: Frontend - Stores (NOVOS)

**Arquivos novos:**

| Arquivo | Linhas | Descrição |
|---------|--------|-----------|
| `stores/kortix-computer-store.ts` | 382 | Estado do Kortix Computer |
| `stores/message-queue-store.ts` | 99 | Fila de mensagens otimista |
| `stores/agent-selection-store.ts` | 28 | Seleção de agente |

**Impacto Prophet:**
- ✅ Código novo, não conflita
- ⚠️ `kortix-computer-store` é para a UI do Kortix Computer que pulamos

### Área 6: Billing

**Commits relevantes:**
- `84da461f8` - caching
- `fc0758350` - fix project limit, orphan project bug

**Arquivos modificados:**

| Arquivo | Mudança | Conflito? |
|---------|---------|-----------|
| `billing/credits/integration.py` | +35 linhas | ❌ Baixo |
| `billing/credits/manager.py` | +10 linhas | ❌ Baixo |

**Customizações Prophet a preservar:**
```python
# Stripe price IDs (config.py)
# free_tier_service.py - get_user_locale() para BRL
```

---

## 🔴 Arquivos Críticos Prophet (NÃO SOBRESCREVER)

```bash
# Backend - CRÍTICOS
backend/api.py                                    # CORS origins
backend/core/ai_models/registry.py               # ANTHROPIC vs Bedrock
backend/core/utils/config.py                     # Stripe IDs, URLs
backend/core/notifications/notification_service.py # URLs prophet.build
backend/run_agent_background.py                  # Redis TTL, proxy URLs

# Backend - Customizações
backend/core/agentpress/xml_tool_parser.py       # Fallback XML truncado
backend/core/tools/sb_files_tool.py              # _build_proxy_url()
backend/core/tools/sb_expose_tool.py             # _build_proxy_url()
backend/core/tools/sb_upload_file_tool.py        # normalize_filename()

# Frontend - CRÍTICOS
frontend/src/components/ui/prophet-loader.tsx    # Nossa animação
frontend/src/app/auth/*                          # Locale signup (BRL)
frontend/src/lib/utils/daytona.ts               # Proxy custom

# Frontend - Customizações
frontend/src/components/thread/preview-renderers/html-renderer.tsx  # Retry
```

---

## 📋 Plano de Execução

### Fase 1: Preparação (Antes do Merge)

- [ ] Criar branch de backup: `git checkout -b backup/pre-upstream-merge`
- [ ] Exportar lista de customizações: `git diff origin/main upstream/main -- <files>`
- [ ] Testar build atual: `npm run build` e `docker compose build`
- [ ] Documentar estado dos testes

### Fase 2: Merge Controlado

**Ordem recomendada de merge (blocos independentes):**

#### Bloco A: JIT System (Novo - Sem Conflitos)
```bash
# Arquivos novos - copiar diretamente
backend/core/jit/*
backend/core/run/*
backend/core/prompts/core_prompt.py
frontend/src/stores/message-queue-store.ts
frontend/src/stores/agent-selection-store.ts
```

#### Bloco B: Prompt Refactor (Conflitos Médios)
```bash
# Merge com cuidado
backend/core/prompts/prompt.py          # Preservar branding Prophet
backend/core/agentpress/thread_manager.py
backend/core/agentpress/response_processor.py
```

#### Bloco C: Tool Changes (Conflitos Altos)
```bash
# Verificar cada arquivo
backend/core/tools/message_tool.py
backend/core/tools/expand_msg_tool.py
# CUIDADO: sb_docs_tool.py foi DELETADO
```

#### Bloco D: Frontend Fixes (Conflitos Médios)
```bash
frontend/src/hooks/messages/*
frontend/src/hooks/threads/*
frontend/src/components/thread/*
```

#### Bloco E: Kortix Computer (APLICAR)
```bash
# Store principal
frontend/src/stores/kortix-computer-store.ts  # 382 linhas

# Tool Views - 78 arquivos!
frontend/src/components/thread/tool-views/*

# Novos componentes compartilhados
frontend/src/components/thread/tool-views/shared/FileDownloadButton.tsx
frontend/src/components/thread/tool-views/shared/SmartJsonViewer.tsx
frontend/src/components/thread/tool-views/shared/AppIcon.tsx

# Arquivos DELETADOS pelo upstream (confirmar que não usamos)
frontend/src/components/thread/tool-views/docs-tool/*        # Já comentado no registry
frontend/src/components/thread/tool-views/str-replace/*      # Verificar se usamos
```

### Fase 3: Pós-Merge

- [ ] Reaplicar customizações perdidas
- [ ] Verificar CORS origins
- [ ] Verificar URLs prophet.build
- [ ] Verificar ANTHROPIC vs Bedrock
- [ ] Testar flows críticos:
  - [ ] Login/Signup com locale
  - [ ] Criar thread e enviar mensagem
  - [ ] Tool calls (files, shell, web_search)
  - [ ] MCP tools (Gmail, etc.)
  - [ ] Preview HTML
  - [ ] Billing/Credits

---

## ⚠️ Decisões Pendentes

### 1. Kortix Computer ✅ DECIDIDO: APLICAR
**O que é:** Nova UI de file browser integrada ao chat
**Status:** Pulamos no commit `587da4d1f` - agora vamos aplicar!
**Store:** `kortix-computer-store.ts` (382 linhas) - gerencia:
- Navegação entre views (tools, files, browser)
- File browser state (path, selected file, version history)
- Panel state (open/closed)
- Unsaved file content persistence

**Tool Views afetadas:** +2,628 / -3,002 linhas em 78 arquivos!
- **Deletados:** `docs-tool/*` (já comentado), `str-replace/*`
- **Novos:** `shared/FileDownloadButton.tsx`, `shared/SmartJsonViewer.tsx`, `ListCommandsToolView.tsx`
- **Modificados:** Quase todos os tool views

**Ordem de aplicação:** Bloco 5 (último) - depende dos blocos anteriores

**Cuidados especiais:**
- Preservar `prophet-loader.tsx` (nossa animação)
- Preservar `html-renderer.tsx` (retry com backoff)
- Verificar se tool views ainda funcionam com nosso XML parser

### 2. sb_docs_tool.py ✅ RESOLVIDO
**O que é:** Tool para criar documentos
**Status:** Upstream DELETOU (916 linhas)
**Decisão:** ✅ Já está **comentado** no nosso `tool_registry.py` - podemos deletar o arquivo!
```python
# backend/core/tools/tool_registry.py (linha 35)
# ('sb_docs_tool', 'core.tools.sb_docs_tool', 'SandboxDocsTool'),  # JÁ COMENTADO
```

### 3. Bootstrap Mode
**O que é:** Agente responde em <500ms
**Status:** Requer refatoração significativa
**Decisão:** Implementar agora ou depois?

---

## 📅 Timeline Sugerido

| Dia | Bloco | Tarefa |
|-----|-------|--------|
| D+0 | Prep | Criar backup, testar build atual |
| D+1 | 1 | JIT Tool Loading (`backend/core/jit/*`) |
| D+2 | 2 | Bootstrap Mode (`backend/core/run/*`, `prompts/core_prompt.py`) |
| D+3 | 3 | Race Condition Fixes (frontend hooks) |
| D+4 | 4 | MCP Decoupled (`agentpress/*`, `expand_msg_tool.py`) |
| D+5 | 5 | Kortix Computer - Stores + Tool Views (78 arquivos!) |
| D+6 | 5 | Kortix Computer - Continuação + Ajustes |
| D+7 | - | Reaplicar customizações Prophet |
| D+8 | - | Testes completos |
| D+9 | - | Deploy staging |

**Total estimado: ~9 dias de trabalho**

---

## 🔗 Commits de Referência

### Commits Essenciais (DEVE aplicar)
```
84da461f8 - chore: add caching, prompt bootstrap
0e2eae349 - tool calling architecture refactor, reduce system prompt
fdfa876a2 - fix: mcp discovery in system prompt
e80342701 - fix stream, color prompt, rem old docs tool
761d90bbe - fix: race condition in thread page on agent start
72143a12f - fix: handle mcps not loaded in cache
```

### Commits Opcionais (Avaliar)
```
587da4d1f - kortix computer (MEGA COMMIT - 20 arquivos)
4932514cd - project categorization + API latency
a8cc98138 - investigate redis timeout issue
```

### Commits Mobile (IGNORAR)
```
*todos os commits com "mobile", "android", "ios"*
```

---

## 📝 Notas de Investigação

### Nova Arquitetura de Tools (expand_msg_tool.py)

O `expand_msg_tool.py` agora é o **hub central** para JIT tool loading:

```python
class ExpandMessageTool(Tool):
    # 1. expand_message(message_id) - Expandir mensagens truncadas
    
    # 2. discover_mcp_tools(filter) - Descobrir schemas de MCPs
    #    Ex: discover_mcp_tools(filter="GMAIL_SEND_MESSAGE,TWITTER...")
    
    # 3. execute_mcp_tool(tool_name, args) - Executar MCPs
    #    Ex: execute_mcp_tool(tool_name="GMAIL_SEND_MESSAGE", args={...})
    
    # 4. initialize_tools(tool_names) - NOVO! Carregar tools JIT
    #    Ex: initialize_tools(["browser_tool", "sb_presentation_tool"])
```

**Fluxo de uso pelo agente:**
```
1. Agente recebe task: "Pesquise sobre Tesla e crie apresentação"
2. Agente analisa → precisa de company_search_tool + sb_presentation_tool
3. Agente chama: initialize_tools(["company_search_tool", "sb_presentation_tool"])
4. Sistema carrega schemas do Redis cache
5. Agente agora pode usar as tools normalmente
```

**Benefícios:**
- System prompt vai de ~15k para ~2.5k tokens
- Menos custo por request (menos tokens de entrada)
- Carregamento sob demanda = menor latência inicial

### Sobre o JIT Tool Loading

O novo sistema funciona assim:

1. **Prompt mínimo** lista apenas nomes das tools:
```
## Pre-loaded (ready immediately):
- message_tool: ask(), complete()
- sb_files_tool: create_file(), read_file()
...

## JIT Tools (call initialize_tools() first):
- browser_tool: browser_navigate_to(), browser_act()
...
```

2. **Agente chama** `initialize_tools(["browser_tool"])` quando precisa

3. **Sistema carrega** schemas do Redis cache ou gera on-the-fly

4. **Benefício:** System prompt vai de ~15k para ~2.5k tokens

### Sobre o Bootstrap Mode

Duas fases de setup:

```python
# Fase A - FAST (obrigatória, ≤500ms)
async def setup_bootstrap(self):
    self.thread_manager = ThreadManager(...)
    self.client = await self.thread_manager.db.client
    # Agente já pode responder!

# Fase B - ENRICHMENT (background)
async def setup_enrichment(self):
    await self._initialize_mcp_jit_loader()
    # Cache warmup, KB, etc.
```

### Sobre a Remoção do sb_docs_tool

O upstream consolidou funcionalidades:
- `sb_docs_tool.py` (-916 linhas) → funcionalidade movida para outros tools
- Verificar se usamos `create_document()`, `read_document()`, `list_documents()`

---

---

## 🔍 Análise de Customizações Prophet

### ✅ Ainda Necessárias (Upstream NÃO Implementou)

| Customização | Motivo | Arquivos |
|--------------|--------|----------|
| **Proxy Daytona** | Upstream usa URLs do Daytona direto, nós precisamos proxy para SSL/custom domain | `backend/core/routes/daytona_proxy.py`, `frontend/src/lib/utils/daytona.ts` |
| **XML Truncated Fallback** | Nossa função `_extract_truncated_parameter` para XML cortado | `backend/core/agentpress/xml_tool_parser.py` |
| **max_output_tokens** | Upstream não define, nós usamos 8192 | `backend/core/ai_models/registry.py` |
| **Redis TTL 6h** | Upstream usa 1h (3600s), nós usamos 6h (21600s) | `backend/run_agent_background.py` |
| **ANTHROPIC direto** | Upstream usa Bedrock ARNs do Kortix | `backend/core/ai_models/registry.py` |
| **Locale Signup** | Para detecção de moeda BRL | `frontend/src/app/auth/*` |
| **ProphetLoader** | Nossa animação CSS | `frontend/src/components/ui/prophet-loader.tsx` |
| **HTML Renderer Retry** | Upstream não tem retry com backoff | `frontend/src/components/thread/preview-renderers/html-renderer.tsx` |

### ⚠️ Possivelmente Obsoletas (Verificar Durante Merge)

| Customização | Status no Upstream | Ação |
|--------------|-------------------|------|
| **sb_docs_tool** | **DELETADO** pelo upstream | ✅ Já comentado no nosso registry, pode deletar |
| **str-replace tool view** | **CONSOLIDADO** - agora usa `FileOperationToolView` | ✅ Podemos deletar `str-replace/` e atualizar registry para `'str-replace': FileOperationToolView` |
| **_get_preview_url em sb_files** | **COMENTADO** pelo upstream | Verificar se nossa versão usa |
| **normalize_filename** | Verificar se upstream implementou algo similar | Manter por segurança |

### 🆕 Upstream Implementou (Podemos Remover Nossa Versão?)

| Feature | O que Upstream Fez | Nossa Versão |
|---------|-------------------|--------------|
| **useAgentStream performance** | Callbacks em ref + startTransition | ✅ Já aplicamos parcialmente |
| **Prompt Caching** | Sistema completo de cache | Verificar integração |
| **Tool Registry Cache** | Cache de schemas em Redis | Novo, não tínhamos |

---

## 🎯 Estratégia Recomendada

### Abordagem: "Merge Incremental por Lógica"

Em vez de fazer um merge gigante de 164 commits, dividir em **blocos lógicos independentes**:

```
Semana 1: Backend Core (Blocos 1-2)
├── Dia 1-2: JIT System (backend/core/jit/*)
├── Dia 3-4: Bootstrap Mode + Run Refactor (backend/core/run/*)
└── Dia 5: Prompt Refactor (backend/core/prompts/*)

Semana 2: MCP + Frontend Fixes (Blocos 3-4)
├── Dia 1: Race Condition Fixes (hooks)
├── Dia 2-3: MCP Decoupled (agentpress + tools)
└── Dia 4-5: Testes de integração backend

Semana 3: Kortix Computer (Bloco 5)
├── Dia 1: Store + novos componentes
├── Dia 2-3: Tool Views (78 arquivos!)
├── Dia 4: Ajustes visuais + customizações Prophet
└── Dia 5: Testes de UI

Semana 4: Estabilização + Deploy
├── Dia 1-2: Reaplicar TODAS customizações Prophet
├── Dia 3: Testes E2E
├── Dia 4: Deploy staging
└── Dia 5: Monitoramento + hotfixes
```

### Priorização por Valor

| # | Bloco | Valor | Esforço | Status |
|---|-------|-------|---------|--------|
| 1 | JIT Tool Loading | 🔥🔥🔥 | Alto | ✅ Aplicar |
| 2 | Bootstrap Mode | 🔥🔥🔥 | Alto | ✅ Aplicar |
| 3 | Race condition fixes | 🔥🔥 | Baixo | ✅ Aplicar |
| 4 | MCP Decoupled | 🔥🔥 | Médio | ✅ Aplicar |
| 5 | Kortix Computer | 🔥🔥 | Alto | ✅ Aplicar |
| - | Mobile | - | Alto | ❌ Pular |

### Ordem de Execução Detalhada

```
┌────────────────────────────────────────────────────────────────┐
│  BLOCO 1: JIT Tool Loading (backend/core/jit/*)                │
│  - 11 arquivos novos, ~1,839 linhas                            │
│  - Sem conflitos (código novo)                                 │
│  - Commits: 3780c4bf2, a807bfc1d, 82eedabf9, 14b134645        │
├────────────────────────────────────────────────────────────────┤
│  BLOCO 2: Bootstrap Mode + Prompts                             │
│  - backend/core/run/* (6 arquivos novos, ~1,550 linhas)       │
│  - backend/core/prompts/core_prompt.py (novo)                  │
│  - Modificar run_agent_background.py                           │
│  - Commits: 84da461f8, 0e2eae349                               │
├────────────────────────────────────────────────────────────────┤
│  BLOCO 3: Race Condition Fixes                                 │
│  - frontend/src/hooks/threads/*                                │
│  - Conflito baixo                                              │
│  - Commits: 761d90bbe, b629021ae                               │
├────────────────────────────────────────────────────────────────┤
│  BLOCO 4: MCP Decoupled                                        │
│  - backend/core/agentpress/mcp_registry.py                     │
│  - backend/core/tools/expand_msg_tool.py                       │
│  - Commits: 3ebe7a7ee, fdfa876a2, 72143a12f                    │
├────────────────────────────────────────────────────────────────┤
│  BLOCO 5: Kortix Computer                                      │
│  - frontend/src/stores/kortix-computer-store.ts (novo)        │
│  - frontend/src/components/thread/tool-views/* (78 arquivos!) │
│  - Commit original: 587da4d1f + fixes posteriores              │
│  - ⚠️ MAIOR esforço - muitos arquivos                          │
└────────────────────────────────────────────────────────────────┘
```

### Arquivos para Fazer Backup ANTES do Merge

```bash
# Script de backup
mkdir -p backups/pre-merge-$(date +%Y%m%d)

cp backend/api.py backups/pre-merge-$(date +%Y%m%d)/
cp backend/core/ai_models/registry.py backups/pre-merge-$(date +%Y%m%d)/
cp backend/core/utils/config.py backups/pre-merge-$(date +%Y%m%d)/
cp backend/run_agent_background.py backups/pre-merge-$(date +%Y%m%d)/
cp backend/core/agentpress/xml_tool_parser.py backups/pre-merge-$(date +%Y%m%d)/
cp backend/core/prompts/prompt.py backups/pre-merge-$(date +%Y%m%d)/
cp frontend/src/components/ui/prophet-loader.tsx backups/pre-merge-$(date +%Y%m%d)/
cp -r frontend/src/app/auth backups/pre-merge-$(date +%Y%m%d)/
```

### 🚨 Arquivos com URLs/CORS que VÃO SOBRESCREVER (Atenção Máxima!)

Estes arquivos do upstream têm URLs do Kortix que precisam ser corrigidos IMEDIATAMENTE após merge:

| Arquivo | URLs Problemáticas | Correção |
|---------|-------------------|----------|
| `backend/api.py` | `allowed_origins = ["https://www.kortix.com", "https://kortix.com"]` | Trocar por `["https://www.prophet.build", "https://prophet.build"]` |
| `backend/api.py` | `allow_origin_regex = r"https://kortix-.*-prjcts\.vercel\.app"` | Remover ou ajustar regex |
| `backend/api.py` | `X-Refresh-Token` removido dos headers | Verificar se usamos |
| `backend/core/notifications/notification_service.py` | `https://www.kortix.com/projects/...` | Trocar por `https://www.prophet.build/...` |
| `backend/core/notifications/notification_service.py` | `KORTIX_HELLO_EMAIL = 'hello@kortix.com'` | Trocar por email Prophet |
| `backend/core/services/email.py` | `sender_email = 'hey@kortix.com'` | Trocar por email Prophet |
| `backend/core/services/email.py` | `hello_email = 'hello@kortix.com'` | Trocar por email Prophet |
| `backend/core/services/email.py` | Logo Kortix no HTML do email | Trocar por logo Prophet |
| `backend/core/services/email.py` | `https://www.kortix.com/` no email | Trocar por Prophet |
| `frontend/src/app/subscription/page.tsx` | `support@kortix.com` | Trocar por email Prophet |
| `backend/core/prompts/core_prompt.py` | `"Kortix team (kortix.com)"` no prompt | Trocar por "Milo team (prophet.build)" |
| `apps/mobile/*` | URLs mobile | Ignorar (não usamos mobile) |

### Checklist Pós-Merge (SEMPRE verificar)

```bash
# 1. CORS - CRÍTICO!
grep -E "kortix\.com|suna\.so" backend/api.py
# Esperado: NENHUM resultado

# 2. Anthropic vs Bedrock  
grep "SHOULD_USE_ANTHROPIC" backend/core/ai_models/registry.py
# Esperado: SHOULD_USE_ANTHROPIC = bool(config.ANTHROPIC_API_KEY)

# 3. URLs Prophet em todo backend
grep -rE "kortix\.com|suna\.so" backend/ --include="*.py" | grep -v __pycache__
# Esperado: NENHUM resultado

# 4. Redis TTL (deve ser 6h = 21600)
grep "REDIS_RESPONSE_LIST_TTL" backend/run_agent_background.py
# Esperado: REDIS_RESPONSE_LIST_TTL = 3600 * 6

# 5. ProphetLoader (não deve usar kortix-loader)
grep -r "kortix-loader" frontend/src --include="*.tsx" | grep -v milo-loader
# Esperado: NENHUM resultado

# 6. Emails
grep -rE "kortix\.com|suna\.so" backend/ --include="*.py" | grep -i email
# Esperado: NENHUM resultado

# 7. System prompt branding
grep -i "kortix team" backend/core/prompts/
# Esperado: "Milo team" em vez de "Kortix team"
```

### Script de Correção Automática Pós-Merge

```bash
#!/bin/bash
# Executar APÓS o merge para corrigir URLs

# Backend
sed -i '' 's/www\.kortix\.com/www.prophet.build/g' backend/api.py
sed -i '' 's/https:\/\/kortix\.com/https:\/\/prophet.build/g' backend/api.py
sed -i '' 's/kortix\.com/prophet.build/g' backend/core/notifications/notification_service.py
sed -i '' 's/hello@kortix\.com/hello@prophet.build/g' backend/core/services/email.py
sed -i '' 's/hey@kortix\.com/hey@prophet.build/g' backend/core/services/email.py
sed -i '' 's/support@kortix\.com/support@prophet.build/g' frontend/src/app/subscription/page.tsx
sed -i '' 's/Kortix team (kortix.com)/Milo team (prophet.build)/g' backend/core/prompts/core_prompt.py

# Verificar
echo "=== Verificando se ainda há URLs do Kortix ==="
grep -rE "kortix\.com|suna\.so" backend/ frontend/src --include="*.py" --include="*.tsx" --include="*.ts" | grep -v node_modules | grep -v __pycache__
```

---

## 📊 Métricas de Sucesso

Após o merge, validar:

- [ ] Build frontend passa: `npm run build`
- [ ] Build backend passa: `docker compose build backend`
- [ ] Testes lint passam: `npm run lint`
- [ ] Login funciona (com locale BR)
- [ ] Criar thread funciona
- [ ] Tool calls funcionam (test: criar arquivo)
- [ ] MCP tools funcionam (test: Gmail)
- [ ] Preview HTML funciona
- [ ] Billing funciona (test: ver créditos)

---

*Documento criado em: 2025-12-09*
*Última atualização: 2025-12-09*

