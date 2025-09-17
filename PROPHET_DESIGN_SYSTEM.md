# Prophet Design System - Guia Completo

## 🎨 Visão Geral

O Prophet utiliza um design system moderno e centralizado baseado em Tailwind CSS v4, componentes React reutilizáveis e variáveis CSS customizadas. Este documento serve como guia definitivo para entender e modificar o design da aplicação.

## 🏗️ Arquitetura do Design System

### 1. Stack Tecnológica
- **Tailwind CSS v4**: Sistema de utilidades CSS com configuração inline
- **CSS Variables**: Tokens de design para cores, espaçamentos e animações
- **React Components**: Componentes UI centralizados e reutilizáveis
- **Theme System**: Suporte nativo para temas light/dark

### 2. Estrutura de Arquivos

```
frontend/
├── src/
│   ├── app/
│   │   └── globals.css          # Variáveis CSS e configuração do Tailwind
│   └── components/
│       └── ui/                  # Componentes base do design system
│           ├── card.tsx
│           ├── button.tsx
│           ├── dialog.tsx
│           ├── badge.tsx
│           └── ...
```

## 🎯 Princípio Fundamental

**IMPORTANTE**: Ao fazer mudanças de design, SEMPRE modifique os componentes base ou variáveis globais para afetar todo o site. Nunca faça mudanças pontuais que quebrem a consistência visual.

## 🎨 Sistema de Cores

### Variáveis CSS Globais
As cores são definidas em `globals.css` usando o formato OKLCH para melhor controle de cor:

```css
:root {
  --background: oklch(0.9741 0 129.63);
  --foreground: oklch(0.2277 0.0034 67.65);
  --card: oklch(98.46% 0.002 247.84);
  --primary: oklch(0.205 0 0);
  --secondary: oklch(54.65% 0.246 262.87);
  --muted: oklch(0.93 0 0);
  --accent: oklch(0.1149 0 0 / 6%);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.1149 0 0 / 8%);
}

.dark {
  --background: oklch(0.185 0.005 285.823);
  --foreground: oklch(0.985 0 0);
  --card: oklch(0.2 0.005 285.823);
  /* ... outras cores do tema escuro ... */
}
```

### Como Modificar Cores Globalmente

1. **Para mudar a cor primária em todo o site**:
```css
:root {
  --primary: oklch(0.5 0.2 250); /* Nova cor primária */
}
```

2. **Para mudar a cor dos cards**:
```css
:root {
  --card: oklch(0.95 0.01 250); /* Nova cor de fundo dos cards */
}
```

## 🧩 Componentes Base

### Card Component
Localização: `/components/ui/card.tsx`

```tsx
// Estrutura padrão do Card
<Card>
  <CardHeader>
    <CardTitle>Título</CardTitle>
    <CardDescription>Descrição</CardDescription>
  </CardHeader>
  <CardContent>
    Conteúdo
  </CardContent>
</Card>
```

**Para modificar todos os cards do site**:
```tsx
// Em card.tsx
className={cn(
  'bg-card text-card-foreground flex flex-col gap-6 rounded-2xl border py-8 shadow-lg', // Mudanças aqui afetam TODOS os cards
  className,
)}
```

### Button Component
Localização: `/components/ui/button.tsx`

**Variantes disponíveis**:
- `default`: Botão primário
- `secondary`: Botão secundário
- `outline`: Botão com borda
- `ghost`: Botão transparente
- `destructive`: Botão de ação perigosa

**Para adicionar nova variante globalmente**:
```tsx
const buttonVariants = cva(
  "...",
  {
    variants: {
      variant: {
        // Adicione nova variante aqui
        success: 'bg-green-500 text-white hover:bg-green-600',
      }
    }
  }
)
```

## 🎯 Padrões de Modificação

### ✅ CORRETO - Mudanças Globais

1. **Modificar variável CSS**:
```css
/* Em globals.css */
--radius: 1rem; /* Muda o raio de TODOS os componentes */
```

