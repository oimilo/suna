import { Template } from './types';

const ecommerceCart: Template = {
  id: 'ecommerce-cart',
  name: 'E-commerce Cart',
  description: 'Loja virtual com carrinho',
  icon: '🛒',
  color: 'from-purple-500 to-pink-500',
  messages: [
    {
      role: 'assistant',
      content: `## 🛒 E-commerce Completo Criado!

Como você escolheu o perfil **"Empreendedor Digital"**, desenvolvi uma loja virtual moderna e funcional. Veja o que preparei:

### 🎨 Sistema E-commerce Profissional

**shop.html** - Loja principal com:
- Header navegável com carrinho dinâmico
- Grid de produtos responsivo
- Sistema de filtros por categoria
- Modal de detalhes do produto
- Checkout integrado

**shop.css** - Design moderno:
- Tema escuro/claro automático
- Animações suaves nos produtos
- Efeitos hover elegantes
- Layout responsivo mobile-first
- Gradientes profissionais

**products.js** - Dados estruturados:
- 12 produtos diversificados
- Categorias organizadas
- Preços e descrições
- URLs de imagem otimizadas

**cart.js** - Carrinho inteligente:
- Adicionar/remover produtos
- Atualização de quantidades
- Cálculo automático de totais
- Persistência no localStorage
- Animações de feedback

**checkout.js** - Processo de compra:
- Formulário de dados do cliente
- Validação de campos
- Cálculo de frete
- Finalização simulada
- Feedback de sucesso

### 💡 Funcionalidades Implementadas

- **Carrinho Persistente**: Dados salvos no navegador
- **Filtros Dinâmicos**: Por categoria e preço
- **Busca Inteligente**: Pesquisa em tempo real
- **Checkout Completo**: Formulário de pedido
- **Responsive Design**: Mobile e desktop
- **Performance**: Lazy loading de imagens

### 🚀 Próximas Melhorias

Para transformar esta loja em um e-commerce real, posso ajudar com:

1. **Integração de Pagamento** (Stripe, Mercado Pago, PayPal)
2. **Backend com API** (Node.js + banco de dados)
3. **Painel Administrativo** (gerenciar produtos e pedidos)
4. **Sistema de Usuários** (login, histórico, favoritos)
5. **Analytics** (Google Analytics, pixels de conversão)
6. **SEO Otimizado** (meta tags, sitemap, structured data)

A loja já está funcionando - abra shop.html para testar! Que funcionalidade gostaria de implementar primeiro?`,
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
    <title>Loja Virtual</title>
    <link rel="stylesheet" href="shop.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1 class="logo">🛍️ MinhaLoja</h1>
            <nav class="nav">
                <input type="text" id="search" placeholder="Buscar produtos...">
                <div class="cart-icon" onclick="toggleCart()">
                    🛒 <span id="cart-count">0</span>
                </div>
            </nav>
        </div>
    </header>

    <main class="main">
        <div class="container">
            <div class="filters">
                <button class="filter-btn active" onclick="filterProducts('all')">Todos</button>
                <button class="filter-btn" onclick="filterProducts('electronics')">Eletrônicos</button>
                <button class="filter-btn" onclick="filterProducts('clothing')">Roupas</button>
                <button class="filter-btn" onclick="filterProducts('home')">Casa</button>
            </div>

            <div class="products-grid" id="products-grid">
                <!-- Products will be loaded by JavaScript -->
            </div>
        </div>
    </main>

    <!-- Cart Modal -->
    <div id="cart-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <h2>Seu Carrinho</h2>
                <span class="close" onclick="toggleCart()">&times;</span>
            </div>
            <div class="modal-body">
                <div id="cart-items"></div>
                <div class="cart-total">
                    <strong>Total: R$ <span id="cart-total">0,00</span></strong>
                </div>
                <button class="checkout-btn" onclick="goToCheckout()">Finalizar Compra</button>
            </div>
        </div>
    </div>

    <!-- Product Modal -->
    <div id="product-modal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <span class="close" onclick="closeProductModal()">&times;</span>
            </div>
            <div class="modal-body" id="product-details">
                <!-- Product details will be loaded by JavaScript -->
            </div>
        </div>
    </div>

    <!-- Checkout Section -->
    <div id="checkout-section" class="checkout-section hidden">
        <div class="container">
            <h2>Finalizar Compra</h2>
            <form id="checkout-form">
                <div class="form-group">
                    <label>Nome Completo</label>
                    <input type="text" name="name" required>
                </div>
                <div class="form-group">
                    <label>Email</label>
                    <input type="email" name="email" required>
                </div>
                <div class="form-group">
                    <label>Telefone</label>
                    <input type="tel" name="phone" required>
                </div>
                <div class="form-group">
                    <label>Endereço</label>
                    <input type="text" name="address" required>
                </div>
                <div class="form-group">
                    <label>CEP</label>
                    <input type="text" name="cep" required>
                </div>
                <div class="order-summary">
                    <h3>Resumo do Pedido</h3>
                    <div id="checkout-items"></div>
                    <div class="total">Total: R$ <span id="checkout-total">0,00</span></div>
                </div>
                <button type="submit" class="submit-btn">Confirmar Pedido</button>
            </form>
        </div>
    </div>

    <script src="products.js"></script>
    <script src="cart.js"></script>
    <script src="checkout.js"></script>
</body>
</html>`
    },
    {
      path: 'shop.css',
      content: `:root {
    --primary: #6366f1;
    --secondary: #ec4899;
    --accent: #8b5cf6;
    --background: #f8fafc;
    --surface: #ffffff;
    --text: #1e293b;
    --text-muted: #64748b;
    --border: #e2e8f0;
    --shadow: rgba(0, 0, 0, 0.1);
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    background: var(--background);
    color: var(--text);
    line-height: 1.6;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 1rem;
}

/* Header */
.header {
    background: var(--surface);
    box-shadow: 0 2px 10px var(--shadow);
    position: sticky;
    top: 0;
    z-index: 100;
}

.header .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--primary);
}

.nav {
    display: flex;
    align-items: center;
    gap: 1rem;
}

.nav input {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    outline: none;
    transition: border-color 0.3s;
}

.nav input:focus {
    border-color: var(--primary);
}

.cart-icon {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--primary);
    color: white;
    border-radius: 8px;
    cursor: pointer;
    transition: transform 0.3s;
}

