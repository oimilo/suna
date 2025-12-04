# Upstream Sync Playbook

Guia rápido para manter o fork (`oimilo/suna`) alinhado com o repositório oficial (`kortix-ai/suna`). Registre aqui o último commit do upstream que já está integrado para que os próximos sincronismos saibam exatamente de onde continuar.

## Baseline atual

| Data (UTC-3) | Commit upstream | Mensagem |
|--------------|-----------------|----------|
| 2025-12-04   | `b50c22f9f`     | `fix model name for trigger runs` |

Tudo até o commit acima já foi incorporado no `origin/main`. As diferenças restantes vêm de customizações locais (branding, parser, etc.), proxy custom e dos commits novos do upstream posteriores à data registrada.

**Commits não aplicados (propositalmente):**
- `f738ea3c1` - mobile permission infos + agents-101 page (página de marketing do Kortix - pode ser adaptada depois)
- `424f947dd` - cleanup scripts (não necessário)
- `b60caacf2` - mobile wip + auth callback (poderia sobrescrever login sem GitHub)
- `3dbefaaa9` - Redis TTLs reduzidos (aplicado parcialmente - safety expiry sim, TTLs não)
- `8760de0a1` - mobile wip (não usamos app mobile)
- RevenueCat fixes - mobile (não usamos)
- `e2022be97` - compression WIP (marcado como wip, muito invasivo)
- `56cc0f02e` - PresentationViewer fix (código não presente no Prophet)
- ~~Referral system - não implementado~~ ✅ Aplicado em 02/12/2025
- `1465821b1` - ~~scale down pricing section~~ ✅ Aplicado em 02/12/2025
- `2a7cdb276` - default plan to yearly (decisão de negócio - podemos aplicar depois)
- `fe800927b` - mock image gen (não necessário - usamos API real)

> **Como atualizar esta tabela:** após concluir um sync, substitua a linha por `HEAD` do `upstream/main` que acabou de ser integrado.

## Progresso em 2025-12-04

### Bloco aplicado — model selection for triggers (b50c22f9f)
- **Upstream commits absorvidos**: `b50c22f9f` (fix model name for trigger runs)
- **Mudanças backend**:
  - `trigger_tool.py`: Novo parâmetro `model` para triggers scheduled e event
  - `execution_service.py`: Passa `model` do trigger para execução do agent
  - `provider_service.py`: Propaga `model` no `TriggerResult`
  - `trigger_service.py`: Campo `model` no `TriggerResult` dataclass
  - `composio_integration/api.py`: Campo `model` no request de criar trigger
  - `suna_config.py`: `claude-haiku-4.5` → `kortix/basic` (ainda usa Haiku por trás)
- **Mudanças frontend**:
  - `schedule-config.tsx`: UI para selecionar modelo no trigger
  - `event-config.tsx`: UI para selecionar modelo no trigger
  - `middleware.ts` → `proxy.ts`: Renomeado (convenção Next.js 16)

### Bloco aplicado — sandbox admin bypass + Next.js 16 (5e19caed6)
- **Upstream commits absorvidos**: `5e19caed6` (sandbox admin bypass)
- **Mudanças backend**:
  - `auth_utils.py`: Admins (`admin`, `super_admin`) agora podem acessar qualquer sandbox, não apenas os próprios
  - `prompt.py`: Melhorias nas sugestões de follow-up - agora específicas em vez de genéricas ("Use PostgreSQL for queries" em vez de "Yes/No")
  - `message_tool.py`: Descriptions melhoradas para `follow_up_answers` e `follow_up_prompts`
- **Mudanças frontend**:
  - **Next.js 15.3.1 → 16.0.7**: Corrige CVE-2025-55182 (vulnerabilidade crítica de RCE)
  - Script `lint` atualizado: `next lint` → `eslint` (comando removido no Next 16)
  - `tsconfig.json`: Ajustes automáticos do Next 16
- **Breaking changes do Next.js 16**:
  - ⚠️ `middleware.ts` deve ser renomeado para `proxy.ts` (warning por enquanto)
  - Node.js mínimo: 20.9.0
  - TypeScript mínimo: 5.1.0
- **Não aplicados**:
  - `74b8bbb96` - mobile text selectable (não usamos mobile)
  - `483579c8f` - desabilita sb_docs_tool (avaliar depois)
  - `b50c22f9f` - model name for trigger runs (aplicar separadamente)

## Progresso em 2025-12-03

### Fix: Remove dead code causing Upstash 10MB limit errors
- **Problema identificado**: Thread `1381715f-7977-4c92-901b-13116905a940` (RiskLab News) falhou com erro "max request size exceeded: 68MB > 10MB"
- **Causa raiz**: Código morto em `run_agent_background.py:623-624` que lia toda a lista de responses do Redis com `lrange(0, -1)` mas nunca usava o resultado
- **Solução**: Removido código morto. A variável `all_responses` era criada mas nunca utilizada após ser lida
- **Nota**: Este bug também existe no upstream - podemos contribuir um PR

### Bloco aplicado — add username in sys prompt (eb3de5e9a)
- **Upstream commits absorvidos**: `eb3de5e9a` (add username in sys prompt)
- **Mudanças backend**:
  - `core/run.py`: Adiciona busca do nome do usuário em paralelo com KB e locale
  - Busca em `user_metadata.full_name`, `name`, `display_name` ou fallback para prefixo do email
  - Adiciona seção "USER INFORMATION" ao system prompt com o nome do usuário
- **Benefício**: O agente pode personalizar respostas e chamar o usuário pelo nome
- **Não aplicados**:
  - `f738ea3c1` - mobile permissions + `/agents-101` page (página de slides de marketing do Kortix - pode ser adaptada para Prophet depois se quisermos)

## Progresso em 2025-12-02

### Bloco aplicado — fix schedule trigger setup (dc38a5d0b)
- **Upstream commits absorvidos**: `dc38a5d0b` (fix schedule trigger setup)
- **Mudanças**:
  - `execution_service.py`: Adiciona verificação de limites de projetos e threads ANTES de criar sessão de trigger
    - Evita criar projetos/threads se usuário já atingiu limite do plano
    - Retorna erro amigável explicando limite
  - `provider_service.py`: Já estava correto (usava `config.WEBHOOK_BASE_URL`)
  - `api.py`: Fix de `agent_run_id` → `id` não aplicado (função `get_trigger_executions` não existe no Prophet)
