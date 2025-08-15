# 🌟 CLAUDE.md - Suna AI Development Assistant Guide

## 🎭 Contexto e Identidade

O **Suna** é um fork do Prophet AI focado em uso pessoal e pequenas equipes. Este guia fornece contexto completo para IAs assistentes (Claude, Cursor, etc.) ajudarem no desenvolvimento.

### Principais Diferenças do Prophet Original:
- **Simplicidade em Produção**: Sem RabbitMQ/Dramatiq em produção
- **Interface em PT-BR**: Totalmente localizada para português brasileiro
- **Foco Pessoal**: Otimizado para 1-10 usuários simultâneos
- **Deploy Simplificado**: Docker Compose ao invés de Kubernetes

## 🏗️ Arquitetura do Sistema

### Stack Técnico Completo

```
Frontend:
├── Next.js 15.0.3 (App Router)
├── TypeScript (strict mode)
├── Tailwind CSS + shadcn/ui
├── React Query (TanStack Query)
├── React Hook Form + Zod
└── Lucide Icons

Backend:
├── Python 3.11+
├── FastAPI + Pydantic v2
├── Supabase (PostgreSQL + Auth)
├── Redis (cache + pub/sub)
├── LiteLLM (multi-provider LLM)
└── Dramatiq (dev only)

Infraestrutura:
├── Docker + Docker Compose
├── E2B Sandboxes
├── GitHub Actions (CI/CD)
└── Nginx (reverse proxy)
```

### Fluxo de Dados

```
Usuário → Next.js → API Routes → FastAPI → Agent → LLM
    ↑                                  ↓
    ←── SSE/WebSocket ←── Redis ←── Response
```

### Decisões Arquiteturais Importantes

1. **Modo de Execução Baseado em Ambiente**:
   ```python
   if config.ENV_MODE == EnvMode.PRODUCTION:
       # Execução direta com asyncio
       asyncio.create_task(run_agent_async(...))
   else:
       # Usa Dramatiq + RabbitMQ
       run_agent_background.send(...)
   ```

2. **Sistema de Tools Dual**:
   - Decorador `@agent_tool` para OpenAPI schema
   - Formato XML para compatibilidade com Claude

3. **Streaming First**:
   - Server-Sent Events para respostas em tempo real
   - Redis pub/sub para coordenação

## 📁 Estrutura do Projeto

### Frontend (`/frontend`)
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Rotas de autenticação
│   ├── (dashboard)/       # Dashboard principal
│   └── actions/           # Server Actions
├── components/            # Componentes React
│   ├── ui/               # shadcn/ui base
│   ├── sidebar/          # Navegação lateral
│   └── thread/           # Chat/Thread UI
├── hooks/                # React Hooks customizados
├── lib/                  # Utilidades
└── contexts/            # React Contexts
```

### Backend (`/backend`)
```
├── agent/                # Core do agente
│   ├── tools/           # Ferramentas do agente
│   ├── run.py          # Loop principal
│   └── api.py          # Endpoints
├── services/            # Serviços externos
├── utils/              # Utilidades
├── supabase/           # Migrações SQL
└── run_agent_background*.py  # Workers
```

## 💻 Guias de Desenvolvimento

### Backend Development

#### Adicionando um Novo Tool

1. Crie o arquivo em `backend/agent/tools/`:
```python
from agentpress.tool import agent_tool, ToolResult, ToolError
from typing import Optional

@agent_tool(
    name="minha_ferramenta",
    description="Descrição clara do que a ferramenta faz"
)
async def minha_ferramenta(
    parametro: str,
    opcional: Optional[int] = None
) -> ToolResult:
    """
    Documentação detalhada da ferramenta.
    """
    try:
        # Lógica da ferramenta
        resultado = await processar(parametro)
        
        return ToolResult(
            output=f"Resultado: {resultado}",
            metadata={"status": "success"}
        )
    except Exception as e:
        return ToolError(error=str(e))
