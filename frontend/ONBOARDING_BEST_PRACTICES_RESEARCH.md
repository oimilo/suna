# 🔬 Pesquisa: Melhores Práticas de User Profiling no Onboarding

## 📊 Principais Descobertas da Pesquisa (2024)

### 1. **Progressive Profiling é Essencial**
- **Não pergunte tudo de uma vez**: Colete informações gradualmente
- **HubSpot**: Usa cookies para substituir campos já preenchidos por novos
- **Typeform**: Micro-formulários e quizzes ao longo da jornada
- **Taxa de conversão**: 86% mais retenção com progressive profiling

### 2. **Framework Jobs-to-be-Done (JTBD)**
As melhores empresas focam em descobrir:
- **O que** o usuário quer alcançar (objetivo funcional)
- **Por que** escolheu sua solução (gatilho emocional)
- **Quando** percebeu que precisava (contexto/timing)
- **Como** tentou resolver antes (soluções anteriores)

### 3. **Regra dos 3-5 Campos Iniciais**
- **Signup**: Máximo 3 campos (email, senha, nome)
- **Welcome Survey**: 3-5 perguntas estratégicas
- **Progressive**: Mais 2-3 perguntas após primeira ação
- **Total Journey**: Não mais que 8-10 pontos de coleta

---

## 🎯 Aplicando ao Prophet: Sistema Refinado de 6 Perguntas

### **Nova Estrutura Baseada em JTBD + Progressive Profiling**

#### **Fase 1: Signup (3 campos apenas)**
```typescript
// Apenas o essencial para criar conta
{
  email: string,
  senha: string,
  nome: string
}
```

#### **Fase 2: Welcome Survey (3 perguntas core)**

##### **Pergunta 1: "O que te trouxe ao Prophet hoje?"**
```typescript
// JTBD: Descobrir o gatilho/motivação
const GATILHOS = [
  {
    id: 'projeto_urgente',
    emoji: '🔥',
    titulo: 'Tenho um projeto urgente',
    subtitulo: 'Preciso entregar algo específico',
    next_questions: ['projeto_tipo', 'prazo'],
    template_bias: 'ready_to_use'
  },
  {
    id: 'automatizar_trabalho',
    emoji: '⚡',
    titulo: 'Quero automatizar meu trabalho',
    subtitulo: 'Perco muito tempo com tarefas repetitivas',
    next_questions: ['tarefas_manuais', 'ferramentas_atuais'],
    template_bias: 'automation_focused'
  },
  {
    id: 'presenca_online',
    emoji: '🌐',
    titulo: 'Preciso de presença online',
    subtitulo: 'Site, landing page ou portfolio',
    next_questions: ['tipo_site', 'publico_alvo'],
    template_bias: 'web_presence'
  },
  {
    id: 'melhorar_vendas',
    emoji: '💰',
    titulo: 'Quero vender mais',
    subtitulo: 'Aumentar conversões e clientes',
    next_questions: ['tipo_negocio', 'problema_vendas'],
    template_bias: 'sales_optimization'
  },
  {
    id: 'aprender_explorando',
    emoji: '🎓',
    titulo: 'Explorando possibilidades',
    subtitulo: 'Quero ver o que consigo criar',
    next_questions: ['nivel_tech', 'area_interesse'],
    template_bias: 'educational'
  }
]
```

##### **Pergunta 2: "Em qual área você atua?"**
```typescript
// Contexto profissional simplificado
const AREAS_ATUACAO = [
  {
    id: 'negocios',
    emoji: '💼',
    titulo: 'Negócios/Vendas',
    subtitulo: 'Empreendedor, vendedor, consultor',
    personas: ['entrepreneur', 'sales', 'consultant']
  },
  {
    id: 'criativo',
    emoji: '🎨',
    titulo: 'Criativo/Conteúdo',
    subtitulo: 'Designer, creator, marketing',
    personas: ['designer', 'creator', 'marketer']
  },
  {
    id: 'tech',
    emoji: '💻',
    titulo: 'Tecnologia',
    subtitulo: 'Dev, data, product',
    personas: ['developer', 'data_analyst', 'product']
  },
  {
    id: 'servicos',
    emoji: '🤝',
    titulo: 'Serviços/Consultoria',
    subtitulo: 'Freelancer, advogado, contador',
    personas: ['freelancer', 'professional_services']
  },
  {
    id: 'educacao',
    emoji: '📚',
    titulo: 'Educação/Ensino',
    subtitulo: 'Professor, instrutor, coach',
    personas: ['educator', 'coach', 'trainer']
  },
  {
    id: 'outro',
    emoji: '✨',
    titulo: 'Outra área',
    subtitulo: 'Conte mais sobre você',
    personas: ['general'],
    follow_up: 'text_input' // Campo livre
  }
]
```