- **Benefício**: Triggers respeitam limites do plano do usuário

### Reversão para XML Tool Calling (Prophet-specific)
- **Problema**: O upstream está em transição incompleta de XML → Native tool calling
  - `AGENT_XML_TOOL_CALLING = False` e `AGENT_NATIVE_TOOL_CALLING = True` (defaults do upstream)
  - MAS o `prompt.py` base ainda contém 48+ exemplos de XML tool calls (`<function_calls>`, `<invoke>`)
  - Resultado: O modelo "aprende" XML dos exemplos mas o sistema espera native → ferramentas não executam
- **Sintoma observado**: Thread com código XML vazado no chat (ex: `<function_calls><invoke name="load_image">...`)
  - Tool calls parseadas corretamente no metadata
  - MAS não executadas porque `finish_reason: stop` (não `tool_calls`)
  - Modelo emite XML no texto em vez de usar native function calling
- **Solução**: Reverter para XML tool calling até que upstream complete a migração
  ```python
  # backend/core/utils/config.py
  AGENT_XML_TOOL_CALLING: bool = True       # Habilitado
  AGENT_NATIVE_TOOL_CALLING: bool = False   # Desabilitado
  ```
- **Resultado**: Ferramentas executam corretamente usando o formato XML que o prompt ensina

### Correção custom — HTML Preview com Retry (a0319301a + 45c1150a7)
- **Problema**: Quando o usuário abria uma thread antiga com sandbox dormindo, o preview de HTML mostrava erro "502" em vez de loading. O Daytona marca sandbox como "ready" antes dos serviços internos (HTTP/VNC) estarem prontos.
- **Causa**: O fix upstream `3a8e03d78` só cobre `sandboxId === null`. Além disso, mesmo após acordar, o servidor HTTP interno do sandbox leva alguns segundos para iniciar.
- **Solução em duas partes**:
  1. **Propagar `isWorkspaceReady`** por toda a cadeia até o `ToolView`:
     - `frontend/src/components/thread/tool-views/types.ts`: Adicionada prop `isWorkspaceReady`
     - `frontend/src/components/thread/tool-views/CompleteToolView.tsx`: Passa `isWorkspaceReady` para `FileAttachment`
     - `frontend/src/components/thread/tool-call-side-panel.tsx`: Recebe e passa `isWorkspaceReady` para `ToolView`
     - `frontend/src/components/thread/layout/thread-layout.tsx`: Recebe e passa para todas as instâncias de `ToolCallSidePanel`
     - `frontend/src/components/thread/ThreadComponent.tsx`: Passa `isWorkspaceReady` para `ThreadLayout`
  2. **Retry automático no `HtmlRenderer`** (45c1150a7):
     - `frontend/src/components/thread/preview-renderers/html-renderer.tsx`: 
       - Verifica acessibilidade da URL antes de mostrar iframe (HEAD request)
       - Retry automático com exponential backoff (1s → 10s, máx 15 tentativas)
       - Mostra "Starting workspace... (attempt X/15)" durante retries
       - Botão "Try again" manual após esgotar tentativas
       - Lida com erros 502/503/504 graciosamente
- **Resultado**: Preview de HTML funciona mesmo quando sandbox ainda está acordando, com feedback visual durante o processo

### Bloco aplicado — Referral System (5a2fe29f4)
- **Upstream commits absorvidos**: `5a2fe29f4` (referral system)
- **Backend**:
  - `backend/core/referrals/` (NOVO): Módulo completo de indicações com service, api e config
  - `backend/core/setup/api.py`: Processa código de indicação durante inicialização de conta
  - `backend/api.py`: Registra router de referrals
  - Migrations: Tabelas `referral_codes`, `referrals`, `referral_stats` + funções SQL
- **Frontend**:
  - `frontend/src/components/referrals/` (NOVO): Componentes de UI para indicações
  - `frontend/src/hooks/referrals/` (NOVO): Hook de dados de indicações
  - `frontend/src/lib/api/referrals.ts` (NOVO): Cliente API
  - `frontend/src/stores/referral-dialog.ts` (NOVO): Estado do dialog de indicação
  - Auth flow modificado: `page.tsx`, `callback/route.ts`, `actions.ts`, `GoogleSignIn.tsx`, `GithubSignIn.tsx`
  - Settings modal: Nova aba "Referrals"/"Indicações"
  - Sidebar: Novo menu "Invite Friends"
  - Traduções pt.json e en.json atualizadas
- **Funcionalidades**:
  - ✅ Código de indicação único por usuário (8 caracteres)
  - ✅ Link de indicação compartilhável
  - ✅ Créditos automáticos para indicador ($1 por indicação bem-sucedida)
  - ✅ Limite máximo de $100 em créditos de indicação
  - ✅ Suporte a OAuth (Google/GitHub) via cookie `pending-referral-code`
  - ✅ Regeneração de código (expira o antigo e cria novo)
  - ✅ Estatísticas de indicações no dashboard

### Bloco aplicado — billing grace periods + file streaming + cleanup fixes (4e83ce252)
- **Upstream commits absorvidos**: `6a84b681c` (grace periods), `439b853bc` (file streaming view), `50b910898` (sandbox cleanup), `417a80c7a` (remove worker kill)
- **Mudanças backend**:
  - `subscription.py`: Adicionado tratamento de status `past_due` (grace period) e `unpaid` (fim do grace period revoga acesso)
  - `lifecycle.py`: Status `past_due` só atualiza metadata, NÃO dá créditos (créditos só no invoice.payment_succeeded)
  - `sb_shell_tool.py`: Não cria sandbox durante cleanup se não existir
  - `agent_runs.py`, `core_utils.py`, `run_management.py`: Removida lógica de kill de workers no shutdown (simplificação)
- **Mudanças frontend**:
  - `FileOperationToolView.tsx`: Mostra conteúdo do arquivo DURANTE streaming (não só no final)
  - `types.ts`: Adicionada prop `streamingText` para streaming content
  - `thread-layout.tsx`: Extrai argumentos de tool call em streaming e passa para side panel
  - `tool-call-side-panel.tsx`: Passa `streamingText` para tool views
- **Benefícios**:
  - ✅ Usuários em grace period mantêm acesso (Stripe retry automático)
  - ✅ Créditos não são dados durante grace period (evita fraude)
  - ✅ UX melhorada: arquivo aparece em tempo real durante criação
  - ✅ Cleanup não cria sandbox desnecessariamente
  - ✅ Shutdown do API mais rápido e limpo
