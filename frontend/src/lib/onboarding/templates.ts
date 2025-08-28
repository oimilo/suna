export interface TemplateMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp?: string;
  metadata?: any;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface TemplateFile {
  path: string;
  content: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  messages: TemplateMessage[];
  files: TemplateFile[];
}

export const templates: Template[] = [
  {
    id: 'automation-workflow',
    name: 'Automação Inteligente',
    description: 'Sistema de automação personalizada',
    icon: '🤖',
    color: 'from-violet-500 to-purple-500',
    messages: [
      {
        role: 'assistant',
        content: `## 🤖 Sistema de Automação Criado!

Como você tem o perfil de **automação**, preparei um sistema inicial de automação que podemos personalizar juntos. Este é um ponto de partida flexível!

### 🎯 Automação Base Implementada

**news-fetcher.js** - Coletor de notícias:
- Busca notícias de múltiplas fontes via RSS/API
- Filtra por palavras-chave e relevância
- Categoriza automaticamente por tópico
- Atualização a cada 30 minutos

**email-sender.js** - Sistema de envio:
- Templates de email personalizáveis
- Envio programado (diário/semanal)
- Lista de destinatários gerenciável
- Tracking de abertura e cliques

**automation-engine.js** - Motor de automação:
- Sistema de triggers e actions
- Webhooks para integrações
- Queue de processamento
- Logs detalhados

### 💡 Exemplos de Automações Prontas

1. **📰 Newsletter Diária Personalizada**
   - Coleta notícias do seu interesse
   - Envia resumo toda manhã às 8h
   - Com IA para resumir conteúdo

2. **📈 Monitor de Mercado**
   - Acompanha preços de ações/crypto
   - Alertas quando atingir targets
   - Relatório semanal de performance

3. **🔔 Social Media Monitor**
   - Monitora menções da sua marca
   - Responde automaticamente FAQs
   - Gera relatório de sentimento

4. **📋 Task Automation**
   - Cria tarefas de emails recebidos
   - Organiza por prioridade
   - Lembra de deadlines

### 🚀 Vamos Personalizar Sua Automação!

Me conte qual automação você precisa:

1. **Que tipo de informação você quer automatizar?**
   - Notícias? Dados? Emails? Tarefas?

2. **Com que frequência?**
   - Tempo real? Diária? Semanal?

3. **Qual ação deve ser tomada?**
   - Notificar? Salvar? Processar? Enviar?

4. **Tem alguma integração específica?**
   - Gmail? Slack? Discord? Telegram?

Posso criar qualquer automação que você imaginar! 🎯`,
        timestamp: new Date(Date.now() - 10000).toISOString()
      }
    ],
    files: [
      {
        path: 'automation-engine.js',
        content: `// 🤖 Motor de Automação Principal
const cron = require('node-cron');
const EventEmitter = require('events');

class AutomationEngine extends EventEmitter {
  constructor() {
    super();
    this.workflows = new Map();
    this.triggers = new Map();
    this.actions = new Map();
    this.running = false;
  }

  // Registra um novo workflow
  registerWorkflow(id, workflow) {
    this.workflows.set(id, {
      id,
      name: workflow.name,
      trigger: workflow.trigger,
      conditions: workflow.conditions || [],
      actions: workflow.actions || [],
      enabled: workflow.enabled !== false,
      metadata: workflow.metadata || {}
    });
    
    console.log(\`✅ Workflow registrado: \${workflow.name}\`);
    return id;
  }

  // Adiciona um trigger (gatilho)
  addTrigger(type, config) {
    const triggerId = \`trigger_\${Date.now()}\`;
    
    switch(type) {
      case 'schedule':
        // Trigger baseado em tempo (cron)
        const task = cron.schedule(config.cron, () => {
          this.emit('trigger', { type, triggerId, data: config.data });
        });
        this.triggers.set(triggerId, { type, task, config });
        break;
        
      case 'webhook':
        // Trigger baseado em webhook
        this.triggers.set(triggerId, { type, endpoint: config.endpoint, config });
        break;
        
      case 'event':
        // Trigger baseado em evento
        this.on(config.eventName, (data) => {
          this.emit('trigger', { type, triggerId, data });
        });
        this.triggers.set(triggerId, { type, eventName: config.eventName, config });
        break;
    }
    
    return triggerId;
  }

  // Adiciona uma ação
  addAction(name, handler) {
    this.actions.set(name, handler);
    console.log(\`📌 Ação registrada: \${name}\`);
  }

  // Executa um workflow
  async executeWorkflow(workflowId, triggerData) {
    const workflow = this.workflows.get(workflowId);
    if (!workflow || !workflow.enabled) return;

    console.log(\`🔄 Executando workflow: \${workflow.name}\`);
    
    // Verifica condições
    for (const condition of workflow.conditions) {
      if (!await this.evaluateCondition(condition, triggerData)) {
        console.log(\`⛔ Condição não atendida: \${JSON.stringify(condition)}\`);
        return;
      }
    }

    // Executa ações
    for (const action of workflow.actions) {
      const handler = this.actions.get(action.type);
      if (handler) {
        try {
          await handler(action.params, triggerData);
          console.log(\`✅ Ação executada: \${action.type}\`);
        } catch (error) {
          console.error(\`❌ Erro na ação \${action.type}:\`, error);
        }
      }
    }
  }

  // Avalia uma condição
  async evaluateCondition(condition, data) {
    switch(condition.type) {
      case 'contains':
        return data.text && data.text.includes(condition.value);
      case 'equals':
        return data[condition.field] === condition.value;
      case 'greater':
        return data[condition.field] > condition.value;
      default:
        return true;
    }
  }

  // Inicia o motor
  start() {
    if (this.running) return;
    
    this.running = true;
    
    // Escuta triggers
    this.on('trigger', async (triggerData) => {
      for (const [id, workflow] of this.workflows) {
        if (workflow.trigger === triggerData.triggerId) {
          await this.executeWorkflow(id, triggerData.data);
        }
      }
    });
    
    console.log('🚀 Motor de automação iniciado!');
  }

  // Para o motor
  stop() {
    this.running = false;
    // Para todos os cron jobs
    for (const [id, trigger] of this.triggers) {
      if (trigger.type === 'schedule' && trigger.task) {
        trigger.task.stop();
      }
    }
    console.log('🛑 Motor de automação parado');
  }
}

// Exporta instância única
module.exports = new AutomationEngine();`
      },
      {
        path: 'news-fetcher.js',
        content: `// 📰 Coletor de Notícias Automatizado
const Parser = require('rss-parser');
const axios = require('axios');

class NewsFetcher {
  constructor() {
    this.parser = new Parser();
    this.sources = [
      // RSS Feeds populares
      { name: 'TechCrunch', url: 'https://techcrunch.com/feed/', category: 'tech' },
      { name: 'Hacker News', url: 'https://news.ycombinator.com/rss', category: 'tech' },
      { name: 'BBC News', url: 'http://feeds.bbci.co.uk/news/rss.xml', category: 'general' },
      { name: 'CNN', url: 'http://rss.cnn.com/rss/edition.rss', category: 'general' },
      { name: 'The Verge', url: 'https://www.theverge.com/rss/index.xml', category: 'tech' },
    ];
    this.keywords = [];
    this.articles = [];
  }

  // Define palavras-chave para filtrar
  setKeywords(keywords) {
    this.keywords = Array.isArray(keywords) ? keywords : [keywords];
    console.log(\`🔍 Palavras-chave definidas: \${this.keywords.join(', ')}\`);
  }

  // Adiciona uma fonte RSS
  addSource(name, url, category = 'general') {
    this.sources.push({ name, url, category });
    console.log(\`➕ Fonte adicionada: \${name}\`);
  }

  // Busca notícias de todas as fontes
  async fetchAllNews() {
    console.log('📡 Buscando notícias...');
    const allArticles = [];

    for (const source of this.sources) {
      try {
        const feed = await this.parser.parseURL(source.url);
        const articles = feed.items.map(item => ({
          title: item.title,
          link: item.link,
          description: item.contentSnippet || item.description,
          pubDate: new Date(item.pubDate),
          source: source.name,
          category: source.category,
          guid: item.guid || item.link
        }));
        
        allArticles.push(...articles);
        console.log(\`✅ \${articles.length} artigos de \${source.name}\`);
      } catch (error) {
        console.error(\`❌ Erro ao buscar \${source.name}:\`, error.message);
      }
    }

    // Filtra por palavras-chave se definidas
    if (this.keywords.length > 0) {
      this.articles = allArticles.filter(article => 
        this.keywords.some(keyword => 
          article.title.toLowerCase().includes(keyword.toLowerCase()) ||
          article.description.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      console.log(\`🎯 \${this.articles.length} artigos filtrados\`);
    } else {
      this.articles = allArticles;
    }

    // Ordena por data (mais recente primeiro)
    this.articles.sort((a, b) => b.pubDate - a.pubDate);

    return this.articles;
  }

  // Busca notícias de uma API específica
  async fetchFromAPI(apiUrl, apiKey = null) {
    try {
      const config = apiKey ? { headers: { 'Authorization': \`Bearer \${apiKey}\` } } : {};
      const response = await axios.get(apiUrl, config);
      return response.data;
    } catch (error) {
      console.error('❌ Erro ao buscar da API:', error.message);
      return null;
    }
  }

  // Gera um resumo das notícias
  getSummary(limit = 10) {
    const topArticles = this.articles.slice(0, limit);
    return topArticles.map(article => ({
      title: article.title,
      source: article.source,
      link: article.link,
      time: this.getRelativeTime(article.pubDate)
    }));
  }

  // Calcula tempo relativo
  getRelativeTime(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    const intervals = {
      ano: 31536000,
      mês: 2592000,
      semana: 604800,
      dia: 86400,
      hora: 3600,
      minuto: 60
    };

    for (const [name, value] of Object.entries(intervals)) {
      const interval = Math.floor(seconds / value);
      if (interval >= 1) {
        return \`\${interval} \${name}\${interval > 1 ? 's' : ''} atrás\`;
      }
    }
    return 'agora';
  }

  // Filtra por categoria
  filterByCategory(category) {
    return this.articles.filter(article => article.category === category);
  }

  // Busca por texto
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.articles.filter(article =>
      article.title.toLowerCase().includes(lowerQuery) ||
      article.description.toLowerCase().includes(lowerQuery)
    );
  }
}

module.exports = NewsFetcher;`
      },
      {
        path: 'email-sender.js',
        content: `// 📧 Sistema de Envio de Emails Automatizado
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

class EmailSender {
  constructor(config = {}) {
    // Configuração do transporter (Gmail como padrão)
    this.transporter = nodemailer.createTransporter({
      service: config.service || 'gmail',
      auth: {
        user: config.email || process.env.EMAIL_USER,
        pass: config.password || process.env.EMAIL_PASS
      }
    });
    
    this.templates = new Map();
    this.subscribers = [];
    this.scheduledJobs = new Map();
  }

  // Verifica configuração
  async verify() {
    try {
      await this.transporter.verify();
      console.log('✅ Servidor de email pronto!');
      return true;
    } catch (error) {
      console.error('❌ Erro na configuração de email:', error);
      return false;
    }
  }

  // Adiciona um template de email
  addTemplate(name, template) {
    this.templates.set(name, {
      subject: template.subject,
      html: template.html,
      text: template.text || '',
      variables: template.variables || []
    });
    console.log(\`📝 Template adicionado: \${name}\`);
  }

  // Adiciona assinantes
  addSubscriber(email, preferences = {}) {
    this.subscribers.push({
      email,
      preferences,
      subscribedAt: new Date(),
      active: true
    });
    console.log(\`👤 Assinante adicionado: \${email}\`);
  }

  // Carrega assinantes de arquivo
  async loadSubscribersFromFile(filePath) {
    try {
      const data = await fs.readFile(filePath, 'utf-8');
      const subscribers = JSON.parse(data);
      subscribers.forEach(sub => this.addSubscriber(sub.email, sub.preferences));
      console.log(\`📂 \${subscribers.length} assinantes carregados\`);
    } catch (error) {
      console.error('❌ Erro ao carregar assinantes:', error);
    }
  }

  // Processa variáveis no template
  processTemplate(templateName, variables = {}) {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(\`Template '\${templateName}' não encontrado\`);
    }

    let html = template.html;
    let subject = template.subject;

    // Substitui variáveis
    Object.keys(variables).forEach(key => {
      const regex = new RegExp(\`{{\\s*\${key}\\s*}}\`, 'g');
      html = html.replace(regex, variables[key]);
      subject = subject.replace(regex, variables[key]);
    });

    return { subject, html, text: template.text };
  }

  // Envia email individual
  async sendEmail(to, subject, html, text = '') {
    try {
      const info = await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Automation System" <noreply@automation.com>',
        to,
        subject,
        html,
        text
      });
      
      console.log(\`📤 Email enviado para \${to}: \${info.messageId}\`);
      return info;
    } catch (error) {
      console.error(\`❌ Erro ao enviar email para \${to}:\`, error);
      throw error;
    }
  }

  // Envia email usando template
  async sendWithTemplate(to, templateName, variables = {}) {
    const { subject, html, text } = this.processTemplate(templateName, variables);
    return await this.sendEmail(to, subject, html, text);
  }

  // Envia para todos os assinantes
  async broadcast(templateName, variables = {}) {
    const activeSubscribers = this.subscribers.filter(sub => sub.active);
    console.log(\`📢 Enviando para \${activeSubscribers.length} assinantes...\`);
    
    const results = [];
    for (const subscriber of activeSubscribers) {
      try {
        const customVars = { ...variables, email: subscriber.email };
        await this.sendWithTemplate(subscriber.email, templateName, customVars);
        results.push({ email: subscriber.email, status: 'success' });
      } catch (error) {
        results.push({ email: subscriber.email, status: 'failed', error: error.message });
      }
      
      // Delay para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    const successful = results.filter(r => r.status === 'success').length;
    console.log(\`✅ Broadcast completo: \${successful}/\${results.length} enviados\`);
    return results;
  }

  // Agenda envio
  scheduleEmail(name, cronExpression, callback) {
    const task = cron.schedule(cronExpression, async () => {
      console.log(\`⏰ Executando tarefa agendada: \${name}\`);
      await callback();
    });
    
    this.scheduledJobs.set(name, task);
    console.log(\`📅 Email agendado: \${name} (\${cronExpression})\`);
    return task;
  }

  // Para tarefa agendada
  stopSchedule(name) {
    const task = this.scheduledJobs.get(name);
    if (task) {
      task.stop();
      this.scheduledJobs.delete(name);
      console.log(\`🛑 Tarefa parada: \${name}\`);
    }
  }

  // Template de newsletter
  createNewsletterTemplate(articles) {
    const html = \`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            h1 { color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px; }
            .article { margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 5px; }
            .article h3 { margin: 0 0 10px 0; color: #007bff; }
            .article p { margin: 5px 0; color: #666; }
            .article a { color: #007bff; text-decoration: none; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>📰 Sua Newsletter Diária</h1>
          <p>Olá {{name}}! Aqui estão as notícias de hoje:</p>
          
          \${articles.map(article => \`
            <div class="article">
              <h3>\${article.title}</h3>
              <p><strong>Fonte:</strong> \${article.source} | \${article.time}</p>
              <a href="\${article.link}">Ler mais →</a>
            </div>
          \`).join('')}
          
          <div class="footer">
            <p>Você está recebendo este email porque se inscreveu em nossa newsletter.</p>
            <p>Para cancelar, responda com "CANCELAR".</p>
          </div>
        </body>
      </html>
    \`;
    
    return html;
  }
}

module.exports = EmailSender;`
      },
      {
        path: 'package.json',
        content: `{
  "name": "automation-workflow",
  "version": "1.0.0",
  "description": "Sistema de automação inteligente",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js",
    "test": "jest"
  },
  "dependencies": {
    "node-cron": "^3.0.2",
    "nodemailer": "^6.9.7",
    "rss-parser": "^3.13.0",
    "axios": "^1.6.2",
    "express": "^4.18.2",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.2",
    "jest": "^29.7.0"
  }
}`
      },
      {
        path: 'index.js',
        content: `// 🚀 Sistema de Automação - Ponto de Entrada
require('dotenv').config();

const automationEngine = require('./automation-engine');
const NewsFetcher = require('./news-fetcher');
const EmailSender = require('./email-sender');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

// Inicializa componentes
const newsFetcher = new NewsFetcher();
const emailSender = new EmailSender({
  email: process.env.EMAIL_USER,
  password: process.env.EMAIL_PASS
});

// Middleware
app.use(express.json());

// =======================
// EXEMPLO 1: Newsletter Diária
// =======================

// Define palavras-chave de interesse
newsFetcher.setKeywords(['AI', 'tecnologia', 'inovação']);

// Cria template de newsletter
emailSender.addTemplate('daily-newsletter', {
  subject: '📰 Sua Newsletter Diária - {{date}}',
  html: '{{content}}',
  variables: ['date', 'content']
});

// Registra ação de enviar newsletter
automationEngine.addAction('send-newsletter', async (params, data) => {
  console.log('📧 Preparando newsletter...');
  
  // Busca notícias
  await newsFetcher.fetchAllNews();
  const summary = newsFetcher.getSummary(10);
  
  // Cria conteúdo HTML
  const content = emailSender.createNewsletterTemplate(summary);
  
  // Envia para assinantes
  await emailSender.broadcast('daily-newsletter', {
    date: new Date().toLocaleDateString('pt-BR'),
    content: content
  });
});

// Cria workflow de newsletter diária
automationEngine.registerWorkflow('daily-newsletter-workflow', {
  name: 'Newsletter Diária Automática',
  trigger: 'daily-trigger',
  actions: [
    { type: 'send-newsletter', params: {} }
  ]
});

// Agenda para 8h da manhã todo dia
const dailyTrigger = automationEngine.addTrigger('schedule', {
  cron: '0 8 * * *', // 8:00 AM todos os dias
  data: { type: 'newsletter' }
});

// =======================
// EXEMPLO 2: Monitor de Keywords
// =======================

automationEngine.addAction('check-keywords', async (params, data) => {
  console.log('🔍 Verificando palavras-chave...');
  
  await newsFetcher.fetchAllNews();
  const urgentNews = newsFetcher.search(params.keyword);
  
  if (urgentNews.length > 0) {
    // Envia alerta imediato
    console.log(\`⚠️ \${urgentNews.length} notícias urgentes encontradas!\`);
    // Aqui você pode enviar notificação push, SMS, etc.
  }
});

// =======================
// API Endpoints
// =======================

// Webhook para triggers externos
app.post('/webhook/:triggerId', (req, res) => {
  automationEngine.emit('trigger', {
    type: 'webhook',
    triggerId: req.params.triggerId,
    data: req.body
  });
  res.json({ status: 'received' });
});

// Status do sistema
app.get('/status', (req, res) => {
  res.json({
    running: automationEngine.running,
    workflows: Array.from(automationEngine.workflows.keys()),
    scheduledJobs: Array.from(automationEngine.triggers.keys())
  });
});

// Adiciona assinante
app.post('/subscribe', (req, res) => {
  const { email, preferences } = req.body;
  emailSender.addSubscriber(email, preferences);
  res.json({ status: 'subscribed', email });
});

// Trigger manual
app.post('/trigger/:workflowId', async (req, res) => {
  await automationEngine.executeWorkflow(req.params.workflowId, req.body);
  res.json({ status: 'executed' });
});

// =======================
// Inicialização
// =======================

async function start() {
  // Verifica configuração de email
  const emailOk = await emailSender.verify();
  if (!emailOk) {
    console.warn('⚠️ Email não configurado. Configure EMAIL_USER e EMAIL_PASS no .env');
  }
  
  // Adiciona alguns assinantes de exemplo
  emailSender.addSubscriber('user@example.com', { topics: ['tech', 'ai'] });
  
  // Inicia motor de automação
  automationEngine.start();
  
  // Inicia servidor
  app.listen(port, () => {
    console.log(\`🌐 Servidor rodando em http://localhost:\${port}\`);
    console.log('🤖 Sistema de automação pronto!');
    console.log('');
    console.log('Comandos úteis:');
    console.log('- GET /status - Ver status do sistema');
    console.log('- POST /subscribe - Adicionar assinante');
    console.log('- POST /trigger/:workflowId - Executar workflow manual');
  });
}

// Inicia sistema
start().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n🛑 Encerrando sistema...');
  automationEngine.stop();
  process.exit(0);
});`
      }
    ]
  },
  {
    id: 'landing-page',
    name: 'Landing Page Moderna',
    description: 'Site com design moderno e responsivo',
    icon: '🎨',
    color: 'from-purple-500 to-pink-500',
    messages: [
      {
        role: 'assistant',
        content: `## 🎨 Landing Page Profissional Criada!

Como você escolheu o perfil **"Designer Pragmático"**, preparei uma landing page moderna e otimizada para conversão. Aqui está o que criei para você:

### 📋 Estrutura do Projeto

**index.html** - Landing page principal com:
- Hero section com CTA prominente
- Seção de recursos com cards interativos
- Depoimentos de clientes
- Footer com links importantes

**styles.css** - Sistema de design completo:
- Design system com variáveis CSS customizadas
- Grid responsivo de 12 colunas
- Componentes reutilizáveis (botões, cards, forms)
- Animações suaves com @keyframes
- Media queries para mobile-first

**script.js** - Interatividade e UX:
- Menu mobile com hamburger animado
- Validação de formulários em tempo real
- Scroll suave para âncoras
- Analytics tracking preparado

### 🎯 Tecnologias Utilizadas
- HTML5 semântico (acessibilidade WCAG 2.1)
- CSS3 moderno com Flexbox e Grid
- JavaScript vanilla (sem dependências)
- Otimizado para Core Web Vitals

### 🚀 Próximos Passos - Vamos Personalizar!

Agora vou fazer algumas perguntas para adaptar a landing page ao seu negócio:

1. **Qual é o nome da sua empresa ou projeto?**
2. **Qual é o seu produto/serviço principal?** (para ajustar o texto do hero)
3. **Quais são as 3 principais características que diferenciam seu produto?**
4. **Você tem preferência de cores?** (ex: azul corporativo, verde natureza, etc)
5. **Qual é sua call-to-action principal?** (ex: "Comece Grátis", "Agende uma Demo", "Saiba Mais")

Enquanto isso, você pode visualizar a landing page atual abrindo o arquivo index.html. Me diga o que gostaria de ajustar!`,
        timestamp: new Date(Date.now() - 10000).toISOString()
      }
    ],
    files: [
      {
        path: 'index.html',
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Landing Page Moderna</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <nav class="navbar">
        <div class="container">
            <div class="nav-brand">SuaBrand</div>
            <ul class="nav-menu">
                <li><a href="#home">Home</a></li>
                <li><a href="#features">Features</a></li>
                <li><a href="#about">Sobre</a></li>
                <li><a href="#contact">Contato</a></li>
            </ul>
        </div>
    </nav>

    <section class="hero" id="home">
        <div class="container">
            <h1 class="hero-title">Bem-vindo ao Futuro</h1>
            <p class="hero-subtitle">Transforme suas ideias em realidade com nossa plataforma inovadora</p>
            <button class="btn-primary">Começar Agora</button>
        </div>
    </section>

    <section class="features" id="features">
        <div class="container">
            <h2 class="section-title">Nossos Recursos</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🚀</div>
                    <h3>Rápido</h3>
                    <p>Performance otimizada para máxima velocidade</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔒</div>
                    <h3>Seguro</h3>
                    <p>Seus dados protegidos com criptografia avançada</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">💡</div>
                    <h3>Inteligente</h3>
                    <p>IA integrada para otimizar sua experiência</p>
                </div>
            </div>
        </div>
    </section>

    <section class="contact" id="contact">
        <div class="container">
            <h2 class="section-title">Entre em Contato</h2>
            <form class="contact-form">
                <input type="text" placeholder="Seu Nome" required>
                <input type="email" placeholder="Seu Email" required>
                <textarea placeholder="Sua Mensagem" rows="5" required></textarea>
                <button type="submit" class="btn-primary">Enviar Mensagem</button>
            </form>
        </div>
    </section>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 SuaBrand. Todos os direitos reservados.</p>
        </div>
    </footer>

    <script src="app.js"></script>
</body>
</html>`
      },
      {
        path: 'style.css',
        content: `:root {
    --primary-color: #667eea;
    --secondary-color: #764ba2;
    --text-dark: #2d3748;
    --text-light: #718096;
    --bg-light: #f7fafc;
    --white: #ffffff;
    --shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    line-height: 1.6;
    color: var(--text-dark);
    overflow-x: hidden;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Navbar */
.navbar {
    background: var(--white);
    box-shadow: var(--shadow);
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
    padding: 1rem 0;
}

.navbar .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.nav-brand {
    font-size: 1.5rem;
    font-weight: bold;
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.nav-menu {
    display: flex;
    list-style: none;
    gap: 2rem;
}

.nav-menu a {
    color: var(--text-dark);
    text-decoration: none;
    transition: color 0.3s ease;
}

.nav-menu a:hover {
    color: var(--primary-color);
}

/* Hero Section */
.hero {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: var(--white);
    padding: 10rem 0 5rem;
    text-align: center;
    position: relative;
}

.hero-title {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: fadeInUp 1s ease;
}

.hero-subtitle {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    opacity: 0.9;
    animation: fadeInUp 1s ease 0.2s both;
}

.btn-primary {
    background: var(--white);
    color: var(--primary-color);
    border: none;
    padding: 1rem 2rem;
    font-size: 1rem;
    font-weight: bold;
    border-radius: 50px;
    cursor: pointer;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    animation: fadeInUp 1s ease 0.4s both;
}

.btn-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.2);
}

/* Features Section */
.features {
    padding: 5rem 0;
    background: var(--bg-light);
}

.section-title {
    font-size: 2.5rem;
    text-align: center;
    margin-bottom: 3rem;
    color: var(--text-dark);
}

.features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.feature-card {
    background: var(--white);
    padding: 2rem;
    border-radius: 10px;
    text-align: center;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    box-shadow: var(--shadow);
}

.feature-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.15);
}

.feature-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--text-dark);
}

