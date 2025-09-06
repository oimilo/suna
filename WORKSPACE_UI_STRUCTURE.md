# 📊 Estrutura da Área de Trabalho - Documentação Completa

## 🎯 Visão Geral

A "Área de Trabalho" é o painel lateral direito que exibe o progresso e resultados das operações do agente AI. Atualmente, ela mostra informações técnicas detalhadas que podem ser confusas para usuários não-técnicos.

## 🏗️ Arquitetura de Componentes

### Hierarquia Principal

```
ThreadPage (page.tsx)
└── ThreadLayout
    ├── SiteHeader (Barra superior)
    ├── Children (Área do chat)
    └── ToolCallSidePanel (Área de Trabalho) ⭐
        ├── Header (Título + Controles)
        ├── Navigation (Setas + Contador)
        ├── Content Area
        │   └── ToolViewWrapper
        │       ├── ToolViewHeader
        │       ├── ToolViewBody (Conteúdo específico)
        │       └── ToolViewFooter
        └── Footer (Status)
```

## 📁 Arquivos Principais

### 1. **ToolCallSidePanel** (`tool-call-side-panel.tsx`)
- **Localização**: `/frontend/src/components/thread/tool-call-side-panel.tsx`
- **Função**: Container principal da área de trabalho
- **Responsabilidades**:
  - Gerencia o estado de abertura/fechamento
  - Controla navegação entre tool calls
  - Renderiza o conteúdo baseado no tipo de ferramenta

### 2. **ToolViewWrapper** (`tool-views/wrapper/ToolViewWrapper.tsx`)
- **Função**: Wrapper padrão para todas as visualizações de ferramentas
- **Estrutura**:
  ```tsx
  <div className={styles.toolViewContainer}>
    <Header> [Ícone] [Nome da Ferramenta] </Header>
    <Body> [Conteúdo específico] </Body>
    <Footer> [Status: Sucesso/Erro] [Timestamp] </Footer>
  </div>
  ```

### 3. **ToolViewRegistry** (`tool-views/wrapper/ToolViewRegistry.tsx`)
- **Função**: Mapeia tipos de ferramentas para seus componentes visuais
- **Ferramentas registradas**:
  - Operações de arquivo (create, read, edit, delete)
  - Comandos do terminal
  - Navegação web
  - Buscas e scraping
  - E mais 30+ tipos

## 🎨 Sistema de Estilos

### Arquivo Principal: `toolcalls.module.css`

#### Cores e Estados
```css
/* Estados visuais das tool calls */
.pending  → Amarelo (amber)    → Aguardando
.running  → Azul (blue)         → Executando (com animação pulse)
.success  → Verde (emerald)     → Sucesso
.error    → Vermelho (red)      → Erro
```

#### Padrões Visuais Atuais
```css
/* Light Mode */
Background: rgba(0, 0, 0, 0.02)  /* 2% preto transparente */
Border: rgba(0, 0, 0, 0.06)      /* 6% preto transparente */
Hover: rgba(0, 0, 0, 0.04)       /* 4% preto transparente */

/* Dark Mode */
Background: rgba(255, 255, 255, 0.03)  /* 3% branco transparente */
Border: rgba(255, 255, 255, 0.08)      /* 8% branco transparente */
Hover: rgba(255, 255, 255, 0.06)       /* 6% branco transparente */
```

## 🖼️ Zonas da Interface

### 1. **Header Zone** (Cabeçalho)
- **Localização**: Topo do painel
- **Conteúdo**: 
  - Título: "Área de trabalho de {agentName}"
  - Botão de fechar (X)
- **Classe CSS**: `.absolute top-0 left-0 right-0`

### 2. **Navigation Zone** (Navegação)
- **Localização**: Abaixo do header
- **Conteúdo**:
  - Setas de navegação (← →)
  - Contador: "1 de 5"
  - Status do agente
- **Interação**: Permite navegar entre diferentes tool calls

### 3. **Content Zone** (Área Principal)
- **Localização**: Centro do painel
- **Conteúdo**: Varia por tipo de ferramenta
  - **FileOperation**: Mostra código, diffs, conteúdo de arquivos
  - **Command**: Terminal output
  - **WebSearch**: Resultados de busca
  - **Browser**: Screenshots e ações
- **Scrollable**: Possui scroll próprio

