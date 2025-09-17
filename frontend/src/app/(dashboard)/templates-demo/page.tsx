'use client';

import { useState } from 'react';
import { templates } from '@/lib/onboarding/templates';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Code, Eye, FileCode, Copy, Check, Sparkles, Brain, Palette, Zap, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import ReactMarkdown from 'react-markdown';

// Mapeamento de perfis para templates
const profileMap: Record<string, string> = {
  'visual-aesthetic': 'blog-markdown',
  'visual-pragmatic': 'landing-page',
  'logical-aesthetic': 'api-nodejs',
  'logical-pragmatic': 'ecommerce-cart',
};

// Informações dos perfis
const profiles = [
  {
    id: 'visual-aesthetic',
    name: '🎨 Artista Visual',
    description: 'Foco em beleza e estética',
    icon: Palette,
    traits: 'Visual + Aesthetic'
  },
  {
    id: 'visual-pragmatic',
    name: '🎯 Designer Pragmático',
    description: 'Visual funcional e conversão',
    icon: Eye,
    traits: 'Visual + Pragmatic'
  },
  {
    id: 'logical-aesthetic',
    name: '🏗️ Arquiteto de Sistemas',
    description: 'Estrutura elegante e limpa',
    icon: Brain,
    traits: 'Logical + Aesthetic'
  },
  {
    id: 'logical-pragmatic',
    name: '⚡ Executor Pragmático',
    description: 'Funcionalidade rápida',
    icon: Zap,
    traits: 'Logical + Pragmatic'
  }
];