- **Não aplicados**:
  - `2a7cdb276` - default yearly (decisão de negócio)

## Progresso em 2025-12-01

### Bloco aplicado — hotfixes (a0486e4f6, d5641ea49, 3dbefaaa9 parcial)
- **Upstream commits absorvidos**: `a0486e4f6` (orphaned tool calls), `d5641ea49` (input preservation), `3dbefaaa9` (parcial - safety expiry)
- **Mudanças backend**:
  - `response_processor.py`: Cleanup de tool_calls órfãos quando run é cancelado antes de executar ferramentas. Previne mensagens inconsistentes no banco.
  - `run_agent_background.py`: Safety TTL refresh a cada 50 responses (previne dados eternos se worker crashar)
- **Mudanças frontend**:
  - `dashboard-content.tsx`: Não limpa input em caso de erro (usuário não perde mensagem)
  - `chat-input.tsx`: Usa ref para detectar transição false→true de `isAgentRunning` (evita limpar em re-renders)
  - `ThreadComponent.tsx`: Move `setChatInputValue('')` para após sucesso, não no início
  - `i18n-provider.tsx`: Remove `key={locale}`, adiciona `timeZone="UTC"`
- **Benefícios**:
  - ✅ Usuário não perde mensagem se der erro ao enviar
  - ✅ Input não limpa aleatoriamente em re-renders
  - ✅ Menos tool_calls órfãos no banco (melhor consistência)
  - ✅ Redis não acumula dados se worker crashar
- **Não aplicados**:
  - `e2022be97` - compression WIP (muito invasivo, marcado como wip)
  - `56cc0f02e` - PresentationViewer fix (código não existe no Prophet)
  - TTLs reduzidos do `3dbefaaa9` (Prophet usa 6h, não 1h)

## Progresso em 2025-11-29

### Bloco aplicado — shared threads + image retries (b004d6099, e97dc0d8e, 5008a864b)
- **Upstream commits absorvidos**: `b004d6099` (fix assistant streams for shared thread), `e97dc0d8e` (add preswrapper to share page), `5008a864b` (retries for seeimagetoolview)
- **Mudanças frontend**:
  - `PlaybackControls.tsx`: Usa `metadata.text_content` para streaming em vez de parsear `content` direto
  - `usePlaybackController.tsx`: Mesma lógica de `metadata.text_content` com fallback para formato legado
  - `SharePageWrapper.tsx`: Adiciona `PresentationViewerWrapper` com lazy loading para páginas de share
  - `SeeImageToolView.tsx`: Refatorado para usar `useImageContent` hook com 15 retries e feedback visual
- **Benefícios**:
  - ✅ Streaming correto de mensagens assistant em threads compartilhadas
  - ✅ Apresentações funcionam em páginas de share
  - ✅ Imagens carregam com retries robustos (igual a outros componentes de arquivo)

### Hotfix — max_output_tokens 8K→16K
- **Problema**: Agente atingia limite de 8192 tokens ao gerar arquivos HTML grandes (ex: relatórios visuais)
- **Solução**: Aumentado `max_output_tokens` de 8192 para 16384 em `registry.py`
- **Sentry issue**: PYTHON-FASTAPI-4G

## Progresso em 2025-11-28

### Bloco aplicado — fix novu inbox + remove notification settings (PR #2175, #2176)
- **Upstream commits absorvidos**: `63c11954e` (fix novu inbox), `aed0b6b83` (remove notifications settings from UI) + merges
- **Mudanças backend**:
  - `api.py`: Fix para `ENV_MODE` sendo None
  - `notification_service.py`: Nova lógica de `send_welcome_email()` - busca dados do usuário via `client.auth.admin.get_user_by_id()`. Adiciona suporte para `phone` e `avatar`. **Mantivemos payload Prophet** com `user_name`, `from_url`, `discord_url`
  - `novu_service.py`: Aceita `avatar` em `trigger_workflow()`, passa subscriber info no `to`
  - `setup/api.py`: Atualizada chamada de `send_welcome_email()` (agora só recebe `account_id`)
- **Mudanças frontend**:
  - `notification-dropdown.tsx`: Retorna `null` se não tiver usuário ou `NOVU_APP_IDENTIFIER`. Fix de estilo `w-full`
  - `user-settings-modal.tsx`: **Removida seção de configurações de notificação** (87 linhas!) - resolve erro 403 "Notifications only available in staging mode"
- **Benefícios**:
  - ✅ Resolve erro 403 ao abrir settings em produção
  - ✅ Simplifica UI - menos código para manter
  - ✅ Avatar do usuário aparece nas notificações do Novu
- **Customizações preservadas**: URLs Prophet (`prophet.build`, `discord.gg/G9f5JASVZc`)

### Bloco aplicado — retries for files (1f1cd3f4f, PR #2174)
- **Upstream commits absorvidos**: `1f1cd3f4f` (retries for files) + merge `4ad091025`
- **Mudanças frontend**:
  - `use-file-queries.ts`: Retry aumentado de 3 → 15 tentativas com exponential backoff (1s → 30s max). Expõe `failureCount` e `failureReason` para feedback na UI
  - `use-file-content.ts`: Expõe `failureCount` do hook subjacente
  - `use-image-content.ts`: Expõe `failureCount` do hook subjacente
  - `file-attachment.tsx`: Usa `failureCount` para mostrar "Retrying... (attempt X)" durante carregamento. Só mostra erro após esgotar 15 retries
  - `file-viewer-modal.tsx`: Mesma lógica de retry - só mostra erro após esgotar tentativas
- **UX melhorada**: Quando usuário abre thread antiga com sandbox desligado, o sistema tenta até 15x (~8-10 min) com backoff exponencial antes de mostrar erro. Feedback visual durante retries
- **Console.logs de debug do upstream**: **Não aplicados** (eram para debug, não produção)
- **Testes**: `npm run lint` passou, erros de lint verificados nos arquivos modificados

## Progresso em 2025-11-25