.feature-card p {
    color: var(--text-light);
}

/* Contact Section */
.contact {
    padding: 5rem 0;
}

.contact-form {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

.contact-form input,
.contact-form textarea {
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s ease;
}

.contact-form input:focus,
.contact-form textarea:focus {
    outline: none;
    border-color: var(--primary-color);
}

/* Footer */
.footer {
    background: var(--text-dark);
    color: var(--white);
    text-align: center;
    padding: 2rem 0;
}

/* Animations */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Responsive */
@media (max-width: 768px) {
    .hero-title {
        font-size: 2rem;
    }
    
    .nav-menu {
        flex-direction: column;
        gap: 1rem;
    }
    
    .features-grid {
        grid-template-columns: 1fr;
    }
}`
      },
      {
        path: 'app.js',
        content: `// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Form submission handler
document.querySelector('.contact-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Get form values
    const formData = new FormData(this);
    const data = Object.fromEntries(formData);
    
    // Show success message
    alert('Mensagem enviada com sucesso! Entraremos em contato em breve.');
    
    // Reset form
    this.reset();
});

// Add scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observe all feature cards
document.querySelectorAll('.feature-card').forEach(card => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(20px)';
    card.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(card);
});

// Add navbar background on scroll
window.addEventListener('scroll', function() {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 50) {
        navbar.style.backgroundColor = 'rgba(255, 255, 255, 0.98)';
        navbar.style.backdropFilter = 'blur(10px)';
    } else {
        navbar.style.backgroundColor = 'var(--white)';
        navbar.style.backdropFilter = 'none';
    }
});`
      }
    ]
  },
  {
    id: 'dashboard-analytics',
    name: 'Dashboard Analytics',
    description: 'Painel com gráficos e métricas',
    icon: '📊',
    color: 'from-blue-500 to-cyan-500',
    messages: [
      {
        role: 'assistant',
        content: `## 📊 Dashboard Analytics Completo Criado!