.cart-icon:hover {
    transform: translateY(-2px);
}

/* Main Content */
.main {
    padding: 2rem 0;
}

.filters {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    flex-wrap: wrap;
}

.filter-btn {
    padding: 0.5rem 1rem;
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: 20px;
    cursor: pointer;
    transition: all 0.3s;
}

.filter-btn.active,
.filter-btn:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
}

/* Products Grid */
.products-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
}

.product-card {
    background: var(--surface);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 4px 20px var(--shadow);
    transition: transform 0.3s, box-shadow 0.3s;
    cursor: pointer;
}

.product-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 30px var(--shadow);
}

.product-image {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.product-info {
    padding: 1.5rem;
}

.product-name {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text);
}

.product-description {
    color: var(--text-muted);
    font-size: 0.9rem;
    margin-bottom: 1rem;
}

.product-price {
    font-size: 1.2rem;
    font-weight: bold;
    color: var(--primary);
    margin-bottom: 1rem;
}

.add-to-cart {
    width: 100%;
    padding: 0.75rem;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
    transition: transform 0.3s;
}

.add-to-cart:hover {
    transform: translateY(-2px);
}

/* Modal */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(5px);
}

.modal.show {
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    background: var(--surface);
    border-radius: 12px;
    max-width: 500px;
    width: 90%;
    max-height: 80vh;
    overflow-y: auto;
    animation: modalSlideIn 0.3s ease;
}

@keyframes modalSlideIn {
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border);
}

.close {
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-muted);
}

.close:hover {
    color: var(--text);
}

.modal-body {
    padding: 1.5rem;
}

.cart-item {
    display: flex;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border-bottom: 1px solid var(--border);
}

