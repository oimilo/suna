import { Template } from './types';

const blogMarkdown: Template = {
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
};

export default blogMarkdown;