### 4. **Footer Zone** (Rodapé)
- **Localização**: Base de cada tool view
- **Conteúdo**:
  - Badge de status (Sucesso/Erro)
  - Timestamp da operação
- **Classe CSS**: `.toolViewFooter`

## 🔧 Tipos de Tool Views

### Mais Técnicas (Problemáticas para usuários finais)
1. **FileOperationToolView**: Mostra código completo, diffs, paths técnicos
2. **CommandToolView**: Output de terminal, comandos shell
3. **StrReplaceToolView**: Operações de string/regex
4. **McpToolView**: Chamadas de API técnicas

### Mais Amigáveis
1. **WebSearchToolView**: Resultados de busca formatados
2. **BrowserToolView**: Screenshots e ações visuais
3. **CompleteToolView**: Mensagem de conclusão simples
4. **DeployToolView**: Status de deploy com link

## 📊 Análise de Problemas Identificados

### Problemas Atuais
1. **Excesso de informação técnica**:
   - Paths completos de arquivos
   - Código fonte inteiro
   - Mensagens de erro técnicas
   - Comandos de terminal

2. **Dificuldade de navegação**:
   - Usuário precisa voltar várias abas para encontrar arquivos entregues
   - Sem distinção visual clara entre operações técnicas e resultados finais
   - Contador simples "1 de 5" não indica o que cada número contém

3. **Falta de hierarquia visual**:
   - Todas as operações têm o mesmo peso visual
   - Resultados finais não são destacados
   - Operações intermediárias ocupam muito espaço

## 💡 Pontos de Customização Identificados

### 1. **Controle de Visibilidade** (Sem alterar backend)
- **Local**: `ToolCallSidePanel` pode filtrar tool calls antes de exibir
- **Como**: Adicionar lógica de filtro baseada no tipo de ferramenta
- **Exemplo**: Ocultar operações técnicas, mostrar apenas resultados

### 2. **Customização Visual**
- **Local**: `toolcalls.module.css` e componentes individuais
- **Como**: 
  - Criar classes especiais para "resultados finais"
  - Adicionar ícones mais claros
  - Usar cores/tamanhos diferentes para hierarquia

### 3. **Agrupamento Inteligente**
- **Local**: `ToolCallSidePanel` na função de renderização
- **Como**: Agrupar operações relacionadas
- **Exemplo**: Colapsar múltiplas edições de arquivo em um único item

### 4. **Summary Mode**
- **Local**: Novo componente ou modo de visualização
- **Como**: Criar visualização resumida que destaca apenas:
  - Arquivos criados/modificados
  - Links para preview
  - Mensagens de conclusão
  - Erros importantes

## 🎯 Estratégia de Modificação Proposta

### Fase 1: Filtros e Visibilidade
```tsx
// Em ToolCallSidePanel, adicionar:
const isUserFriendlyTool = (name: string) => {
  const friendlyTools = ['complete', 'deploy', 'web-search', 'browser-navigate-to'];
  return friendlyTools.includes(name);
};

// Filtrar tool calls mostradas
const displayedToolCalls = showTechnicalDetails 
  ? toolCalls 
  : toolCalls.filter(tc => isUserFriendlyTool(tc.name));
```

### Fase 2: Hierarquia Visual
```css
/* Adicionar em toolcalls.module.css */
.toolViewContainer.highlight {
  border: 2px solid rgba(34, 197, 94, 0.3);
  background: rgba(34, 197, 94, 0.05);
}

.toolViewContainer.technical {
  opacity: 0.7;
  font-size: 0.875rem;
}
```

### Fase 3: Modo Resumo
```tsx
// Novo componente: WorkspaceSummary
interface WorkspaceSummaryProps {
  toolCalls: ToolCallInput[];
  onViewDetails: (index: number) => void;
}

// Mostra apenas:
// - ✅ Arquivos criados: index.html, style.css
// - 🔗 Deploy: https://app.example.com
// - 📊 5 operações técnicas ocultadas [Ver detalhes]
```

## 📋 Checklist de Implementação

- [ ] Adicionar toggle "Modo Simplificado/Detalhado"
- [ ] Implementar filtros de tool calls
- [ ] Criar componente de resumo
- [ ] Adicionar destaque visual para resultados finais
- [ ] Melhorar ícones e labels
- [ ] Adicionar tooltips explicativos
- [ ] Criar seção "Arquivos Entregues" destacada
- [ ] Implementar colapso/expansão de operações técnicas
- [ ] Adicionar breadcrumb de navegação melhor
- [ ] Criar preview inline para arquivos HTML/CSS