##### **Pergunta 3: "Como você prefere trabalhar?"**
```typescript
// Estilo de trabalho e preferências
const ESTILO_TRABALHO = [
  {
    id: 'visual_primeiro',
    emoji: '👁️',
    titulo: 'Visual primeiro',
    subtitulo: 'Prefiro arrastar, clicar e ver resultados',
    approach: 'no_code',
    explanation_level: 'minimal'
  },
  {
    id: 'guiado',
    emoji: '🗺️',
    titulo: 'Com orientação',
    subtitulo: 'Gosto de tutoriais e passo a passo',
    approach: 'guided',
    explanation_level: 'detailed'
  },
  {
    id: 'rapido_direto',
    emoji: '⚡',
    titulo: 'Rápido e direto',
    subtitulo: 'Só me mostre o resultado',
    approach: 'result_focused',
    explanation_level: 'minimal'
  },
  {
    id: 'entender_tudo',
    emoji: '🔍',
    titulo: 'Entender tudo',
    subtitulo: 'Quero saber como funciona',
    approach: 'educational',
    explanation_level: 'comprehensive'
  },
  {
    id: 'codigo_controle',
    emoji: '⌨️',
    titulo: 'Código e controle',
    subtitulo: 'Prefiro ver e editar código',
    approach: 'code_first',
    explanation_level: 'technical'
  }
]
```

#### **Fase 3: Progressive Questions (após primeira interação)**

##### **Pergunta 4: "Qual resultado você espera em 7 dias?"**
```typescript
// Pergunta aparece após usuário enviar primeira mensagem
const RESULTADO_7_DIAS = [
  {
    id: 'projeto_completo',
    titulo: 'Projeto completo funcionando',
    metrics: ['deployment', 'live_url']
  },
  {
    id: 'processo_automatizado',
    titulo: 'Processo automatizado rodando',
    metrics: ['tasks_automated', 'time_saved']
  },
  {
    id: 'primeiros_clientes',
    titulo: 'Primeiros clientes/leads',
    metrics: ['conversions', 'leads_captured']
  },
  {
    id: 'aprendizado_aplicado',
    titulo: 'Novo conhecimento aplicado',
    metrics: ['skills_learned', 'projects_created']
  }
]
```

##### **Pergunta 5: "Quais ferramentas você já usa?"**
```typescript
// Aparece quando usuário menciona integração
const FERRAMENTAS_ATUAIS = [
  { id: 'google_workspace', nome: 'Google Workspace', integracao: 'nativa' },
  { id: 'microsoft_365', nome: 'Microsoft 365', integracao: 'nativa' },
  { id: 'notion', nome: 'Notion', integracao: 'api' },
  { id: 'slack', nome: 'Slack', integracao: 'webhook' },
  { id: 'whatsapp', nome: 'WhatsApp', integracao: 'api' },
  { id: 'instagram', nome: 'Instagram', integracao: 'api' },
  { id: 'shopify', nome: 'Shopify', integracao: 'api' },
  { id: 'wordpress', nome: 'WordPress', integracao: 'plugin' },
  { id: 'outras', nome: 'Outras', integracao: 'custom' }
]
```

##### **Pergunta 6: "Tamanho da sua operação?"**
```typescript
// Aparece após 3 dias de uso
const TAMANHO_OPERACAO = [
  { id: 'pessoal', titulo: 'Uso pessoal', limite_automacoes: 10 },
  { id: 'pequeno', titulo: '1-10 pessoas', limite_automacoes: 50 },
  { id: 'medio', titulo: '11-50 pessoas', limite_automacoes: 200 },
  { id: 'grande', titulo: '50+ pessoas', limite_automacoes: 'unlimited' }
]
```

---

## 🧠 Inteligência do Sistema

### **Algoritmo de Template Matching 2.0**

