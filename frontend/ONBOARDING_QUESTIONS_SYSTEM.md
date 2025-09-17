# 🎯 Sistema de Perguntas Inteligente para Onboarding

## ✅ Checklist de Implementação

### Backend
- [ ] Criar endpoint `/api/onboarding/analyze-profile`
- [ ] Implementar lógica de mapeamento pergunta → template
- [ ] Criar serviço de análise de respostas
- [ ] Adicionar templates base no banco
- [ ] Implementar sistema de tags/categorias
- [ ] Criar fallback para casos não mapeados

### Frontend
- [ ] Criar componente `OnboardingQuestions.tsx`
- [ ] Implementar fluxo de perguntas dinâmicas
- [ ] Adicionar animações de transição entre perguntas
- [ ] Criar componente de preview do template sugerido
- [ ] Implementar skip inteligente (pular para template genérico)
- [ ] Adicionar analytics de respostas

### Database
- [ ] Adicionar tabela `onboarding_responses`
- [ ] Criar tabela `template_mappings`
- [ ] Adicionar índices para busca rápida
- [ ] Criar views para analytics

### Templates
- [ ] Criar no mínimo 20 templates base
- [ ] Adicionar variações por indústria
- [ ] Implementar sistema de merge de templates
- [ ] Criar templates híbridos

## 🎯 Sistema de Perguntas Gamificado e Interativo

### Filosofia: "6 Perguntas, 6 Formatos Diferentes - Uma Experiência Divertida"
**Objetivo**: Transformar o questionário em uma experiência interativa e leve:
1. **Área/Profissão** → Cards com emojis (estilo Duolingo)
2. **Objetivo principal** → Swipe cards (estilo Tinder)
3. **Dor específica** → Chat conversacional (estilo chatbot)
4. **Nível técnico** → Slider visual interativo
5. **Urgência/Timeline** → Reações com emojis
6. **Estilo de trabalho** → Quiz de personalidade rápido

### 🎮 Elementos de Gamificação
- **Progress bar animada** com micro-celebrações a cada etapa
- **Pontos XP** ganhos por responder (10 XP por pergunta)
- **Feedback imediato** mostrando como a resposta personaliza
- **Skip inteligente** que mostra o que perde ao pular
- **Avatar mascote** que reage às respostas (tipo Duo do Duolingo)

---

## 🎨 Design Interativo de Cada Pergunta

### 📱 Pergunta 1: "O que melhor descreve você?" 
**Formato: Cards Animados (Estilo Duolingo)**

```tsx
// Visual: Grid de cards 3D com hover effect
// Interação: Click para selecionar, card vira mostrando confirmação
// Animação: Cards entram em cascade com bounce effect
```

**Componente Visual:**

