# Frontend Port Plan

Prepared to align our frontend with the latest upstream (kortix-suna) capabilities before touching the codebase.

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
- Remaining:
  - Integrate connector/tools manager into agent settings so discovery isn’t dashboard-only.
  - Add credential list/bulk actions (registry, connections section) once backend endpoints are verified.
  - Re-enable tool save endpoint when backend supports `/secure-mcp/composio-profiles/save-tools`.

### 3. Knowledge Base & Templates ☐
- TODO: port knowledge base components and templates route; ensure Supabase queries align.

### 4. Subscription & Billing Flows ☐
- TODO: port subscription pages/hooks and reconcile UI with billing integration checks.

### 5. Docs & Operational Utilities ☐
- TODO: evaluate docs/master-login surfaces, decide on exposure and navigation updates.

### 6. Supporting Hooks & Shared Utilities 🚧
- Added Composio hook suite; triggers powered by backend API client.
- TODO: port other upstream helpers (`use-model-selection`, `use-thread-agent-status`, realtime/VAPI hooks, telemetry helpers) as needed by upcoming surfaces.

## Testing & Validation
- Automated: extend or add playwright/react testing-library coverage for triggers creation, knowledge base interactions, and billing modals.
- Manual smoke:
  - Trigger lifecycle (create → toggle → edit → delete).
  - Composio authentication test flow.
  - Knowledge base upload + search.
  - Subscription upgrade path.
- Regression: ensure existing sidebar and dashboard widgets still render; run `pnpm lint` and `pnpm test` in `frontend`.

## Rollout Considerations
- Stagger releases per workstream behind feature flags if necessary.
- Document new environment variables or settings in deployment playbooks.
- Coordinate with backend team before enabling routes depending on unmerged APIs.
