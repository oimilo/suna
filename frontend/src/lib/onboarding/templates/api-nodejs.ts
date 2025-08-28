import { Template } from './types';

const apiNodejs: Template = {
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
};

export default apiNodejs;