```typescript
const PERGUNTA_1_OPCOES = [
  {
    id: 'empreendedor',
    emoji: '🚀',
    titulo: 'Empreendedor',
    subtitulo: 'Tenho ou quero começar um negócio',
    tags: ['business', 'startup', 'vendas'],
    proximas_opcoes: ['landing_page', 'automacao_vendas', 'gestao_clientes']
  },
  {
    id: 'profissional_tech',
    emoji: '💻',
    titulo: 'Desenvolvedor/Tech',
    subtitulo: 'Trabalho com tecnologia',
    tags: ['dev', 'tech', 'programacao'],
    proximas_opcoes: ['api', 'portfolio_dev', 'automacao_deploy', 'scraping']
  },
  {
    id: 'criador_conteudo',
    emoji: '📱',
    titulo: 'Criador de Conteúdo',
    subtitulo: 'Produzo conteúdo online',
    tags: ['content', 'social', 'creator'],
    proximas_opcoes: ['landing_creator', 'automacao_posts', 'analytics_social']
  },
  {
    id: 'profissional_dados',
    emoji: '📊',
    titulo: 'Analista/Dados',
    subtitulo: 'Trabalho com análise e insights',
    tags: ['data', 'analytics', 'business_intelligence'],
    proximas_opcoes: ['dashboard', 'relatorios', 'automacao_dados']
  },
  {
    id: 'educador',
    emoji: '🎓',
    titulo: 'Professor/Educador',
    subtitulo: 'Ensino e compartilho conhecimento',
    tags: ['education', 'teaching', 'courses'],
    proximas_opcoes: ['site_curso', 'automacao_alunos', 'quiz_app']
  },
  {
    id: 'profissional_saude',
    emoji: '⚕️',
    titulo: 'Saúde/Bem-estar',
    subtitulo: 'Atuo na área de saúde',
    tags: ['health', 'wellness', 'medical'],
    proximas_opcoes: ['site_clinica', 'agendamento', 'formularios_paciente']
  },
  {
    id: 'vendedor',
    emoji: '💼',
    titulo: 'Vendas/Comercial',
    subtitulo: 'Trabalho com vendas',
    tags: ['sales', 'commerce', 'retail'],
    proximas_opcoes: ['crm_simples', 'automacao_followup', 'catalogo_produtos']
  },
  {
    id: 'freelancer',
    emoji: '🎨',
    titulo: 'Freelancer/Autônomo',
    subtitulo: 'Trabalho por conta própria',
    tags: ['freelance', 'autonomo', 'services'],
    proximas_opcoes: ['portfolio', 'invoice_generator', 'gestao_projetos']
  },
  {
    id: 'estudante',
    emoji: '📚',
    titulo: 'Estudante',
    subtitulo: 'Estou aprendendo e estudando',
    tags: ['student', 'learning', 'academic'],
    proximas_opcoes: ['organizador_estudos', 'site_pessoal', 'automacao_notas']
  },
  {
    id: 'outro',
    emoji: '✨',
    titulo: 'Outro/Explorar',
    subtitulo: 'Quero explorar possibilidades',
    tags: ['general', 'explore'],
    proximas_opcoes: ['assistente_geral', 'site_basico', 'automacao_basica']
  }
]
```

---

## 🎯 Pergunta 2: "O que você precisa agora?"

### Opções Dinâmicas Baseadas na Primeira Resposta:

```typescript
const PERGUNTA_2_MAPEAMENTO = {
  // Para Empreendedor
  landing_page: {
    emoji: '🌐',
    titulo: 'Site que Converte',
    subtitulo: 'Landing page para capturar clientes',
    template: 'landing_page_conversao',
    prompt_inicial: 'Crie uma landing page de alta conversão para [seu produto/serviço]'
  },
  automacao_vendas: {
    emoji: '🤖',
    titulo: 'Automação de Vendas',
    subtitulo: 'Automatizar follow-up e propostas',
    template: 'automacao_crm',
    prompt_inicial: 'Configure uma automação de vendas com follow-up automático'
  },
  gestao_clientes: {
    emoji: '👥',
    titulo: 'Gestão de Clientes',
    subtitulo: 'CRM simples e eficiente',
    template: 'crm_basico',
    prompt_inicial: 'Crie um sistema simples para gerenciar meus clientes'
  },

  // Para Desenvolvedor
  api: {
    emoji: '⚡',
    titulo: 'API REST',
    subtitulo: 'Backend robusto e escalável',
    template: 'api_nodejs',
    prompt_inicial: 'Crie uma API REST com Node.js e autenticação JWT'
  },
  portfolio_dev: {
    emoji: '💼',
    titulo: 'Portfolio Tech',
    subtitulo: 'Mostre seus projetos com estilo',
    template: 'portfolio_developer',
    prompt_inicial: 'Crie um portfolio de desenvolvedor com seção de projetos do GitHub'
  },
  automacao_deploy: {
    emoji: '🚀',
    titulo: 'CI/CD Pipeline',
    subtitulo: 'Automatize seus deploys',
    template: 'cicd_setup',
    prompt_inicial: 'Configure um pipeline de CI/CD com testes automatizados'
  },

  // Para Criador de Conteúdo
  landing_creator: {
    emoji: '🎬',
    titulo: 'Link na Bio Pro',
    subtitulo: 'Página de links profissional',
    template: 'linktree_pro',
    prompt_inicial: 'Crie uma página de links estilo Linktree com analytics'
  },
  automacao_posts: {
    emoji: '📅',
    titulo: 'Agenda de Posts',
    subtitulo: 'Automatize suas redes sociais',
    template: 'social_scheduler',
    prompt_inicial: 'Crie um agendador de posts para Instagram e Twitter'
  },
  analytics_social: {
    emoji: '📈',
    titulo: 'Dashboard de Métricas',
    subtitulo: 'Acompanhe seu crescimento',
    template: 'social_analytics',
    prompt_inicial: 'Crie um dashboard para analisar métricas das redes sociais'
  },

  // Para Analista de Dados
  dashboard: {
    emoji: '📊',
    titulo: 'Dashboard Interativo',
    subtitulo: 'Visualize dados em tempo real',
    template: 'dashboard_analytics',
    prompt_inicial: 'Crie um dashboard interativo com gráficos e KPIs'
  },
  relatorios: {
    emoji: '📄',
    titulo: 'Gerador de Relatórios',
    subtitulo: 'Relatórios automáticos',
    template: 'report_generator',
    prompt_inicial: 'Crie um gerador de relatórios PDF automático'
  },
  automacao_dados: {
    emoji: '🔄',
    titulo: 'ETL Pipeline',
    subtitulo: 'Automatize o fluxo de dados',
    template: 'etl_pipeline',
    prompt_inicial: 'Configure um pipeline ETL para processar dados diariamente'
  },

  // Templates Gerais (Fallback)
  assistente_geral: {
    emoji: '🤖',
    titulo: 'Assistente Pessoal',
    subtitulo: 'IA para tarefas do dia a dia',
    template: 'personal_assistant',
    prompt_inicial: 'Me ajude a organizar minhas tarefas e projetos'
  },
  site_basico: {
    emoji: '🌐',
    titulo: 'Site Simples',
    subtitulo: 'Presença online básica',
    template: 'simple_website',
    prompt_inicial: 'Crie um site simples e moderno'
  },
  automacao_basica: {
    emoji: '⚙️',
    titulo: 'Automação Básica',
    subtitulo: 'Automatize tarefas repetitivas',
    template: 'basic_automation',
    prompt_inicial: 'Me ajude a automatizar tarefas repetitivas'
  }
}
```

---

## 🔄 Fluxo de Decisão Inteligente com 6 Perguntas

### Algoritmo de Scoring Avançado:

```typescript
interface OnboardingAnswers {
  q1_profile: string;        // Quem é você
  q2_need: string;           // O que precisa fazer
  q3_objective: string;      // Objetivo principal
  q4_pain: string;          // Dor/impedimento
  q5_tech_level: string;    // Nível técnico
  q6_urgency: string;       // Urgência/timeline
}

interface TemplateScore {
  template_id: string;
  total_score: number;
  match_reasons: string[];
  confidence: 'high' | 'medium' | 'low';
}

function calculateTemplateScore(
  template: Template, 
  answers: OnboardingAnswers
): TemplateScore {
  let score = 0;
  const reasons = [];
  
  // 1. Match de Profissão (peso 20%)
  if (template.profiles.includes(answers.q1_profile)) {
    score += 20;
    reasons.push(`Perfeito para ${answers.q1_profile}`);
  }
  
  // 2. Match de Necessidade (peso 25%)
  if (template.needs.includes(answers.q2_need)) {
    score += 25;
    reasons.push(`Resolve: ${answers.q2_need}`);
  }
  
  // 3. Match de Objetivo (peso 20%)
  const objectiveMatch = template.objectives.filter(o => 
    o === answers.q3_objective
  ).length;
  score += objectiveMatch * 20;
  if (objectiveMatch) {
    reasons.push(`Alcança objetivo de ${answers.q3_objective}`);
  }
  
  // 4. Solução para Dor (peso 15%)
  const painSolution = template.solves_pains.includes(answers.q4_pain);
  if (painSolution) {
    score += 15;
    reasons.push(`Elimina: ${answers.q4_pain}`);
  }
  
  // 5. Adequação ao Nível Técnico (peso 10%)
  if (template.tech_levels.includes(answers.q5_tech_level)) {
    score += 10;
    reasons.push(`Adequado ao nível ${answers.q5_tech_level}`);
  }
  
  // 6. Match de Urgência (peso 10%)
  if (template.time_to_implement === answers.q6_urgency) {
    score += 10;
    reasons.push(`Pronto no tempo certo`);
  }
  
  // Calcular confiança
  const confidence = score >= 70 ? 'high' : 
                    score >= 50 ? 'medium' : 'low';
  
  return {
    template_id: template.id,
    total_score: score,
    match_reasons: reasons,
    confidence
  };
}

// Função principal de seleção
function selectBestTemplate(answers: OnboardingAnswers): {
  primary: Template,
  alternatives: Template[],
  explanation: string
} {
  // Calcular score para todos os templates
  const scores = ALL_TEMPLATES.map(template => 
    calculateTemplateScore(template, answers)
  );
  
  // Ordenar por score
  scores.sort((a, b) => b.total_score - a.total_score);
  
  // Pegar top 3
  const bestMatch = scores[0];
  const alternatives = scores.slice(1, 4);
  
  // Gerar explicação personalizada
  const explanation = generatePersonalizedExplanation(
    bestMatch,
    answers
  );
  
  return {
    primary: ALL_TEMPLATES.find(t => t.id === bestMatch.template_id),
    alternatives: alternatives.map(a => 
      ALL_TEMPLATES.find(t => t.id === a.template_id)
    ),
    explanation
  };
}
```