### Bloco aplicado — credit usage/billing + mobile
- Reestruturamos `backend/core/billing/**` de acordo com o upstream, preservando a lógica de provedores manuais e atualizando `shared/config.py`, `subscriptions/handlers/retrieval.py` e `core/utils/config.py`.
- Portamos o catálogo e UI de pricing (`frontend/src/components/billing/**`), stores e hooks (`use-thread-data`, `use-threads`, `projects.ts`) além de alinhar o app mobile (`apps/mobile/**`).
- Ajustamos Langfuse mock, modelo Sonnet 4 e migrations de account deletion/indexes.
- **Testes locais:** `docker compose up backend worker redis`, `curl /api/health`, `/api/health-docker`, `/api/metrics/queue`, `GET /api/threads`, `GET /api/threads/{id}/messages`, `GET /api/billing/credit-usage-by-thread` (com filtros). Frontend compilou e chat respondeu com streaming usando o Redis local.

### Bloco aplicado — credit usage adjustments + mobile polish (7376383a1)
- Atualizamos o catálogo de tiers e o handler de recuperação de assinatura com o `price_id` real do Stripe, mantendo o fallback de provedores manuais. Inclui ajustes no serviço de créditos/cache e scripts (`grant_missing_credits.py`).
- Sincronizamos as APIs/UX de billing no frontend (novas props em `CreateCheckoutSessionResponse`, botões que tratam `scheduled_date`, toggle de billing period, copy do usage preview) e reimportamos o pacote mobile mais recente (`apps/mobile/**`).
- **Testes locais:** `npm run lint`, `curl /api/billing/credit-usage-by-thread?limit=3` autenticado com usuário `start@prophet.build` (confirmou payload com novos campos). Container backend/worker/redis seguia ativo via Docker Compose.

### Bloco aplicado — native tool calling + unified messages
- Substituímos o pipeline de parsing/stream do backend (`response_processor`, `threads.get_thread_messages`, `agentpress/native_tool_parser`, `utils/message_migration.py`) para suportar chunks nativos (`tool_call_delta`) mantendo nossos fallbacks XML (`_extract_function_call_blocks`). Redis/worker ganharam o novo consumidor (`services/redis_worker.py`) e os locks/prune jobs foram ajustados.
- No frontend/mobile, migramos todos os consumidores para o pacote `@/hooks/messages` (`useAgentStream`, `useThreadToolCalls`, `usePlaybackController`) e atualizamos `ThreadContent`, side panels e tool views para renderizar tool calls unificados + streaming parcial.
- **Testes locais:** 
  - Backend: `docker compose up backend worker redis`, `curl http://127.0.0.1:8000/api/health`, `curl /api/threads?limit=5` usando `X-Guest-Session` (checa fallback guest e JSON estrutural).
  - Frontend: `npm run lint` (sem erros novos). 
  - Observação: não foi possível repetir o fluxo autenticado `/api/threads/{id}/messages` por falta de um JWT válido; documentado para rodada seguinte.

### Bloco aplicado — queue-depth auto scaling + limpeza de docs Redis (9253e3cf0)
- Trouxemos `backend/core/services/queue_metrics.py`, conectamos o publisher no ciclo de vida do FastAPI/worker e expusemos `GET /api/metrics/queue` no `api_router`.
- Atualizamos a documentação para o padrão upstream, mantendo o conteúdo porém com branding Prophet e os endpoints reais (`https://app.prophet.build`). Os docs antigos de Redis tuning (`redis_connection_management.md`, etc.) foram removidos.
- Ajustamos o namespace CloudWatch para `Prophet` e documentamos a dependência do publisher no ambiente de produção.
- **Testes locais:** rebuild `docker compose build backend worker`, `docker compose up -d backend worker redis`, `curl http://127.0.0.1:8000/api/health`, `curl http://127.0.0.1:8000/api/metrics/queue` (retornou profundidade zero), além de verificar os logs e readiness dos containers.

### Bloco aplicado — fix credit usage by thread + índices (2c4f9087a)
- Reaplicamos o patch de threads (`backend/core/threads.py`) que evita múltiplas queries na rota `get_thread_messages`: carregamos todas as mensagens em um único loop paginado, checamos se precisam de migração em memória (`needs_migration`) e só então otimizamos o payload (removendo `content` de mensagens não humanas).
- Ajustamos `20251123153256_index_optimisations.sql` para registrar que os índices da tabela `messages` são executados via script separado `backend/supabase/RUN_VIA_PSQL_index_optimisations.sql`. O arquivo agora está versionado novamente como referência.
- Executamos todos os índices no Supabase usando `mcp_supabase_execute_sql` (rodando individualmente os `CREATE INDEX CONCURRENTLY`) e finalizamos com `ANALYZE messages` + inserção em `supabase_migrations.schema_migrations`.
- **Testes locais:** backend já estava rodando; rodamos `curl http://127.0.0.1:8000/api/health` para garantir que nada quebrou depois da troca da query e da aplicação dos índices.

### Bloco aplicado — mobile design refinements e novo showcase (162865907, ba478c391)
- Reimportamos todo o diretório `apps/mobile/**` a partir do upstream (AnimatedTierBackground, novos tool views, BillingPage refeito, prisms e animações). Mantivemos ajustes locais onde necessário (ex.: enablement de hooks e estados) e reaplicamos o branding Prophet (`locales/en.json`, termos legais, links de suporte, `APP_STORE_COPY.md`).
- Sincronizamos os novos assets da landing mobile (`frontend/public/images/landing-showcase/*`) e os componentes `showcase-section`, `grain-icon` para manter paridade com o PR. No web, preservamos a copy Prophet.
- Revimos `apps/mobile/lib/billing/*` para garantir que os IDs/códigos `kortix_*` usados pelo RevenueCat não fossem renomeados (continuam iguais para não quebrar IAP), trocando apenas strings de exibição e URLs públicos.
- **Testes locais:** mantivemos o backend rodando (`docker compose up backend worker redis`) e fizemos apenas validações manuais do Pricing modal; os lints/builds específicos do app mobile (`npm run lint`, `expo-doctor`) ainda precisam ser executados quando tivermos o ambiente iOS configurado.

### Bloco aplicado — worker warmup + Supabase paralelo (05e6be0d7, 5121a0105, e240168e9)
- `backend/run_agent_background.py` agora importa `warm_up_tools_cache` no topo, aquece o cache no startup do processo Dramatiq e deixa `initialize()` responsável apenas por Redis/DB. Atualizamos os logs para usar `redis_host/redis_port` calculados previamente e documentamos que o warmup não bloqueia a primeira requisição.
- `backend/core/run.py` passou a usar `asyncio.gather` para buscar `threads` e `projects` simultaneamente, reduzindo uma rodada de latência antes de carregar o sandbox/projecto.
- Rebuildamos os containers (`docker compose build backend worker` + `docker compose up -d backend worker`) para incorporar os binários novos e validamos `curl --http1.0 http://127.0.0.1:8000/api/health` (HTTP/1.0 explicitamente porque o `curl` padrão/HTTP1.1 estava resetando a conexão no ambiente Docker local).

