# Suna Port Plan

Plano vivo para alinhar o repositório Prophet com a base de código do Suna original (`tmp/kortix-suna`). Atualize conforme avançarmos.

---

## 1. Baseline & Preparação
- [x] Gerar dump do banco atual (`pg_dump` ou backup Supabase) e guardar snapshot seguro. _(Decisão 2025-10-24: pular backup nesta rodada conforme pedido; documentar risco no rollout.)_
- [x] Criar tag/branch `pre-suna-port` no Git. _(Dispensado em 2025-10-25 — alinhado com time que rollback via Git não será utilizado nesta rodada.)_
- [x] Rodar `mcp__supabase__get_advisors` e anexar resultado aqui (link ou arquivo) para saber riscos conhecidos.
  - 2025-10-24: relatórios `security` e `performance` coletados (ver resumo em **Notas** abaixo).
- [x] Validar se há scripts/manuais de rollback disponíveis. _(Sem material adicional identificado; decisão 2025-10-25 é seguir sem rollback formal além de Git/Supabase.)_

## 2. Sincronizar Migrações
- [ ] Revisar diffs detectados (suite 20251015–20251019 presente só no Suna, vs migrações exclusivas do Prophet):
  - `20251015063309_billing_improvements_part1.sql`
  - `20251015063310_billing_improvements_part2.sql`
  - `20251015063430_critical_billing_fixes.sql`
  - `20251015063444_credit_transaction_functions.sql`
  - `20251015063445_atomic_use_credits.sql`
  - `20251015063446_atomic_reset_credits.sql`
  - `20251015063447_grant_atomic_functions.sql`
  - `20251015063448_grant_use_credits.sql`
  - `20251015063449_grant_reset_credits.sql`
  - `20251016061240_distributed_circuit_breaker.sql`
  - `20251016114716_remove_billing_health_check.sql`
  - `20251016115107_add_trial_history_status.sql`
  - `20251016115145_add_renewal_period_column.sql`
  - `20251016115146_atomic_grant_renewal_function.sql`
  - `20251016115147_check_renewal_function.sql`
  - `20251016115148_grant_renewal_functions.sql`
  - `20251016115149_grant_check_renewal.sql`
  - `20251016115153_fix_atomic_use_credits_uuid_cast.sql`
  - `20251019081308_add_payment_status.sql`
  - Prophet-only hoje: `20251015160000_min_credit_tables.sql`, `20251017144500_add_reference_id_to_credit_ledger.sql`
- [ ] Definir estratégia:
- [x] Substituir `20251015160000_min_credit_tables.sql` pelo par `20251015063309`/`20251015063310` (garantir que schemas `credit_accounts`, `credit_ledger`, `credit_purchases`, `audit_log` reflitam a versão Suna).
- [x] Reconciliar `20251017144500_add_reference_id_to_credit_ledger.sql`: verificar se já está contemplado nas migrações originais ou se precisa virar patch separado.
- [x] Importar a sequência restante (funções atômicas, circuit breaker, ajustes trial/billing) mantendo ordenação original e avaliando se consolidar facilita rollback.
- [ ] Análise inicial (2025-10-24):
  | Migration | Tema principal | Observações |
  |-----------|----------------|-------------|
  | `20251015063309_billing_improvements_part1.sql` | Reconciliação de créditos + constraints e índices | Ajusta `credit_accounts`/`credit_ledger`; precisa substituir a migração minimalista que criamos (`20251015160000_min_credit_tables.sql`). |
  | `20251015063310_billing_improvements_part2.sql` | Novas tabelas (`credit_purchases`, `audit_log`) + RLS | Requer políticas e grants. Dependente do step anterior. |
  | `20251015063430_critical_billing_fixes.sql` | Webhooks Stripe, locks distribuídos, refund tracking | Cria `webhook_events`, `renewal_processing`, `refund_history`, `distributed_locks` + funções `acquire_/release_distributed_lock`; ampliar backend para usar lock fallback. |
  | `20251015063444_credit_transaction_functions.sql` ... `20251015063449_grant_reset_credits.sql` | Funções atômicas `credit_*` | Revisar interações com backend atual (ver `core/billing`). |
  | `20251016061240_distributed_circuit_breaker.sql` | Circuit breaker Stripe | Depende de novos serviços no backend. |
  | `20251016115107_add_trial_history_status.sql` ... `20251016115153_fix_atomic_use_credits_uuid_cast.sql` | Ajustes trial/billing | Sequência incremental; garantir aplicação na ordem. |
  | `20251019081308_add_payment_status.sql` | Campo extra em billing | Checar se backend consome. |