### Matriz de Decisão Completa:

```typescript
// Exemplo de como as 6 respostas geram um template único
const DECISION_MATRIX = {
  // Empreendedor + Landing + Aumentar Vendas + Sem Clientes + Iniciante + Hoje
  'empreendedor-landing_page-aumentar_vendas-sem_clientes-iniciante-hoje': {
    template: 'landing_page_simples_conversao',
    confidence: 0.95,
    customizations: {
      include_form: true,
      include_whatsapp: true,
      simple_analytics: true,
      one_page_only: true
    }
  },
  
  // Dev + API + Escalar + Desorganizado + Avançado + Este Mês
  'profissional_tech-api-escalar_negocio-desorganizado-avancado-este_mes': {
    template: 'microservices_architecture',
    confidence: 0.92,
    customizations: {
      include_docker: true,
      include_tests: true,
      include_ci_cd: true,
      scalable_design: true
    }
  },
  
  // Freelancer + Portfolio + Impressionar + Sem Visibilidade + Intermediário + Esta Semana
  'freelancer-portfolio-impressionar_clientes-sem_visibilidade-intermediario-esta_semana': {
    template: 'portfolio_premium_animado',
    confidence: 0.88,
    customizations: {
      include_animations: true,
      include_testimonials: true,
      include_contact_form: true,
      seo_optimized: true
    }
  }
  
  // ... mais combinações
}
```

---

## 💡 Pergunta 3: "Qual seu principal objetivo agora?"

