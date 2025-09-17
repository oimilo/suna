# Variáveis de Ambiente Necessárias no Vercel

## Backend (DigitalOcean App Platform)

```bash
# OpenRouter - OBRIGATÓRIO
OPENROUTER_API_KEY=sk-or-v1-xxxxx
OPENROUTER_API_BASE=https://openrouter.ai/api/v1
OR_SITE_URL=https://prophet-milo.vercel.app
OR_SITE_NAME=Prophet AI

# Supabase
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=xxxxx

# Outros
ENV_MODE=PRODUCTION
MODEL_TO_USE=anthropic/claude-sonnet-4-20250514
```

## Frontend (Vercel)

```bash
# URLs
NEXT_PUBLIC_BACKEND_URL=https://seu-backend.ondigitalocean.app/api
NEXT_PUBLIC_URL=https://prophet-milo.vercel.app
NEXT_PUBLIC_ENV_MODE=PRODUCTION

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxxxx

# Branding
NEXT_PUBLIC_APP_NAME=Prophet
NEXT_PUBLIC_COMPANY_NAME=Milo
NEXT_PUBLIC_SUPPORT_EMAIL=support@milo.com
# ... outras variáveis de branding
```

## Importante:
- Certifique-se de que NEXT_PUBLIC_BACKEND_URL está correto
- OPENROUTER_API_KEY é obrigatório no backend
- Todas as variáveis NEXT_PUBLIC_ devem estar no Vercel