- [ ] Mapear impactos em grants/RLS existentes antes de aplicar (principalmente para novas tabelas e funções `SECURITY DEFINER`).
- [ ] Rebasear diretório `backend/supabase/migrations` para espelhar o Suna (ordem e conteúdo).
- [ ] Aplicar migrações em ambiente de staging:
  - [ ] Subir branch staging.
  - [ ] `supabase migration up` (ou pipeline equivalente).
  - [ ] Smoke tests (fluxos de billing e criação de agentes).
- [ ] Atualizar documentação com ordem de execução (incluir rollback se falhar).
- [ ] Validar `agents.config` e `agent_versions.config` pós-migração (consulta SQL).

## 3. Port de Código Essencial

### 3.1 Criação de Agentes
- [x] `backend/core/tools/agent_creation_tool.py`:
  - [x] Introduzir helper `build_agent_config(...)` que:
    - [x] Monte `tools.agentpress` com merge de defaults (`ensure_core_tools_enabled`) + overrides do usuário.
    - [x] Normalize arrays `tools.mcp` / `tools.custom_mcp` (garantir `enabledTools`, `config` mínimos).
    - [x] Construa `metadata` inicial (ícones, cores, flags padrão) e permita extensão futura.
    - ✅ Helper agora vive em `backend/core/utils/agent_config_builder.py` para uso compartilhado (importado pelos fluxos acima e disponível para scripts/backfill).
  - [x] Atualizar `create_new_agent` para:
    - [x] Incluir `config` e `metadata` no `insert_data` do Supabase já no primeiro insert.
    - [x] Persistir `config` alinhado com versão criada (chamar helper novamente após `create_version` se necessário).
    - [x] Remover dependência de colunas legadas (`system_prompt`, `configured_mcps`, etc.) ainda existentes em chamadas subsequentes.
  - [x] Ajustar fluxos auxiliares (`configure_agent_integration`, `update_agent_config`) para reutilizar o helper quando regenerarem config. (_Sync de triggers segue apenas replicando triggers em `agent_versions`._)
  - [x] Garantir compatibilidade com `agents_config_structure_check` (config/build agora sempre inclui `system_prompt`, `tools`, `metadata`).
- [ ] Backfill para agentes existentes (script SQL ou job):
  - [ ] Preencher `config` e `metadata` conforme estrutura da migração 20250723175911.
  - [ ] Reutilizar helper recém-criado (exposto via módulo/serviço auxiliar) para evitar divergência entre agentes antigos e novos.
  - 2025-10-24: script `python3 backend/scripts/backfill_agent_configs.py` executado com SERVICE_ROLE (`Agents scanned: 59, updated: 0, missing versions skipped: 0`). Repetir após novos ajustes ou em staging antes de produção definitiva.

### 3.2 Serviços e Orquestração
- [ ] `backend/core/agent_service.py`:
  - [x] Portar leitura via `VersionService.get_version()` (ou copiar lógica atual do Suna). Versão do Suna usa `batch_query_in` para evitar múltiplas chamadas; checar compatibilidade com `VersionService`.
  - [x] Ajustar dependências (batch query helpers, normalização de config).
- [x] `backend/core/agentpress/thread_manager.py`:
  - [x] Portar versão do Suna (auto-continue com `latest_user_message_content`, pré-checagem de tokens via `llm_response_end`, `estimated_total_tokens` e caching rápido).
  - [x] Incluir suporte a mensagens comprimidas (`metadata.compressed_content`) e compressão condicional com `ContextManager`.
  - [x] Revisar `ProcessorConfig`/assinaturas de `run_llm_call` e `auto_continue_generator` para aceitar novos parâmetros.
- [x] `backend/core/agentpress/response_processor.py`:
  - [x] Sincronizar lógica de streaming (drain timeout, tool execution sem bloquear finish events, manipulação de `estimated_total_tokens`).
  - [x] Checar compatibilidade com tracing, `StatefulGenerationClient` e novos eventos (`auto_continue`, `streaming_drained`).
- [ ] Revisar utilitários de suporte:
  - [x] `backend/core/agentpress/context_manager.py` e `prompt_caching.py` precisam do fluxo de compressão seletiva, cache invalidation e utilitários extras (`should_compress_message`, `cache_block_tracker`).
  - [ ] `core/agentpress/utils.py` (se existir) / helpers: confirmar se há novas funções chamadas pelo `ThreadManager` ou `ResponseProcessor`.
