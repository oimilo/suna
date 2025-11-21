# Frontend Port Plan

Prepared to align our frontend with the latest upstream (milo-prophet) capabilities before touching the codebase.

## Objectives
- Restore the full triggers/automations experience so users can create, edit, toggle and delete tasks directly from the dashboard.
- Expose Composio discovery and diagnostics flows that surface MCP integrations end-to-end.
- Reintroduce auxiliary product areas (knowledge base, templates, billing flows, docs entry points) kept upstream so UX and backend APIs stay in sync.

## Prerequisites
- ✅ Confirm backend endpoints match upstream contracts (`/triggers/*`, `/composio/*`, `/knowledge-base/*`, `/billing/*`).
- ✅ Ensure environment variables required by new surfaces (e.g. `NEXT_PUBLIC_BACKEND_URL`, billing flags) are defined in each deployment target.
- ☐ Decide rollout strategy (feature flag vs. immediate replacement) for routes where we already have divergent UI (e.g. `/automations`).

## Workstreams & Tasks

### 1. Triggers Workspace Alignment ✅
- Ported the upstream triggers UI (`frontend/src/components/triggers/*`) and replaced `/automations` with the new workspace (`frontend/src/app/(dashboard)/automations/page.tsx`).
- Reworked trigger hooks to use the backend API client (`frontend/src/hooks/react-query/triggers/use-all-triggers.ts`, `use-agent-triggers.ts`) and adjusted sidebar widgets (`frontend/src/components/sidebar/nav-automations.tsx`).
- Trigger edit modal now tolerates upstream shape (`frontend/src/components/sidebar/trigger-edit-modal.tsx`).
- ✔️ Next: bring in trigger creation dialogs (schedule + event) and Composio event flow to enable full CRUD from the dashboard.

### 2. Composio Discovery & Diagnostics 🚧
- Ported core hooks/utilities under `frontend/src/hooks/react-query/composio/` (toolkits, profiles, triggers, mutations, utils).
- Added diagnostics page `/composio-test` with health check, search, and connector launch (`frontend/src/app/(dashboard)/composio-test/page.tsx`).
- Ported connector/tool manager components (`frontend/src/components/agents/composio/*`).
- Integrated the Composio registry and tools manager into agent configuration (`frontend/src/components/agents/mcp/mcp-configuration-new.tsx`) including MCP list updates and agent MCP mutation hook.
- Ported the credential/connections manager (`/settings/credentials`) with bulk actions, MCP URL viewer, and registry shortcut.
- Tool selector now tolerates missing `/secure-mcp/composio-profiles/save-tools` endpoint (logs + soft-fall back) so agents still get their tools via the agent update path.
- Backend auth flow now defaults to Composio-managed redirects (no API keys exposed) so connectors like Trello surface the proper login link.
- Remaining:
  - Re-enable tool save endpoint when backend supports `/secure-mcp/composio-profiles/save-tools`.

#### Phase 2.1 – Composio Credential Alignment (new)
- Backend parity work:
  - Normalize slugs when we read/write Composio profiles (`backend/core/composio_integration/composio_profile_service.py`) and when versions are created (`backend/core/versioning/version_service.py`) so anything persisted by the agent builder matches o formato upstream (`composio.<slug>` com hífens).
  - Revisitar `CredentialProfileTool.configure_profile_for_agent` para reaproveitar o slug canônico (converter underscore → hífen quando necessário) e garantir que `mcp_qualified_name` acompanhe todas as fusões de `custom_mcps`.
  - Planejar uma migração/backfill no Supabase para remover prefixos legados `custom_composio_*` e preencher `toolkit_slug` ausentes em `user_mcp_credential_profiles`, mantendo a cifra via `ComposioProfileService`.
- Frontend follow-up:
  - Ajustar `ConfiguredMcpList` e `MCPConfigurationNew` para ler o slug via `toolkit_slug`, `config.mcp_qualified_name` ou chaves legadas e alimentar `useComposioToolkitIcon`, garantindo que credenciais criadas pelo agente exibam os ícones corretos.
  - Trocar as keys da lista de MCPs para usar `profile_id` (ou `mcp.config.profile_id`) e evitar warnings de duplicidade quando o agent builder cria múltiplas entradas com o mesmo qualified name.
- QA & verificação:
  - Exercitar fluxos Trello/Auth1 via agent builder após o ajuste de slug e confirmar que o link de autenticação espelha o comportamento do Prophet original.
  - Rodar smoke em `/agents` (modal + logos), `/settings/credentials` e nas ferramentas de descoberta do chat depois da limpeza de dados.