### Bloco aplicado — infra/docs (README + docker-compose) + workflows
- Sincronizamos o `README.md` com o texto do upstream e aplicamos o branding Prophet (links da org `oimilo`, Discord `discord.gg/milo`, badges, quick start, etc.). Isso mantém o conteúdo atualizado enquanto preserva a identidade local.
- Atualizamos o `docker-compose.yaml` para incluir o cabeçalho de instruções de uso (ajustado para Prophet) e mantivemos os ajustes locais (imagens `ghcr.io/prophet-ai/prophet-backend`, montagens de `.env`, etc.).
- As tentativas de remover `.cursor/rules/backend.mdc`/`frontend.mdc` foram bloqueadas pelo ambiente (arquivos marcados como protegidos). Continuaremos com eles versionados até termos outra orientação.
- Revimos os workflows do GitHub:
  - `.github/workflows/docker-build.yml`: imagem agora publica `prophet-backend`; diretórios remotos/nomes de cluster passaram a aceitar secrets (`STAGING_PROJECT_DIR`, `STAGING_LEGACY_DIR`, `PROD_PROJECT_DIR`, `AWS_ECS_CLUSTER`, `AWS_ECS_API_FILTER`, `AWS_ECS_WORKER_FILTER`) com fallback para os caminhos antigos.
  - `.github/workflows/mobile-eas-update.yml`: `EXPO_PUBLIC_BACKEND_URL` aponta para `https://app.prophet.build/api`, mantendo o Supabase atual.
  - `apps/mobile/eas.json`: espelha o mesmo backend URL nos perfis development/production/testflight, evitando divergência com o workflow.

### Bloco aplicado — Prophet proxy URL fix + XML tool limit (custom)
- Restauramos a lógica de proxy para URLs do Daytona que foi perdida no merge:
  - `backend/core/utils/config.py`: adicionada property `DAYTONA_PREVIEW_BASE` que constrói a URL base do proxy baseada no ambiente.
  - `backend/core/tools/sb_expose_tool.py`: restaurada função `_build_proxy_url()` que converte URLs do Daytona para URLs do proxy Prophet.
  - `backend/core/tools/sb_files_tool.py`: adicionada função `_build_proxy_url()` para converter as URLs quando o agente cria/reescreve um `index.html`.
- Adicionamos `max_xml_tool_calls = 3` ao `ProcessorConfig` para permitir até 3 tool calls por resposta LLM antes de parar com `xml_tool_limit_reached`.
- Adicionamos normalização de caracteres especiais em nomes de arquivos para upload (`sb_upload_file_tool.py`), convertendo acentos (é→e, ç→c, etc.) para evitar erros `InvalidKey` no Supabase Storage.
- **Testes locais:** backend reiniciado via `docker compose restart backend worker`, `curl --http1.0 http://127.0.0.1:8000/api/health` confirmou operação normal.

### Bloco aplicado — daily credits refresh + KB improvements (611bd3dfd)
- Sincronizamos `backend/core/credits.py` com a nova função `check_and_refresh_daily_credits()` que verifica e atualiza créditos diários para usuários do tier free.
- Atualizamos `backend/core/billing/shared/config.py` com o novo campo `daily_credit_config` no dataclass `Tier`. O tier free agora recebe $2.00 diariamente (refresh a cada 24h) em vez de $2.00 one-time.
- Aplicamos 4 migrations via MCP Supabase para suportar daily credits: `20251125151140_daily_credits_refresh.sql`, `20251125152753_add_daily_grant_type.sql`, `20251125154048_fix_daily_refresh.sql`, `20251125175846_cleanup_daily_refresh.sql`.
- Sincronizamos `backend/core/knowledge_base/api.py` e `file_processor.py` com melhorias do upstream.
- Atualizamos componentes frontend: `credits-display.tsx`, `dashboard-content.tsx` (com branding Prophet), `unified-kb-entry-modal.tsx`.
- Sincronizamos todas as translations em `frontend/translations/*.json`.
- **Testes locais:** backend reiniciado via `docker compose restart backend worker`, `curl http://127.0.0.1:8000/api/health` confirmou operação normal.

**Arquivos de SEO/layout não atualizados (preservando branding Prophet):**
- `frontend/src/app/layout.tsx`, `frontend/src/app/metadata.ts` - já têm branding Prophet
- `frontend/src/app/sitemap.ts` - já está alinhado com upstream

**Mobile Design Rework (já parcialmente aplicado em blocos anteriores):**
- Os commits de mobile design (`611bd3dfd`, `5fd83e05c`, `628a87d87`) afetam principalmente `apps/mobile/**` que já foi sincronizado em blocos anteriores
- Verificar se há diferenças pendentes no mobile app

### Bloco aplicado — start sandbox in background (2158e8a11)
- Sincronizamos `backend/core/threads.py` para iniciar o sandbox proativamente em background quando uma thread tem um sandbox existente. Isso reduz a latência percebida pelo usuário ao abrir uma thread com sandbox.
- Ajustamos `backend/core/agentpress/thread_manager.py` para aceitar dicts sem a condição `content.get('content')`, tornando o parsing mais flexível.
- **Testes locais:** `python3 -c "import ast; ast.parse(open('core/threads.py').read())"` e `python3 -c "import ast; ast.parse(open('core/agentpress/thread_manager.py').read())"` confirmaram sintaxe válida.

### Bloco aplicado — Notifications via Novu (f9d4b3d8a)
- **20 commits** do upstream integrados (push notifications, email, in-app, presence)
- Adicionado módulo completo de notificações (`backend/core/notifications/`):
  - `notification_service.py` - orquestrador multi-canal
  - `novu_service.py` - integração com Novu API
  - `presence_service.py` - tracking de status online/offline
  - `api.py` + `presence_api.py` - endpoints REST
- Componentes frontend:
  - `notification-dropdown.tsx` - dropdown no sidebar com centro de notificações
  - `notification-settings.tsx` - configurações de preferências
  - `presence-provider.tsx` - React context para presence tracking
  - `use-presence.ts` - hook para verificar se usuário está online
