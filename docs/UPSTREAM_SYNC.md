# Upstream Sync Playbook

Guia para manter o fork (`oimilo/prophet`) alinhado com o repositório oficial (`kortix-ai/suna`).

## Baseline atual

| Data (UTC-3) | Commit upstream | Mensagem |
|--------------|-----------------|----------|
| 2025-12-09   | `969ba7c2`      | `Merge pull request #2119 from kubet/feat/rework-desing-mobile` |

Tudo até o commit acima já foi incorporado no `origin/main` via merge da branch `upstream-dec2025`.

---

## Customizações Prophet Ativas

Essas são as customizações marcadas com `[PROPHET CUSTOM]` que devem ser preservadas em futuros syncs:

### 1. Daytona Preview Proxy (Backend + Frontend)

**Propósito**: Roteia URLs de preview do Daytona através do nosso backend para evitar o modal de warning do Daytona.

**Arquivos**:
- `backend/api.py` - Registro do router de proxy
- `backend/core/utils/config.py` - Settings do proxy (`DAYTONA_PREVIEW_BASE`, `DAYTONA_PREVIEW_SKIP_WARNING`, etc.)
- `backend/core/routes/daytona_proxy.py` - Router que faz proxy das requisições
- `frontend/src/lib/utils/url.ts` - `constructHtmlPreviewUrl()` usa proxy quando configurado

### 2. max_output_tokens do Model Registry

**Propósito**: Passa o `max_output_tokens` do registry para o LiteLLM, evitando truncamento de arquivos grandes.

**Arquivos**:
- `backend/core/run/agent_runner.py` - Busca `max_output_tokens` do model registry
- `backend/core/services/llm.py` - Passa `max_tokens` no `override_params`
- `backend/core/ai_models/registry.py` - Define `max_output_tokens=16384` nos modelos

### 3. Branding Prophet

**Propósito**: Substitui todas as referências visíveis de "Kortix" por "Prophet".

**Principais arquivos alterados**:
- `frontend/src/lib/site-metadata.ts` - Metadados do site
- `frontend/src/app/layout.tsx` - SEO e meta tags
- `backend/core/utils/config.py` - `OR_APP_NAME = "Prophet AI"`
- `backend/core/services/email.py` - Templates de email
- `backend/core/prompts/prompt.py` - Identidade do agente
- Vários componentes de UI (títulos, labels, mensagens)

### 4. URLs e Domínios

**Propósito**: Usa domínios `prophet.build` em vez de `kortix.com`/`suna.so`.

**Arquivos**:
- `backend/core/utils/config.py` - `OR_SITE_URL`, `frontend_url`
- `backend/api.py` - CORS origins
- `frontend/src/lib/home.tsx` - Links do GitHub
- Templates de email e notificações

---

## ⚠️ Pontos de Atenção

### Anthropic vs Bedrock (VERIFICAR!)

O upstream usa Bedrock ARNs do Kortix. O código atual está assim:

```python
# backend/core/ai_models/registry.py
SHOULD_USE_ANTHROPIC = config.ENV_MODE == EnvMode.LOCAL and bool(config.ANTHROPIC_API_KEY)
```

**Problema**: Em produção (`ENV_MODE != LOCAL`), vai tentar usar Bedrock ARNs do Kortix que não funcionam para Prophet.

**Solução necessária** (se não usar Bedrock próprio):
```python
SHOULD_USE_ANTHROPIC = bool(config.ANTHROPIC_API_KEY)
```

### CORS Origins

Após cada sync, verificar `backend/api.py`:
```python
allowed_origins = ["https://www.prophet.build", "https://prophet.build", ...]
```

### Daytona Proxy Router

Verificar se está registrado em `backend/api.py`:
```python
from core.routes import daytona_proxy
daytona_proxy.initialize(db)
api_router.include_router(daytona_proxy.router, prefix="/preview", tags=["preview"])
```

---

## Commits não aplicados (propositalmente)

- Mobile app commits - Não usamos o app mobile
- RevenueCat commits - IAP não aplicável
- Alguns commits de marketing/landing - Temos nossa própria landing

---

## Mega Merge 2025-12-09

### Principais features do upstream absorvidas:

1. **MCP Decoupled Execution** - Sistema de execução MCP desacoplado
2. **Bootstrap Mode** - Modo de inicialização otimizado
3. **JIT Tool Loading** - Carregamento de ferramentas sob demanda
4. **Mobile Design Rework** - Redesign completo do mobile (não usado)
5. **Notifications via Novu** - Sistema de notificações
6. **Referral System** - Sistema de indicações
7. **Daily Credits** - Créditos diários para tier free
8. **Grace Periods** - Período de graça para billing
9. **Onboarding Flow** - Fluxo de onboarding com marketplace
10. **Unicode Filenames** - Suporte a nomes de arquivo com caracteres especiais

### Customizações Prophet aplicadas neste merge:

1. ✅ Rebranding completo Kortix → Prophet
2. ✅ Favicon atualizado com logo Prophet
3. ✅ Logo de email atualizado
4. ✅ Daytona proxy restaurado
5. ✅ max_output_tokens passado ao LiteLLM
6. ✅ Links do GitHub atualizados para oimilo/prophet

---

## Passo a passo para sincronizar

1. **Atualizar o backup do upstream**
   ```bash
   cd tmp/kortix-suna
   git fetch origin
   git pull origin main
   ```

2. **Ver commits novos desde a baseline**
   ```bash
   git log --oneline 969ba7c2..HEAD
   ```

3. **Comparar diferenças**
   ```bash
   # Na raiz do projeto Prophet
   diff -rq backend/ tmp/kortix-suna/backend/ | grep -v __pycache__ | head -30
   ```

4. **Aplicar mudanças**
   - Cherry-pick para hotfixes isolados
   - Merge para conjuntos grandes

5. **Verificar customizações Prophet**
   ```bash
   grep -r "\[PROPHET CUSTOM\]" --include="*.py" --include="*.ts" --include="*.tsx" | grep -v "tmp/\|backups/"
   ```

6. **Atualizar este arquivo**
   - Registrar novo commit baseline
   - Documentar mudanças aplicadas

---

## Histórico de Syncs

| Data | Baseline Anterior | Nova Baseline | Notas |
|------|-------------------|---------------|-------|
| 2025-12-09 | `b00b431c4` | `969ba7c2` | Mega merge upstream-dec2025 |