```typescript
const PERGUNTA_3_OBJETIVOS = [
  {
    id: 'aumentar_vendas',
    emoji: '💰',
    titulo: 'Aumentar Vendas',
    subtitulo: 'Vender mais e melhor',
    tags: ['revenue', 'conversion', 'sales'],
    weight: 1.5
  },
  {
    id: 'economizar_tempo',
    emoji: '⏰',
    titulo: 'Economizar Tempo',
    subtitulo: 'Automatizar tarefas repetitivas',
    tags: ['automation', 'efficiency', 'productivity'],
    weight: 1.3
  },
  {
    id: 'organizar_processos',
    emoji: '📋',
    titulo: 'Organizar Processos',
    subtitulo: 'Estruturar melhor meu trabalho',
    tags: ['organization', 'workflow', 'systems'],
    weight: 1.2
  },
  {
    id: 'impressionar_clientes',
    emoji: '✨',
    titulo: 'Impressionar Clientes',
    subtitulo: 'Mostrar profissionalismo',
    tags: ['presentation', 'portfolio', 'branding'],
    weight: 1.4
  },
  {
    id: 'aprender_tecnologia',
    emoji: '🎓',
    titulo: 'Aprender Fazendo',
    subtitulo: 'Desenvolver novas habilidades',
    tags: ['learning', 'education', 'growth'],
    weight: 1.0
  },
  {
    id: 'escalar_negocio',
    emoji: '📈',
    titulo: 'Escalar Negócio',
    subtitulo: 'Crescer de forma sustentável',
    tags: ['scale', 'growth', 'expansion'],
    weight: 1.6
  },
  {
    id: 'conectar_ferramentas',
    emoji: '🔗',
    titulo: 'Integrar Ferramentas',
    subtitulo: 'Conectar apps que já uso',
    tags: ['integration', 'api', 'workflow'],
    weight: 1.2
  },
  {
    id: 'analisar_dados',
    emoji: '📊',
    titulo: 'Entender Métricas',
    subtitulo: 'Tomar decisões baseadas em dados',
    tags: ['analytics', 'metrics', 'insights'],
    weight: 1.3
  }
]
```

## 🎯 Pergunta 4: "O que está te impedindo hoje?"

```typescript
const PERGUNTA_4_DORES = [
  {
    id: 'sem_tempo',
    emoji: '😫',
    titulo: 'Falta de Tempo',
    subtitulo: 'Muitas tarefas manuais',
    solutions: ['automation', 'delegation', 'optimization']
  },
  {
    id: 'sem_tecnico',
    emoji: '🤯',
    titulo: 'Complexidade Técnica',
    subtitulo: 'Não sei programar/configurar',
    solutions: ['no-code', 'templates', 'guided-setup']
  },
  {
    id: 'sem_clientes',
    emoji: '🏜️',
    titulo: 'Poucos Clientes',
    subtitulo: 'Dificuldade em atrair pessoas',
    solutions: ['marketing', 'landing-page', 'seo']
  },
  {
    id: 'desorganizado',
    emoji: '🌪️',
    titulo: 'Desorganização',
    subtitulo: 'Informações espalhadas',
    solutions: ['crm', 'dashboard', 'centralization']
  },
  {
    id: 'sem_conversao',
    emoji: '📉',
    titulo: 'Baixa Conversão',
    subtitulo: 'Visitas não viram vendas',
    solutions: ['optimization', 'funnel', 'ab-testing']
  },
  {
    id: 'manual_demais',
    emoji: '🔄',
    titulo: 'Tudo Manual',
    subtitulo: 'Repito as mesmas tarefas',
    solutions: ['automation', 'scripts', 'workflows']
  },
  {
    id: 'sem_visibilidade',
    emoji: '👻',
    titulo: 'Pouca Visibilidade',
    subtitulo: 'Ninguém me encontra online',
    solutions: ['seo', 'social-media', 'content']
  },
  {
    id: 'sem_metricas',
    emoji: '🎯',
    titulo: 'Sem Dados',
    subtitulo: 'Não sei o que está funcionando',
    solutions: ['analytics', 'tracking', 'reports']
  }
]
```

## 🚀 Pergunta 5: "Qual seu nível de experiência com tecnologia?"

```typescript
const PERGUNTA_5_NIVEIS = [
  {
    id: 'zero',
    emoji: '👶',
    titulo: 'Zero Técnico',
    subtitulo: 'Só uso o básico do computador',
    modifiers: {
      ultra_simple: true,
      visual_interface: true,
      step_by_step: true,
      no_code_only: true
    }
  },
  {
    id: 'iniciante',
    emoji: '🌱',
    titulo: 'Iniciante',
    subtitulo: 'Sei o básico, uso apps e ferramentas',
    modifiers: {
      include_tutorials: true,
      simplified_code: true,
      more_explanations: true,
      templates_first: true
    }
  },
  {
    id: 'intermediario',
    emoji: '🚀',
    titulo: 'Intermediário',
    subtitulo: 'Já mexi com sites/automações',
    modifiers: {
      balanced_approach: true,
      some_advanced_features: true,
      can_edit_code: true
    }
  },
  {
    id: 'avancado',
    emoji: '⚡',
    titulo: 'Avançado',
    subtitulo: 'Programo ou entendo bem de tech',
    modifiers: {
      advanced_patterns: true,
      performance_focus: true,
      minimal_explanations: true,
      code_first: true
    }
  }
]
```