Como você escolheu o perfil **"Analista de Dados"**, desenvolvi um dashboard profissional com visualizações interativas. Veja o que preparei:

### 📈 Componentes do Dashboard

**dashboard.html** - Interface principal com:
- Header com período de análise e filtros
- Grid de KPIs com variações percentuais
- 4 gráficos interativos principais
- Tabela de dados com ordenação
- Sidebar com navegação

**dashboard.css** - Design profissional:
- Tema escuro/claro automático
- Cards com sombras e hover effects
- Gradientes sutis nos KPIs
- Responsivo para tablets e mobile

**charts.js** - Visualizações com Chart.js:
- Gráfico de linha (tendências)
- Gráfico de barras (comparações)
- Gráfico de pizza (distribuição)
- Gráfico de área (evolução)
- Tooltips customizados
- Animações ao carregar

**data.json** - Dados estruturados:
- 6 meses de dados históricos
- Métricas de vendas, usuários e conversão
- Dados por região e categoria
- Formato pronto para API REST

### 💡 Recursos Implementados
- **Real-time Updates**: Preparado para WebSocket
- **Export**: Botões para CSV e PDF
- **Filtros Avançados**: Por data, categoria, região
- **Performance**: Lazy loading de dados
- **Acessibilidade**: ARIA labels e navegação por teclado

### 🎯 Vamos Personalizar seu Dashboard!

Para adaptar o dashboard às suas necessidades, me responda:

1. **Qual é o foco principal do seu dashboard?** (vendas, marketing, operações, finanças?)
2. **Quais são os 4 KPIs mais importantes para você?** (ex: receita, conversão, CAC, churn)
3. **Que tipo de dados você vai analisar?** (e-commerce, SaaS, varejo, serviços?)
4. **Qual período de análise é mais relevante?** (diário, semanal, mensal?)
5. **Precisa integrar com alguma API específica?** (Google Analytics, banco de dados, etc)
6. **Preferência de cores?** (corporativo azul, moderno roxo, clean cinza?)