## 🎯 Sistema de Priorização e Detecção de Entregas

### Conceito Central: "Show the artifact, not the announcement"

A área de trabalho deve focar no resultado final (arquivo criado, deploy realizado) e não no processo técnico ou mensagens genéricas de conclusão.

### 📊 Hierarquia de Priorização de Tool Calls

```typescript
const DELIVERY_PRIORITY = {
  LEVEL_1: { // Entregas principais - sempre mostrar
    'create-file': (input) => isMainFile(input),  // Arquivos principais
    'deploy': true,                               // Deploy com URL
    'expose-port': true,                          // Serviço exposto
  },
  LEVEL_2: { // Entregas secundárias - mostrar se relevante
    'web-search': true,                           // Resultados de busca
    'browser-navigate-to': true,                  // Navegação com screenshot
    'create-credential-profile': true,            // Integração configurada
  },
  LEVEL_3: { // Operações técnicas - ocultar por padrão
    'execute-command': false,                     // Comandos terminal
    'str-replace': false,                         // Edições de string
    'edit-file': false,                          // Edições intermediárias
    'read-file': false,                          // Leituras de arquivo
  },
  LEVEL_4: { // Mensagens genéricas - mostrar só se única opção
    'complete': false,                            // Conclusão genérica
    'ask': false,                                 // Perguntas ao usuário
  }
};
```

### 🎮 Detecção de Arquivo Principal por Contexto

```typescript
interface MainFilePatterns {
  // Websites e Landing Pages
  webPatterns: [
    'index.html',        // Padrão web principal
    'home.html',         // Alternativa comum
    'main.html',         // Outra alternativa
    'app.html',          // Single Page Apps
  ],
  
  // Jogos HTML5
  gamePatterns: [
    'game.html',         // Nome comum para jogos
    'play.html',         // Alternativa para jogos
    'index.html',        // Fallback padrão
    'main.js',           // Se for jogo em canvas
  ],
  
  // Aplicações Python
  pythonPatterns: [
    'main.py',           // Padrão Python
    'app.py',            // Flask/FastAPI comum
    'server.py',         // Servidor Python
    'bot.py',            // Para bots
    'script.py',         // Scripts genéricos
  ],
  
  // Aplicações Node.js
  nodePatterns: [
    'index.js',          // Padrão Node
    'app.js',            // Express comum
    'server.js',         // Servidor Node
    'main.js',           // Alternativa comum
    'index.ts',          // TypeScript
  ],
  
  // Dashboards e Admin
  dashboardPatterns: [
    'dashboard.html',    // Dashboard específico
    'admin.html',        // Painel admin
    'panel.html',        // Painel genérico
    'index.html',        // Fallback
  ],
  
  // APIs e Webhooks
  apiPatterns: [
    'webhook.js',        // Webhook handler
    'api.py',            // API Python
    'handler.js',        // Serverless functions
    'function.js',       // Cloud functions
  ]
}

// Função de detecção inteligente
function detectMainFile(toolCalls: ToolCallInput[]): number {
  const fileCreations = toolCalls
    .map((tc, idx) => ({ tc, idx }))
    .filter(({ tc }) => tc.name === 'create-file');
  
  // Detecta contexto baseado em palavras-chave
  const context = detectProjectContext(toolCalls);
  
  // Escolhe padrões baseado no contexto
  const patterns = getPatternsByContext(context);
  
  // Procura arquivo principal nos padrões
  for (const pattern of patterns) {
    const match = fileCreations.find(({ tc }) => 
      tc.input?.includes(pattern)
    );
    if (match) return match.idx;
  }
  
  // Fallback: último arquivo HTML ou primeiro arquivo criado
  const htmlFile = fileCreations.findLast(({ tc }) => 
    tc.input?.includes('.html')
  );
  return htmlFile?.idx ?? fileCreations[0]?.idx ?? -1;
}
```

### 🚀 Comportamento de Auto-Abertura Inteligente