2. **Modificar componente base**:
```tsx
/* Em button.tsx */
const buttonVariants = cva(
  "... rounded-2xl ...", /* Afeta TODOS os botões */
)
```

3. **Adicionar nova variável global**:
```css
/* Em globals.css */
:root {
  --spacing-section: 4rem; /* Novo espaçamento padrão */
}
```

### ❌ INCORRETO - Mudanças Pontuais

1. **NÃO faça isso**:
```tsx
// Em algum componente específico
<Button className="bg-blue-500"> /* Quebra consistência */
```

2. **NÃO crie estilos inline**:
```tsx
<Card style={{ backgroundColor: 'red' }}> /* Evite! */
```

## 🔧 Guia de Implementação

### Para mudar o estilo de um tipo de componente:

1. **Identifique o componente base** em `/components/ui/`
2. **Modifique o componente** para afetar todas as instâncias
3. **Ou modifique a variável CSS** correspondente em `globals.css`

### Exemplo: Mudando o visual de todos os cards

```tsx
// Em /components/ui/card.tsx
function Card({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn(
        // Mudanças aqui afetam TODOS os cards do site
        'bg-card text-card-foreground flex flex-col gap-8 rounded-3xl border-2 py-10 shadow-2xl hover:shadow-3xl transition-all',
        className,
      )}
      {...props}
    />
  );
}
```

### Exemplo: Criando novo tema de cores

```css
/* Em globals.css */
:root {
  /* Tema padrão */
  --primary: oklch(0.205 0 0);
  --secondary: oklch(54.65% 0.246 262.87);
}

.theme-ocean {
  /* Tema oceano */
  --primary: oklch(0.5 0.2 220);
  --secondary: oklch(0.6 0.15 200);
}
```

## 📋 Checklist para Mudanças de Design

Ao fazer mudanças de design, verifique:

- [ ] A mudança está sendo feita no componente base ou variável global?
- [ ] Todos os componentes do mesmo tipo serão afetados?
- [ ] A mudança mantém consistência visual?
- [ ] Os temas light/dark continuam funcionando?
- [ ] As variantes do componente ainda fazem sentido?

## 🚀 Boas Práticas

1. **Sempre prefira variáveis CSS** para valores que podem mudar
2. **Use componentes base** para garantir consistência
3. **Evite classes Tailwind diretas** em componentes específicos
4. **Documente novas variantes** adicionadas aos componentes
5. **Teste em ambos os temas** (light/dark)

## 🎨 Customização Avançada

### Animações Globais
Definidas em `globals.css`:

```css
@theme inline {
  --animate-shimmer: shimmer 1s infinite;
  --animate-gradient-shift: gradient-shift 2s ease infinite;
  /* Adicione novas animações aqui */
}
```

### Breakpoints Responsivos
O Tailwind v4 usa breakpoints padrão que podem ser customizados:

```css
/* Use classes como sm:, md:, lg:, xl: para responsividade */
className="text-sm md:text-base lg:text-lg"
```

## 📝 Notas Importantes

1. **Tailwind v4**: Usa configuração inline em vez de arquivo separado
2. **Componentes Compostos**: Muitos componentes têm sub-componentes (Card, CardHeader, etc.)
3. **Utility Function `cn()`**: Combina classes de forma inteligente
4. **Slots de Dados**: Componentes usam `data-slot` para identificação

## 🔄 Processo de Atualização

Quando receber solicitações de mudança de design:

1. **Analise o escopo**: A mudança é local ou global?
2. **Localize o componente/variável**: Onde fazer a mudança?
3. **Implemente globalmente**: Garanta que afete todo o sistema
4. **Valide consistência**: Verifique se não quebrou outros elementos

## 🔧 Sistema de Toolcalls Globalizado

### Visão Geral
O sistema de toolcalls foi globalizado usando CSS Modules para garantir consistência visual e facilitar manutenção. Todos os componentes que renderizam toolcalls compartilham os mesmos estilos.

### Estrutura e Localização

**Arquivo de estilos**: `/frontend/src/styles/toolcalls.module.css`