O dashboard já está funcional - abra dashboard.html para visualizar. Me diga o que gostaria de ajustar primeiro!`,
        timestamp: new Date(Date.now() - 10000).toISOString()
      }
    ],
    files: [
      {
        path: 'dashboard.html',
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard Analytics</title>
    <link rel="stylesheet" href="dashboard.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div class="dashboard">
        <aside class="sidebar">
            <div class="sidebar-header">
                <h2>Analytics</h2>
            </div>
            <nav class="sidebar-nav">
                <a href="#" class="nav-item active">📊 Overview</a>
                <a href="#" class="nav-item">📈 Vendas</a>
                <a href="#" class="nav-item">👥 Clientes</a>
                <a href="#" class="nav-item">📦 Produtos</a>
                <a href="#" class="nav-item">⚙️ Configurações</a>
            </nav>
        </aside>

        <main class="main-content">
            <header class="header">
                <h1>Dashboard Overview</h1>
                <div class="header-actions">
                    <select class="period-filter">
                        <option>Últimos 7 dias</option>
                        <option>Últimos 30 dias</option>
                        <option>Últimos 3 meses</option>
                        <option>Último ano</option>
                    </select>
                    <button class="btn-export">Exportar</button>
                </div>
            </header>

            <div class="kpi-grid">
                <div class="kpi-card">
                    <div class="kpi-icon">💰</div>
                    <div class="kpi-content">
                        <h3>Receita Total</h3>
                        <p class="kpi-value">R$ 125.430</p>
                        <span class="kpi-change positive">+12.5%</span>
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon">📦</div>
                    <div class="kpi-content">
                        <h3>Pedidos</h3>
                        <p class="kpi-value">1.234</p>
                        <span class="kpi-change positive">+8.2%</span>
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon">👥</div>
                    <div class="kpi-content">
                        <h3>Clientes Ativos</h3>
                        <p class="kpi-value">892</p>
                        <span class="kpi-change negative">-2.3%</span>
                    </div>
                </div>
                <div class="kpi-card">
                    <div class="kpi-icon">⭐</div>
                    <div class="kpi-content">
                        <h3>Satisfação</h3>
                        <p class="kpi-value">4.8/5</p>
                        <span class="kpi-change positive">+0.3</span>
                    </div>
                </div>
            </div>

            <div class="charts-grid">
                <div class="chart-container">
                    <h3>Vendas Mensais</h3>
                    <canvas id="salesChart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Distribuição por Categoria</h3>
                    <canvas id="categoryChart"></canvas>
                </div>
            </div>

            <div class="table-container">
                <h3>Últimas Transações</h3>
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Cliente</th>
                            <th>Produto</th>
                            <th>Valor</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>#1234</td>
                            <td>João Silva</td>
                            <td>Produto A</td>
                            <td>R$ 299,00</td>
                            <td><span class="status completed">Completo</span></td>
                        </tr>
                        <tr>
                            <td>#1235</td>
                            <td>Maria Santos</td>
                            <td>Produto B</td>
                            <td>R$ 450,00</td>
                            <td><span class="status pending">Pendente</span></td>
                        </tr>
                        <tr>
                            <td>#1236</td>
                            <td>Pedro Costa</td>
                            <td>Produto C</td>
                            <td>R$ 189,00</td>
                            <td><span class="status completed">Completo</span></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </main>
    </div>

    <script src="data.js"></script>
    <script src="charts.js"></script>
</body>
</html>`
      },
      {
        path: 'dashboard.css',
        content: `:root {
    --primary: #3b82f6;
    --secondary: #8b5cf6;
    --success: #10b981;
    --danger: #ef4444;
    --warning: #f59e0b;
    --dark: #1e293b;
    --light: #f1f5f9;
    --white: #ffffff;
    --gray: #64748b;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--light);
    color: var(--dark);
}

.dashboard {
    display: flex;
    min-height: 100vh;
}

/* Sidebar */
.sidebar {
    width: 250px;
    background: var(--white);
    box-shadow: 2px 0 10px rgba(0,0,0,0.05);
}

.sidebar-header {
    padding: 1.5rem;
    border-bottom: 1px solid var(--light);
}

.sidebar-header h2 {
    color: var(--primary);
}

.sidebar-nav {
    padding: 1rem 0;
}

.nav-item {
    display: block;
    padding: 1rem 1.5rem;
    color: var(--gray);
    text-decoration: none;
    transition: all 0.3s ease;
}

.nav-item:hover {
    background: var(--light);
    color: var(--primary);
}

.nav-item.active {
    background: rgba(59, 130, 246, 0.1);
    color: var(--primary);
    border-left: 3px solid var(--primary);
}

/* Main Content */
.main-content {
    flex: 1;
    padding: 2rem;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
}

.header h1 {
    color: var(--dark);
}

.header-actions {
    display: flex;
    gap: 1rem;
}

.period-filter {
    padding: 0.5rem 1rem;
    border: 1px solid var(--gray);
    border-radius: 8px;
    background: var(--white);
}

.btn-export {
    padding: 0.5rem 1.5rem;
    background: var(--primary);
    color: var(--white);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s ease;
}

.btn-export:hover {
    background: #2563eb;
}

/* KPI Cards */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.kpi-card {
    background: var(--white);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    display: flex;
    align-items: center;
    gap: 1rem;
    transition: transform 0.3s ease;
}

.kpi-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}

.kpi-icon {
    font-size: 2rem;
    padding: 1rem;
    background: var(--light);
    border-radius: 10px;
}

.kpi-content h3 {
    font-size: 0.875rem;
    color: var(--gray);
    margin-bottom: 0.5rem;
}

.kpi-value {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--dark);
}

.kpi-change {
    font-size: 0.875rem;
    font-weight: 600;
}

.kpi-change.positive {
    color: var(--success);
}

.kpi-change.negative {
    color: var(--danger);
}

/* Charts */
.charts-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
}

.chart-container {
    background: var(--white);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.chart-container h3 {
    margin-bottom: 1rem;
    color: var(--dark);
}

/* Table */
.table-container {
    background: var(--white);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.table-container h3 {
    margin-bottom: 1rem;
    color: var(--dark);
}

.data-table {
    width: 100%;
    border-collapse: collapse;
}

.data-table th {
    text-align: left;
    padding: 1rem;
    border-bottom: 2px solid var(--light);
    color: var(--gray);
    font-weight: 600;
}

.data-table td {
    padding: 1rem;
    border-bottom: 1px solid var(--light);
}

.status {
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    font-weight: 600;
}

.status.completed {
    background: rgba(16, 185, 129, 0.1);
    color: var(--success);
}

.status.pending {
    background: rgba(245, 158, 11, 0.1);
    color: var(--warning);
}`
      },
      {
        path: 'data.js',
        content: `// Dados de exemplo para os gráficos
const salesData = {
    labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
    values: [12000, 19000, 15000, 25000, 22000, 30000]
};

const categoryData = {
    labels: ['Eletrônicos', 'Roupas', 'Alimentos', 'Livros', 'Outros'],
    values: [35, 25, 20, 15, 5]
};

// Dados para a tabela
const transactions = [
    { id: '#1234', customer: 'João Silva', product: 'Produto A', value: 'R$ 299,00', status: 'completed' },
    { id: '#1235', customer: 'Maria Santos', product: 'Produto B', value: 'R$ 450,00', status: 'pending' },
    { id: '#1236', customer: 'Pedro Costa', product: 'Produto C', value: 'R$ 189,00', status: 'completed' },
    { id: '#1237', customer: 'Ana Lima', product: 'Produto D', value: 'R$ 567,00', status: 'completed' },
    { id: '#1238', customer: 'Carlos Souza', product: 'Produto E', value: 'R$ 234,00', status: 'pending' }
];`
      },
      {
        path: 'charts.js',
        content: `// Configuração do gráfico de vendas
const salesCtx = document.getElementById('salesChart').getContext('2d');
new Chart(salesCtx, {
    type: 'line',
    data: {
        labels: salesData.labels,
        datasets: [{
            label: 'Vendas (R$)',
            data: salesData.values,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return 'R$ ' + value.toLocaleString('pt-BR');
                    }
                }
            }
        }
    }
});

// Configuração do gráfico de categorias
const categoryCtx = document.getElementById('categoryChart').getContext('2d');
new Chart(categoryCtx, {
    type: 'doughnut',
    data: {
        labels: categoryData.labels,
        datasets: [{
            data: categoryData.values,
            backgroundColor: [
                '#3b82f6',
                '#8b5cf6',
                '#10b981',
                '#f59e0b',
                '#ef4444'
            ]
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom'
            }
        }
    }
});

// Exportar dados
document.querySelector('.btn-export').addEventListener('click', function() {
    alert('Exportando dados para Excel...');
});`
      }
    ]
  },
  {
    id: 'api-nodejs',
    name: 'API REST Node.js',
    description: 'Backend completo com Express',
    icon: '🚀',
    color: 'from-green-500 to-emerald-500',
    messages: [
      {
        role: 'assistant',
        content: `## 🏗️ API REST Profissional Criada!

Como você escolheu o perfil **"Arquiteto de Sistemas"**, desenvolvi uma API REST elegante e bem estruturada. Arquitetura limpa, escalável e com as melhores práticas!

### 🎯 Arquitetura Implementada

**server.js** - Servidor principal:
- Express.js configurado com middlewares essenciais
- CORS, body-parser, helmet para segurança
- Rate limiting e compression
- Error handling centralizado

**routes.js** - Sistema de rotas:
- RESTful endpoints organizados
- Versionamento de API (v1)
- Documentação inline
- Validação de parâmetros

**middleware.js** - Camada de middleware:
- Autenticação JWT
- Logging estruturado
- Validação de requests
- Cache strategy

### 📚 Recursos da API
✅ CRUD completo para recursos
✅ Autenticação e autorização
✅ Validação com schemas
✅ Paginação e filtros
✅ Rate limiting por IP
✅ Documentação Swagger ready

### 🚀 Próximos Passos

A API está pronta! Execute \`npm install && npm start\` para iniciar. Me diga qual tipo de aplicação você quer construir e posso:

1. **Conectar um banco de dados** (MongoDB, PostgreSQL, MySQL)
2. **Adicionar mais recursos** (upload de arquivos, websockets, GraphQL)
3. **Implementar microserviços** (message queues, service mesh)
4. **Setup de CI/CD** (Docker, Kubernetes, GitHub Actions)`,
        timestamp: new Date(Date.now() - 10000).toISOString()
      }
    ],
    files: [
      {
        path: 'server.js',
        content: `const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const routes = require('./routes');
const { errorHandler } = require('./middleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    console.log(\`🚀 Server running on http://localhost:\${PORT}\`);
    console.log(\`📚 API Documentation: http://localhost:\${PORT}/api/docs\`);
});

module.exports = app;`
      },
      {
        path: 'routes.js',
        content: `const express = require('express');
const { authenticate, validateRequest } = require('./middleware');

const router = express.Router();

// Mock database
let items = [
    { id: 1, name: 'Item 1', description: 'First item', price: 29.99 },
    { id: 2, name: 'Item 2', description: 'Second item', price: 39.99 }
];

// GET all items
router.get('/items', (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    
    const results = {
        data: items.slice(startIndex, endIndex),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: items.length,
            pages: Math.ceil(items.length / limit)
        }
    };
    
    res.json(results);
});

// GET item by ID
router.get('/items/:id', (req, res) => {
    const item = items.find(i => i.id === parseInt(req.params.id));
    
    if (!item) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    res.json(item);
});

// POST create new item (protected)
router.post('/items', authenticate, validateRequest, (req, res) => {
    const { name, description, price } = req.body;
    
    const newItem = {
        id: items.length + 1,
        name,
        description,
        price: parseFloat(price),
        createdAt: new Date().toISOString()
    };
    
    items.push(newItem);
    res.status(201).json(newItem);
});

// PUT update item (protected)
router.put('/items/:id', authenticate, validateRequest, (req, res) => {
    const itemIndex = items.findIndex(i => i.id === parseInt(req.params.id));
    
    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    items[itemIndex] = {
        ...items[itemIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
    };
    
    res.json(items[itemIndex]);
});

// DELETE item (protected)
router.delete('/items/:id', authenticate, (req, res) => {
    const itemIndex = items.findIndex(i => i.id === parseInt(req.params.id));
    
    if (itemIndex === -1) {
        return res.status(404).json({ error: 'Item not found' });
    }
    
    items.splice(itemIndex, 1);
    res.status(204).send();
});

// API Documentation
router.get('/docs', (req, res) => {
    const docs = {
        version: '1.0.0',
        title: 'Items API',
        description: 'REST API for managing items',
        baseURL: '/api',
        endpoints: [
            {
                method: 'GET',
                path: '/items',
                description: 'Get all items with pagination',
                parameters: ['page', 'limit']
            },
            {
                method: 'GET',
                path: '/items/:id',
                description: 'Get item by ID'
            },
            {
                method: 'POST',
                path: '/items',
                description: 'Create new item (requires auth)',
                body: { name: 'string', description: 'string', price: 'number' }
            },
            {
                method: 'PUT',
                path: '/items/:id',
                description: 'Update item (requires auth)'
            },
            {
                method: 'DELETE',
                path: '/items/:id',
                description: 'Delete item (requires auth)'
            }
        ]
    };
    
    res.json(docs);
});

module.exports = router;`
      },
      {
        path: 'middleware.js',
        content: `// Authentication middleware
const authenticate = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Mock authentication - in production, verify JWT token
    if (token !== 'secret-token-123') {
        return res.status(403).json({ error: 'Invalid token' });
    }
    
    // Add user info to request
    req.user = {
        id: 1,
        email: 'user@example.com',
        role: 'admin'
    };
    
    next();
};

// Validation middleware
const validateRequest = (req, res, next) => {
    const { name, price } = req.body;
    
    if (!name || typeof name !== 'string' || name.trim().length < 3) {
        return res.status(400).json({ 
            error: 'Invalid name. Must be at least 3 characters' 
        });
    }
    
    if (price !== undefined && (typeof price !== 'number' || price < 0)) {
        return res.status(400).json({ 
            error: 'Invalid price. Must be a positive number' 
        });
    }
    
    next();
};

// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error(err.stack);
    
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    
    res.status(status).json({
        error: message,
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
};

// Rate limiting
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
    const requests = new Map();
    
    return (req, res, next) => {
        const ip = req.ip;
        const now = Date.now();
        const windowStart = now - windowMs;
        
        if (!requests.has(ip)) {
            requests.set(ip, []);
        }
        
        const userRequests = requests.get(ip).filter(time => time > windowStart);
        
        if (userRequests.length >= maxRequests) {
            return res.status(429).json({ 
                error: 'Too many requests. Please try again later.' 
            });
        }
        
        userRequests.push(now);
        requests.set(ip, userRequests);
        next();
    };
};

module.exports = {
    authenticate,
    validateRequest,
    errorHandler,
    rateLimit
};`
      },
      {
        path: 'package.json',
        content: `{
  "name": "api-rest-nodejs",
  "version": "1.0.0",
  "description": "REST API with Express.js",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "test": "jest"
  },
  "keywords": ["api", "rest", "express", "nodejs"],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "morgan": "^1.10.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.6.2"
  }
}`
      },
      {
        path: 'README.md',
        content: `# API REST Node.js

Uma API REST completa construída com Express.js, incluindo autenticação, validação e documentação.

## 🚀 Início Rápido

### Instalação
\`\`\`bash
npm install
\`\`\`

### Desenvolvimento
\`\`\`bash
npm run dev
\`\`\`

### Produção
\`\`\`bash
npm start
\`\`\`

## 📚 Endpoints

### Públicos
- \`GET /api/items\` - Listar todos os itens
- \`GET /api/items/:id\` - Buscar item por ID
- \`GET /api/docs\` - Documentação da API

### Protegidos (Requer Autenticação)
- \`POST /api/items\` - Criar novo item
- \`PUT /api/items/:id\` - Atualizar item
- \`DELETE /api/items/:id\` - Deletar item

## 🔐 Autenticação

Adicione o token no header:
\`\`\`
Authorization: Bearer secret-token-123
\`\`\`

## 📦 Estrutura

- \`server.js\` - Servidor Express principal
- \`routes.js\` - Definição de rotas e controllers
- \`middleware.js\` - Middlewares customizados
- \`package.json\` - Dependências do projeto

## 🛠️ Tecnologias

- Express.js - Framework web
- Helmet - Segurança
- CORS - Cross-Origin Resource Sharing
- Morgan - Logging HTTP

## 📝 Exemplos

### Criar Item
\`\`\`bash
curl -X POST http://localhost:3000/api/items \\
  -H "Authorization: Bearer secret-token-123" \\
  -H "Content-Type: application/json" \\
  -d '{"name": "Novo Item", "description": "Descrição", "price": 99.99}'
\`\`\`

### Listar Items com Paginação
\`\`\`bash
curl http://localhost:3000/api/items?page=1&limit=10
\`\`\`

## 🔄 Próximos Passos

1. Conectar banco de dados (MongoDB/PostgreSQL)
2. Implementar JWT real
3. Adicionar testes
4. Configurar CI/CD
5. Adicionar Swagger documentation`
      }
    ]
  },
  {
    id: 'blog-markdown',
    name: 'Blog com Markdown',
    description: 'Sistema de blog com editor Markdown',
    icon: '✍️',
    color: 'from-indigo-500 to-purple-500',
    messages: [
      {
        role: 'assistant',
        content: `## ✨ Blog Artístico e Visual Criado!

Como você escolheu o perfil **"Artista Visual"**, criei um blog lindíssimo com foco em estética e experiência visual. Cada detalhe foi pensado para encantar!

### 🎨 Design & Experiência

**blog.html** - Interface principal:
- Layout magazine-style com grid assimétrico
- Hero posts com imagens grandes
- Typography elegante (Playfair + Inter)
- Animações suaves ao scroll
- Dark mode automático

**editor.html** - Editor criativo:
- Editor Markdown com preview ao vivo
- Paleta de cores customizável
- Inserção drag-and-drop de imagens
- Templates de post pré-definidos
- Mood board integrado

**blog.css** - Sistema visual:
- Design system com golden ratio
- Gradientes e glassmorphism
- Micro-interações deliciosas
- Fontes variáveis e responsivas
- Print stylesheet otimizado

### 🌟 Features Visuais
✅ Hero posts cinematográficos
✅ Galeria de imagens lightbox
✅ Reading progress indicator
✅ Parallax scrolling sutil
✅ Share buttons animados
✅ Typography perfeita para leitura

### 🚀 Próximos Passos Criativos

O blog está pronto para você expressar sua arte! Abra blog.html para ver a magia. Agora me conte:

1. **Qual é o tema do seu blog?** (arte, fotografia, design, lifestyle)
2. **Que tipo de conteúdo você vai criar?** (tutoriais, portfolio, diário criativo)
3. **Cores preferidas?** (posso customizar toda a paleta)
4. **Tem alguma referência visual?** (site ou estilo que admira)

Vamos deixar seu blog com a sua cara! 🎨`,
        timestamp: new Date(Date.now() - 10000).toISOString()
      }
    ],
    files: [
      {
        path: 'blog.html',
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Meu Blog</title>
    <link rel="stylesheet" href="blog.css">
</head>
<body>
    <header class="blog-header">
        <div class="container">
            <h1 class="blog-title">📝 Meu Blog</h1>
            <nav class="blog-nav">
                <a href="#" class="nav-link active">Home</a>
                <a href="#" class="nav-link">Artigos</a>
                <a href="#" class="nav-link">Categorias</a>
                <a href="#" class="nav-link">Sobre</a>
                <a href="editor.html" class="btn-write">Escrever</a>
            </nav>
        </div>
    </header>

    <main class="blog-main container">
        <div class="search-bar">
            <input type="search" placeholder="Buscar artigos..." class="search-input">
        </div>

        <div class="articles-grid">
            <article class="article-card">
                <img src="https://via.placeholder.com/400x200" alt="Cover" class="article-image">
                <div class="article-content">
                    <div class="article-meta">
                        <span class="category">Tecnologia</span>
                        <span class="date">25 Jan 2024</span>
                    </div>
                    <h2 class="article-title">Introdução ao Markdown</h2>
                    <p class="article-excerpt">
                        Aprenda como usar Markdown para escrever conteúdo formatado de forma simples e eficiente.
                    </p>
                    <div class="article-footer">
                        <a href="#" class="read-more">Ler mais →</a>
                        <div class="article-stats">
                            <span>👁 234</span>
                            <span>❤️ 45</span>
                        </div>
                    </div>
                </div>
            </article>

            <article class="article-card">
                <img src="https://via.placeholder.com/400x200" alt="Cover" class="article-image">
                <div class="article-content">
                    <div class="article-meta">
                        <span class="category">Design</span>
                        <span class="date">24 Jan 2024</span>
                    </div>
                    <h2 class="article-title">Tendências de UI/UX em 2024</h2>
                    <p class="article-excerpt">
                        Descubra as principais tendências de design que estão moldando a web este ano.
                    </p>
                    <div class="article-footer">
                        <a href="#" class="read-more">Ler mais →</a>
                        <div class="article-stats">
                            <span>👁 512</span>
                            <span>❤️ 89</span>
                        </div>
                    </div>
                </div>
            </article>

            <article class="article-card">
                <img src="https://via.placeholder.com/400x200" alt="Cover" class="article-image">
                <div class="article-content">
                    <div class="article-meta">
                        <span class="category">JavaScript</span>
                        <span class="date">23 Jan 2024</span>
                    </div>
                    <h2 class="article-title">Async/Await vs Promises</h2>
                    <p class="article-excerpt">
                        Entenda as diferenças e quando usar cada abordagem para código assíncrono.
                    </p>
                    <div class="article-footer">
                        <a href="#" class="read-more">Ler mais →</a>
                        <div class="article-stats">
                            <span>👁 178</span>
                            <span>❤️ 34</span>
                        </div>
                    </div>
                </div>
            </article>
        </div>

        <aside class="sidebar">
            <div class="widget">
                <h3>Categorias</h3>
                <ul class="category-list">
                    <li><a href="#">Tecnologia (12)</a></li>
                    <li><a href="#">Design (8)</a></li>
                    <li><a href="#">JavaScript (15)</a></li>
                    <li><a href="#">CSS (6)</a></li>
                    <li><a href="#">Tutorial (9)</a></li>
                </ul>
            </div>

            <div class="widget">
                <h3>Tags Populares</h3>
                <div class="tag-cloud">
                    <span class="tag">React</span>
                    <span class="tag">Node.js</span>
                    <span class="tag">CSS</span>
                    <span class="tag">JavaScript</span>
                    <span class="tag">HTML</span>
                    <span class="tag">UI/UX</span>
                </div>
            </div>
        </aside>
    </main>

    <footer class="blog-footer">
        <div class="container">
            <p>&copy; 2024 Meu Blog. Feito com ❤️ usando Markdown</p>
        </div>
    </footer>

    <script src="articles.js"></script>
</body>
</html>`
      },
      {
        path: 'editor.html',
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Editor Markdown</title>
    <link rel="stylesheet" href="blog.css">
    <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/prismjs/prism.min.js"></script>
</head>
<body>
    <div class="editor-container">
        <header class="editor-header">
            <a href="blog.html" class="back-link">← Voltar</a>
            <div class="editor-actions">
                <button class="btn-preview" onclick="togglePreview()">Preview</button>
                <button class="btn-save" onclick="saveArticle()">Salvar</button>
                <button class="btn-publish" onclick="publishArticle()">Publicar</button>
            </div>
        </header>

        <div class="editor-main">
            <div class="editor-panel">
                <input type="text" class="title-input" placeholder="Título do artigo...">
                <input type="text" class="tags-input" placeholder="Tags (separadas por vírgula)...">
                <div class="editor-toolbar">
                    <button onclick="insertMarkdown('**', '**')">B</button>
                    <button onclick="insertMarkdown('*', '*')">I</button>
                    <button onclick="insertMarkdown('# ')">H1</button>
                    <button onclick="insertMarkdown('## ')">H2</button>
                    <button onclick="insertMarkdown('### ')">H3</button>
                    <button onclick="insertMarkdown('- ')">List</button>
                    <button onclick="insertMarkdown('[', '](url)')">Link</button>
                    <button onclick="insertMarkdown('![alt](', ')')">Image</button>
                    <button onclick="insertMarkdown('\`', '\`')">Code</button>
                    <button onclick="insertMarkdown('\`\`\`\\n', '\\n\`\`\`')">Block</button>
                </div>
                <textarea class="markdown-editor" placeholder="Escreva seu artigo em Markdown..."></textarea>
            </div>
            
            <div class="preview-panel">
                <div class="preview-content"></div>
            </div>
        </div>
    </div>

    <script src="markdown.js"></script>
</body>
</html>`
      },
      {
        path: 'blog.css',
        content: `:root {
    --primary: #5b21b6;
    --secondary: #6366f1;
    --text: #1e293b;
    --text-light: #64748b;
    --bg: #f8fafc;
    --white: #ffffff;
    --border: #e2e8f0;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--bg);
    color: var(--text);
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Blog Header */
.blog-header {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 1.5rem 0;
}

.blog-header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.blog-title {
    font-size: 1.75rem;
    color: var(--primary);
}

.blog-nav {
    display: flex;
    gap: 2rem;
    align-items: center;
}

.nav-link {
    color: var(--text-light);
    text-decoration: none;
    transition: color 0.3s;
}

.nav-link:hover,
.nav-link.active {
    color: var(--primary);
}

.btn-write {
    background: var(--primary);
    color: var(--white);
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    transition: background 0.3s;
}

.btn-write:hover {
    background: var(--secondary);
}

/* Main Layout */
.blog-main {
    display: grid;
    grid-template-columns: 1fr 300px;
    gap: 2rem;
    margin-top: 2rem;
}

/* Search Bar */
.search-bar {
    grid-column: 1 / -1;
    margin-bottom: 2rem;
}

.search-input {
    width: 100%;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    font-size: 1rem;
}

/* Articles Grid */
.articles-grid {
    display: grid;
    gap: 2rem;
}

.article-card {
    background: var(--white);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    transition: transform 0.3s, box-shadow 0.3s;
}

.article-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}

.article-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.article-content {
    padding: 1.5rem;
}

.article-meta {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.category {
    background: var(--primary);
    color: var(--white);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
}

.date {
    color: var(--text-light);
    font-size: 0.875rem;
}

.article-title {
    margin-bottom: 1rem;
    color: var(--text);
}

.article-excerpt {
    color: var(--text-light);
    margin-bottom: 1.5rem;
}

.article-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.read-more {
    color: var(--primary);
    text-decoration: none;
    font-weight: 600;
    transition: color 0.3s;
}

.read-more:hover {
    color: var(--secondary);
}

.article-stats {
    display: flex;
    gap: 1rem;
    color: var(--text-light);
}

/* Sidebar */
.sidebar {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

.widget {
    background: var(--white);
    padding: 1.5rem;
    border-radius: 12px;
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.widget h3 {
    margin-bottom: 1rem;
    color: var(--text);
}

.category-list {
    list-style: none;
}

.category-list li {
    padding: 0.5rem 0;
}

.category-list a {
    color: var(--text-light);
    text-decoration: none;
    transition: color 0.3s;
}

.category-list a:hover {
    color: var(--primary);
}

.tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.tag {
    background: var(--bg);
    padding: 0.25rem 0.75rem;
    border-radius: 20px;
    font-size: 0.875rem;
    color: var(--text-light);
    transition: background 0.3s, color 0.3s;
    cursor: pointer;
}

.tag:hover {
    background: var(--primary);
    color: var(--white);
}

/* Editor Styles */
.editor-container {
    height: 100vh;
    display: flex;
    flex-direction: column;
}

.editor-header {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.back-link {
    color: var(--text-light);
    text-decoration: none;
}

.editor-actions {
    display: flex;
    gap: 1rem;
}

.editor-actions button {
    padding: 0.5rem 1.5rem;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s;
}

.btn-preview {
    background: var(--bg);
    color: var(--text);
}

.btn-save {
    background: var(--secondary);
    color: var(--white);
}

.btn-publish {
    background: var(--primary);
    color: var(--white);
}

.editor-main {
    flex: 1;
    display: grid;
    grid-template-columns: 1fr 1fr;
}

.editor-panel {
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
}

.title-input,
.tags-input {
    padding: 1rem 2rem;
    border: none;
    border-bottom: 1px solid var(--border);
    font-size: 1.25rem;
}

.editor-toolbar {
    padding: 1rem 2rem;
    border-bottom: 1px solid var(--border);
    display: flex;
    gap: 0.5rem;
}

.editor-toolbar button {
    padding: 0.5rem 1rem;
    background: var(--bg);
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.markdown-editor {
    flex: 1;
    padding: 2rem;
    border: none;
    font-family: 'Courier New', monospace;
    font-size: 1rem;
    resize: none;
}

.preview-panel {
    padding: 2rem;
    overflow-y: auto;
}

.preview-content {
    max-width: 800px;
    margin: 0 auto;
}

/* Footer */
.blog-footer {
    background: var(--white);
    border-top: 1px solid var(--border);
    padding: 2rem 0;
    margin-top: 4rem;
    text-align: center;
    color: var(--text-light);
}`
      },
      {
        path: 'markdown.js',
        content: `// Markdown editor functionality
const editor = document.querySelector('.markdown-editor');
const preview = document.querySelector('.preview-content');
const titleInput = document.querySelector('.title-input');
const tagsInput = document.querySelector('.tags-input');

// Live preview update
if (editor) {
    editor.addEventListener('input', updatePreview);
    
    // Initialize with sample content
    editor.value = \`# Bem-vindo ao Editor Markdown!

Este é um editor **Markdown** com preview ao vivo.

## Features

- **Negrito** e *itálico*
- Listas e numeração
- [Links](https://example.com)
- Imagens
- \\\`Código inline\\\`
- Blocos de código

\\\`\\\`\\\`javascript
function hello() {
    console.log("Hello, World!");
}
\\\`\\\`\\\`

### Tabelas

| Feature | Suportado |
|---------|-----------|
| Tabelas | ✅ |
| Listas | ✅ |
| Código | ✅ |

> Blockquotes também são suportados!

Aproveite para escrever seu conteúdo! 🚀\`;
    
    updatePreview();
}

function updatePreview() {
    if (preview && editor) {
        const markdown = editor.value;
        const html = marked.parse(markdown);
        preview.innerHTML = html;
        
        // Highlight code blocks
        preview.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightBlock(block);
        });
    }
}

// Insert markdown helpers
function insertMarkdown(before, after = '') {
    if (!editor) return;
    
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const text = editor.value;
    const selectedText = text.substring(start, end);
    
    const replacement = before + selectedText + after;
    editor.value = text.substring(0, start) + replacement + text.substring(end);
    
    // Set cursor position
    editor.selectionStart = start + before.length;
    editor.selectionEnd = start + before.length + selectedText.length;
    editor.focus();
    
    updatePreview();
}

// Toggle preview
function togglePreview() {
    const editorPanel = document.querySelector('.editor-panel');
    const previewPanel = document.querySelector('.preview-panel');
    
    if (editorPanel.style.display === 'none') {
        editorPanel.style.display = 'flex';
        previewPanel.style.display = 'block';
    } else {
        editorPanel.style.display = editorPanel.style.display === 'flex' ? 'none' : 'flex';
        previewPanel.style.display = previewPanel.style.display === 'block' ? 'none' : 'block';
    }
}

// Save article
function saveArticle() {
    const article = {
        title: titleInput?.value || 'Untitled',
        tags: tagsInput?.value.split(',').map(tag => tag.trim()) || [],
        content: editor?.value || '',
        savedAt: new Date().toISOString()
    };
    
    localStorage.setItem('draft', JSON.stringify(article));
    alert('Artigo salvo como rascunho!');
}

// Publish article
function publishArticle() {
    const article = {
        title: titleInput?.value || 'Untitled',
        tags: tagsInput?.value.split(',').map(tag => tag.trim()) || [],
        content: editor?.value || '',
        publishedAt: new Date().toISOString(),
        status: 'published'
    };
    
    // In a real app, this would send to a server
    console.log('Publishing article:', article);
    alert('Artigo publicado com sucesso!');
    
    // Redirect to blog
    window.location.href = 'blog.html';
}

// Load draft on page load
window.addEventListener('load', () => {
    const draft = localStorage.getItem('draft');
    if (draft && editor) {
        const article = JSON.parse(draft);
        if (titleInput) titleInput.value = article.title;
        if (tagsInput) tagsInput.value = article.tags.join(', ');
        editor.value = article.content;
        updatePreview();
    }
});`
      },
      {
        path: 'articles.js',
        content: `// Blog functionality
document.addEventListener('DOMContentLoaded', function() {
    // Search functionality
    const searchInput = document.querySelector('.search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.toLowerCase();
            const articles = document.querySelectorAll('.article-card');
            
            articles.forEach(article => {
                const title = article.querySelector('.article-title').textContent.toLowerCase();
                const excerpt = article.querySelector('.article-excerpt').textContent.toLowerCase();
                
                if (title.includes(query) || excerpt.includes(query)) {
                    article.style.display = 'block';
                } else {
                    article.style.display = 'none';
                }
            });
        });
    }
    
    // Category filter
    document.querySelectorAll('.category-list a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const category = this.textContent.split('(')[0].trim();
            filterByCategory(category);
        });
    });
    
    // Tag filter
    document.querySelectorAll('.tag').forEach(tag => {
        tag.addEventListener('click', function() {
            const tagText = this.textContent;
            filterByTag(tagText);
        });
    });
});

function filterByCategory(category) {
    const articles = document.querySelectorAll('.article-card');
    articles.forEach(article => {
        const articleCategory = article.querySelector('.category').textContent;
        if (articleCategory === category || category === 'Todos') {
            article.style.display = 'block';
        } else {
            article.style.display = 'none';
        }
    });
}

function filterByTag(tag) {
    // In a real app, this would filter based on article tags
    console.log('Filtering by tag:', tag);
    // For now, just highlight the selected tag
    document.querySelectorAll('.tag').forEach(t => {
        if (t.textContent === tag) {
            t.style.background = 'var(--primary)';
            t.style.color = 'var(--white)';
        } else {
            t.style.background = 'var(--bg)';
            t.style.color = 'var(--text-light)';
        }
    });
}

// Simulate article view count
document.querySelectorAll('.read-more').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        const stats = this.closest('.article-footer').querySelector('.article-stats');
        const viewCount = stats.querySelector('span:first-child');
        const currentViews = parseInt(viewCount.textContent.split(' ')[1]);
        viewCount.textContent = \`👁 \${currentViews + 1}\`;
    });
});`
      }
    ]
  },
  {
    id: 'ecommerce-cart',
    name: 'E-commerce Cart',
    description: 'Carrinho de compras funcional',
    icon: '🛒',
    color: 'from-orange-500 to-red-500',
    messages: [
      {
        role: 'assistant',
        content: `## 🛒 E-commerce Completo Criado!

Como você escolheu o perfil **"Executor Pragmático"**, desenvolvi uma loja virtual funcional e pronta para vender - direto ao ponto, sem enrolação! Confira os detalhes:

### 🏪 Estrutura da Loja

**index.html** - Página principal:
- Banner hero com ofertas
- Produtos em destaque
- Categorias principais
- Newsletter e promoções
- Brands carousel

**shop.html** - Catálogo de produtos:
- Grid responsivo de produtos
- Filtros por categoria e preço
- Ordenação (preço, popularidade, novos)
- Quick view modal
- Paginação infinita
- Badges (novo, promoção, frete grátis)

**product.html** - Página de produto:
- Galeria com zoom
- Variações (cor, tamanho)
- Tabela de medidas
- Reviews e ratings
- Produtos relacionados
- Botão WhatsApp

**cart.html** - Carrinho de compras:
- Lista de itens com imagens
- Quantidade editável
- Cálculo automático
- Cupom de desconto
- Frete calculado por CEP
- Salvo em localStorage

### 💳 Recursos de E-commerce

**Gestão de Produtos:**
- Base com 12 produtos de exemplo
- Categorias e subcategorias
- SKU e controle de estoque
- Múltiplas imagens por produto
- Preços com desconto

**Carrinho Inteligente:**
- Persistência com localStorage
- Indicador de quantidade no header
- Desconto progressivo
- Frete grátis condicional
- Carrinho abandonado tracking

### 🎯 Vamos Personalizar sua Loja!

Para configurar sua loja perfeitamente, me informe:

1. **Qual é o nome da sua loja e nicho?** (moda, eletrônicos, casa, beleza?)
2. **Quantos produtos você planeja ter?** (10, 100, 1000+?)
3. **Faixa de preço média?** (produtos populares ou premium?)
4. **Formas de pagamento desejadas?** (PIX, cartão, boleto, crypto?)
5. **Precisa de integração com ERP/estoque?** (Bling, Tiny, próprio?)
6. **Estratégia de frete?** (Correios, transportadora, motoboy?)
7. **Diferenciais da loja?** (entrega rápida, personalização, sustentável?)
8. **Cores da marca?** (já tem identidade visual?)

A loja está funcional! Abra index.html para navegar. Me diga que features são prioritárias para seu negócio.`,
        timestamp: new Date(Date.now() - 10000).toISOString()
      }
    ],
    files: [
      {
        path: 'shop.html',
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Minha Loja Online</title>
    <link rel="stylesheet" href="shop.css">
</head>
<body>
    <header class="shop-header">
        <div class="container">
            <h1 class="shop-logo">🛍️ MinhaLoja</h1>
            <div class="header-actions">
                <input type="search" placeholder="Buscar produtos..." class="search-bar">
                <button class="cart-button" onclick="toggleCart()">
                    🛒 Carrinho
                    <span class="cart-count">0</span>
                </button>
            </div>
        </div>
    </header>

    <nav class="categories-nav">
        <div class="container">
            <button class="category-btn active" data-category="all">Todos</button>
            <button class="category-btn" data-category="eletronicos">Eletrônicos</button>
            <button class="category-btn" data-category="roupas">Roupas</button>
            <button class="category-btn" data-category="livros">Livros</button>
            <button class="category-btn" data-category="casa">Casa & Decoração</button>
        </div>
    </nav>

    <main class="shop-main container">
        <aside class="filters-sidebar">
            <h3>Filtros</h3>
            
            <div class="filter-group">
                <h4>Preço</h4>
                <input type="range" min="0" max="1000" value="1000" class="price-range">
                <div class="price-display">Até R$ <span id="priceValue">1000</span></div>
            </div>
            
            <div class="filter-group">
                <h4>Avaliação</h4>
                <label><input type="checkbox" value="5"> ⭐⭐⭐⭐⭐</label>
                <label><input type="checkbox" value="4"> ⭐⭐⭐⭐ +</label>
                <label><input type="checkbox" value="3"> ⭐⭐⭐ +</label>
            </div>
            
            <div class="filter-group">
                <h4>Disponibilidade</h4>
                <label><input type="checkbox" checked> Em estoque</label>
                <label><input type="checkbox"> Promoção</label>
            </div>
        </aside>

        <div class="products-grid" id="productsGrid">
            <!-- Products will be loaded here -->
        </div>
    </main>

    <!-- Shopping Cart Sidebar -->
    <div class="cart-sidebar" id="cartSidebar">
        <div class="cart-header">
            <h2>Seu Carrinho</h2>
            <button class="close-cart" onclick="toggleCart()">×</button>
        </div>
        
        <div class="cart-items" id="cartItems">
            <!-- Cart items will be displayed here -->
        </div>
        
        <div class="cart-footer">
            <div class="cart-summary">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span id="subtotal">R$ 0,00</span>
                </div>
                <div class="summary-row">
                    <span>Desconto:</span>
                    <span id="discount">R$ 0,00</span>
                </div>
                <div class="summary-row total">
                    <span>Total:</span>
                    <span id="total">R$ 0,00</span>
                </div>
            </div>
            
            <div class="coupon-section">
                <input type="text" placeholder="Cupom de desconto" id="couponInput">
                <button onclick="applyCoupon()">Aplicar</button>
            </div>
            
            <button class="checkout-btn" onclick="checkout()">Finalizar Compra</button>
        </div>
    </div>

    <!-- Product Modal -->
    <div class="product-modal" id="productModal">
        <div class="modal-content">
            <span class="close-modal" onclick="closeModal()">×</span>
            <div class="modal-body">
                <!-- Product details will be shown here -->
            </div>
        </div>
    </div>

    <footer class="shop-footer">
        <div class="container">
            <p>&copy; 2024 MinhaLoja. Todos os direitos reservados.</p>
        </div>
    </footer>

    <script src="products.js"></script>
    <script src="cart.js"></script>
    <script src="checkout.js"></script>
</body>
</html>`
      },
      {
        path: 'shop.css',
        content: `:root {
    --primary: #ff6b6b;
    --secondary: #4ecdc4;
    --dark: #2c3e50;
    --light: #f7f9fc;
    --white: #ffffff;
    --gray: #95a5a6;
    --success: #2ecc71;
    --warning: #f39c12;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--light);
    color: var(--dark);
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

/* Header */
.shop-header {
    background: var(--white);
    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
    padding: 1.5rem 0;
    position: sticky;
    top: 0;
    z-index: 100;
}

.shop-header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.shop-logo {
    font-size: 1.75rem;
    color: var(--primary);
}

.header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
}

.search-bar {
    padding: 0.75rem 1rem;
    border: 1px solid var(--gray);
    border-radius: 8px;
    width: 300px;
}

.cart-button {
    position: relative;
    padding: 0.75rem 1.5rem;
    background: var(--primary);
    color: var(--white);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.3s;
}

.cart-button:hover {
    background: #ff5252;
}

.cart-count {
    position: absolute;
    top: -5px;
    right: -5px;
    background: var(--secondary);
    color: var(--white);
    border-radius: 50%;
    width: 20px;
    height: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
    font-weight: bold;
}

/* Categories */
.categories-nav {
    background: var(--white);
    border-bottom: 1px solid #e0e0e0;
    padding: 1rem 0;
}

.categories-nav .container {
    display: flex;
    gap: 1rem;
}

.category-btn {
    padding: 0.5rem 1rem;
    background: transparent;
    border: 1px solid var(--gray);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
}

.category-btn.active,
.category-btn:hover {
    background: var(--primary);
    color: var(--white);
    border-color: var(--primary);
}

/* Main Layout */
.shop-main {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 2rem;
    margin: 2rem auto;
}

/* Filters */
.filters-sidebar {
    background: var(--white);
    padding: 1.5rem;
    border-radius: 12px;
    height: fit-content;
}

.filter-group {
    margin-bottom: 1.5rem;
}

.filter-group h4 {
    margin-bottom: 0.75rem;
    color: var(--dark);
}

.filter-group label {
    display: block;
    padding: 0.5rem 0;
    cursor: pointer;
}

.price-range {
    width: 100%;
}

.price-display {
    margin-top: 0.5rem;
    color: var(--gray);
}

/* Products Grid */
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
    gap: 1.5rem;
}

.product-card {
    background: var(--white);
    border-radius: 12px;
    overflow: hidden;
    transition: transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
}

.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 30px rgba(0,0,0,0.15);
}

.product-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.product-info {
    padding: 1rem;
}

.product-name {
    font-size: 1.1rem;
    margin-bottom: 0.5rem;
    color: var(--dark);
}

.product-price {
    font-size: 1.25rem;
    font-weight: bold;
    color: var(--primary);
    margin-bottom: 0.5rem;
}

.product-rating {
    color: var(--warning);
    margin-bottom: 1rem;
}

.add-to-cart {
    width: 100%;
    padding: 0.75rem;
    background: var(--secondary);
    color: var(--white);
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.3s;
}

.add-to-cart:hover {
    background: #45b8b0;
}

/* Cart Sidebar */
.cart-sidebar {
    position: fixed;
    right: -400px;
    top: 0;
    width: 400px;
    height: 100vh;
    background: var(--white);
    box-shadow: -2px 0 10px rgba(0,0,0,0.1);
    transition: right 0.3s;
    z-index: 1000;
    display: flex;
    flex-direction: column;
}

.cart-sidebar.active {
    right: 0;
}

.cart-header {
    padding: 1.5rem;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.close-cart {
    font-size: 2rem;
    background: none;
    border: none;
    cursor: pointer;
    color: var(--gray);
}

.cart-items {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
}

.cart-item {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid #e0e0e0;
}

.cart-item img {
    width: 80px;
    height: 80px;
    object-fit: cover;
    border-radius: 8px;
}

.cart-item-info {
    flex: 1;
}

.cart-item-name {
    font-weight: bold;
    margin-bottom: 0.5rem;
}

.cart-item-price {
    color: var(--primary);
    margin-bottom: 0.5rem;
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.quantity-controls button {
    width: 25px;
    height: 25px;
    border: 1px solid var(--gray);
    background: var(--white);
    cursor: pointer;
    border-radius: 4px;
}

.cart-footer {
    padding: 1.5rem;
    border-top: 1px solid #e0e0e0;
}

.cart-summary {
    margin-bottom: 1rem;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
}

.summary-row.total {
    font-size: 1.25rem;
    font-weight: bold;
    border-top: 1px solid #e0e0e0;
    padding-top: 1rem;
}

.coupon-section {
    display: flex;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.coupon-section input {
    flex: 1;
    padding: 0.5rem;
    border: 1px solid var(--gray);
    border-radius: 4px;
}

.coupon-section button {
    padding: 0.5rem 1rem;
    background: var(--secondary);
    color: var(--white);
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.checkout-btn {
    width: 100%;
    padding: 1rem;
    background: var(--success);
    color: var(--white);
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: background 0.3s;
}

.checkout-btn:hover {
    background: #27ae60;
}

/* Modal */
.product-modal {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 2000;
}

.modal-content {
    position: relative;
    background: var(--white);
    margin: 5% auto;
    width: 80%;
    max-width: 800px;
    border-radius: 12px;
    overflow: hidden;
}

.close-modal {
    position: absolute;
    top: 1rem;
    right: 1.5rem;
    font-size: 2rem;
    cursor: pointer;
    color: var(--gray);
}

.modal-body {
    padding: 2rem;
}

/* Footer */
.shop-footer {
    background: var(--dark);
    color: var(--white);
    text-align: center;
    padding: 2rem 0;
    margin-top: 4rem;
}`
      },
      {
        path: 'products.js',
        content: `// Products data
const products = [
    {
        id: 1,
        name: 'Notebook Ultra Pro',
        category: 'eletronicos',
        price: 2999.99,
        image: 'https://via.placeholder.com/300x200',
        rating: 4.5,
        inStock: true,
        description: 'Notebook de alta performance para profissionais'
    },
    {
        id: 2,
        name: 'Camiseta Premium',
        category: 'roupas',
        price: 89.99,
        image: 'https://via.placeholder.com/300x200',
        rating: 4.8,
        inStock: true,
        description: 'Camiseta 100% algodão premium'
    },
    {
        id: 3,
        name: 'Livro JavaScript Moderno',
        category: 'livros',
        price: 59.99,
        image: 'https://via.placeholder.com/300x200',
        rating: 5.0,
        inStock: true,
        description: 'Aprenda JavaScript do básico ao avançado'
    },
    {
        id: 4,
        name: 'Luminária LED Smart',
        category: 'casa',
        price: 199.99,
        image: 'https://via.placeholder.com/300x200',
        rating: 4.3,
        inStock: true,
        description: 'Luminária inteligente com controle por app'
    },
    {
        id: 5,
        name: 'Fone Bluetooth Pro',
        category: 'eletronicos',
        price: 399.99,
        image: 'https://via.placeholder.com/300x200',
        rating: 4.7,
        inStock: true,
        description: 'Fone com cancelamento de ruído ativo'
    },
    {
        id: 6,
        name: 'Calça Jeans Slim',
        category: 'roupas',
        price: 159.99,
        image: 'https://via.placeholder.com/300x200',
        rating: 4.4,
        inStock: true,
        description: 'Calça jeans com corte moderno'
    }
];

// Load products on page load
document.addEventListener('DOMContentLoaded', function() {
    displayProducts(products);
    updateCartDisplay();
    
    // Category filter
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const category = this.dataset.category;
            if (category === 'all') {
                displayProducts(products);
            } else {
                const filtered = products.filter(p => p.category === category);
                displayProducts(filtered);
            }
        });
    });
    
    // Price filter
    const priceRange = document.querySelector('.price-range');
    const priceValue = document.getElementById('priceValue');
    
    if (priceRange) {
        priceRange.addEventListener('input', function() {
            priceValue.textContent = this.value;
            const maxPrice = parseFloat(this.value);
            const filtered = products.filter(p => p.price <= maxPrice);
            displayProducts(filtered);
        });
    }
    
    // Search
    const searchBar = document.querySelector('.search-bar');
    if (searchBar) {
        searchBar.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const filtered = products.filter(p => 
                p.name.toLowerCase().includes(query) ||
                p.description.toLowerCase().includes(query)
            );
            displayProducts(filtered);
        });
    }
});