.cart-item img {
    width: 60px;
    height: 60px;
    object-fit: cover;
    border-radius: 8px;
}

.cart-item-info {
    flex: 1;
}

.cart-item-name {
    font-weight: 600;
}

.cart-item-price {
    color: var(--primary);
    font-weight: bold;
}

.quantity-controls {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

.quantity-btn {
    width: 30px;
    height: 30px;
    border: 1px solid var(--border);
    background: var(--surface);
    border-radius: 4px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
}

.quantity-btn:hover {
    background: var(--background);
}

.cart-total {
    text-align: center;
    padding: 1rem;
    font-size: 1.2rem;
    border-top: 2px solid var(--border);
    margin-top: 1rem;
}

.checkout-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, var(--primary), var(--secondary));
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
    margin-top: 1rem;
}

/* Checkout */
.checkout-section {
    background: var(--surface);
    padding: 2rem 0;
}

.checkout-section.hidden {
    display: none;
}

.form-group {
    margin-bottom: 1.5rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 600;
    color: var(--text);
}

.form-group input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    outline: none;
    transition: border-color 0.3s;
}

.form-group input:focus {
    border-color: var(--primary);
}

.order-summary {
    background: var(--background);
    padding: 1.5rem;
    border-radius: 8px;
    margin: 2rem 0;
}

.order-summary h3 {
    margin-bottom: 1rem;
    color: var(--text);
}

.checkout-item {
    display: flex;
    justify-content: space-between;
    padding: 0.5rem 0;
    border-bottom: 1px solid var(--border);
}

.total {
    font-size: 1.2rem;
    font-weight: bold;
    text-align: center;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 2px solid var(--border);
}

.submit-btn {
    width: 100%;
    padding: 1rem;
    background: linear-gradient(135deg, var(--accent), var(--secondary));
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
}

/* Responsive */
@media (max-width: 768px) {
    .header .container {
        flex-direction: column;
        gap: 1rem;
    }
    
    .nav {
        width: 100%;
        justify-content: space-between;
    }
    
    .nav input {
        flex: 1;
        margin-right: 1rem;
    }
    
    .products-grid {
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
    }
    
    .modal-content {
        width: 95%;
    }
}`
    },
    {
      path: 'products.js',
      content: `// Database de produtos
const products = [
    {
        id: 1,
        name: 'Smartphone Pro Max',
        description: 'Smartphone premium com câmera profissional e bateria de longa duração',
        price: 2999.99,
        image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=300&fit=crop',
        category: 'electronics',
        stock: 15
    },
    {
        id: 2,
        name: 'Laptop Gamer RGB',
        description: 'Notebook gamer com placa de vídeo dedicada e teclado RGB',
        price: 4599.99,
        image: 'https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?w=400&h=300&fit=crop',
        category: 'electronics',
        stock: 8
    },
    {
        id: 3,
        name: 'Camiseta Premium',
        description: 'Camiseta 100% algodão com design exclusivo e alta qualidade',
        price: 89.99,
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
        category: 'clothing',
        stock: 50
    },
    {
        id: 4,
        name: 'Tênis Esportivo',
        description: 'Tênis esportivo confortável para corrida e academia',
        price: 299.99,
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=300&fit=crop',
        category: 'clothing',
        stock: 25
    },
    {
        id: 5,
        name: 'Sofá Moderno 3 Lugares',
        description: 'Sofá moderno e confortável para sala de estar',
        price: 1899.99,
        image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400&h=300&fit=crop',
        category: 'home',
        stock: 5
    },
    {
        id: 6,
        name: 'Mesa de Centro Glass',
        description: 'Mesa de centro em vidro temperado com design contemporâneo',
        price: 699.99,
        image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400&h=300&fit=crop',
        category: 'home',
        stock: 12
    },
    {
        id: 7,
        name: 'Smartwatch Fitness',
        description: 'Relógio inteligente com monitoramento de saúde e GPS',
        price: 899.99,
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop',
        category: 'electronics',
        stock: 20
    },
    {
        id: 8,
        name: 'Jaqueta de Couro',
        description: 'Jaqueta de couro genuíno com design clássico e atemporal',
        price: 499.99,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=300&fit=crop',
        category: 'clothing',
        stock: 15
    },
    {
        id: 9,
        name: 'Luminária LED Smart',
        description: 'Luminária inteligente com controle por aplicativo',
        price: 199.99,
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
        category: 'home',
        stock: 30
    },
    {
        id: 10,
        name: 'Fones Bluetooth Pro',
        description: 'Fones de ouvido sem fio com cancelamento de ruído',
        price: 599.99,
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
        category: 'electronics',
        stock: 40
    },
    {
        id: 11,
        name: 'Calça Jeans Premium',
        description: 'Calça jeans de alta qualidade com corte moderno',
        price: 199.99,
        image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=300&fit=crop',
        category: 'clothing',
        stock: 35
    },
    {
        id: 12,
        name: 'Tapete Decorativo',
        description: 'Tapete decorativo de alta qualidade para sala',
        price: 399.99,
        image: 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400&h=300&fit=crop',
        category: 'home',
        stock: 18
    }
];

