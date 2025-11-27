# Plano de Sync Upstream - Novembro 27, 2025 (Parte 2)

## Commits a absorver

De `f9d4b3d8a` até `a82b2e80d` (upstream/main atual)

### Commits principais:
1. **`010b09541`** - UX/UI improvements upgrade & free tier revamp
2. **`a82b2e80d`** - Notifications: Stream → Supabase Realtime

---

## 📊 Análise de Impacto

### 🔴 CRÍTICO - Custom Logic (merge manual obrigatório)

| Arquivo | Nossa Customização | Mudança Upstream |
|---------|-------------------|------------------|
| `backend/run_agent_background.py` | LTRIM/TTL Redis (500 items, 6h) | +1037 linhas de diff! Nova função `check_terminating_tool_call`, refatoração grande |
| `frontend/src/lib/home.tsx` | Landing page Prophet PT-BR | Pode ter sido modificado |
| `frontend/src/lib/pricing-config.ts` | Planos traduzidos PT-BR | Possíveis novos campos |

### 🟡 ATENÇÃO - Já modificamos (verificar conflitos)

| Arquivo | Status |
|---------|--------|
| `frontend/src/components/billing/pricing/pricing-section.tsx` | Traduzimos textos |
| `frontend/src/components/dashboard/dashboard-content.tsx` | Branding Prophet |
| `frontend/src/components/sidebar/sidebar-left.tsx` | NotificationDropdown |
| `frontend/src/hooks/billing/*.ts` | Refatoramos hooks |

### 🟢 SAFE - Pode aceitar upstream direto

| Área | Arquivos |
|------|----------|
| Mobile | `apps/mobile/*` |
| Presence Refactor | `presence-provider.tsx`, `presence_service.py`, `presence_api.py` |
| Billing Backend | `endpoints/account_state.py`, `cache_utils.py` |
| Migrações | `20251127*.sql` (verificar se já aplicamos) |
| Novos componentes | `upgrade-celebration.tsx`, `usage-limits-popover.tsx` |

---

## 📋 Estratégia de Absorção

### Fase 1: Backup e Preparação
```bash
# Criar branch de trabalho
git checkout -b sync-upstream-nov27-p2

# Salvar versões atuais dos arquivos críticos
cp backend/run_agent_background.py /tmp/run_agent_background_prophet.py
cp frontend/src/lib/home.tsx /tmp/home_prophet.tsx
cp frontend/src/lib/pricing-config.ts /tmp/pricing-config_prophet.ts
```

### Fase 2: Merge Automático (arquivos safe)
```bash
# Arquivos que podem ser aceitos do upstream
git checkout upstream/main -- apps/mobile/
git checkout upstream/main -- frontend/src/providers/presence-provider.tsx
git checkout upstream/main -- backend/core/notifications/presence_*.py
```

### Fase 3: Merge Manual (arquivos críticos)

#### 3.1 `run_agent_background.py`
**Preservar:**
- `REDIS_RESPONSE_LIST_MAX_SIZE = 500`
- `REDIS_RESPONSE_LIST_TTL = 3600 * 6` (6h, upstream tem 24h)
- `redis.ltrim(response_list_key, -REDIS_RESPONSE_LIST_MAX_SIZE, -1)`

**Aceitar do upstream:**
- Nova função `check_terminating_tool_call()`
- Refatoração de imports
- Novas métricas/timing

#### 3.2 `home.tsx`
**Preservar:**
- Todo conteúdo Prophet PT-BR (hero, nav, footer, sections)
- URL prophet.build

**Aceitar do upstream:**
- Novos campos/estruturas se houver

#### 3.3 `pricing-config.ts`
**Preservar:**
- Textos em português
- "Prophet" em vez de "Kortix"

**Aceitar do upstream:**
- Novos campos de configuração

### Fase 4: Billing Hooks
O upstream pode ter mudado a estrutura dos hooks. Precisamos:
1. Verificar se `use-billing-status.ts` e `use-subscription.ts` voltaram
2. Manter nossa unificação em `use-account-state.ts`

### Fase 5: Migrações
Verificar se já aplicamos:
- `20251127092158_proper_daily_credits_tracking.sql` ✅ (já temos)
- `20251127093531_add_daily_refresh_type.sql` ✅ (já temos)

---

## 🧪 Checklist de Validação

- [ ] Backend inicia sem erros
- [ ] Frontend builda sem erros
- [ ] Landing page ainda em português
- [ ] Planos de preços em português
- [ ] NotificationDropdown funciona
- [ ] Presence usa Supabase Realtime
- [ ] Redis LTRIM/TTL ainda ativo
- [ ] `uv lock` atualizado

---

## ⏱️ Estimativa

| Fase | Tempo |
|------|-------|
| Preparação | 5 min |
| Merge automático | 10 min |
| Merge manual críticos | 30 min |
| Teste e validação | 15 min |
| **Total** | ~1 hora |

---

## 📝 Notas

1. O diff de `run_agent_background.py` é MUITO grande (1037 linhas). Provavelmente é melhor:
   - Pegar a versão upstream
   - Re-aplicar nosso LTRIM/TTL manualmente
   
2. O presence mudou de EventSource para Supabase Realtime - mudança arquitetural importante mas safe para aceitar

3. Verificar se upstream re-adicionou hooks que deletamos (`use-subscription.ts`, `use-billing-status.ts`)

