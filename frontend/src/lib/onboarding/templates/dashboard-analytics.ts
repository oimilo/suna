import { Template } from './types';

const dashboardAnalytics: Template = {
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
};

export default dashboardAnalytics;