### Classes CSS Disponíveis

#### 1. Container Principal (.toolcallContainer)
```css
/* Botão compacto inline para toolcalls */
.toolcallContainer {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem 0.375rem 0.5rem;
  font-size: 0.75rem;
  color: var(--muted-foreground);
  background-color: var(--muted);
  border-radius: 0.375rem;
  transition: all 0.2s;
  cursor: pointer;
  border: 1px solid rgb(229 229 229);
}
```

#### 2. Ícone (.toolcallIcon)
```css
/* Wrapper do ícone com visual distintivo */
.toolcallIcon {
  border-width: 2px;
  background: linear-gradient(to bottom right, rgb(229 229 229), rgb(212 212 212));
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  border-radius: 0.25rem;
  border-color: rgb(163 163 163 / 0.2);
  flex-shrink: 0;
}

/* Dark mode */
.dark .toolcallIcon {
  background: linear-gradient(to bottom right, rgb(64 64 64), rgb(38 38 38));
  border-color: rgb(82 82 82);
}
```

#### 3. Estados Visuais (.toolcallStatus)
```css
.toolcallStatus {
  font-size: 12px;
  padding: 4px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.toolcallStatus.pending { background: rgba(251, 191, 36, 0.2); color: #fbbf24; }
.toolcallStatus.running { background: rgba(59, 130, 246, 0.2); color: #3b82f6; }
.toolcallStatus.success { background: rgba(34, 197, 94, 0.2); color: #22c55e; }
.toolcallStatus.error { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
```

### Componentes que Utilizam o Sistema

1. **ThreadContent.tsx** (`/frontend/src/components/thread/content/ThreadContent.tsx`)
   - Renderiza botões de toolcall inline nas mensagens
   - Usa `.toolcallContainer` e `.toolcallIcon`

2. **ShowToolStream.tsx** (`/frontend/src/components/thread/content/ShowToolStream.tsx`)
   - Mostra toolcalls em execução com animação de streaming
   - Combina classes: `${styles.toolcallContainer} animate-shimmer`

3. **ToolViewWrapper.tsx** (`/frontend/src/components/thread/tool-views/wrapper/ToolViewWrapper.tsx`)
   - Container expandido para visualização detalhada de toolcalls
   - Usa classes específicas para header, body e footer

### Como Implementar em Novos Componentes

```tsx
// 1. Importar o módulo CSS
import styles from '@/styles/toolcalls.module.css';

// 2. Aplicar as classes
<button className={styles.toolcallContainer}>
  <div className={styles.toolcallIcon}>
    <IconComponent className="h-3.5 w-3.5" />
  </div>
  <span className="font-mono text-xs">{toolName}</span>
</button>

// 3. Para combinar com outras classes
<button className={`${styles.toolcallContainer} animate-shimmer`}>
  ...
</button>
```

### Benefícios da Globalização

✅ **Consistência Visual**: Todos os toolcalls têm a mesma aparência
✅ **Manutenção Centralizada**: Mudanças em um arquivo afetam todos os componentes
✅ **CSS Modules**: Evita conflitos de nome e garante isolamento
✅ **Performance**: Código CSS reutilizado, não duplicado
✅ **Dark Mode**: Suporte nativo com classes específicas

### Para Modificar o Visual dos Toolcalls

1. **Edite o arquivo**: `/frontend/src/styles/toolcalls.module.css`
2. **As mudanças afetarão automaticamente** todos os componentes que usam as classes
3. **Teste em ambos os temas** (light/dark)

### Exemplo de Customização

Para mudar o visual de todos os toolcalls:

```css
/* Em toolcalls.module.css */
.toolcallContainer {
  /* Mudanças aqui afetam TODOS os toolcalls */
  border-radius: 12px; /* Mais arredondado */
  padding: 8px 16px; /* Mais espaçoso */
  background: var(--primary); /* Cor diferente */
}
```

---

**Lembre-se**: O objetivo é manter um design system coeso e escalável. Toda mudança deve beneficiar o sistema como um todo, não apenas uma parte isolada.