- [ ] `backend/core/tools/agent_builder_tools/**`:
  - [x] Ajustar `mcp_search_tool` para comportamento do Suna (`success=False` quando não há toolkits, mensagens genéricas).
  - [x] Revisar `trigger_tool`, `credential_profile_tool`, wrappers MCP.
- [ ] `backend/core/utils/config.py` + utilitários:
  - [x] Portar chaves adicionais (`SUPABASE_AGENT_PROFILE_BUCKET`, etc.).
  - [x] Avaliar necessidade dos utilitários extras (distributed lock, ensure_suna, etc.).

### 3.3 Billing/Integrações (Fasear)
- [x] Analisar diferenças nos módulos de billing (`core/billing/**`).
- [x] Decidir se port será todo de uma vez ou incremental.
- [x] Mapear dependências (circuit breaker, reconciliation).

### 3.4 Default Agent (Suna) Reinstall & Sync
- [x] Atualizar `backend/core/suna_config.py` com modelo `claude-haiku-4.5` (upstream 2025-10-24).
- [x] Sincronizar `backend/core/utils/scripts/manage_suna_agents.py` com upstream e expor comandos:
  - [x] `install-all` com overrides opcionais de nome/descrição.
  - [x] `reinstall-all` (novo) com suporte a `--dry-run` para planejamento de rollout.
  - [x] `install-user`/`replace-user` aceitando `--name`/`--description`.
- [x] Estender `SunaDefaultAgentService` / `install_suna_for_user.py` para aceitar overrides e registrar metadados de origem (`source_name`, `display_name_override`).
- [ ] Planejar sequência de execução em produção:
  - [ ] Rodar `reinstall-all --dry-run --name "<novo nome>"` para inventário dos accounts.
  - [ ] Executar rollout real em janela controlada (logar sucessos/falhas).
  - [ ] Reexecutar `stats` após rollout e validar agentes na UI (rename aplicado).
- [ ] Documentar checklist pós-reinstalação (backfill de configs, smoke test de threads).

### 3.5 Painel Administrativo (Admin Dashboard)
- Backend
  - [x] Confirmar que os módulos `backend/core/admin/admin_api.py` e `billing_admin_api.py` permanecem alinhados ao upstream (já portados) e expostos via `backend/api.py`.
  - [x] Trazer `backend/core/admin/master_password_api.py`, parametrizando a senha mestre via `config.ADMIN_MASTER_PASSWORD` (fallback loga aviso) e adicionando o router em `backend/api.py`.
  - [x] Expor serviços complementares (`admin_management_api.py`, `analytics_api.py`) para `/admin/admins` e `/admin/analytics/**`, garantindo respostas para dashboard/gráficos/healthcheck.
  - [ ] Garantir que `KORTIX_ADMIN_API_KEY` esteja configurado (local/staging/prod) e documentar distribuição para time de operações.
  - [x] Provisionar tabela `admin_users` (campos mínimos: `id`, `user_id`, `email`, `role`, `is_active`, timestamps) e manter coerência com `user_roles` (`admin`/`super_admin`).
  - [ ] Revisar `verify_admin_api_key`/`verify_role` e ajustar se o fluxo de autenticação exigir múltiplos níveis (support/viewer).
- Supabase
  - [x] Validar se há migrações adicionais do Suna para `admin_users`, `admin_actions_log` ou políticas RLS; portar e aplicar quando necessário (`20251026093000_admin_users_table.sql` cobre tabela + policies `is_admin`/`get_admin_role`).
    - ✅ Função auxiliar `get_user_account_by_email` portada (`20250821051025_find_user_by_email.sql`) para destravar master login.
    - ✅ Adicionados agregados de crédito faltantes (`20251026095000_add_credit_account_totals.sql`) para alinhar `credit_accounts` com o schema que expõe `lifetime_*`.
    - ✅ Restaurado RPC `get_user_email` (`20250910105021_fix_oauth_email_retrieval.sql`) para lookup de e-mails no painel.
  - [ ] Popular `admin_users` + `user_roles` com contas operacionais; definir processo de onboarding/offboarding e auditar `admin_actions_log`.