```

2. Registre em `backend/agent/tools/__init__.py`

3. Crie o componente de visualização em `frontend/src/components/thread/tool-views/`

#### Padrões de API FastAPI

```python
@router.post("/api/recurso", response_model=RespostaModelo)
async def criar_recurso(
    dados: DadosModelo,
    user_id: str = Depends(get_current_user_id_from_jwt),
    db: DBConnection = Depends(get_db)
):
    # Sempre use estrutlog para logging
    logger.info("Criando recurso", user_id=user_id, dados=dados.dict())
    
    # Validação e processamento
    try:
        resultado = await db.client.table('tabela').insert(dados.dict()).execute()
        return RespostaModelo(**resultado.data[0])
    except Exception as e:
        logger.error("Erro ao criar recurso", error=str(e))
        raise HTTPException(status_code=400, detail=str(e))
```

### Frontend Development

#### Componente com shadcn/ui

```tsx
"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

interface MeuComponenteProps {
  titulo: string
  onAction: () => Promise<void>
}

export function MeuComponente({ titulo, onAction }: MeuComponenteProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  
  const mutation = useMutation({
    mutationFn: onAction,
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Ação completada com sucesso."
      })
      queryClient.invalidateQueries({ queryKey: ['meus-dados'] })
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive"
      })
    }
  })
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{titulo}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button 
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending}
        >
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Executar Ação
        </Button>
      </CardContent>
    </Card>
  )
}
```

#### Hook Customizado

```tsx
// hooks/use-projetos.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { createClient } from "@/lib/supabase/client"

