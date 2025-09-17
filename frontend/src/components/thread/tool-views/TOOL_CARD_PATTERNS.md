# Tool Card Design Patterns - Análise para Globalização

## 🎯 Padrões Identificados

### 1. Estrutura Base do Card (100% consistente)
```tsx
<Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col h-full overflow-hidden bg-card">
```
- **23 arquivos** usam exatamente esta estrutura
- Card "flat" sem bordas laterais/inferior
- Sem sombra e sem cantos arredondados
- Height full com overflow hidden

### 2. Header Padrão (100% consistente)
```tsx
<CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4 space-y-2">
```
- **24 arquivos** usam exatamente este header
- Altura fixa de 14 unidades
- Fundo translúcido com backdrop blur
- Borda inferior apenas

### 3. Estrutura do Ícone (95% consistente)
```tsx
<div className="relative p-2 rounded-[lg|xl] bg-gradient-to-br from-[COR]-500/20 to-[COR]-600/10 border border-[COR]-500/20">
  <[ÍCONE] className="w-5 h-5 text-[COR]-500 dark:text-[COR]-400" />
</div>
```

#### Cores por Categoria:
- **blue**: Ask, WebSearch, DataProvider, GetAppDetails, GetCredentialProfiles, ConnectProfile
- **purple**: Command, StrReplace, Browser, GetAgentConfig, SearchMCP
- **green**: CreateProfile, ExposePort
- **emerald**: Complete, CheckProfileConnection
- **violet**: ConfigureProfile
- **orange**: Deploy, Generic
- **red**: Terminate

### 4. Badge de Status (padrão repetido)
```tsx
// Sucesso
<Badge className="bg-gradient-to-b from-emerald-200 to-emerald-100 text-emerald-700 dark:from-emerald-800/50 dark:to-emerald-900/60 dark:text-emerald-300">
  <CheckCircle className="h-3.5 w-3.5 mr-1" />
  Sucesso
</Badge>

// Erro
<Badge className="bg-gradient-to-b from-rose-200 to-rose-100 text-rose-700 dark:from-rose-800/50 dark:to-rose-900/60 dark:text-rose-300">
  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
  Falhou
</Badge>

// Processando
<Badge className="bg-gradient-to-b from-blue-200 to-blue-100 text-blue-700 dark:from-blue-800/50 dark:to-blue-900/60 dark:text-blue-300">
  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
  Processando
</Badge>
```

### 5. Footer Padrão (quando existe)
```tsx
<div className="px-4 py-2 h-10 bg-gradient-to-r from-zinc-50/90 to-zinc-100/90 dark:from-zinc-900/90 dark:to-zinc-800/90 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
```

## 🚀 Proposta de Globalização

### 1. Criar Componente Base
```tsx
// /components/thread/tool-views/shared/ToolCard.tsx
export interface ToolCardProps {
  children: React.ReactNode;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: 'blue' | 'purple' | 'green' | 'emerald' | 'violet' | 'orange' | 'red';
  title: string;
  status?: 'success' | 'error' | 'loading';
  statusText?: string;
  footer?: React.ReactNode;
}

export function ToolCard({ ... }: ToolCardProps) {
  const iconColors = {
    blue: 'from-blue-500/20 to-blue-600/10 border-blue-500/20',
    purple: 'from-purple-500/20 to-purple-600/10 border-purple-500/20',
    // ... etc
  };

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col h-full overflow-hidden bg-card">
      <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4 space-y-2">
        {/* Conteúdo padronizado */}
      </CardHeader>
      <CardContent className="p-0 flex-1 overflow-hidden relative">
        {children}
      </CardContent>
      {footer}
    </Card>
  );
}
```

### 2. Variáveis CSS Globais
```css
/* Em globals.css */
:root {
  /* Tool Card Colors */
  --tool-card-header-bg: oklch(0.93 0 0 / 0.8);
  --tool-card-header-border: oklch(0.1149 0 0 / 8%);
  --tool-card-icon-size: 1.25rem;
  --tool-card-header-height: 3.5rem;
  
  /* Tool Status Colors */
  --tool-status-success-bg: oklch(0.85 0.15 142.4);
  --tool-status-error-bg: oklch(0.85 0.15 27.3);
  --tool-status-loading-bg: oklch(0.85 0.15 236.7);
}

.dark {
  --tool-card-header-bg: oklch(0.185 0.005 285.823 / 0.8);
  --tool-card-header-border: oklch(0.9911 0 0 / 6%);
}
```

### 3. Classes Utilitárias Tailwind
```tsx
// Em tailwind.config ou como plugin
const toolCardVariants = {
  '.tool-card': {
    '@apply gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col h-full overflow-hidden bg-card': {}
  },
  '.tool-card-header': {
    '@apply h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4 space-y-2': {}
  },
  '.tool-card-icon': {
    '@apply relative p-2 rounded-lg bg-gradient-to-br': {}
  }
}
```

## 📊 Impacto da Mudança

- **24+ arquivos** seriam simplificados
- **~500 linhas de código** removidas (duplicação)
- **Manutenção centralizada** de estilos
- **Consistência garantida** entre todos os tool cards

## 🔧 Implementação Sugerida

1. Criar componente `ToolCard` base
2. Adicionar variáveis CSS para cores customizáveis
3. Migrar gradualmente cada tool view
4. Manter retrocompatibilidade durante migração
5. Documentar padrões no design system

## 📝 Benefícios

1. **DRY (Don't Repeat Yourself)**: Elimina duplicação
2. **Manutenibilidade**: Um lugar para mudar todos os cards
3. **Consistência**: Garante mesmo visual em todos
4. **Extensibilidade**: Fácil adicionar novos tool cards
5. **Performance**: Menos CSS duplicado