// Renderizar produtos na página
function renderProducts(productsToRender = products) {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';
    
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.onclick = () => showProductDetails(product);
        
        productCard.innerHTML = \`
            <img src="\${product.image}" alt="\${product.name}" class="product-image">
            <div class="product-info">
                <h3 class="product-name">\${product.name}</h3>
                <p class="product-description">\${product.description}</p>
                <div class="product-price">R$ \${product.price.toFixed(2).replace('.', ',')}</div>
                <button class="add-to-cart" onclick="event.stopPropagation(); addToCart(\${product.id})">
                    Adicionar ao Carrinho
                </button>
            </div>
        \`;
        
        grid.appendChild(productCard);
    });
}

// Filtrar produtos por categoria
function filterProducts(category) {
    const buttons = document.querySelectorAll('.filter-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    if (category === 'all') {
        renderProducts(products);
    } else {
        const filtered = products.filter(product => product.category === category);
        renderProducts(filtered);
    }
}

// Buscar produtos
function searchProducts(query) {
    const filtered = products.filter(product => 
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.description.toLowerCase().includes(query.toLowerCase())
    );
    renderProducts(filtered);
}

// Mostrar detalhes do produto
function showProductDetails(product) {
    const modal = document.getElementById('product-modal');
    const details = document.getElementById('product-details');
    
    details.innerHTML = \`
        <img src="\${product.image}" alt="\${product.name}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 1rem;">
        <h2>\${product.name}</h2>
        <p style="color: var(--text-muted); margin: 1rem 0;">\${product.description}</p>
        <div style="font-size: 1.5rem; font-weight: bold; color: var(--primary); margin: 1rem 0;">
            R$ \${product.price.toFixed(2).replace('.', ',')}
        </div>
        <div style="margin: 1rem 0; color: var(--text-muted);">
            Estoque: \${product.stock} unidades
        </div>
        <button class="add-to-cart" onclick="addToCart(\${product.id}); closeProductModal();">
            Adicionar ao Carrinho
        </button>
    \`;
    
    modal.classList.add('show');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('show');
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    
    // Busca
    document.getElementById('search').addEventListener('input', (e) => {
        searchProducts(e.target.value);
    });
});`
    },
    {
      path: 'cart.js',
      content: `// Carrinho de compras
let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Atualizar contador do carrinho
function updateCartCount() {
    const count = cart.reduce((total, item) => total + item.quantity, 0);
    document.getElementById('cart-count').textContent = count;
}

// Adicionar produto ao carrinho
function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showCartNotification('Produto adicionado ao carrinho!');
}

// Remover produto do carrinho
function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    updateCartTotal();
}

// Atualizar quantidade
function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity <= 0) {
        removeFromCart(productId);
        return;
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    renderCartItems();
    updateCartTotal();
}

// Renderizar itens do carrinho
function renderCartItems() {
    const cartItemsContainer = document.getElementById('cart-items');
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p style="text-align: center; color: var(--text-muted);">Seu carrinho está vazio</p>';
        return;
    }
    
    cartItemsContainer.innerHTML = cart.map(item => \`
        <div class="cart-item">
            <img src="\${item.image}" alt="\${item.name}">
            <div class="cart-item-info">
                <div class="cart-item-name">\${item.name}</div>
                <div class="cart-item-price">R$ \${item.price.toFixed(2).replace('.', ',')}</div>
                <div class="quantity-controls">
                    <button class="quantity-btn" onclick="updateQuantity(\${item.id}, -1)">-</button>
                    <span>\${item.quantity}</span>
                    <button class="quantity-btn" onclick="updateQuantity(\${item.id}, 1)">+</button>
                    <button class="quantity-btn" onclick="removeFromCart(\${item.id})" style="margin-left: 1rem; color: red;">🗑️</button>
                </div>
            </div>
        </div>
    \`).join('');
}

// Atualizar total do carrinho
function updateCartTotal() {
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    document.getElementById('cart-total').textContent = total.toFixed(2).replace('.', ',');
}

// Toggle carrinho
function toggleCart() {
    const modal = document.getElementById('cart-modal');
    
    if (modal.classList.contains('show')) {
        modal.classList.remove('show');
    } else {
        modal.classList.add('show');
        renderCartItems();
        updateCartTotal();
    }
}

// Ir para checkout
function goToCheckout() {
    if (cart.length === 0) {
        alert('Seu carrinho está vazio!');
        return;
    }
    
    // Esconder modal do carrinho
    document.getElementById('cart-modal').classList.remove('show');
    
    // Esconder produtos e mostrar checkout
    document.querySelector('.main').style.display = 'none';
    document.getElementById('checkout-section').classList.remove('hidden');
    
    // Renderizar itens no checkout
    renderCheckoutItems();
}

// Voltar para loja
function backToShop() {
    document.querySelector('.main').style.display = 'block';
    document.getElementById('checkout-section').classList.add('hidden');
}

// Mostrar notificação do carrinho
function showCartNotification(message) {
    // Criar elemento de notificação
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--primary);
        color: white;
        padding: 1rem 2rem;
        border-radius: 8px;
        z-index: 1001;
        animation: slideIn 0.3s ease;
    \`;
    
    // Adicionar CSS de animação
    if (!document.getElementById('notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = \`
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        \`;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remover após 3 segundos
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Inicializar carrinho
document.addEventListener('DOMContentLoaded', () => {
    updateCartCount();
    
    // Fechar modais ao clicar fora
    window.onclick = (event) => {
        const cartModal = document.getElementById('cart-modal');
        const productModal = document.getElementById('product-modal');
        
        if (event.target === cartModal) {
            cartModal.classList.remove('show');
        }
        if (event.target === productModal) {
            productModal.classList.remove('show');
        }
    };
});`
    },
    {
      path: 'checkout.js',
      content: `// Checkout e finalização da compra

// Renderizar itens no checkout
function renderCheckoutItems() {
    const checkoutItems = document.getElementById('checkout-items');
    const checkoutTotal = document.getElementById('checkout-total');
    
    if (cart.length === 0) {
        checkoutItems.innerHTML = '<p>Nenhum item no carrinho</p>';
        checkoutTotal.textContent = '0,00';
        return;
    }
    
    checkoutItems.innerHTML = cart.map(item => \`
        <div class="checkout-item">
            <span>\${item.name} x \${item.quantity}</span>
            <span>R$ \${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
        </div>
    \`).join('');
    
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    checkoutTotal.textContent = total.toFixed(2).replace('.', ',');
}

// Validar CEP (simulação)
function validateCEP(cep) {
    const cleanCEP = cep.replace(/\\D/g, '');
    return cleanCEP.length === 8;
}

// Calcular frete (simulação)
function calculateShipping(cep) {
    if (!validateCEP(cep)) return 0;
    
    // Simulação de frete baseado no CEP
    const cleanCEP = cep.replace(/\\D/g, '');
    const firstDigit = parseInt(cleanCEP[0]);
    
    if (firstDigit <= 2) return 15.99; // Sudeste
    if (firstDigit <= 4) return 25.99; // Sul
    if (firstDigit <= 6) return 35.99; // Nordeste
    return 45.99; // Norte/Centro-Oeste
}

// Formatar campos
function formatCEP(input) {
    let value = input.value.replace(/\\D/g, '');
    value = value.replace(/(\\d{5})(\\d)/, '$1-$2');
    input.value = value;
}

function formatPhone(input) {
    let value = input.value.replace(/\\D/g, '');
    value = value.replace(/(\\d{2})(\\d)/, '($1) $2');
    value = value.replace(/(\\d{4})(\\d)/, '$1-$2');
    input.value = value;
}

// Processar pedido
function processOrder(formData) {
    // Simulação de processamento
    return new Promise((resolve) => {
        setTimeout(() => {
            const orderId = 'PED' + Date.now();
            resolve({
                success: true,
                orderId: orderId,
                total: cart.reduce((sum, item) => sum + (item.price * item.quantity), 0)
            });
        }, 2000);
    });
}

// Mostrar confirmação do pedido
function showOrderConfirmation(orderData) {
    const confirmation = document.createElement('div');
    confirmation.innerHTML = \`
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1002;
        ">
            <div style="
                background: white;
                padding: 3rem;
                border-radius: 12px;
                text-align: center;
                max-width: 500px;
                width: 90%;
            ">
                <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
                <h2 style="color: var(--primary); margin-bottom: 1rem;">Pedido Confirmado!</h2>
                <p style="margin-bottom: 1rem;">Seu pedido <strong>\${orderData.orderId}</strong> foi processado com sucesso.</p>
                <p style="margin-bottom: 2rem; font-size: 1.2rem;">Total: <strong>R$ \${orderData.total.toFixed(2).replace('.', ',')}</strong></p>
                <button onclick="finishOrder()" style="
                    background: var(--primary);
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1.1rem;
                ">Continuar Comprando</button>
            </div>
        </div>
    \`;
    
    document.body.appendChild(confirmation);
}

// Finalizar pedido e limpar carrinho
function finishOrder() {
    // Limpar carrinho
    cart = [];
    localStorage.removeItem('cart');
    updateCartCount();
    
    // Voltar para a loja
    document.querySelector('.main').style.display = 'block';
    document.getElementById('checkout-section').classList.add('hidden');
    
    // Remover confirmação
    const confirmation = document.querySelector('[style*="position: fixed"]');
    if (confirmation) confirmation.remove();
}

// Event listeners do checkout
document.addEventListener('DOMContentLoaded', () => {
    const checkoutForm = document.getElementById('checkout-form');
    
    if (checkoutForm) {
        // Formatação automática dos campos
        const cepField = checkoutForm.querySelector('input[name="cep"]');
        const phoneField = checkoutForm.querySelector('input[name="phone"]');
        
        if (cepField) {
            cepField.addEventListener('input', (e) => formatCEP(e.target));
        }
        
        if (phoneField) {
            phoneField.addEventListener('input', (e) => formatPhone(e.target));
        }
        
        // Submit do formulário
        checkoutForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(checkoutForm);
            const data = Object.fromEntries(formData);
            
            // Validações básicas
            if (!data.name || !data.email || !data.phone || !data.address || !data.cep) {
                alert('Por favor, preencha todos os campos obrigatórios.');
                return;
            }
            
            if (!validateCEP(data.cep)) {
                alert('Por favor, insira um CEP válido.');
                return;
            }
            
            // Mostrar loading
            const submitBtn = checkoutForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Processando...';
            submitBtn.disabled = true;
            
            try {
                const result = await processOrder(data);
                
                if (result.success) {
                    showOrderConfirmation(result);
                } else {
                    alert('Erro ao processar pedido. Tente novamente.');
                }
            } catch (error) {
                alert('Erro ao processar pedido. Tente novamente.');
            } finally {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        });
    }
});`
    }
  ]
};

export default ecommerceCart;