- Frontend
  - [ ] Copiar as rotas `frontend/src/app/(admin)/admin/**` e `/master-login` (componentes `AdminGuard`, `AdminSidebar`, páginas de usuários/billing/analytics/system/settings).
    - ✅ `/admin/billing` + componentes `AdminUserTable/AdminUserDetailsDialog` e página `/master-login` portados do Suna (faltam analytics/system/settings).
  - [x] Ajustar imports (`@/lib/api/admin`, `@/lib/supabase/admin`) e garantir build sem erros de TypeScript (`npm run lint` limpa; warnings herdados de `<img>` antigos permanecem).
  - [ ] Decidir ponto de entrada na UI (link dedicado na sidebar ou instruções internas) e revisar `middleware.ts` para permitir `/master-login`/`/admin`.
- Testes & Operação
- [ ] Exercitar fluxos-chave: login mestre, listagem de usuários, ajuste de créditos/refund, visualização de threads/atividade.
    - ⚠️ Necessário configurar `ADMIN_MASTER_PASSWORD` + seed em `admin_users` antes de validar `/master-login`.
    - Executar smoke manual: autenticar via `/master-login` → acessar `/admin/billing` → abrir modal → testar `credits/adjust` e `refund` (verificar efeitos no Supabase).
  - [ ] Adicionar smoke tests simples (ex.: `admin/billing/credits/adjust` requer role, `AdminGuard` bloqueia usuários sem permissão).
  - [ ] Documentar requisitos de segurança: armazenar `ADMIN_MASTER_PASSWORD`, `KORTIX_ADMIN_API_KEY`, e definir frequência de rotação.

### 3.6 Composio MCP “Queries + Session”
- Objetivo: seguir o fluxo oficial do Composio (search → session → execução) para evitar dumps enormes e manter o contexto do agente saudável.
- [ ] Atualizar o client Composio (`backend/core/composio_integration/client.py`) e `requirements.txt` para garantir suporte a `search_tools`/`session.generate`; documentar impactos em outros consumidores.
- [ ] Criar wrapper `search_tools` em `ComposioIntegrationService` (`backend/core/composio_integration/composio_service.py`) aceitando array de queries + filtros opcionais, retornando resposta já normalizada.
- [ ] Ajustar `MCPSearchTool.search_mcp_servers` (`backend/core/tools/agent_builder_tools/mcp_search_tool.py`) para usar o wrapper `{ "queries": [...] }` (parcial: agora consumindo Composio diretamente, falta expor `search_tools`).
- [ ] Implementar helper `start_mcp_session` em `ComposioIntegrationService` chamando `session.generate({"generate_id": true})`, retornando `session_id` + TTL e registrando métricas.
- [x] Persistir `session_id` por thread via `ThreadManager`/`AgentContext`; renovar automaticamente se API retornar 401/410 antes de reexecutar a ferramenta.
- [x] Atualizar `MCPToolExecutor` (`backend/core/tools/utils/mcp_tool_executor.py`) para anexar `session_id` nas execuções Composio e tentar novamente após renovar sessão.
- [x] Adicionar pós-processador no executor que:
  - Converta payloads em JSON estruturado;
  - Aplique limites (linhas/bytes) e gere resumo (contagem, colunas relevantes);
  - Envie conteúdo bruto grande para storage/Remote Workbench e retorne link + resumo (aplicável a qualquer MCP).
- [x] Após `search_tools`, registrar ferramentas recomendadas como preferidas no `DynamicToolBuilder` (`backend/core/tools/utils/dynamic_tool_builder.py`) e despriorizar chamadas que geram dumps completos (`list_tables`, etc.).
- [x] Atualizar prompts do agente (`backend/core/prompts/prompt.py`) para orientar uso da busca + sessão e do resumo de resultados.
- [x] Documentar o fluxo em `docs/mcp.md` (referenciar “Universal MCP Search” / `session.generate` da doc oficial do Composio).
- [ ] Testes:
  - Cobrir `search_tools` + sessão (incluindo renovação) com unit tests;
  - Smoke manual com integrações (ex.: Trello/GitHub) e confirmar resposta resumida;
  - Monitorar logs (tamanho pré/pós-filtro) para validar redução de payload.
  - ✅ Coberto: executor (header de sessão + resumo/armazenamento) via `test_mcp_tool_executor.py`.