## ⏰ Pergunta 6: "Quando você precisa disso pronto?"

```typescript
const PERGUNTA_6_URGENCIA = [
  {
    id: 'hoje',
    emoji: '🔥',
    titulo: 'Hoje/Agora',
    subtitulo: 'Preciso urgente!',
    approach: 'quick_and_functional',
    template_priority: 'ready_to_use'
  },
  {
    id: 'esta_semana',
    emoji: '📅',
    titulo: 'Esta Semana',
    subtitulo: 'Nos próximos dias',
    approach: 'balanced',
    template_priority: 'customizable'
  },
  {
    id: 'este_mes',
    emoji: '📆',
    titulo: 'Este Mês',
    subtitulo: 'Tenho algumas semanas',
    approach: 'well_planned',
    template_priority: 'scalable'
  },
  {
    id: 'explorando',
    emoji: '🔍',
    titulo: 'Só Explorando',
    subtitulo: 'Quero entender as possibilidades',
    approach: 'educational',
    template_priority: 'demo_rich'
  }
]
```

---

## 🎨 UI/UX do Fluxo de Perguntas

### Componente Visual:

```tsx
// Estrutura da tela de pergunta
<OnboardingQuestion>
  <ProgressBar current={currentQuestion} total={6} />
  
  <QuestionHeader>
    <Title>{questions[currentQuestion].title}</Title>
    <Subtitle>{questions[currentQuestion].subtitle}</Subtitle>
  </QuestionHeader>
  
  <OptionsGrid columns={2}>
    {options.map(option => (
      <OptionCard
        key={option.id}
        emoji={option.emoji}
        title={option.titulo}
        subtitle={option.subtitulo}
        onClick={() => handleSelect(option.id)}
        className="hover:scale-105 transition-all"
        selected={selectedAnswers[currentQuestion] === option.id}
      />
    ))}
  </OptionsGrid>
  
  <NavigationButtons>
    {currentQuestion > 0 && (
      <BackButton onClick={goToPreviousQuestion}>
        Voltar
      </BackButton>
    )}
    
    <SkipButton onClick={skipToGeneric}>
      Pular para template genérico
    </SkipButton>
  </NavigationButtons>
</OnboardingQuestion>
```

### Fluxo Completo das 6 Perguntas:

```typescript
const QUESTION_FLOW = [
  {
    id: 'profile',
    title: 'O que melhor descreve você?',
    subtitle: 'Isso nos ajuda a entender seu contexto',
    options: PERGUNTA_1_OPCOES
  },
  {
    id: 'need',
    title: 'O que você precisa fazer?',
    subtitle: 'Escolha a opção mais próxima do seu projeto',
    options: PERGUNTA_2_MAPEAMENTO // Dinâmico baseado em Q1
  },
  {
    id: 'objective',
    title: 'Qual seu principal objetivo?',
    subtitle: 'O que você quer alcançar primeiro',
    options: PERGUNTA_3_OBJETIVOS
  },
  {
    id: 'pain',
    title: 'O que está te impedindo hoje?',
    subtitle: 'Vamos resolver esse problema',
    options: PERGUNTA_4_DORES
  },
  {
    id: 'tech_level',
    title: 'Como você se sente com tecnologia?',
    subtitle: 'Para ajustarmos a complexidade',
    options: PERGUNTA_5_NIVEIS
  },
  {
    id: 'urgency',
    title: 'Quando você precisa disso pronto?',
    subtitle: 'Para priorizarmos o essencial',
    options: PERGUNTA_6_URGENCIA
  }
]
```

### Transições:
- Fade in/out entre perguntas
- Scale animation ao selecionar
- Progress bar animada
- Preview do template ao finalizar

---