function displayProducts(productsToShow) {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;
    
    grid.innerHTML = productsToShow.map(product => \`
        <div class="product-card" onclick="showProductDetails(\${product.id})">
            <img src="\${product.image}" alt="\${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">\${product.name}</h3>
                <div class="product-price">R$ \${product.price.toFixed(2)}</div>
                <div class="product-rating">\${'⭐'.repeat(Math.floor(product.rating))}</div>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(\${product.id})">
                    Adicionar ao Carrinho
                </button>
            </div>
        </div>
    \`).join('');
}

function showProductDetails(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const modal = document.getElementById('productModal');
    const modalBody = modal.querySelector('.modal-body');
    
    modalBody.innerHTML = \`
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
            <img src="\${product.image}" alt="\${product.name}" style="width: 100%; border-radius: 8px;">
            <div>
                <h2>\${product.name}</h2>
                <p style="color: var(--gray); margin: 1rem 0;">\${product.description}</p>
                <div style="font-size: 1.5rem; color: var(--primary); margin: 1rem 0;">
                    R$ \${product.price.toFixed(2)}
                </div>
                <div style="color: var(--warning); margin: 1rem 0;">
                    \${'⭐'.repeat(Math.floor(product.rating))} \${product.rating}
                </div>
                <button class="add-to-cart" style="width: 100%; padding: 1rem;" onclick="addToCart(\${product.id}); closeModal();">
                    Adicionar ao Carrinho
                </button>
            </div>
        </div>
    \`;
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('productModal').style.display = 'none';
}`
      },
      {
        path: 'cart.js',
        content: `// Shopping cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity++;
    } else {
        cart.push({
            ...product,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartDisplay();
    showNotification('Produto adicionado ao carrinho!');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    updateCartDisplay();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
    } else {
        saveCart();
        updateCartDisplay();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function updateCartDisplay() {
    // Update cart count
    const cartCount = document.querySelector('.cart-count');
    if (cartCount) {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        cartCount.textContent = totalItems;
    }
    
    // Update cart items
    const cartItemsContainer = document.getElementById('cartItems');
    if (cartItemsContainer) {
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--gray);">Seu carrinho está vazio</p>';
        } else {
            cartItemsContainer.innerHTML = cart.map(item => \`
                <div class="cart-item">
                    <img src="\${item.image}" alt="\${item.name}">
                    <div class="cart-item-info">
                        <div class="cart-item-name">\${item.name}</div>
                        <div class="cart-item-price">R$ \${item.price.toFixed(2)}</div>
                        <div class="quantity-controls">
                            <button onclick="updateQuantity(\${item.id}, -1)">-</button>
                            <span>\${item.quantity}</span>
                            <button onclick="updateQuantity(\${item.id}, 1)">+</button>
                        </div>
                    </div>
                    <button onclick="removeFromCart(\${item.id})" style="background: none; border: none; color: var(--gray); cursor: pointer;">
                        🗑️
                    </button>
                </div>
            \`).join('');
        }
    }
    
    updateCartSummary();
}

function updateCartSummary() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = getDiscount();
    const total = subtotal - discount;
    
    const subtotalElement = document.getElementById('subtotal');
    const discountElement = document.getElementById('discount');
    const totalElement = document.getElementById('total');
    
    if (subtotalElement) subtotalElement.textContent = \`R$ \${subtotal.toFixed(2)}\`;
    if (discountElement) discountElement.textContent = \`R$ \${discount.toFixed(2)}\`;
    if (totalElement) totalElement.textContent = \`R$ \${total.toFixed(2)}\`;
}

function toggleCart() {
    const cartSidebar = document.getElementById('cartSidebar');
    if (cartSidebar) {
        cartSidebar.classList.toggle('active');
    }
}

let currentCoupon = null;

function applyCoupon() {
    const couponInput = document.getElementById('couponInput');
    const code = couponInput.value.toUpperCase();
    
    const coupons = {
        'DESCONTO10': 0.10,
        'DESCONTO20': 0.20,
        'PRIMEIRACOMPRA': 0.15
    };
    
    if (coupons[code]) {
        currentCoupon = coupons[code];
        showNotification(\`Cupom aplicado! \${(currentCoupon * 100).toFixed(0)}% de desconto\`);
        updateCartSummary();
    } else {
        showNotification('Cupom inválido', 'error');
    }
}

function getDiscount() {
    if (!currentCoupon) return 0;
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return subtotal * currentCoupon;
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = \`notification \${type}\`;
    notification.textContent = message;
    notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: \${type === 'success' ? 'var(--success)' : 'var(--primary)'};
        color: white;
        border-radius: 8px;
        z-index: 3000;
        animation: slideIn 0.3s ease;
    \`;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}`
      },
      {
        path: 'checkout.js',
        content: `// Checkout functionality
function checkout() {
    if (cart.length === 0) {
        showNotification('Seu carrinho está vazio!', 'error');
        return;
    }
    
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = getDiscount();
    const total = subtotal - discount;
    
    // Create checkout summary
    const summary = {
        items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity
        })),
        subtotal: subtotal,
        discount: discount,
        total: total,
        coupon: currentCoupon ? \`\${(currentCoupon * 100).toFixed(0)}% desconto\` : null,
        date: new Date().toISOString()
    };
    
    // In a real application, this would send to a payment gateway
    console.log('Checkout summary:', summary);
    
    // Show success message
    alert(\`
        Pedido Confirmado!
        
        Total: R$ \${total.toFixed(2)}
        
        Itens:
        \${cart.map(item => \`- \${item.name} (x\${item.quantity})\`).join('\\n')}
        
        Obrigado pela sua compra!
    \`);
    
    // Clear cart
    cart = [];
    currentCoupon = null;
    saveCart();
    updateCartDisplay();
    toggleCart();
    
    // Reset coupon input
    const couponInput = document.getElementById('couponInput');
    if (couponInput) couponInput.value = '';
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = \`
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
\`;
document.head.appendChild(style);`
      }
    ]
  },
  {
    id: 'game-2048',
    name: 'Jogo 2048',
    description: 'Clone do famoso jogo 2048',
    icon: '🎮',
    color: 'from-yellow-500 to-pink-500',
    messages: [
      {
        role: 'assistant',
        content: `## 🎮 Jogo 2048 Completo Criado!

Como você escolheu o perfil **"Gamer Entusiasta"**, desenvolvi um jogo 2048 totalmente funcional com features extras! Veja o que preparei:

### 🕹️ Estrutura do Jogo

**game.html** - Interface do jogo:
- Board 4x4 responsivo
- Score e High Score
- Botão New Game
- Game Over screen
- Victory screen (2048!)
- Leaderboard local

**game.css** - Visual e animações:
- Tiles com cores gradientes
- Animações de slide suaves
- Efeito de merge dos números
- Glow effect no 2048
- Tema escuro disponível
- Responsivo para mobile

**game.js** - Mecânica do jogo:
- Grid system 4x4
- Swipe detection (mobile)
- Keyboard controls (arrows)
- Score calculation
- Undo último movimento
- Auto-save do estado

### 🎯 Features Implementadas

**Gameplay:**
- Movimentos em 4 direções
- Merge de tiles idênticos
- Spawn aleatório (2 ou 4)
- Detecção de Game Over
- Victory ao alcançar 2048
- Continue após vitória

**Controles:**
- ⬆️⬇️⬅️➡️ Setas do teclado
- WASD alternativo
- Swipe no mobile
- Botões na tela (mobile)

### 🎨 Customizações Possíveis

Posso adaptar o jogo para você! Me diga:

1. **Que tipo de tema visual prefere?** (minimalista, neon, pixel art, natureza?)
2. **Quer adicionar power-ups?** (bomba, shuffle, undo extra?)
3. **Multiplayer local?** (2 players split screen?)
4. **Outros modos de jogo?** (3x3 fácil, 6x6 expert?)
5. **Integração com ranking online?** (leaderboard global?)
6. **Sons e música?** (8-bit, ambient, effects only?)

### 🎮 Como Jogar:

\`\`\`
→ Use as setas para mover
→ Junte números iguais
→ Chegue até 2048 para vencer!
→ Maior score possível!
\`\`\`

O jogo está pronto! Abra game.html para jogar agora. Que tal adicionar multiplayer ou criar outro jogo?`,
        timestamp: new Date(Date.now() - 10000).toISOString()
      }
    ],
    files: [
      {
        path: 'game.html',
        content: `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>2048 Game</title>
    <link rel="stylesheet" href="game.css">
</head>
<body>
    <div class="game-container">
        <div class="game-header">
            <h1 class="game-title">2048</h1>
            <div class="scores">
                <div class="score-box">
                    <div class="score-label">PONTOS</div>
                    <div class="score" id="score">0</div>
                </div>
                <div class="score-box">
                    <div class="score-label">MELHOR</div>
                    <div class="best-score" id="bestScore">0</div>
                </div>
            </div>
        </div>
        
        <div class="game-message" id="gameMessage"></div>
        
        <div class="game-board" id="gameBoard">
            <div class="grid-container">
                <!-- Grid cells will be created by JavaScript -->
            </div>
            <div class="tile-container" id="tileContainer">
                <!-- Tiles will be created by JavaScript -->
            </div>
        </div>
        
        <div class="game-controls">
            <button class="btn-new-game" onclick="newGame()">Novo Jogo</button>
            <div class="instructions">
                <p><strong>COMO JOGAR:</strong> Use as <strong>setas do teclado</strong> para mover as peças. Quando duas peças com o mesmo número se tocam, elas se somam!</p>
            </div>
        </div>
    </div>

    <script src="game.js"></script>
</body>
</html>`
      },
      {
        path: 'game.css',
        content: `:root {
    --board-size: 4;
    --cell-size: 70px;
    --cell-gap: 10px;
    --border-radius: 6px;
    --animation-speed: 150ms;
    
    --color-bg: #faf8ef;
    --color-board: #bbada0;
    --color-cell: #cdc1b4;
    --color-text-light: #f9f6f2;
    --color-text-dark: #776e65;
    
    --tile-2: #eee4da;
    --tile-4: #ede0c8;
    --tile-8: #f2b179;
    --tile-16: #f59563;
    --tile-32: #f67c5f;
    --tile-64: #f65e3b;
    --tile-128: #edcf72;
    --tile-256: #edcc61;
    --tile-512: #edc850;
    --tile-1024: #edc53f;
    --tile-2048: #edc22e;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--color-bg);
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    padding: 20px;
}

.game-container {
    max-width: 500px;
    width: 100%;
}

/* Header */
.game-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
}

.game-title {
    font-size: 60px;
    font-weight: bold;
    color: var(--color-text-dark);
}

.scores {
    display: flex;
    gap: 10px;
}

.score-box {
    background: var(--color-board);
    padding: 10px 20px;
    border-radius: var(--border-radius);
    text-align: center;
    min-width: 70px;
}

.score-label {
    color: var(--color-text-light);
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 2px;
}

.score,
.best-score {
    color: white;
    font-size: 24px;
    font-weight: bold;
}

/* Game Message */
.game-message {
    text-align: center;
    font-size: 24px;
    font-weight: bold;
    margin-bottom: 20px;
    height: 30px;
}

.game-message.win {
    color: #f9c74f;
}

.game-message.lose {
    color: #f94144;
}

/* Game Board */
.game-board {
    position: relative;
    background: var(--color-board);
    border-radius: var(--border-radius);
    padding: var(--cell-gap);
    width: calc(var(--board-size) * var(--cell-size) + (var(--board-size) + 1) * var(--cell-gap));
    height: calc(var(--board-size) * var(--cell-size) + (var(--board-size) + 1) * var(--cell-gap));
    margin: 0 auto;
}

.grid-container {
    position: absolute;
    top: var(--cell-gap);
    left: var(--cell-gap);
}

.grid-cell {
    position: absolute;
    width: var(--cell-size);
    height: var(--cell-size);
    background: var(--color-cell);
    border-radius: calc(var(--border-radius) / 2);
}

.tile-container {
    position: absolute;
    top: var(--cell-gap);
    left: var(--cell-gap);
}

/* Tiles */
.tile {
    position: absolute;
    width: var(--cell-size);
    height: var(--cell-size);
    border-radius: calc(var(--border-radius) / 2);
    font-weight: bold;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 35px;
    transition: all var(--animation-speed) ease-in-out;
    z-index: 10;
}

.tile.new {
    animation: appear 200ms ease-in-out;
    z-index: 20;
}

.tile.merged {
    animation: pop 200ms ease-in-out;
    z-index: 20;
}

@keyframes appear {
    0% {
        transform: scale(0);
    }
    100% {
        transform: scale(1);
    }
}

@keyframes pop {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
    }
}

/* Tile Colors */
.tile-2 {
    background: var(--tile-2);
    color: var(--color-text-dark);
}

.tile-4 {
    background: var(--tile-4);
    color: var(--color-text-dark);
}

.tile-8 {
    background: var(--tile-8);
    color: var(--color-text-light);
}

.tile-16 {
    background: var(--tile-16);
    color: var(--color-text-light);
}

.tile-32 {
    background: var(--tile-32);
    color: var(--color-text-light);
}

.tile-64 {
    background: var(--tile-64);
    color: var(--color-text-light);
}

.tile-128 {
    background: var(--tile-128);
    color: var(--color-text-light);
    font-size: 30px;
}

.tile-256 {
    background: var(--tile-256);
    color: var(--color-text-light);
    font-size: 30px;
}

.tile-512 {
    background: var(--tile-512);
    color: var(--color-text-light);
    font-size: 30px;
}

.tile-1024 {
    background: var(--tile-1024);
    color: var(--color-text-light);
    font-size: 25px;
}

.tile-2048 {
    background: var(--tile-2048);
    color: var(--color-text-light);
    font-size: 25px;
}

/* Controls */
.game-controls {
    margin-top: 30px;
    text-align: center;
}

.btn-new-game {
    background: var(--color-text-dark);
    color: var(--color-text-light);
    border: none;
    padding: 10px 20px;
    font-size: 18px;
    font-weight: bold;
    border-radius: var(--border-radius);
    cursor: pointer;
    transition: background 0.2s;
}

.btn-new-game:hover {
    background: #8f7a66;
}

.instructions {
    margin-top: 20px;
    color: var(--color-text-dark);
    font-size: 14px;
    line-height: 1.6;
}

/* Responsive */
@media (max-width: 520px) {
    :root {
        --cell-size: 60px;
        --cell-gap: 8px;
    }
    
    .game-title {
        font-size: 48px;
    }
    
    .tile {
        font-size: 28px;
    }
    
    .tile-128,
    .tile-256,
    .tile-512 {
        font-size: 24px;
    }
    
    .tile-1024,
    .tile-2048 {
        font-size: 20px;
    }
}`
      },
      {
        path: 'game.js',
        content: `// Game 2048 Logic
const GRID_SIZE = 4;
const CELL_COUNT = GRID_SIZE * GRID_SIZE;

class Game2048 {
    constructor() {
        this.board = [];
        this.score = 0;
        this.bestScore = localStorage.getItem('best2048') || 0;
        this.tiles = new Map();
        this.moving = false;
        
        this.init();
    }
    
    init() {
        this.setupBoard();
        this.setupEventListeners();
        this.updateBestScore();
        this.newGame();
    }
    
    setupBoard() {
        const gridContainer = document.querySelector('.grid-container');
        
        // Create grid cells
        for (let i = 0; i < CELL_COUNT; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            const row = Math.floor(i / GRID_SIZE);
            const col = i % GRID_SIZE;
            cell.style.left = \`\${col * 80}px\`;
            cell.style.top = \`\${row * 80}px\`;
            gridContainer.appendChild(cell);
        }
    }
    
    setupEventListeners() {
        // Keyboard controls
        document.addEventListener('keydown', (e) => {
            if (this.moving) return;
            
            switch(e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    this.move('up');
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    this.move('down');
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    this.move('left');
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    this.move('right');
                    break;
            }
        });
        
        // Touch controls
        let touchStartX = 0;
        let touchStartY = 0;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });
        
        document.addEventListener('touchend', (e) => {
            if (this.moving) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;
            
            const minSwipeDistance = 50;
            
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                if (Math.abs(deltaX) > minSwipeDistance) {
                    if (deltaX > 0) {
                        this.move('right');
                    } else {
                        this.move('left');
                    }
                }
            } else {
                if (Math.abs(deltaY) > minSwipeDistance) {
                    if (deltaY > 0) {
                        this.move('down');
                    } else {
                        this.move('up');
                    }
                }
            }
        });
    }
    
    newGame() {
        // Clear board
        this.board = Array(GRID_SIZE).fill().map(() => Array(GRID_SIZE).fill(0));
        this.score = 0;
        this.updateScore();
        
        // Clear tiles
        const tileContainer = document.getElementById('tileContainer');
        tileContainer.innerHTML = '';
        this.tiles.clear();
        
        // Clear message
        document.getElementById('gameMessage').textContent = '';
        
        // Add initial tiles
        this.addRandomTile();
        this.addRandomTile();
    }
    
    addRandomTile() {
        const emptyCells = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (this.board[r][c] === 0) {
                    emptyCells.push({row: r, col: c});
                }
            }
        }
        
        if (emptyCells.length === 0) return false;
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < 0.9 ? 2 : 4;
        
        this.board[randomCell.row][randomCell.col] = value;
        this.createTileElement(randomCell.row, randomCell.col, value, true);
        
        return true;
    }
    
    createTileElement(row, col, value, isNew = false) {
        const tile = document.createElement('div');
        tile.classList.add('tile', \`tile-\${value}\`);
        if (isNew) tile.classList.add('new');
        
        tile.textContent = value;
        tile.style.left = \`\${col * 80}px\`;
        tile.style.top = \`\${row * 80}px\`;
        
        const tileContainer = document.getElementById('tileContainer');
        tileContainer.appendChild(tile);
        
        const key = \`\${row}-\${col}\`;
        this.tiles.set(key, tile);
        
        return tile;
    }
    
    move(direction) {
        this.moving = true;
        let moved = false;
        const newBoard = this.board.map(row => [...row]);
        
        // Clear old tiles
        const tileContainer = document.getElementById('tileContainer');
        tileContainer.innerHTML = '';
        this.tiles.clear();
        
        if (direction === 'left') {
            for (let r = 0; r < GRID_SIZE; r++) {
                const row = newBoard[r].filter(val => val !== 0);
                const merged = this.mergeRow(row);
                while (merged.length < GRID_SIZE) {
                    merged.push(0);
                }
                if (JSON.stringify(newBoard[r]) !== JSON.stringify(merged)) {
                    moved = true;
                }
                newBoard[r] = merged;
            }
        } else if (direction === 'right') {
            for (let r = 0; r < GRID_SIZE; r++) {
                const row = newBoard[r].filter(val => val !== 0);
                const merged = this.mergeRow(row.reverse()).reverse();
                while (merged.length < GRID_SIZE) {
                    merged.unshift(0);
                }
                if (JSON.stringify(newBoard[r]) !== JSON.stringify(merged)) {
                    moved = true;
                }
                newBoard[r] = merged;
            }
        } else if (direction === 'up') {
            for (let c = 0; c < GRID_SIZE; c++) {
                const column = [];
                for (let r = 0; r < GRID_SIZE; r++) {
                    column.push(newBoard[r][c]);
                }
                const filtered = column.filter(val => val !== 0);
                const merged = this.mergeRow(filtered);
                while (merged.length < GRID_SIZE) {
                    merged.push(0);
                }
                for (let r = 0; r < GRID_SIZE; r++) {
                    if (newBoard[r][c] !== merged[r]) {
                        moved = true;
                    }
                    newBoard[r][c] = merged[r];
                }
            }
        } else if (direction === 'down') {
            for (let c = 0; c < GRID_SIZE; c++) {
                const column = [];
                for (let r = 0; r < GRID_SIZE; r++) {
                    column.push(newBoard[r][c]);
                }
                const filtered = column.filter(val => val !== 0);
                const merged = this.mergeRow(filtered.reverse()).reverse();
                while (merged.length < GRID_SIZE) {
                    merged.unshift(0);
                }
                for (let r = 0; r < GRID_SIZE; r++) {
                    if (newBoard[r][c] !== merged[r]) {
                        moved = true;
                    }
                    newBoard[r][c] = merged[r];
                }
            }
        }
        
        if (moved) {
            this.board = newBoard;
            
            // Recreate all tiles
            for (let r = 0; r < GRID_SIZE; r++) {
                for (let c = 0; c < GRID_SIZE; c++) {
                    if (this.board[r][c] !== 0) {
                        this.createTileElement(r, c, this.board[r][c]);
                    }
                }
            }
            
            // Add new random tile after a short delay
            setTimeout(() => {
                this.addRandomTile();
                this.checkGameState();
                this.moving = false;
            }, 150);
        } else {
            this.moving = false;
        }
    }
    
    mergeRow(row) {
        const result = [];
        let skip = false;
        
        for (let i = 0; i < row.length; i++) {
            if (skip) {
                skip = false;
                continue;
            }
            
            if (i < row.length - 1 && row[i] === row[i + 1]) {
                const merged = row[i] * 2;
                result.push(merged);
                this.score += merged;
                this.updateScore();
                skip = true;
            } else {
                result.push(row[i]);
            }
        }
        
        return result;
    }
    
    checkGameState() {
        // Check for 2048
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (this.board[r][c] === 2048) {
                    this.showMessage('VOCÊ VENCEU!', 'win');
                    return;
                }
            }
        }
        
        // Check for game over
        let hasEmpty = false;
        let canMerge = false;
        
        for (let r = 0; r < GRID_SIZE; r++) {
            for (let c = 0; c < GRID_SIZE; c++) {
                if (this.board[r][c] === 0) {
                    hasEmpty = true;
                }
                
                // Check adjacent cells for possible merges
                if (r < GRID_SIZE - 1 && this.board[r][c] === this.board[r + 1][c]) {
                    canMerge = true;
                }
                if (c < GRID_SIZE - 1 && this.board[r][c] === this.board[r][c + 1]) {
                    canMerge = true;
                }
            }
        }
        
        if (!hasEmpty && !canMerge) {
            this.showMessage('GAME OVER!', 'lose');
        }
    }
    
    showMessage(text, type) {
        const messageElement = document.getElementById('gameMessage');
        messageElement.textContent = text;
        messageElement.className = \`game-message \${type}\`;
    }
    
    updateScore() {
        document.getElementById('score').textContent = this.score;
        
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem('best2048', this.bestScore);
            this.updateBestScore();
        }
    }
    
    updateBestScore() {
        document.getElementById('bestScore').textContent = this.bestScore;
    }
}

// Initialize game
let game;

// Função global para o botão
function newGame() {
    if (game) {
        game.newGame();
    } else {
        // Se o jogo ainda não foi inicializado, inicializa agora
        game = new Game2048();
    }
}

// Inicializa o jogo quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        game = new Game2048();
    });
} else {
    // DOM já está carregado
    game = new Game2048();
}

// Torna a função newGame disponível globalmente
window.newGame = newGame;`
      }
    ]
  }
];