### 3. Knowledge Base & Templates ☐
- Ported knowledge base manager page (`/knowledge`) with folders/files UI, including new `knowledge-base/*` components, Supabase-driven hooks, and sidebar navigation.
- `/agents/config` now reuses the unified knowledge base manager (tree view, folder/file assignments) so agent configuration matches upstream UX.
- Agent configuration flows now use the upstream modal (`AgentConfigurationDialog`) with icon editor, granular tool configuration, and model selector.
- Added public template share route (`/templates/[shareId]`) with OG image endpoint so marketplace links render for unauthenticated users.
- TODO: template catalog parity review (marketplace tab still disabled upstream); confirm backend endpoints for publishing/cloning templates.
- ✅ grade/listas/sidebar agora disparam o novo `AgentConfigurationDialog` em vez de redirecionar para `/agents/config`; falta revisar traduções/branding do modal e unificar mensagens.
- ✅ resolvemos warnings de dependência no `knowledge-base-manager`, com `useEffect` e `useCallback` alinhados ao comportamento upstream (build atual só reclama dos `<img>` legados em templates).
- ✅ grid de agentes agora usa o `UnifiedAgentCard`, mantendo o menu contextual e confirmando exclusão via `AlertDialog` local.
- ✅ portamos o `UnifiedAgentCard` e atualizamos os grids de marketplace/templates para usarem o mesmo componente do upstream (incluindo badges e estados de ação); seguir avaliando a grid de agentes quando migrarmos o modal de ações completo.
- ✅ modal de upload da base de conhecimento volta a pré-selecionar a primeira pasta disponível, reseta estado ao fechar e libera o CTA de upload sem passos extras.
- ✅ granular tool configuration agora lê os defaults do backend quando o agente não tem configuração explícita, deixando todos os core tools habilitados por padrão.
- ✅ avatars de agentes passaram a usar o componente upstream com ícones dinâmicos/milo logo, respeitando cores salvas e cache local dos agentes.
- ✅ uploads de arquivos no chat normalizam caminhos para `/workspace/uploads/*`, limpam pendências locais e evitam anexos duplicados com erro de preview.
- ✅ fluxo de streaming do chat acompanha a lógica upstream (`userInitiatedRun` + `lastStreamStartedRef`), então a UI volta a atualizar respostas em tempo real sem precisar de refresh.
- ✅ ferramentas de visão (`load_image`) agora criam/verificam o bucket público automaticamente e usam o bucket configurável em `SUPABASE_PUBLIC_IMAGE_BUCKET`, evitando o 404 “Bucket not found”.
- ✅ aba de Integrations resgatou o fluxo completo das integrações Composio/custom (logos, gerenciamento de ferramentas) e removeu o alerta falso de Pipedream legado; código/fluxos de Pipedream foram totalmente eliminados.

### 4. Subscription & Billing Flows ☐
- TODO: port subscription pages/hooks and reconcile UI with billing integration checks.

### 5. Docs & Operational Utilities ☐
- TODO: evaluate docs/master-login surfaces, decide on exposure and navigation updates.

### 6. Supporting Hooks & Shared Utilities 🚧
- Added Composio hook suite; triggers powered by backend API client.
- Brought in `use-update-agent-mcps` to let registry invalidate agent cache on connector changes.
- Upgraded `DataTable` to support row selection/header actions required by the Composio connections grid.
- TODO: port other upstream helpers (`use-model-selection`, `use-thread-agent-status`, realtime/VAPI hooks, telemetry helpers) as needed by upcoming surfaces.

## Testing & Validation
- Automated: extend or add playwright/react testing-library coverage for triggers creation, knowledge base interactions, and billing modals.
- Manual smoke:
  - Trigger lifecycle (create → toggle → edit → delete).
  - Composio authentication test flow.
  - Knowledge base upload + search.
  - Subscription upgrade path.
- Regression: ensure existing sidebar and dashboard widgets still render; rodar `npm run lint` e `npm run test` no `frontend`.
- ✅ `npm run build` (frontend) pós-ajustes do configurador/knowledge base.

## Rollout Considerations
- Stagger releases per workstream behind feature flags if necessary.
- Document new environment variables or settings in deployment playbooks.
- Coordinate with backend team before enabling routes depending on unmerged APIs.
