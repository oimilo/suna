# Composio MCP – Fluxo "Queries + Session"

## Objetivo
Garantir que o runtime Prophet utilize o fluxo recomendado pelo Composio — **search → session → execução** — para manter o contexto do agente saudável, evitar dumps gigantes e registrar as ferramentas corretas antes de chamá-las.

## Visão Geral
1. **Busca estruturada (`search_mcp_servers*`)**
   - Sempre envie um array `queries` com pelo menos uma entrada contendo `use_case` e filtros opcionais (`category`, `app_slug`, etc.).
   - O endpoint universal do Composio (`/api/v3/labs/tool_router/search-tools`) devolve `results` e um objeto `session`. Nós normalizamos os campos (nome, descrição, tags, tipo de auth) e devolvemos um payload único `{ query, results, session, source }`.
   - Se a busca universal falhar ou retornar vazio, caímos em `ToolkitService.search_toolkits` com o mesmo `use_case`. Ainda assim, mantemos um `session.id` sintético (`local-<uuid>`) para manter o contrato.

2. **Sessões resilientes**
   - `ComposioIntegrationService.start_mcp_session` encapsula `session.generate({"generate_id": true})`, normaliza TTL e entrega `{ id, ttl, generated }`.
   - `ThreadManager` guarda o `session_id` por thread. O `MCPToolExecutor` injeta esse valor em `x-composio-session-id` ao executar ferramentas HTTP e refaz a sessão automaticamente se receber 401/410 ou mensagens de sessão expirada.

3. **Registro e priorização de ferramentas**
   - `search_mcp_servers`/`search_mcp_servers_for_agent` retornam as recomendações e a UI marca explicitamente as ferramentas habilitadas.
   - `DynamicToolBuilder` agora atribui prioridade maior para resultados recomendados e penaliza utilitários pesados (`dump`, `list_all`, etc.), reduzindo o risco de chamadas que esgotam o contexto.

4. **Pós-processamento de payloads**
   - Toda resposta MCP passa por `_post_process_payload`: convertemos para JSON quando possível, aplicamos limites (4 kB ou >20 itens) e, se exceder, geramos `summary` + `preview` + upload completo para `tool-outputs` (Supabase). O agente recebe somente o resumo e, opcionalmente, o link público.
   - A configuração do bucket (`SUPABASE_TOOL_OUTPUT_BUCKET`, default `tool-outputs`) é validada via `ensure_bucket_exists` e precisa ser pública.

## Como Usar (Agente)
1. Rodar `search_mcp_servers` ou `search_mcp_servers_for_agent` **antes de qualquer execução**.
2. Analisar `results` → selecionar toolkit/ferramentas relevantes → proceder com credenciais/autenticação.
3. Após `discover_user_mcp_servers`, habilitar apenas os nomes exatos retornados.
4. Invocar as ferramentas MCP; o runtime já envia o `session_id` correto e faz retry em caso de expiração.
5. Tratar respostas truncadas usando `summary`/`preview`; só solicitar download completo do `storage.url` quando realmente necessário.

## Como Usar (Backend)
- Toda chamada manual ao Composio deve passar por `ComposioIntegrationService.search_toolkits_with_queries` ou `start_mcp_session` para manter consistência.
- Para integrações customizadas, usar `MCPToolExecutor` ao invés de clientes diretos HTTP/SSE, garantindo headers de sessão e pós-processamento.
- Logs relevantes:
  - `core.tools.utils.mcp_tool_executor` (anexos de sessão, retries, uploads)
  - `core.composio_integration.composio_service` (fallbacks de busca/sessão)
  - `core.agentpress.thread_manager` (cache de sessão)

## Testes Recomendados
- **Unitários**
  - `search_toolkits_with_queries`: sucesso, fallback, resposta vazia.
  - `MCPToolExecutor._build_composio_tool_info`: header aplicado quando existe `session.id` não-local.
  - `_post_process_payload`: confirma resumo, truncamento e upload opcional.
- **Integração (mock/QA)**
  - Fluxo completo Trello/GitHub: busca → autenticação → discover → execução → verificação de resumo.
  - Forçar erro 401 para validar renovação automática da sessão.
- **Operação**
  - Monitorar tamanho das respostas antes/depois (logs de `approx_size_bytes`).
  - Auditar objetos gravados em `tool-outputs` e garantir política pública ativa.

## Troubleshooting
- **Mensagem “Tool function ... not found”** → indica que o agente pulou `search_mcp_servers` e não registrou as ferramentas no runtime. Repetir o fluxo de busca + session.
- **Erros 401/410** → devem ser reexecutados automaticamente; se persistir, verificar expiração do perfil Composio.
- **Uploads falhando** → garantir que o bucket `tool-outputs` exista e esteja público; variável `SUPABASE_TOOL_OUTPUT_BUCKET` pode apontar para outro bucket.

## Referências
- Composio docs: “Universal MCP Search” e “Session API” (`/api/v3/labs/tool_router/search-tools` e `/api/v3/labs/tool_router/session`).
- Código principal:
  - `backend/core/composio_integration/composio_service.py`
  - `backend/core/tools/utils/mcp_tool_executor.py`
  - `backend/core/tools/utils/dynamic_tool_builder.py`
  - `backend/core/agentpress/thread_manager.py`