## 📊 Matriz de Cobertura

### Profissões/Áreas Cobertas:

| Categoria | Profissões Incluídas | Templates Possíveis |
|-----------|---------------------|---------------------|
| **Negócios** | CEO, Founder, Gerente, Consultor | Landing, CRM, Dashboard |
| **Tech** | Dev, DevOps, QA, Data Scientist | API, Portfolio, CI/CD |
| **Criativo** | Designer, Creator, Influencer | Portfolio, Link Bio, Brand |
| **Vendas** | SDR, Closer, E-commerce | CRM, Follow-up, Catalogo |
| **Educação** | Professor, Instrutor, Coach | Curso, Quiz, Agenda |
| **Saúde** | Médico, Psicólogo, Personal | Agenda, Formulários, Site |
| **Serviços** | Advogado, Contador, Consultor | Site, Automação, Docs |
| **Estudante** | Universitário, Pesquisador | Organização, Portfolio, CV |

### Taxa de Cobertura Estimada: **85%** dos casos de uso

---

## 🚀 Implementação Técnica

### Estado do Onboarding:

```typescript
interface OnboardingState {
  currentQuestion: number;
  answers: {
    profile?: string;
    need?: string;
    experience?: string;
  };
  suggestedTemplate: Template | null;
  alternatives: Template[];
  skipCount: number;
  timeSpent: number;
  
  // Métodos
  answerQuestion: (question: string, answer: string) => void;
  skipQuestion: () => void;
  selectTemplate: (templateId: string) => void;
  startOver: () => void;
}
```

### Analytics de Conversão:

```typescript
// Trackear cada passo
analytics.track('onboarding_question_answered', {
  question_number: 1,
  answer: 'empreendedor',
  time_to_answer: 3.2,
  skipped: false
});

// Métricas importantes
- Taxa de conclusão por pergunta
- Templates mais escolhidos
- Tempo médio para decisão
- Taxa de skip
- Sucesso pós-template (usuário continua?)
```

---

## 🎯 Templates Resultantes (Exemplos)

### Template: "Landing Page de Alta Conversão"
**Para:** Empreendedor → Site que Converte
```
Arquivos criados:
- index.html (hero, benefícios, CTA)
- styles.css (design moderno)
- form-handler.js (captura de leads)
- thank-you.html (página de obrigado)

Chat pré-populado:
"Criei uma landing page otimizada para conversão com:
- Hero section impactante
- Lista de benefícios
- Prova social
- Formulário de captura
- CTA's estratégicos

Quer adicionar integração com email marketing?"
```

### Template: "Dashboard Analytics"
**Para:** Analista → Dashboard Interativo
```
Arquivos criados:
- dashboard.html
- charts.js (Chart.js configurado)
- data-processor.js
- styles.css (layout responsivo)
- sample-data.json

Chat pré-populado:
"Criei um dashboard interativo com:
- 6 tipos de gráficos
- Filtros por período
- KPIs principais
- Exportação para PDF

Quer conectar com sua fonte de dados real?"
```

---

## 🔮 Melhorias Futuras

1. **Machine Learning**
   - Aprender com escolhas dos usuários
   - Refinar sugestões ao longo do tempo
   - Detectar padrões não previstos

2. **Personalização Avançada**
   - Integrar com LinkedIn para auto-detectar profissão
   - Usar histórico de navegação (com permissão)
   - Adaptar linguagem ao perfil

3. **Templates Híbridos**
   - Combinar múltiplos templates
   - Gerar templates únicos com IA
   - Adaptar em tempo real

4. **A/B Testing**
   - Testar diferentes sequências de perguntas
   - Otimizar copy das opções
   - Medir impacto na retenção

---

## 📈 KPIs de Sucesso

- **Tempo até template:** < 30 segundos
- **Taxa de conclusão:** > 85%
- **Satisfação com template:** > 4.5/5
- **Usuários que editam template:** > 70%
- **Retenção D7:** > 40%

---

**Status:** Pronto para Implementação
**Prioridade:** Alta
**Impacto Esperado:** Redução de 60% no tempo de onboarding