export function useProjetos(userId: string) {
  const supabase = createClient()
  const queryClient = useQueryClient()
  
  const query = useQuery({
    queryKey: ['projetos', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('account_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  })
  
  const createMutation = useMutation({
    mutationFn: async (nome: string) => {
      const { data, error } = await supabase
        .from('projects')
        .insert({ name: nome, account_id: userId })
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projetos', userId] })
    }
  })
  
  return {
    projetos: query.data ?? [],
    isLoading: query.isLoading,
    criarProjeto: createMutation.mutate,
    isCriando: createMutation.isPending
  }
}
```

## 🎨 Design System Suna

### Princípios de Design

O Suna adota um design **minimalista e moderno** com foco em:
- **Sutileza**: Bordas e backgrounds com transparências muito baixas
- **Hierarquia clara**: Uso de opacidade para criar níveis visuais
- **Feedback suave**: Transições e hovers delicados
- **Consistência**: Padrões reutilizáveis em todos os componentes

### Cores e Transparências

```tsx
// Backgrounds primários
const backgrounds = {
  // Light mode
  subtle: "bg-black/[0.02]",      // Background muito sutil
  hover: "bg-black/[0.04]",       // Hover state
  active: "bg-black/[0.06]",      // Active/pressed state
  
  // Dark mode
  darkSubtle: "dark:bg-white/[0.03]",
  darkHover: "dark:bg-white/[0.06]", 
  darkActive: "dark:bg-white/[0.08]"
}

// Bordas
const borders = {
  default: "border-black/6 dark:border-white/8",      // Borda padrão muito sutil
  hover: "border-black/10 dark:border-white/12",      // Borda no hover
}

// Estados de status
const statusColors = {
  success: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-600 dark:text-emerald-400",
    border: "border-emerald-500/20"
  },
  error: {
    bg: "bg-red-500/10",
    text: "text-red-600 dark:text-red-400",
    border: "border-red-500/20"
  },
  warning: {
    bg: "bg-amber-500/10",
    text: "text-amber-600 dark:text-amber-400",
    border: "border-amber-500/20"
  },
  info: {
    bg: "bg-blue-500/10",
    text: "text-blue-600 dark:text-blue-400",
    border: "border-blue-500/20"
  }
}
```

### Componentes Base

#### Cards Minimalistas

```tsx
// Card padrão do design system
<div className="rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 p-4 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200">
  {/* Conteúdo */}
</div>

// Card com estado de sucesso
<div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4">
  <span className="text-emerald-600 dark:text-emerald-400">
    Sucesso
  </span>
</div>
```

#### Botões Sutis

```tsx
// Botão ghost minimalista
<Button
  variant="ghost"
  className="h-7 w-7 p-0 hover:bg-black/5 dark:hover:bg-white/5"
>
  <Icon className="h-3.5 w-3.5 opacity-60" />
</Button>

// Botão com hover colorido
<Button
  variant="ghost"
  className="hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
>
  <Trash2 className="h-3.5 w-3.5 opacity-60" />
</Button>
```

#### Badges e Tags

```tsx
// Badge de status
<div className={cn(
  "px-2 py-0.5 rounded text-xs font-medium",
  isActive 
    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
    : "bg-muted text-muted-foreground border border-border"
)}>
  {isActive ? "Ativo" : "Inativo"}
</div>

// Tag informativa
<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
  <CircleDashed className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
  <span className="text-xs font-medium text-muted-foreground">
    Processando
  </span>
</div>
```

#### Código e Snippets

```tsx
// Bloco de código inline
<code className="text-xs bg-black/[0.02] dark:bg-white/[0.03] px-2 py-1 rounded-md font-mono border border-black/6 dark:border-white/8">
  {codeContent}
</code>
```

### Tipografia

```tsx
// Hierarquia de títulos
const typography = {
  // Títulos principais
  h1: "text-2xl font-semibold tracking-tight",
  h2: "text-xl font-semibold tracking-tight",
  h3: "text-lg font-semibold",
  h4: "text-sm font-medium",
  
  // Corpo de texto
  body: "text-sm text-foreground",
  bodyMuted: "text-sm text-muted-foreground",
  
  // Textos pequenos
  small: "text-xs text-muted-foreground",
  tiny: "text-xs text-muted-foreground/60",
  
  // Monospace
  mono: "font-mono text-xs"
}
```

### Ícones

```tsx
// Tamanhos padrões de ícones
const iconSizes = {
  xs: "h-3 w-3",      // Extra pequeno
  sm: "h-3.5 w-3.5",  // Pequeno (padrão para botões)
  md: "h-4 w-4",      // Médio
  lg: "h-5 w-5",      // Grande
  xl: "h-6 w-6"       // Extra grande
}

// Sempre use opacidade para ícones secundários
<Icon className="h-3.5 w-3.5 opacity-60" />

// Ícones coloridos para status
<CheckCircle className="h-3.5 w-3.5 text-emerald-500 opacity-80" />
<AlertTriangle className="h-3.5 w-3.5 text-red-500 opacity-80" />
```

### Espaçamentos

```tsx
// Sistema de espaçamento consistente
const spacing = {
  // Padding em cards/containers
  cardPadding: "p-4",
  sectionPadding: "p-6",
  
  // Gaps entre elementos
  tightGap: "gap-1",    // 0.25rem
  smallGap: "gap-2",    // 0.5rem
  defaultGap: "gap-3",  // 0.75rem
  largeGap: "gap-4",    // 1rem
  
  // Margens entre seções
  sectionMargin: "mt-6 mb-6",
  componentMargin: "mt-4 mb-4"
}
```

### Animações e Transições

```tsx
// Transição padrão
const transitions = {
  default: "transition-all duration-200",
  fast: "transition-all duration-100",
  slow: "transition-all duration-300",
  
  // Para hovers e interações
  hover: "transition-colors duration-200",
  
  // Para loading states
  pulse: "animate-pulse",
  spin: "animate-spin"
}

// Exemplo de uso
<div className="hover:bg-black/5 transition-all duration-200">
  {/* Conteúdo */}
</div>
```

### Padrões de Layout

```tsx
// Container com ícone e conteúdo
<div className="flex items-start gap-3">
  <div className="p-2 rounded-md bg-transparent opacity-60 shrink-0">
    <Icon className="h-4 w-4" />
  </div>
  <div className="flex-1 min-w-0">
    {/* Conteúdo principal */}
  </div>
</div>

// Header com ações
<div className="flex items-center justify-between mb-1">
  <div className="flex items-center gap-2">
    <h4 className="text-sm font-medium">Título</h4>
    <Badge />
  </div>
  <div className="flex items-center gap-2">
    {/* Botões de ação */}
  </div>
</div>
```

### Tool Calls e Feedback Visual

```tsx
// Tool call container (referência: toolcalls.module.css)
<div className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200 cursor-pointer">
  <div className="p-1 rounded">
    <Icon className="h-3.5 w-3.5 opacity-60" />
  </div>
  <span>Tool Name</span>
</div>

// Estados de tool calls
const toolCallStates = {
  pending: "border-amber-500/20 bg-amber-500/5",
  running: "border-blue-500/20 bg-blue-500/5 animate-pulse",
  success: "border-emerald-500/20 bg-emerald-500/5",
  error: "border-red-500/20 bg-red-500/5"
}
```

### Exemplo Completo: Card de Automação

```tsx
export function AutomationCard({ trigger }: Props) {
  return (
    <div className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200">
      <div className="flex items-start gap-3">
        {/* Ícone */}
        <div className="p-2 rounded-md bg-transparent opacity-60 shrink-0">
          <Clock className="h-4 w-4" />
        </div>
        
        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium truncate">
                {trigger.name}
              </h4>
              <div className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Ativo
              </div>
            </div>
            
            {/* Ações */}
            <div className="flex items-center gap-2">
              <Switch className="scale-90" />
              <Button variant="ghost" className="h-7 w-7 p-0 hover:bg-black/5 dark:hover:bg-white/5">
                <Edit className="h-3.5 w-3.5 opacity-60" />
              </Button>
            </div>
          </div>
          
          {/* Descrição */}
          <p className="text-xs text-muted-foreground truncate">
            {trigger.description}
          </p>
          
          {/* URL com botões */}
          <div className="flex items-center gap-2 mt-2">
            <code className="text-xs bg-black/[0.02] dark:bg-white/[0.03] px-2 py-1 rounded-md font-mono truncate flex-1 border border-black/6 dark:border-white/8">
              {trigger.webhook_url}
            </code>
            <Button variant="ghost" className="h-6 w-6 p-0 hover:bg-black/5 dark:hover:bg-white/5">
              <Copy className="h-3 w-3 opacity-60" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

## 🌍 Localização PT-BR

### Onde Traduzir

1. **Componentes de UI**: Todos os textos visíveis ao usuário
2. **Mensagens de Erro**: Toast notifications e alerts
3. **Tool Views**: Status e mensagens de ferramentas
4. **Validações**: Mensagens do Zod

### Exemplo de Tradução

```tsx
// ❌ Evite
<Button>Save</Button>
toast({ title: "Error occurred" })

// ✅ Correto
<Button>Salvar</Button>
toast({ title: "Erro ao salvar" })
```

### Formatos Brasileiros

```tsx
// Datas
const formatarData = (data: Date) => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(data)
}

// Moeda
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}
```

## ⚡ Performance e Otimizações

### Redis Best Practices

```python
# Sempre defina TTL
await redis.set(key, value, ex=3600)  # 1 hora

# Use pipeline para múltiplas operações
pipe = redis.pipeline()
pipe.set("key1", "value1")
pipe.set("key2", "value2")
await pipe.execute()

# Padrões de chave
agent_run_key = f"agent_run:{agent_run_id}:responses"
cache_key = f"cache:user:{user_id}:projects"
```

### Streaming de Respostas

```python
async def stream_response():
    async for chunk in agent_generator:
        # Processa chunk
        yield f"data: {json.dumps(chunk)}\n\n"
        
        # Força flush para envio imediato
        if hasattr(response, 'flush'):
            await response.flush()
```

### Frontend Performance

```tsx
// Lazy loading de componentes pesados
const EditorPesado = lazy(() => import('./EditorPesado'))

// Debounce para inputs
const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    searchMutation.mutate(value)
  }, 300),
  []
)

// Virtualização para listas grandes
<VirtualList
  height={600}
  itemCount={items.length}
  itemSize={50}
  renderItem={({ index }) => <Item data={items[index]} />}
/>
```

## 🔒 Segurança

### Validação de Inputs

```python
# Backend - sempre valide com Pydantic
class CreateProjectRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    
    @validator('name')
    def validate_name(cls, v):
        if not v.strip():
            raise ValueError('Nome não pode ser vazio')
        return v.strip()
```

```tsx
// Frontend - validação com Zod
const projetoSchema = z.object({
  name: z.string()
    .min(1, "Nome é obrigatório")
    .max(100, "Nome muito longo"),
  description: z.string()
    .max(500, "Descrição muito longa")
    .optional()
})
```

### Secrets e Environment

```bash
# .env.local (desenvolvimento)
NEXT_PUBLIC_SUPABASE_URL=...  # Público OK
SUPABASE_SERVICE_ROLE_KEY=...  # NUNCA público

# Sempre use process.env no servidor
const secret = process.env.SECRET_KEY
if (!secret) {
  throw new Error('SECRET_KEY não configurada')
}
```

**IMPORTANTE**: As variáveis de ambiente do frontend estão em `.env.local`, não em `.env`

## 🐛 Troubleshooting

### Problemas Comuns

1. **"Redis connection failed"**
   ```bash
   # Verifique se Redis está rodando
   docker-compose ps
   docker-compose up redis -d
   ```

2. **"Sandbox not responding"**
   ```bash
   # Reinicie o sandbox
   docker restart suna-sandbox
   ```

3. **"Unauthorized" no frontend**
   ```tsx
   // Verifique o token
   const session = await supabase.auth.getSession()
   console.log('Token válido?', !!session.data.session)
   ```

### Debug Tools

```python
# Backend logging detalhado
import structlog
logger = structlog.get_logger()

logger.info("Debug info", 
    user_id=user_id,
    payload=payload,
    headers=dict(request.headers)
)
```

```tsx
// Frontend debug
if (process.env.NODE_ENV === 'development') {
  console.log('Estado atual:', {
    user: session?.user,
    projetos: projetos.length,
    erro: error?.message
  })
}
```

## 🤖 Guia para IAs Assistentes

### Ao Modificar Código

1. **Sempre verifique traduções**: Textos em PT-BR
2. **Mantenha padrões**: shadcn/ui, TypeScript strict
3. **Teste o fluxo completo**: Frontend → Backend → LLM
4. **Considere o contexto**: Produção = sem Dramatiq

### Checklist para Changes

- [ ] Código segue padrões do projeto
- [ ] Traduções PT-BR adicionadas
- [ ] Types TypeScript corretos
- [ ] Tratamento de erros adequado
- [ ] Logging estruturado adicionado
- [ ] Performance considerada
- [ ] Segurança validada

### Arquivos Críticos

```
frontend/
├── lib/supabase/client.ts     # Cliente Supabase
├── components/ui/             # NUNCA modifique diretamente
├── hooks/use-*.ts            # Hooks reutilizáveis
└── app/actions/              # Server actions

backend/
├── utils/config.py           # Configurações
├── agent/run.py             # Loop principal do agente
├── services/supabase.py     # Conexão DB
└── run_agent_background*.py # Workers (cuidado!)
```

### Anti-Patterns a Evitar

```python
# ❌ EVITE
data = supabase.table('x').select('*').execute()  # Sem limit
await redis.set(key, value)  # Sem TTL
print(f"Debug: {data}")  # Use structlog

# ✅ CORRETO  
data = supabase.table('x').select('*').limit(100).execute()
await redis.set(key, value, ex=3600)
logger.info("Debug", data=data)
```

```tsx
// ❌ EVITE
const data: any = await fetch()  // Nunca use any
setData(response)  // Sem validação
<div className="mt-4">  // Classes hardcoded

// ✅ CORRETO
const data: ApiResponse = await fetch()
setData(validateResponse(response))
<div className={cn("mt-4", className)}>
```

## 🛠️ Tool Development Framework

### Sistema de Duplo Schema

Tools no Suna usam decoradores duplos para compatibilidade:

```python
from agentpress.tool import agent_tool, openapi_schema, xml_schema
from typing import Optional, List

# Primeiro define schemas
@openapi_schema({
    "name": "search_files",
    "description": "Search for files in the codebase",
    "parameters": {
        "type": "object",
        "properties": {
            "query": {"type": "string", "description": "Search query"},
            "file_types": {
                "type": "array",
                "items": {"type": "string"},
                "description": "File extensions to search"
            }
        },
        "required": ["query"]
    }
})
@xml_schema("""
<tool>
    <name>search_files</name>
    <description>Search for files in the codebase</description>
    <parameters>
        <parameter>
            <name>query</name>
            <type>string</type>
            <required>true</required>
        </parameter>
        <parameter>
            <name>file_types</name>
            <type>array</type>
            <required>false</required>
        </parameter>
    </parameters>
</tool>
""")
@agent_tool
async def search_files(query: str, file_types: Optional[List[str]] = None):
    # Implementação
    pass
```

### Padrões de Tool Classes

```python
# Para tools simples
from agentpress.tool import Tool

class MyTool(Tool):
    name = "my_tool"
    description = "Tool description"
    
    async def execute(self, **kwargs):
        return self.success("Result")

# Para Agent Builder tools
from agent.tools.agent_builder_tools.base_tool import AgentBuilderBaseTool

class AgentConfigTool(AgentBuilderBaseTool):
    async def get_agent_config(self, agent_id: str):
        # Acesso a self.db, self.user_id, etc.
        pass
```

## 🗄️ Database & Migration Patterns

### Padrão de Migration Idempotente

```sql
-- migrations/20250201000000_add_feature.sql
BEGIN;

-- Sempre use IF NOT EXISTS
CREATE TABLE IF NOT EXISTS feature_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- campos específicos
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_feature_updated_at 
    BEFORE UPDATE ON feature_table 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_feature_created_at 
    ON feature_table(created_at DESC);

-- RLS policies
ALTER TABLE feature_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON feature_table
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data" ON feature_table
    FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMIT;
```

### Padrões de Query Otimizada

```python
# Sempre use select específico e limit
result = await db.client.table('projects')\
    .select('id, name, created_at')\
    .eq('account_id', account_id)\
    .order('created_at', desc=True)\
    .limit(20)\
    .execute()

# Para counts, use count específico
count_result = await db.client.table('messages')\
    .select('*', count='exact', head=True)\
    .eq('thread_id', thread_id)\
    .execute()
```

## 🎨 shadcn/ui Setup Completo

### Instalação de Componentes

```bash
# Inicializar shadcn/ui (já feito no projeto)
npx shadcn-ui@latest init

# Componentes essenciais do Suna
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add form
npx shadcn-ui@latest add input
npx shadcn-ui@latest add toast
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add dropdown-menu
npx shadcn-ui@latest add scroll-area
npx shadcn-ui@latest add tabs
```

### Padrão de Form com shadcn/ui

```tsx
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

const formSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email("Email inválido"),
})

export function MyForm() {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Handle submission
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome</FormLabel>
              <FormControl>
                <Input placeholder="Seu nome" {...field} />
              </FormControl>
              <FormDescription>
                Este é seu nome público.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Enviar</Button>
      </form>
    </Form>
  )
}
```

## 🔐 Segurança Avançada

### JWT Validation Pattern

```python
# JWT validation sem verificação de assinatura (confia no Supabase)
def decode_jwt_without_verification(token: str) -> dict:
    """Decode JWT for user_id extraction only"""
    try:
        # Decode sem verificar assinatura
        decoded = jwt.decode(
            token,
            options={"verify_signature": False}
        )
        return decoded
    except jwt.DecodeError:
        raise HTTPException(401, "Invalid token")
```

### Credential Encryption

```python
from cryptography.fernet import Fernet
import base64

class EncryptionService:
    def __init__(self):
        # Gera ou carrega chave
        self.key = base64.urlsafe_b64encode(
            settings.ENCRYPTION_KEY.encode()[:32].ljust(32, b'0')
        )
        self.cipher = Fernet(self.key)
    
    def encrypt(self, data: str) -> str:
        return self.cipher.encrypt(data.encode()).decode()
    
    def decrypt(self, encrypted: str) -> str:
        return self.cipher.decrypt(encrypted.encode()).decode()
```

## 📊 Observabilidade & Monitoring

### Structured Logging

```python
import structlog

# Configuração do logger
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    cache_logger_on_first_use=True,
)

# Uso
logger = structlog.get_logger()
logger.info("Operation started", 
    user_id=user_id,
    operation="create_project",
    metadata={"source": "api"}
)
```

### Langfuse Integration

```python
from langfuse import Langfuse

langfuse = Langfuse(
    public_key=config.LANGFUSE_PUBLIC_KEY,
    secret_key=config.LANGFUSE_SECRET_KEY,
    host=config.LANGFUSE_HOST
)

# Criar trace
trace = langfuse.trace(
    name="agent_run",
    id=agent_run_id,
    session_id=thread_id,
    metadata={
        "model": model_name,
        "project_id": project_id
    }
)

# Adicionar spans
span = trace.span(
    name="tool_execution",
    input={"tool": tool_name, "args": args}
)
span.end(output=result)
```

## 🐳 Docker & Infrastructure

### Multi-stage Build Pattern

```dockerfile
# Build stage
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user -r requirements.txt

# Runtime stage
FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
COPY . .
ENV PATH=/root/.local/bin:$PATH
CMD ["uvicorn", "api:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose Production

```yaml
version: '3.8'
services:
  api:
    build: ./backend
    environment:
      - ENV_MODE=production
      - DATABASE_URL=${DATABASE_URL}
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### GitHub Actions CI/CD

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build and push
        run: |
          docker build -t myapp:latest .
          docker push myapp:latest
      
      - name: Deploy
        run: |
          ssh deploy@server 'docker pull myapp:latest && docker-compose up -d'
```

## 🧪 Testing Patterns

### Pytest com Fixtures

```python
# conftest.py
import pytest
from httpx import AsyncClient
from api import app

@pytest.fixture
async def client():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        yield ac

@pytest.fixture
async def authenticated_client(client):
    # Setup auth
    token = "test_token"
    client.headers["Authorization"] = f"Bearer {token}"
    yield client

# test_api.py
@pytest.mark.asyncio
async def test_create_project(authenticated_client):
    response = await authenticated_client.post(
        "/api/projects",
        json={"name": "Test Project"}
    )
    assert response.status_code == 201
    assert response.json()["name"] == "Test Project"
```

## 📚 Recursos Adicionais

- [Documentação Supabase](https://supabase.io/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [FastAPI Best Practices](https://fastapi.tiangolo.com/tutorial/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Dramatiq Documentation](https://dramatiq.io)
- [Redis Best Practices](https://redis.io/docs/manual/patterns/)

---

**Última atualização**: Janeiro 2025
**Mantenedor**: Equipe Suna
**Versão**: 1.1.0