```typescript
interface UserProfile {
  // Dados coletados progressivamente
  trigger: string;           // O que trouxe ao Prophet
  area: string;              // Área de atuação
  workStyle: string;         // Como prefere trabalhar
  expectedResult?: string;   // Resultado em 7 dias
  currentTools?: string[];   // Ferramentas que usa
  operationSize?: string;    // Tamanho da operação
  
  // Dados inferidos
  urgencyLevel: 'high' | 'medium' | 'low';
  technicalLevel: 'none' | 'basic' | 'intermediate' | 'advanced';
  primaryNeed: string;
  
  // Comportamento observado
  messagesSent: number;
  featuresUsed: string[];
  timeSpentMinutes: number;
}

function selectOptimalTemplate(profile: UserProfile): Template {
  // Peso dinâmico baseado em quanta informação temos
  const weights = {
    trigger: profile.messagesSent === 0 ? 0.4 : 0.25,
    area: 0.2,
    workStyle: 0.15,
    expectedResult: profile.expectedResult ? 0.15 : 0,
    currentTools: profile.currentTools ? 0.1 : 0,
    behavior: profile.messagesSent > 5 ? 0.15 : 0
  };
  
  // Score cada template
  const scores = TEMPLATE_DATABASE.map(template => ({
    template,
    score: calculateMatchScore(template, profile, weights),
    confidence: calculateConfidence(profile)
  }));
  
  // Retorna o melhor com explicação
  const best = scores.sort((a, b) => b.score - a.score)[0];
  
  return {
    ...best.template,
    customizations: generateCustomizations(profile, best.template),
    explanation: explainMatch(profile, best)
  };
}
```

---

## 🎨 UX Refinada

### **Princípios de Design do Onboarding**

1. **Micro-interações**: Cada pergunta tem animação suave
2. **Feedback imediato**: Mostra como a resposta personaliza a experiência
3. **Skip inteligente**: Sempre pode pular, mas mostra o que perde
4. **Gamificação sutil**: Progress bar e achievements
5. **Transparência**: Explica por que cada pergunta importa

### **Fluxo Visual**

```
[Signup: 3 campos]
        ↓
[Welcome: Nome + Avatar gerado]
        ↓
[Pergunta 1: Card visual com emojis]
    ↙ Resposta ↘
[Feedback: "Entendi! Vou focar em..."]
        ↓
[Pergunta 2: Cards menores, 2 colunas]
    ↙ Resposta ↘
[Preview: Mostra template sugerido]
        ↓
[Pergunta 3: Slider ou cards]
    ↙ Resposta ↘
[Resultado: Template pronto + Chat iniciado]
```

---

## 📈 Métricas de Validação

### **KPIs para Medir Sucesso**

1. **Completion Rate por Pergunta**
   - P1: >95% (muito relevante)
   - P2: >90% (contexto importante)
   - P3: >85% (personalização)
   - P4-6: >60% (progressive)

2. **Time to Value**
   - Primeira mensagem enviada: <2 min
   - Primeiro resultado útil: <5 min
   - Projeto deployado: <30 min

3. **Template Match Score**
   - Usuários que mantém template: >70%
   - Usuários que editam levemente: 20-25%
   - Usuários que trocam completamente: <10%

4. **Retenção**
   - D1: >80%
   - D7: >60%
   - D30: >40%

---

## 🚀 Implementação Recomendada

### **MVP (Fase 1)**
- Implementar apenas as 3 perguntas core
- 10 templates base bem polidos
- Analytics básico

### **Evolução (Fase 2)**
- Adicionar progressive profiling
- 25+ templates especializados
- A/B testing de perguntas

### **Maturidade (Fase 3)**
- ML para prever templates
- Personalização em tempo real
- Templates gerados por IA

---

## 🔑 Insights Cruciais

1. **Menos é mais**: 3 perguntas bem feitas > 10 perguntas genéricas
2. **Contexto sobre demografia**: "O que te trouxe aqui" > "Qual sua idade"
3. **Ação sobre intenção**: "Projeto urgente" > "Interesse em tecnologia"
4. **Progressivo funciona**: Coletar mais dados APÓS engajamento inicial
5. **Mostrar valor**: Cada pergunta deve resultar em personalização visível

---

**Conclusão**: O sistema refinado de 6 perguntas (3 iniciais + 3 progressivas) baseado em JTBD e progressive profiling tem potencial para alcançar >85% de match accuracy com templates, mantendo >90% de completion rate no onboarding.