### 3.7 Automação (Triggers & Workflows)
- Objetivo: reproduzir o sistema de automações do Suna (triggers + workflows) adotando Supabase Cron e sincronização com `agent_versions`.
- [ ] **Migrações & Estrutura de Dados**
  - [ ] Portar íntegro o conjunto de migrações relacionadas (`20250705161610_agent_workflows.sql`, `20250705164211_fix_agent_workflows.sql`, `20250708034613_add_steps_to_workflows.sql`, `20250708123910_cleanup_db.sql`, `20250723093053_fix_workflow_policy_conflicts.sql`, `20250726180605_remove_old_workflow_sys.sql`, `20250814184554_add_workflows_to_config.sql`).
  - [ ] Reaplicar políticas RLS, índices GIN (`steps`) e triggers `update_agent_workflows_updated_at` conforme upstream.
  - [ ] Criar/atualizar funções RPC `schedule_trigger_http` e `unschedule_job_by_name` + helpers requeridos pela versão Cron.
  - [ ] Alinhar tabelas auxiliares (`trigger_event_logs`, estatísticas via RPC) e grants para `service_role`/`authenticated`.
- [ ] **Adoção do Supabase Cron**
  - [x] Remover dependência do QStash (`ScheduleProvider` antigo) e configurar `ScheduleProvider` igual ao Suna (RPC + `X-Trigger-Secret`).
  - [x] Garantir que variáveis `WEBHOOK_BASE_URL`, `TRIGGER_WEBHOOK_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` estejam documentadas em `.env` e `docs/deployment.md`.
  - [x] Atualizar `backend/utils/config.py` para expor as novas chaves e remover referências a `QSTASH_TOKEN`.
- [x] **Providers & Integrações**
  - [x] Portar `ComposioEventProvider` (contagem de triggers ativos, enable/disable remoto, `delete_remote_trigger`).
  - [x] Revisar `ProviderService` para registrar dinamicamente schedule/webhook/composio e preservar schema de config.
  - [x] Confirmar dependências extras (`httpx`, `COMPOSIO_API_BASE`, `COMPOSIO_API_KEY`) no `requirements.txt`.
- [ ] **Trigger Service & Logs**
  - [ ] Atualizar `TriggerService` para incluir `TriggerEvent.context`, reconciliar enable/disable incremental e logging serializado.
  - [ ] Garantir que `_log_trigger_event` siga formato seguro (strings/JSON), e que métricas/contagens existam no Supabase.
  - [ ] Ajustar `process_trigger_event` para retornar variáveis de execução (`provider`, `trigger_slug`, `composio_trigger_id`, etc.).
- [ ] **Execution Service**
  - [ ] Portar `backend/triggers/execution_service.py` inteiro do Suna (SessionManager, AgentExecutor, WorkflowExecutor) para usar `run_agent_background`, billing (`billing_integration.check_and_reserve_credits`), seleção de modelo via versão ativa e prompts formatados.
  - [ ] Sincronizar dependências: `run_agent_background`, `core.versioning.version_service`, `model_manager`, `billing_integration`.
  - [ ] Revisar criação de sandboxes (import `core.sandbox.sandbox`) e tratamento de falhas (rollback de projetos/threads em caso de erro).
- [ ] **API & Rotas**
  - [ ] Copiar `core/triggers/api.py` e `api_all_triggers.py`, incluindo:
    - [ ] Funções `sync_workflows_to_version_config` e `sync_triggers_to_version_config` chamadas após create/update/delete.
    - [ ] Modelos de passo com `id`, `parentConditionalId`, suporte a playbooks e `WorkflowExecuteRequest.model_name`.
    - [ ] Hardening de webhook (`TRIGGER_WEBHOOK_SECRET` obrigatório) e respostas detalhadas.
    - [ ] Integração com billing/model gating em `execute_agent_workflow`.
  - [ ] Revisar inclusão dos routers (`router.include_router(workflows_router)`) seguindo estrutura do Suna.
  - [ ] Remover dependências do feature flag `agent_triggers` ou definir rollout para habilitá-lo permanentemente.
- [x] **Agent Builder & Ferramentas**
  - [x] Portar `core/tools/agent_builder_tools/trigger_tool.py`, incluindo `_sync_workflows_to_version_config`, retorno correto do dataclass e mensagens formatadas.
  - [x] Atualizar chamadas a `get_trigger_service`/`TriggerManager` para refletir novos métodos e ausência de QStash.
  - [ ] Ajustar UI/frontend do builder (se necessário) para lidar com passos que preservam `id` e metadados extras.
- [ ] **Edge Functions & Jobs**
  - [ ] Confirmar necessidade de `supabase/functions/run-agent-trigger`; ajustar payload gerado pelo Cron/ExecutionService.
  - [ ] Documentar fluxo: Supabase Cron → webhook `/api/triggers/{id}/webhook` → ExecutionService → `run_agent_background`.