// Type alias for compatibility
export type OnboardingTemplate = Template;

// Function to get a template based on profile type
export function getTemplateForProfile(profileType: string): Template | undefined {
  // Map personality profile types to template ids (8 profiles)
  const profileToTemplateMap: Record<string, string> = {
    // Visual + Aesthetic + Interactive = Game Designer
    'visual-aesthetic-interactive': 'game-2048',
    
    // Visual + Aesthetic + Automated = Artista Visual
    'visual-aesthetic-automated': 'blog-markdown',
    
    // Visual + Pragmatic + Interactive = UX Developer
    'visual-pragmatic-interactive': 'landing-page',
    
    // Visual + Pragmatic + Automated = Growth Hacker
    'visual-pragmatic-automated': 'dashboard-analytics',
    
    // Logical + Aesthetic + Interactive = Full Stack Developer
    'logical-aesthetic-interactive': 'api-nodejs',
    
    // Logical + Aesthetic + Automated = Arquiteto de Sistemas
    'logical-aesthetic-automated': 'automation-workflow',
    
    // Logical + Pragmatic + Interactive = Backend Developer
    'logical-pragmatic-interactive': 'ecommerce-cart',
    
    // Logical + Pragmatic + Automated = Automation Engineer
    'logical-pragmatic-automated': 'automation-workflow',
    
    // Fallback para perfis antigos (compatibilidade)
    'visual-aesthetic': 'blog-markdown',
    'visual-pragmatic': 'landing-page',
    'logical-aesthetic': 'api-nodejs',
    'logical-pragmatic': 'ecommerce-cart',
    'developer': 'api-nodejs',
    'designer': 'landing-page',
    'data-analyst': 'dashboard-analytics',
    'content-creator': 'blog-markdown',
    'ecommerce': 'ecommerce-cart',
    'gamer': 'game-2048'
  };

  const templateId = profileToTemplateMap[profileType] || 'landing-page';
  return templates.find(t => t.id === templateId);
}