- **6 migrations de banco de dados** aplicadas via MCP Supabase:
  - `notification_settings` - preferências por usuário
  - `device_tokens` - tokens de push notification
  - `user_presence_sessions` - tracking multi-sessão
- **Lógica custom preservada**:
  - `REDIS_RESPONSE_LIST_TTL = 3600 * 6` (6h TTL em vez de 24h do upstream)
  - ~~`REDIS_RESPONSE_LIST_MAX_SIZE = 500` (LTRIM)~~ **REMOVIDO** - causava race condition com SSE
  - Branding Prophet (displayName no dashboard)
  - Daytona proxy router re-adicionado ao `api.py`
- **Fallback de email**: Se Novu falhar, usa `email_service` (Mailtrap) diretamente
- **Env vars necessárias** (para ativar Novu):
  - `NOVU_SECRET_KEY` - API key do Novu
  - `NOVU_BACKEND_URL` - URL da API (default: https://api.novu.co)
  - Nota: Novu só ativo em `ENV_MODE=STAGING` por padrão
- **Testes**: `npm run lint` passou, sintaxe Python OK

### Bloco aplicado — UX/UI improvements & free tier revamp (010b09541)
- **Billing refatorado**: Novo endpoint unificado `account_state.py` (403 linhas)
  - Consolida subscription, credits, limits em uma única resposta
  - Hooks: `useAccountState` substitui `useCreditBalance` e outros hooks separados
- **Free tier revamp**:
  - Daily credits tracking correto (deduction order: Daily → Monthly → Extra)
  - 2 migrations: `proper_daily_credits_tracking`, `add_daily_refresh_type`
- **Novos componentes UX**:
  - `upgrade-celebration.tsx` - animação de celebração após upgrade
  - `welcome-bonus-banner.tsx` - banner de boas vindas
  - `usage-limits-popover.tsx` - popover de limites (substitui inline)
  - `scheduled-downgrade-card.tsx` - melhorado
- **Pricing redesenhado**: `pricing-section.tsx` refatorado (~700 linhas)
- **Model selector melhorado**: Acesso a modelos baseado em tier
- **Lógica custom preservada**: Branding Prophet (displayName)
- **Testes**: `npm run lint` passou, sintaxe Python OK

### Bloco aplicado — Novu production + atomic credit functions (f45ae15c7)
- **Upstream commits absorvidos**:
  - `fa61ca66d` - Novu enabled in production (`self.enabled = True`)
  - `c1fd94708` - Inbox notifications on dashboard
  - `411ee7e58` - Fix downgrade edge case + cleanup account state queries
  - `b310b4e87` - Split migrations (atomic credit functions)
- **Migrations aplicadas** (7 novas, 1 deletada, 1 renomeada):
  - `20251127144738_add_daily_credits_column.sql`
  - `20251127144746_atomic_daily_refresh_function.sql`
  - `20251127144843_add_daily_refresh_type.sql` (renomeada)
  - `20251127150827_atomic_use_credits_function.sql`
  - `20251127150909_atomic_grant_renewal_credits_function.sql`
  - `20251127151104_get_credit_breakdown_function.sql`
  - `20251127151402_grant_permissions_all_functions.sql`
- **Funções SQL atômicas**: Novo sistema de deduction de créditos (Daily → Monthly → Extra)
- **Cache invalidation**: Adicionado `invalidate_account_state_cache` no `run_agent_background.py`
- **Frontend updates**: `invalidateAccountState` helper, novo notification dropdown com fallback gracioso
- **Lógica custom preservada**:
  - CORS: `allowed_origins = ["https://www.prophet.build", "https://prophet.build"]`
  - Redis LTRIM/TTL (500 items, 6h)
  - Daytona proxy router
  - URLs corrigidas para prophet.build em: `config.py`, `notification_service.py`, `email.py`, `subscription/page.tsx`
- **⚠️ Problema encontrado**: CORS estava com `kortix.com`/`suna.so` após merge - corrigido manualmente
- **Testes**: Frontend build OK, backend imports OK

### Próximo bloco
- Garantir que as secrets citadas acima estão configuradas no repositório (`STAGING_PROJECT_DIR`, `STAGING_LEGACY_DIR`, `PROD_PROJECT_DIR`, `AWS_ECS_CLUSTER`, `AWS_ECS_API_FILTER`, `AWS_ECS_WORKER_FILTER`, `EXPO_TOKEN`, etc.) antes de habilitar os jobs na branch principal.
- Rodar os lints/builds específicos do app mobile (Expo/EAS) para garantir que o bloco "mobile refinements" não trouxe regressões de build.
- Se o ambiente permitir no futuro, remover ou arquivar os `.cursor/rules/*.md` extras para acompanhar o upstream; por ora estão protegidos pelo runtime.

## Passo a passo para sincronizar

1. **Buscar o upstream**
   ```bash
   git fetch upstream
   ```

2. **Conferir commits novos desde o baseline**
   ```bash
   # Use o hash anotado acima
   git log --oneline ed70428cc..upstream/main
   ```
   Para um recorte diário:
   ```bash
   git log --pretty=format:"%h %ad %s" --date=iso-local \
     --since="2025-11-22 00:00" --until="2025-11-22 23:59" upstream/main
   ```

3. **Ver diferenças agregadas**
   ```bash
   git diff --stat origin/main upstream/main
   ```
   Para focar só nos commits novos, compare com o baseline:
   ```bash
   git diff --stat ed70428cc upstream/main
   ```

4. **Escolher estratégia**
   - *Cherry-pick* para hotfixes isolados.
   - *Merge* (ou rebase) quando o conjunto é grande e não conflita.

5. **Aplicar e testar**
   - Crie uma branch (`sync/upstream-YYYYMMDD`).
   - Aplique commits selecionados.
   - Rode testes relevantes (lint, backend, frontend).

6. **Atualizar este arquivo**
   - Após mergear no `origin/main`, registre o novo hash do `upstream/main` que ficou coberto.

## Dicas úteis

- Use `git log origin/main..upstream/main` para ver apenas o que falta aplicar.
- Se precisar comparar apenas os ajustes locais, inverta o diff: `git diff --stat upstream/main origin/main`.
- Antes de sincronizar grandes mudanças de billing ou UX, leia o PR original para entender contextos (ex.: `yearly-plans`, `in-app-purchases`).
- Sempre cite a data/hora dos commits importantes na conversa para facilitar auditoria futura.

Manter este arquivo atualizado evita dúvidas sobre “até onde já sincronizamos” e acelera futuros merges com o upstream.

## Customizações locais que devemos preservar

- **🚨 Locale no Signup (CRÍTICO para billing)**: Salvamos o locale do usuário no metadata durante signup para detecção correta de moeda (BRL para pt, USD para outros). **Arquivos customizados**:
  - `frontend/src/app/auth/actions.ts` - Adiciona `locale` ao `userData` no signup
  - `frontend/src/app/auth/page.tsx` - Passa `locale` no formData e para componentes OAuth
  - `frontend/src/components/GoogleSignIn.tsx` - Salva locale em cookie `pending-locale`
  - `frontend/src/components/GithubSignIn.tsx` - Salva locale em cookie `pending-locale`
  - `frontend/src/app/auth/callback/route.ts` - Processa cookie `pending-locale` e salva no metadata
  - `backend/core/billing/subscriptions/free_tier_service.py` - Usa `get_user_locale()` para auto-detectar moeda
  - `backend/core/utils/user_locale.py` - Função que busca locale do `raw_user_meta_data`
  - **Sem isso**: Usuários BR recebem subscription em USD e não conseguem fazer upgrade em BRL (erro de conflito de moeda no Stripe)

- **🚨 Anthropic API (CRÍTICO)**: Em `backend/core/ai_models/registry.py`, usamos `SHOULD_USE_ANTHROPIC = bool(config.ANTHROPIC_API_KEY)`. O upstream usa Bedrock ARNs do Kortix que não funcionam para Prophet.
- **Proxy Daytona**: ajustes em `frontend/src/lib/utils/daytona.ts` e correlatos para reconstruir URLs de preview (inclui encoding segmentado e path derivado automaticamente).
- **Parser XML**: fallback para `<function_calls>` incompletos em `backend/core/agentpress/xml_tool_parser.py`, garantindo que `create_file` não quebre quando o streaming corta `</invoke>`.
- **Branding/UI**: alterações visuais da versão Prophet (logos, landing/hero, cores) e landing page custom (`frontend/src/...` + assets em `public/`).
- **Landing Page estática**: `landing_page.html` precisa continuar servindo via nossas rotas (mantemos favicon personalizado e assets).
- **Redis SSL/TLS**: suporte a `REDIS_SSL=true` para Upstash e outros provedores cloud (não presente no upstream).
- **Redis LTRIM/TTL**: `REDIS_RESPONSE_LIST_MAX_SIZE = 500` e `REDIS_RESPONSE_LIST_TTL = 3600 * 6` (6h) em `run_agent_background.py`.
- **Stripe Price IDs**: IDs de produção em `backend/core/utils/config.py` são os do Prophet (não Kortix).
- **max_output_tokens (CRÍTICO)**: Em `backend/core/ai_models/registry.py` e `ai_models.py`:
  - Adicionamos `max_output_tokens=8192` nos modelos `kortix/basic` e `kortix/power`
  - Modificamos `get_litellm_params()` para usar esse valor quando `max_tokens` não é especificado
  - Sem isso, Anthropic usa o padrão de 4096 tokens, causando truncamento de arquivos grandes
- **Auto-continue limits**: Removido limite custom de `consecutive_length_no_tool`. Agora usa valores padrão do upstream (25 auto-continues).
- **JSON repair removido**: Removemos o `repair_truncated_json` do `native_tool_parser.py`. O repair estava causando execução de tools com argumentos truncados (ex: arquivo cortado no meio). Com 8192 tokens, o problema de truncamento é bem menor.
- **🆕 HTML Preview com Retry (Prophet-only)**: O fix do upstream `3a8e03d78` só cobre o caso de `sandboxId === null` para imagens. Adicionamos verificação de `isWorkspaceReady` + retry automático no `HtmlRenderer` para garantir que previews funcionem mesmo com sandbox acordando. **Arquivos customizados**:
  - `frontend/src/components/thread/file-attachment.tsx` - Adiciona prop `isWorkspaceReady` e lógica de loading para HTML previews
  - `frontend/src/components/thread/attachment-group.tsx` - Passa `isWorkspaceReady` para `FileAttachment`
  - `frontend/src/components/thread/content/ThreadContent.tsx` - Aceita e passa `isWorkspaceReady` para `renderAttachments()`
  - `frontend/src/components/thread/ThreadComponent.tsx` - Obtém `isWorkspaceReady` do `useThreadData` e passa para `ThreadContent`
  - `frontend/src/components/thread/preview-renderers/html-renderer.tsx` - **Retry automático** com exponential backoff (15 tentativas, 1s→10s) e feedback visual
  - **Sem isso**: Landing pages criadas pelo agente dão erro ao abrir thread antiga (sandbox dormindo), funcionando apenas após F5

## ⚠️ Checklist OBRIGATÓRIO após cada sync

> **IMPORTANTE**: O upstream usa `kortix.com`, `suna.so` e outros domínios. Após cada sync, SEMPRE verificar:

### 1. CORS Origins (`backend/api.py`)
```python
# Deve conter APENAS prophet.build:
allowed_origins = ["https://www.prophet.build", "https://prophet.build"]
```

### 2. URLs hardcoded (buscar e substituir)
```bash
grep -r "kortix\.com\|suna\.so" --include="*.py" --include="*.tsx" --include="*.ts" | grep -v "tmp/\|backups/\|node_modules/"
```

**Arquivos comuns que precisam de correção:**
- `backend/api.py` - CORS
- `backend/core/utils/config.py` - `frontend_url` property
- `backend/core/notifications/notification_service.py` - task URLs
- `backend/core/services/email.py` - welcome email template
- `frontend/src/app/subscription/page.tsx` - support email

### 3. Daytona Proxy Router
Verificar se o router está incluído em `backend/api.py`:
```python
from core.routes import daytona_proxy
daytona_proxy.initialize(db)
api_router.include_router(daytona_proxy.router, prefix="/preview", tags=["preview"])
```

### 4. 🚨 Anthropic vs Bedrock (CRÍTICO)
O upstream usa Bedrock ARNs do Kortix. Prophet usa Anthropic direto. Verificar `backend/core/ai_models/registry.py`:
```python
# DEVE ser assim (Prophet):
SHOULD_USE_ANTHROPIC = bool(config.ANTHROPIC_API_KEY)

# NÃO DEVE ser assim (Upstream):
# SHOULD_USE_ANTHROPIC = config.ENV_MODE == EnvMode.LOCAL and bool(config.ANTHROPIC_API_KEY)
```

### 5. notification_service.py URLs
Verificar se URLs estão `prophet.build` e não `kortix.com`:
```python
task_url = f"https://www.prophet.build/projects/{project_id}/thread/{thread_id}"
"from_url": "https://www.prophet.build"
```

### 6. Auto-continue Limit (`run_agent_background.py`)
Estamos usando os valores padrão do upstream (25 auto-continues) para permitir que o agente complete tarefas longas.

Ao aplicar diffs do upstream, revise esses arquivos primeiro para evitar sobrescrever personalizações do produto Prophet.

## Hotfixes aplicados (pós-sync)

### 2025-11-26 — Redis SSL/TLS para Upstash
- **Problema**: `Connection closed by server` em produção porque Upstash requer TLS.
- **Solução**: Adicionamos `REDIS_SSL` env var e lógica de SSL em `redis.py` e `redis_worker.py`.
- **Ação necessária**: Configurar `REDIS_SSL=true` no ambiente de produção (DigitalOcean).

### 2025-11-26 — Latency Optimization + Gigantic Loop Fix (134d04ae, 7dd0c958)
- **Problema**: Delay significativo (~2-5s) em cada request do agente devido a múltiplas queries ao banco de dados. Também havia um bug que causava loops infinitos de retry em erros 400 do LiteLLM.
- **Solução**:
  - **`runtime_cache.py` (novo)**: Sistema de cache em memória + Redis para configs do Suna, evitando queries repetidas ao banco.
  - **`agent_loader.py`**: Atualizado para usar o cache, com "fast path" para agentes Suna (zero DB calls quando cache está quente).
  - **`agent_runs.py`**: Adicionado fast path que usa `get_static_suna_config()` + `get_cached_user_mcps()` para evitar queries.
  - **`run.py`**: Adicionado timing detalhado para diagnóstico de registro de tools.
  - **`run_agent_background.py`**: Warmup do cache Suna no startup do worker via `warm_up_suna_config_cache()`.
  - **`llm.py`**: Desabilitado retries internos do LiteLLM (`litellm.num_retries = 0`) para evitar loops infinitos.
  - **`thread_manager.py`**: Adicionada detecção de erros non-retryable (400, BadRequestError, validation) para parar imediatamente em vez de retry.
- **Lógica custom preservada**: LTRIM, TTL de 6h, `_build_proxy_url`, `normalize_filename`, `WEBHOOK_BASE_URL`, `max_xml_tool_calls`, `max_output_tokens`, SSL Redis.
- **Testes**: Imports OK, sintaxe Python OK.

### 2025-11-27 — Agent System Prompt Rebranding
- **Problema**: Os prompts de sistema dos agentes no banco de dados ainda continham "Suna.so" e "Kortix team" (resquícios das versões de agente criadas antes do fork).
- **Solução**: Aplicadas 2 migrations para atualizar todos os `system_prompt` na coluna `config` (JSONB) da tabela `agent_versions`:
  - `20251127195700_rebrand_agent_prompts_v2.sql` - Substitui "Suna.so → Prophet" e "Kortix team → Milo team"
  - `20251127195802_rebrand_agent_prompts_v3_remaining_suna.sql` - Remove referências restantes de "Suna"
- **Resultado**: 102 registros atualizados, 0 referências antigas restantes
- **Nota**: A tabela `agents` não tem coluna `config` direta - os prompts ficam em `agent_versions.config->>'system_prompt'`

### 2025-11-27 — Hotfixes & Tool Registry Cache (e035249ce..7d7f5a6f2)
- **Commits absorvidos**:
  - `e035249ce` - Hotfix context window manager / prompt cache
  - `535f05d3a` - Fix find model cost
  - `642c484a9` - Fast check if usage
  - `685c57cd9` - Welcome emails in init function
  - `c6401bb87` - Fix welcome emails
  - `363965900` - Add toolviews (mobile)
  - `7d7f5a6f2` - Merge PR #2168 rework-design-mobile
- **Mudanças backend**:
  - `context_manager.py` - Novo gerenciador de contexto (~500 linhas)
  - `prompt_caching.py` - Sistema de cache de prompts (~250 linhas)
  - `tool_registry.py` - Cache de schemas para melhor performance
  - `novu_service.py` - Logs melhorados com ❌ emoji
- **Skipped (preservando Prophet)**:
  - `notification_service.py` - Mantidas URLs `prophet.build`
  - `xml_tool_parser.py` - Mantido fallback XML truncado
  - `setup/api.py` - Bug no upstream (condição invertida)
- **Mobile**: 84 arquivos de design refatorados (não usamos mobile app)
- **Fix crítico**: `SHOULD_USE_ANTHROPIC = bool(config.ANTHROPIC_API_KEY)` para usar Anthropic direto (Bedrock ARNs são do Kortix)

### 2025-11-26 — Full Upstream Sync (7dd0c958..6ffc72f86)
- **Commits aplicados**: 19 commits desde `7dd0c958` até `6ffc72f86`
- **Mudanças principais**:
  - **`worker_health.py`**: Simplificado para verificar apenas conectividade Redis (não passa mais pelo Dramatiq queue)
  - **`thread_manager.py`**: Filtro de mensagens de usuário vazias no contexto LLM + verificação de `content` em dicts
  - **`threads.py`**: Query de count otimizada (`select thread_id` em vez de `select *`)
  - **Mobile auth revamp**: Novo fluxo de magic link, `EmailAuthDrawer`, remoção de `AuthForms`, `GuestAuthGate`, `GuestModeContext`
  - **Setting-up page**: Adicionado refs para prevenir múltiplas chamadas de inicialização
  - **PresentationViewer**: Adicionado `ensureSandboxActive` para acordar sandbox em erros 400/502/503
  - **Manual initialization revert**: Restaurado endpoint de inicialização manual de conta (webhook não é suficiente sozinho)
  - **CORS**: Adicionados domínios `prophet.build` e `prophet-milo-f3hr5.ondigitalocean.app`
- **Branding reaplicado**: URLs de legal/privacy, locales (`en`, `de`, `es`, `fr`, `it`, `ja`, `pt`, `zh`), api/config.ts
- **Proxy Daytona**: Router re-adicionado ao `api.py` (foi perdido no checkout do upstream)
- **Landing page**: Mantida a versão Prophet (não sincronizada com upstream)
- **Testes pendentes**: Build do frontend, testes locais do backend