- [ ] **Environment & Observabilidade**
  - [ ] Atualizar checklists de deploy para criação/remoção de jobs Cron via RPC (permissões `postgres`/`service_role`).
  - [ ] Instrumentar logs (`logger.debug/info`) conforme upstream e integrar com Sentry/Langfuse se habilitados.
  - [ ] Validar dashboards/queries existentes (upcoming runs, estatísticas) após ajustes estruturais.
- [ ] **Testes & Migração de Dados**
  - [ ] Escrever testes unitários para `ScheduleProvider`, `ComposioEventProvider`, `convert_steps_to_json` (condicionais/IDs) e `ExecutionService` (mockado).
  - [ ] Criar script de migração de dados para triggers/workflows existentes: normalizar config, preencher IDs de steps, recalcular índice GIN.
  - [ ] Conduzir smoke tests manuais: criar trigger schedule (agent + workflow), trigger Composio, trigger webhook manual.
  - [ ] Validar que `agent_versions.config` recebe listas `workflows`/`triggers` após operações CRUD.

## 4. Testes & Validação
- [ ] Atualizar/Adicionar testes unitários para `AgentCreationTool`, `AgentService`, `ThreadManager`.
  - [x] Cobrir helper `_build_agent_config` para garantir estrutura mínima (`backend/core/tools/tests/test_agent_creation_tool.py`).
  - [ ] Criar teste que garante que `create_new_agent` insere `agents.config` com chaves obrigatórias.
- [ ] Executar suites existentes (`pytest`, smoke manual via CLI/UI).
- [ ] Validar, via logs e queries Supabase, que:
  - [ ] Agentes criados têm `config` válido.
  - [ ] `agent_versions` sincroniza triggers/MCPs.
  - [ ] Auto-continue e caching não quebram.
- [ ] Exercitar leitura com `AgentService`/`AgentLoader` (listar agent → carregar individual) para confirmar que restrições/metadata chegam com o novo payload.
- [ ] Checklist pós-deploy (scripts SQL de verificação).

## 5. Governança de Atualizações Futuras
- [ ] Documentar processo de sync: copiar `tmp/kortix-suna`, gerar diff, aplicar.
- [ ] Agendar revisão periódica (ex.: semanal).
- [ ] Preparar lista de arquivos "críticos" que sempre devem ser comparados (ThreadManager, ResponseProcessor, VersionService, migrations).
- [ ] Opcional: automatizar diff com script (salvar referência aqui).

## 6. Pendências / Observações
- [ ] Inserir links para PRs, migrações aplicadas, resultados de testes.
- [ ] Adicionar notas sobre decisões (ex.: migrações omitidas).
- [ ] Se novos diretórios do Suna forem adotados (admin, utils), atualizar aqui.

### Notas
- 2025-10-24 — Supabase Advisors:
  - **Security**: violação crítica de `agents_config_structure_check` não listada, mas vários alertas (exposição de `auth.users` via `v_user_credits_summary`, `RLS` desabilitado em `agent_runs_cleanup_log`, políticas sem RLS, funções `SECURITY DEFINER`, etc.).
  - **Performance**: grande volume de `unused_index`, `unindexed_foreign_keys` e `auth_rls_initplan` nas tabelas copyadas do Suna. Guardar esta lista para fase de hardening pós-port.
- 2025-10-25 — Pacote de billing do Suna aplicado via MCP (`20251015063309`–`20251019081308`); dependências `20250923070217_commitment_tracking`, `20251013131022_billing_improvement` e `20250909184956_last_invoice_tracking` também executadas para alinhar `credit_accounts`/`trial_history`.
- 2025-10-25 — Port do módulo `core/billing` completo (Stripe circuit breaker, reconciliation, idempotency). Novas dependências: `core/billing/idempotency.py`, `core/billing/reconciliation_service.py`, `core/billing/stripe_circuit_breaker.py`, `core/utils/distributed_lock.py`, `core/utils/ensure_suna.py`.

---

Atualize as caixas de seleção conforme avançarmos. Se surgirem sub-tarefas maiores, crie subtítulos dedicados. 
- [ ] Checar migrações "rollback" (`20250729094718_cleanup_agents_table.sql`) — aparentemente removem `config`, mas ambiente atual ainda falha no `agents_config_structure_check`. Precisamos decidir se pulamos essas migrações ou se existem migrações posteriores que reintroduzem `config`. Documentar decisão antes de aplicar.
