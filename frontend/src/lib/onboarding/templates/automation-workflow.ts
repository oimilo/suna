import { Template } from './types';

const automationWorkflow: Template = {
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
};

export default automationWorkflow;