```typescript
// Configuração de comportamento
const WORKSPACE_BEHAVIOR = {
  // Iniciar fechado
  startClosed: true,
  
  // Abrir automaticamente quando houver entrega
  autoOpenOnDelivery: true,
  
  // Pular direto para resultado principal
  skipToMainResult: true,
  
  // Ocultar operações técnicas
  hideTechnicalOps: true,
  
  // Colapsar mensagem de complete redundante
  collapseRedundantComplete: true,
};

// Lógica de abertura
useEffect(() => {
  if (!toolCalls.length) return;
  
  // Detecta momento de entrega
  const hasDelivery = toolCalls.some(tc => 
    isDeliveryMoment(tc)
  );
  
  if (hasDelivery && !userHasInteracted) {
    // Encontra arquivo principal
    const mainIdx = detectMainFile(toolCalls);
    
    if (mainIdx > -1) {
      setIsSidePanelOpen(true);
      setCurrentToolIndex(mainIdx);
      // Marca como "entrega principal" para UI
      setMainDeliveryIndex(mainIdx);
    }
  }
}, [toolCalls]);
```

### 📋 Casos de Uso e Comportamentos

| Tipo de Projeto | Arquivo Principal | Quando Abrir | O que Mostrar |
|-----------------|-------------------|--------------|---------------|
| **Landing Page** | index.html | Ao criar index.html | Preview visual do HTML |
| **Jogo HTML5** | game.html ou index.html | Ao criar arquivo do jogo | Preview do jogo + botão jogar |
| **Bot Python** | bot.py ou main.py | Ao criar script principal | Código + instruções de execução |
| **API/Webhook** | webhook URL | Ao configurar endpoint | URL + como testar |
| **Dashboard** | dashboard.html | Ao criar interface | Preview + link de acesso |
| **Integração** | Credenciais/Config | Ao conectar serviço | Status + próximos passos |

### 🎨 Interface Proposta Refinada

```
┌─────────────────────────────────────────┐
│ Área de trabalho de Prophet         [X] │
├─────────────────────────────────────────┤
│                                         │
│  [Conteúdo Principal em Destaque]      │
│  ┌─────────────────────────────────┐   │
│  │   🌐 index.html                  │   │
│  │   [Preview Visual do Site]       │   │
│  │                                   │   │
│  │   [Abrir no Navegador] [Código]  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ● Entrega principal                    │
│                                         │
│  ─────────────────────────────────     │
│  ▼ Detalhes técnicos (12 operações)    │
│     [Colapsado por padrão]             │
└─────────────────────────────────────────┘
```

### 🔧 Implementação: Navegação Inteligente

```typescript
// Pula operações não relevantes
const navigateToNext = () => {
  let nextIdx = currentIndex + 1;
  
  // Pula operações técnicas se em modo simplificado
  while (nextIdx < toolCalls.length) {
    const tc = toolCalls[nextIdx];
    
    // Se for 'complete' redundante, pula
    if (tc.name === 'complete' && mainDeliveryIndex > -1) {
      nextIdx++;
      continue;
    }
    
    // Se for operação técnica em modo simples, pula
    if (hideTechnicalOps && isTechnicalOperation(tc.name)) {
      nextIdx++;
      continue;
    }
    
    break;
  }
  
  setCurrentToolIndex(Math.min(nextIdx, toolCalls.length - 1));
};
```

## 🚀 Resultado Esperado

### Antes:
```
Área de Trabalho (15 itens)
1. execute-command: npm install
2. create-file: /src/components/Header.tsx
3. str-replace: const -> let
4. read-file: package.json
[... navegar até item 12 para achar index.html ...]
15. complete: Tarefa concluída
```

### Depois:
```
Área de Trabalho

🌐 index.html (Entrega Principal)
[Preview Visual Grande e Claro]

[Abrir] [Código] [Baixar]

────────────────
▼ Ver processo completo (14 operações)
```

## 🔑 Variáveis de Controle

Todas as modificações podem ser controladas via:
1. **Props do componente**: Passar flags do componente pai
2. **Context/Estado global**: Preferências do usuário
3. **Local Storage**: Salvar preferência de visualização
4. **URL Params**: `?view=simple` ou `?view=detailed`
5. **Detecção automática**: Baseada no tipo de projeto

---

**Nota**: Toda a estrutura foi mapeada para permitir modificações APENAS no frontend, sem alterar o backend ou a lógica de negócio. O sistema é inteligente o suficiente para detectar diferentes tipos de projetos (landing pages, jogos, APIs, dashboards) e ajustar o comportamento accordingly.