export default function TemplatesDemoPage() {
  const [selectedTemplate, setSelectedTemplate] = useState(templates[0]);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'message' | 'files' | 'preview'>('message');

  const copyToClipboard = (content: string, fileName: string) => {
    navigator.clipboard.writeText(content);
    setCopiedFile(fileName);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  const getFileLanguage = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'js': return 'javascript';
      case 'html': return 'html';
      case 'css': return 'css';
      case 'json': return 'json';
      case 'md': return 'markdown';
      default: return 'plaintext';
    }
  };

  const getProfileForTemplate = (templateId: string) => {
    const profileEntry = Object.entries(profileMap).find(([_, tId]) => tId === templateId);
    if (profileEntry) {
      return profiles.find(p => p.id === profileEntry[0]);
    }
    return null;
  };

  const generatePreviewHTML = () => {
    if (!selectedTemplate?.files) return '<p>No files to preview</p>';
    
    // Para templates não-visuais (API, server-side), mostrar uma página informativa
    if (selectedTemplate.id === 'api-nodejs') {
      return `
        <html>
          <head>
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; }
              .container { max-width: 800px; margin: 0 auto; }
              h1 { font-size: 2.5em; margin-bottom: 20px; }
              .info-box { background: rgba(255,255,255,0.1); padding: 20px; border-radius: 10px; margin: 20px 0; backdrop-filter: blur(10px); }
              .chat-example { background: rgba(0,0,0,0.3); padding: 15px; border-radius: 10px; margin: 15px 0; }
              .user-msg { background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; margin: 5px 0; text-align: right; }
              .agent-msg { background: rgba(103,126,234,0.2); padding: 10px; border-radius: 8px; margin: 5px 0; }
              .endpoint { margin: 10px 0; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 5px; }
              .highlight { color: #fbbf24; font-weight: bold; }
            </style>
          </head>
          <body>
            <div class="container">
              <h1>🚀 API REST Node.js</h1>
              <div class="info-box">
                <h2>Backend pronto para expandir!</h2>
                <p>Este é um template de API REST completo. Como não tem interface visual, <span class="highlight">peça ao agente para fazer o que você precisa!</span></p>
              </div>
              
              <div class="info-box">
                <h3>💬 Exemplos de comandos em linguagem natural:</h3>
                <div class="chat-example">
                  <div class="user-msg">👤 "Rode a API e mostre os endpoints"</div>
                  <div class="agent-msg">🤖 Vou iniciar a API e listar os endpoints disponíveis...</div>
                </div>
                <div class="chat-example">
                  <div class="user-msg">👤 "Adicione um endpoint para produtos com nome, preço e descrição"</div>
                  <div class="agent-msg">🤖 Criando endpoint CRUD para produtos com os campos solicitados...</div>
                </div>
                <div class="chat-example">
                  <div class="user-msg">👤 "Conecte um banco PostgreSQL"</div>
                  <div class="agent-msg">🤖 Configurando conexão com PostgreSQL usando Prisma...</div>
                </div>
                <div class="chat-example">
                  <div class="user-msg">👤 "Adicione autenticação JWT"</div>
                  <div class="agent-msg">🤖 Implementando sistema de autenticação com tokens JWT...</div>
                </div>
              </div>
              
              <div class="info-box">
                <h3>📋 Estrutura atual da API:</h3>
                <div class="endpoint">✅ Servidor Express configurado</div>
                <div class="endpoint">✅ Rotas RESTful prontas</div>
                <div class="endpoint">✅ Middleware de validação</div>
                <div class="endpoint">✅ Tratamento de erros</div>
                <div class="endpoint">✅ CORS habilitado</div>
                <div class="endpoint">✅ Pronto para deploy</div>
              </div>
            </div>
          </body>
        </html>
      `;
    }
    
    // Encontrar o arquivo HTML principal
    const htmlFiles = selectedTemplate.files.filter(f => f.path.endsWith('.html'));
    const cssFiles = selectedTemplate.files.filter(f => f.path.endsWith('.css'));
    const jsFiles = selectedTemplate.files.filter(f => f.path.endsWith('.js') && !f.path.includes('server') && !f.path.includes('routes'));
    
    // Priorizar index.html, senão pegar o primeiro HTML
    const htmlFile = htmlFiles.find(f => f.path.includes('index')) || htmlFiles[0];
    
    if (!htmlFile) {
      return `
        <html>
          <head>
            <style>
              body { font-family: system-ui; padding: 40px; text-align: center; }
              .message { background: #f0f0f0; padding: 20px; border-radius: 10px; max-width: 500px; margin: 0 auto; }
            </style>
          </head>
          <body>
            <div class="message">
              <h2>📁 Template sem preview visual</h2>
              <p>Este template contém ${selectedTemplate.files.length} arquivos:</p>
              <ul style="list-style: none; padding: 0;">
                ${selectedTemplate.files.map(f => `<li>📄 ${f.path}</li>`).join('')}
              </ul>
              <p>Use a aba "Arquivos" para ver o código fonte.</p>
            </div>
          </body>
        </html>
      `;
    }
    
    let html = htmlFile.content;
    
    // Remover links externos de CSS/JS que não funcionarão no iframe
    html = html.replace(/<link[^>]*href=["'](?!data:)(?!#)[^"']*\.css["'][^>]*>/gi, '');
    html = html.replace(/<script[^>]*src=["'](?!data:)(?!#)[^"']*\.js["'][^>]*><\/script>/gi, '');
    
    // Injetar CSS inline
    if (cssFiles.length > 0) {
      const allCSS = cssFiles.map(f => f.content).join('\n');
      const styleTag = `<style>${allCSS}</style>`;
      
      if (html.includes('</head>')) {
        html = html.replace('</head>', `${styleTag}</head>`);
      } else {
        html = html.replace('<body', `<style>${allCSS}</style><body`);
      }
    }
    
    // Injetar JS inline (com wrapper para evitar conflitos)
    if (jsFiles.length > 0) {
      // Não envolver em IIFE para manter as funções globais acessíveis
      const allJS = jsFiles.map(f => f.content).join('\n');
      
      const scriptTag = `<script>${allJS}</script>`;
      
      if (html.includes('</body>')) {
        html = html.replace('</body>', `${scriptTag}</body>`);
      } else {
        html += scriptTag;
      }
    }
    
    // Adicionar estilos de reset para o iframe
    const resetStyles = `
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: system-ui, -apple-system, sans-serif; }
      </style>
    `;
    
    if (html.includes('<head>')) {
      html = html.replace('<head>', `<head>${resetStyles}`);
    }
    
    return html;
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🎭 Templates de Onboarding - Demo</h1>
        <p className="text-muted-foreground">
          Visualize todos os templates disponíveis e suas mensagens personalizadas por perfil
        </p>
      </div>

      {/* Perfis Overview */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Perfis de Personalidade</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {profiles.map((profile) => {
            const templateId = profileMap[profile.id];
            const template = templates.find(t => t.id === templateId);
            const Icon = profile.icon;
            
            return (
              <Card
                key={profile.id}
                className={cn(
                  "cursor-pointer transition-all hover:shadow-lg",
                  selectedTemplate?.id === templateId && "ring-2 ring-purple-500"
                )}
                onClick={() => template && setSelectedTemplate(template)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Icon className="h-8 w-8 text-purple-500" />
                    <Badge variant="outline" className="text-xs">
                      {profile.traits}
                    </Badge>
                  </div>
                  <CardTitle className="text-base">{profile.name}</CardTitle>
                  <CardDescription className="text-xs">
                    {profile.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    → {template?.name || 'Template não encontrado'}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Template List */}
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Templates Disponíveis</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[600px]">
                <div className="p-4 space-y-2">
                  {templates.map((template) => {
                    const profile = getProfileForTemplate(template.id);
                    return (
                      <button
                        key={template.id}
                        onClick={() => setSelectedTemplate(template)}
                        className={cn(
                          "w-full text-left p-3 rounded-lg transition-all",
                          "hover:bg-accent",
                          selectedTemplate?.id === template.id && "bg-accent border border-purple-500/50"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">
                              {template.name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {template.description}
                            </div>
                            {profile && (
                              <Badge variant="secondary" className="mt-1 text-xs">
                                {profile.name}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Template Detail */}
        <div className="col-span-9">
          {selectedTemplate && (
            <Card className="h-[700px] flex flex-col">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <span className="text-2xl">{selectedTemplate.icon}</span>
                      {selectedTemplate.name}
                    </CardTitle>
                    <CardDescription>{selectedTemplate.description}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'preview' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('preview')}
                    >
                      <Monitor className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                    <Button
                      variant={viewMode === 'message' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('message')}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Mensagem
                    </Button>
                    <Button
                      variant={viewMode === 'files' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('files')}
                    >
                      <FileCode className="h-4 w-4 mr-2" />
                      Arquivos ({selectedTemplate.files?.length || 0})
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex-1 overflow-hidden p-0">
                {viewMode === 'preview' ? (
                  <div className="h-full bg-white">
                    <iframe
                      srcDoc={generatePreviewHTML()}
                      className="w-full h-full border-0"
                      title="Template Preview"
                      sandbox="allow-scripts"
                    />
                  </div>
                ) : viewMode === 'message' ? (
                  <ScrollArea className="h-full p-6">
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <ReactMarkdown>
                        {selectedTemplate.messages[0]?.content || 'Sem mensagem'}
                      </ReactMarkdown>
                    </div>
                  </ScrollArea>
                ) : (
                  <div className="h-full">
                    <Tabs defaultValue={selectedTemplate.files?.[0]?.path} className="h-full">
                      <TabsList className="w-full justify-start rounded-none border-b bg-muted/30 h-auto p-0">
                        <ScrollArea className="w-full">
                          <div className="flex">
                            {selectedTemplate.files?.map((file) => (
                              <TabsTrigger
                                key={file.path}
                                value={file.path}
                                className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-500 px-4"
                              >
                                <Code className="h-3 w-3 mr-2" />
                                {file.path}
                              </TabsTrigger>
                            ))}
                          </div>
                        </ScrollArea>
                      </TabsList>
                      
                      {selectedTemplate.files?.map((file) => (
                        <TabsContent
                          key={file.path}
                          value={file.path}
                          className="h-[calc(100%-48px)] m-0"
                        >
                          <div className="h-full relative">
                            <Button
                              size="sm"
                              variant="outline"
                              className="absolute top-2 right-2 z-10"
                              onClick={() => copyToClipboard(file.content, file.path)}
                            >
                              {copiedFile === file.path ? (
                                <>
                                  <Check className="h-3 w-3 mr-2" />
                                  Copiado!
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 mr-2" />
                                  Copiar
                                </>
                              )}
                            </Button>
                            <ScrollArea className="h-full">
                              <SyntaxHighlighter
                                language={getFileLanguage(file.path)}
                                style={vscDarkPlus}
                                customStyle={{
                                  margin: 0,
                                  borderRadius: 0,
                                  fontSize: '0.875rem',
                                }}
                              >
                                {file.content}
                              </SyntaxHighlighter>
                            </ScrollArea>
                          </div>
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Info Box */}
      <Card className="mt-8 border-purple-500/20 bg-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-500" />
            Como Funciona
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• Durante o onboarding, o usuário responde perguntas sobre seu estilo de trabalho</li>
            <li>• Com base nas respostas, identificamos um dos 4 perfis de personalidade</li>
            <li>• Cada perfil recebe um template específico com mensagem personalizada</li>
            <li>• O agente entrega os arquivos prontos usando tool call &lt;complete&gt;</li>
            <li>• A thread começa apenas com a mensagem do agente, sem mensagem do usuário</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}