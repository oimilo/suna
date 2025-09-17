# Prophet - Guia do Usuário

## Índice
1. [Bem-vindo ao Prophet](#bem-vindo-ao-prophet)
2. [Começando](#começando)
3. [Criando seu Primeiro Agente](#criando-seu-primeiro-agente)
4. [Ferramentas Disponíveis](#ferramentas-disponíveis)
5. [Workflows - Automatizando Tarefas](#workflows---automatizando-tarefas)
6. [Integrações](#integrações)
7. [Interface e Navegação](#interface-e-navegação)
8. [Dicas e Melhores Práticas](#dicas-e-melhores-práticas)
9. [Resolução de Problemas](#resolução-de-problemas)

---

## Bem-vindo ao Prophet

Prophet é sua plataforma de criação de agentes de IA personalizados. Com Prophet, você pode criar assistentes inteligentes capazes de:

- 📁 Manipular arquivos e documentos
- 💻 Executar comandos e scripts
- 🌐 Navegar e extrair informações da web
- 🖼️ Analisar imagens e screenshots
- 🔄 Automatizar tarefas repetitivas
- 🔗 Integrar com serviços externos

---

## Começando

### Sua Primeira Conversa

1. **Acesse o Prophet** e você verá a mensagem de boas-vindas
2. **Digite sua primeira pergunta ou tarefa** - por exemplo:
   - "Crie um arquivo Python que calcule fibonacci"
   - "Analise esta imagem e me diga o que vê"
   - "Pesquise sobre as últimas notícias de IA"
3. **Observe o agente trabalhar** - você verá as ferramentas sendo utilizadas em tempo real

### Entendendo a Interface

- **Sidebar Lateral**: Suas conversas (tarefas) e agentes
- **Área Principal**: Onde a conversa acontece
- **Indicadores de Ferramenta**: Pequenos cards mostrando qual ferramenta está sendo usada

---

## Criando seu Primeiro Agente

### O que é um Agente?

Um agente é um assistente de IA configurado com capacidades e comportamentos específicos para suas necessidades.

### Passo a Passo

1. **Clique em "Agentes" na sidebar**
2. **Selecione "Criar Novo Agente"**
3. **Configure seu agente:**
   - **Nome**: Dê um nome descritivo (ex: "Assistente de Código")
   - **Descrição**: Explique o propósito do agente
   - **Instruções**: Defina como o agente deve se comportar
   - **Ferramentas**: Selecione quais capacidades ativar

### Exemplo de Configuração

**Nome**: Assistente de Desenvolvimento Web

**Instruções**:
```
Você é um especialista em desenvolvimento web. Sempre:
- Use as melhores práticas de código
- Comente o código em português
- Teste o código antes de entregar
- Sugira melhorias quando apropriado
```

**Ferramentas Ativadas**:
- ✅ Manipulação de Arquivos
- ✅ Execução de Comandos
- ✅ Navegador Web

---

## Ferramentas Disponíveis

### 1. 📝 **Manipulação de Arquivos**
Permite ao agente criar, editar e deletar arquivos.

**O que pode fazer:**
- Criar novos arquivos de qualquer tipo
- Editar código com inteligência contextual
- Fazer substituições precisas de texto
- Organizar estruturas de pastas

**Exemplo de uso:**
> "Crie um componente React para um formulário de login"

### 2. 💻 **Execução de Comandos**
Executa comandos no terminal para você.

**O que pode fazer:**
- Instalar dependências (`npm install`, `pip install`)
- Executar scripts e programas
- Gerenciar git e versionamento
- Compilar e testar código

**Exemplo de uso:**
> "Execute os testes e corrija qualquer erro que aparecer"

### 3. 🌐 **Navegador Web**
Acessa e extrai informações de sites.

**O que pode fazer:**
- Visitar páginas web
- Capturar screenshots
- Extrair informações
- Pesquisar documentação

**Exemplo de uso:**
> "Acesse a documentação do React e me mostre como usar hooks"

### 4. 🖼️ **Análise de Imagens**
Interpreta e analisa conteúdo visual.

**O que pode fazer:**
- Descrever conteúdo de imagens
- Ler texto em screenshots
- Identificar elementos de UI
- Analisar diagramas

**Exemplo de uso:**
> "Analise este mockup e crie o HTML/CSS correspondente"

### 5. 🔍 **Pesquisa Web**
Busca informações atualizadas na internet.

**O que pode fazer:**
- Pesquisar informações recentes
- Encontrar documentação
- Buscar soluções para problemas
- Coletar dados para análise

**Exemplo de uso:**
> "Pesquise as melhores práticas de segurança para APIs em 2024"

### 6. 🔌 **Provedores de Dados**
Conecta com APIs e serviços externos.

**O que pode fazer:**
- Acessar APIs configuradas
- Buscar dados em tempo real
- Integrar com serviços externos
- Automatizar coleta de dados

---

## Workflows - Automatizando Tarefas

### O que são Workflows?

Workflows são sequências de ações que o agente executa automaticamente quando ativadas.

### Criando um Workflow

1. **Acesse as configurações do agente**
2. **Vá para aba "Workflows"**
3. **Clique em "Novo Workflow"**
4. **Configure:**
   - **Nome**: Ex: "Análise de Código"
   - **Gatilho**: Palavra ou frase que ativa o workflow
   - **Passos**: Sequência de ações

### Exemplo Prático

**Workflow**: "Criar CRUD Completo"

**Gatilho**: "criar crud de [entidade]"

**Passos**:
1. Criar modelo de dados
2. Gerar API endpoints
3. Criar interface de usuário
4. Adicionar validações
5. Escrever testes
6. Criar documentação

### Tipos de Passos

- **Ferramenta**: Usa uma ferramenta específica
- **Instrução**: Dá uma instrução ao agente
- **Condição**: Executa ações baseadas em condições

---

## Integrações

### MCP - Conexões Modernas

O Prophet usa o Model Context Protocol (MCP) para conectar com serviços externos de forma eficiente.

**Como adicionar uma integração MCP:**
1. Vá para configurações do agente
2. Seção "Conexões MCP"
3. Adicione a URL do serviço
4. Configure as permissões

### Pipedream (Opcional)

Para casos específicos, você pode usar integrações Pipedream:
- Webhooks complexos
- Transformação de dados
- Integrações legadas

**Importante**: A maioria das tarefas não precisa de Pipedream - as ferramentas nativas são suficientes.

---

## Interface e Navegação

### Sidebar Inteligente

A sidebar funciona como no Manus.io:
- **Passe o mouse** para expandir
- **Clique** para fixar aberta
- **Arrastar** para reordenar itens

### Gerenciando Conversas

#### Ver Todas as Conversas
- Clique em "Tarefas" na sidebar
- Role para ver todas as conversas
- Use a busca para encontrar específicas

#### Ações Rápidas
- **3 pontinhos**: Menu de opções
- **Compartilhar**: Gera link para compartilhar
- **Deletar**: Remove a conversa
- **Abrir em nova aba**: Útil para múltiplas conversas

#### Seleção Múltipla
1. Passe o mouse sobre uma conversa
2. Clique no checkbox que aparece
3. Selecione várias conversas
4. Use ações em lote

### Atalhos Úteis

- **Nova conversa**: Clique no botão "+" ou comece a digitar
- **Trocar de agente**: Use o seletor no topo da conversa
- **Histórico**: Veja versões anteriores de arquivos editados

---

## Dicas e Melhores Práticas

### 1. Seja Específico
❌ "Faça um site"
✅ "Crie um site de portfolio com React, incluindo seções sobre, projetos e contato"

### 2. Forneça Contexto
❌ "Corrija o bug"
✅ "O formulário não está validando email. Corrija a validação no arquivo ContactForm.js"

### 3. Use Workflows para Tarefas Repetitivas
Se você faz algo frequentemente, crie um workflow para automatizar.

### 4. Aproveite o Contexto
O agente lembra de toda a conversa - referencie coisas anteriores naturalmente.

### 5. Combine Ferramentas
Peça ao agente para pesquisar algo e depois implementar baseado no que encontrou.

### Exemplos de Bons Prompts

**Para Desenvolvimento:**
> "Crie uma API REST em Python com FastAPI para gerenciar tarefas. Inclua CRUD completo, validação com Pydantic e documentação automática"

**Para Análise:**
> "Analise a estrutura do projeto na pasta /src e sugira melhorias de organização seguindo padrões clean architecture"

**Para Debugging:**
> "O teste 'should calculate total' está falhando. Encontre o problema e corrija, garantindo que todos os testes passem"

---

## Resolução de Problemas

### O agente não está respondendo
- Verifique se selecionou um agente
- Recarregue a página se necessário
- Verifique o indicador de status

### Ferramenta falhou ao executar
- Verifique se a ferramenta está ativada no agente
- Para arquivos: confirme que o caminho existe
- Para comandos: verifique permissões

### Workflow não está funcionando
- Confirme que o workflow está ativo
- Verifique se usou o gatilho correto
- Revise se as ferramentas necessárias estão ativadas

### Dicas Gerais

1. **Mensagens de erro**: Leia com atenção - geralmente indicam o problema
2. **Tente novamente**: Às vezes reformular o pedido ajuda
3. **Divida tarefas complexas**: Peça uma coisa por vez se houver problemas
4. **Use o histórico**: Veja o que funcionou antes

### Precisa de Ajuda?

Se encontrar problemas persistentes:
1. Tente reformular seu pedido
2. Verifique se o agente tem as ferramentas necessárias ativadas
3. Para problemas técnicos, recarregue a página

---

## Próximos Passos

Agora que você conhece o Prophet:

1. **Experimente diferentes ferramentas** - Cada uma tem capacidades únicas
2. **Crie agentes especializados** - Um para código, outro para pesquisa, etc.
3. **Construa seus workflows** - Automatize suas tarefas mais comuns
4. **Explore integrações** - Conecte com seus serviços favoritos

Lembre-se: Prophet aprende com seu uso. Quanto mais específico e claro você for, melhores serão os resultados!

---

*Dica final: Comece simples e vá aumentando a complexidade conforme se familiariza com a plataforma.*