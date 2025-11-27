# Upstream Sync Playbook

Guia rápido para manter o fork (`oimilo/suna`) alinhado com o repositório oficial (`kortix-ai/suna`). Registre aqui o último commit do upstream que já está integrado para que os próximos sincronismos saibam exatamente de onde continuar.

## Baseline atual

| Data (UTC-3) | Commit upstream | Mensagem |
|--------------|-----------------|----------|
| 2025-11-27   | `2158e8a11`     | `Merge pull request #2152 from KrishavRajSingh/main` |

Tudo até o commit acima já foi incorporado no `origin/main`. As diferenças restantes vêm de customizações locais (branding, parser, etc.), proxy custom e dos commits novos do upstream posteriores à data registrada.

> **Como atualizar esta tabela:** após concluir um sync, substitua a linha por `HEAD` do `upstream/main` que acabou de ser integrado.

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
- Atualizamos a documentação para o padrão upstream, mantendo o conteúdo porém com branding Prophet e os endpoints reais (`https://prophet-milo-f3hr5.ondigitalocean.app`). Os docs antigos de Redis tuning (`redis_connection_management.md`, etc.) foram removidos.
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
  - `.github/workflows/mobile-eas-update.yml`: `EXPO_PUBLIC_BACKEND_URL` aponta para `https://prophet-milo-f3hr5.ondigitalocean.app/api`, mantendo o Supabase atual.
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

- **Proxy Daytona**: ajustes em `frontend/src/lib/utils/daytona.ts` e correlatos para reconstruir URLs de preview (inclui encoding segmentado e path derivado automaticamente).
- **Parser XML**: fallback para `<function_calls>` incompletos em `backend/core/agentpress/xml_tool_parser.py`, garantindo que `create_file` não quebre quando o streaming corta `</invoke>`.
- **Branding/UI**: alterações visuais da versão Prophet (logos, landing/hero, cores) e landing page custom (`frontend/src/...` + assets em `public/`).
- **Landing Page estática**: `landing_page.html` precisa continuar servindo via nossas rotas (mantemos favicon personalizado e assets).
- **Redis SSL/TLS**: suporte a `REDIS_SSL=true` para Upstash e outros provedores cloud (não presente no upstream).

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

