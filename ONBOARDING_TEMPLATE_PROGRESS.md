# 🚀 Progresso do Sistema de Templates de Onboarding

## 📅 Data: Janeiro 2025

## 🎯 Objetivo Final
Criar um sistema onde o usuário, após completar o onboarding:
1. Entre em um projeto já configurado com template
2. Veja uma mensagem inicial do agente com descrição do que foi criado
3. Tenha arquivos já criados no workspace
4. Possa interagir normalmente como qualquer projeto

## ✅ O que Foi Implementado

### 1. Templates Melhorados (`templates.ts`)
- ✅ 6 templates completos (landing-page, dashboard, api, blog, ecommerce, game)
- ✅ Mensagens detalhadas em Markdown com descrição do que foi criado
- ✅ Perguntas de personalização específicas para cada perfil
- ✅ Arquivos de template definidos para cada projeto
- ✅ Timestamps adicionados às mensagens
- ✅ Tipo TypeScript `TemplateMessage` atualizado com campos opcionais

### 2. Criação de Projeto (`create-template-project.ts`)

#### Estratégia Atual:
```typescript
1. Inicia agent real com mensagem mínima ('.')
2. Agent cria: projeto + thread + sandbox + agent_run
3. Atualiza agent_run para status 'waiting' (não 'completed')
4. Remove mensagens iniciais do agent
5. Insere mensagem do template
6. Aguarda sandbox (até 3 tentativas, 14 segundos total)
7. Cria arquivos via FormData upload
8. Salva backup em project_files
```

#### Código Chave:
```typescript
// Iniciar agent com mensagem mínima
formData.append('prompt', '.');
formData.append('stream', 'false');
const agentResult = await initiateAgent(formData);

// Atualizar agent_run para 'waiting'
await supabase.from('agent_runs')
  .update({ status: 'waiting', is_completed: false })
  .eq('agent_run_id', agentRunId);

// Upload de arquivos com FormData
const blob = new Blob([file.content], { type: 'text/plain' });
formData.append('file', blob, file.path);
formData.append('path', file.path);
```

## 🐛 Problemas Encontrados e Resolvidos

### 1. ❌ Agent Run "Completed" Error
**Problema**: Agent completava imediatamente e não aceitava mais interações
**Solução**: Atualizar status para 'waiting' após criação

### 2. ❌ Mensagens não Apareciam
**Problema**: Template messages não eram visíveis no chat
**Solução**: Inserir mensagem diretamente na tabela messages

### 3. ❌ Sandbox Não Encontrada
**Problema**: Tentava criar arquivos antes da sandbox existir
**Solução**: Loop de tentativas com delay

### 4. ❌ Upload de Arquivos Falhava
**Problema**: Enviava JSON ao invés de multipart/form-data
**Solução**: Usar FormData com Blob

## ⚠️ Problemas Atuais

### 1. Mock do Agent Ainda Aparece
- **Sintoma**: Ao invés da mensagem do template, aparece o fallback genérico
- **Possível Causa**: 
  - Chat pode estar verificando se há agent_run ativo
  - Mensagem pode não estar sendo buscada corretamente
  - Timing issue entre criação e redirecionamento

### 2. Logs Somem no Redirecionamento
- **Problema**: Console.log desaparece quando muda de página
- **Solução Necessária**: 
  - Adicionar logs no backend
  - Ou usar localStorage para persistir logs
  - Ou adicionar debug mode que mostra logs na UI

## 📊 Estado Atual dos Componentes

| Componente | Status | Observações |
|------------|--------|-------------|
| Templates | ✅ Completo | 6 templates com mensagens e arquivos |
| Tipos TypeScript | ✅ Completo | Interfaces atualizadas |
| Criação de Projeto | ✅ Funciona | Agent, projeto, thread criados |
| Agent Run | ✅ Funciona | Status 'waiting' permitindo interação |
| Mensagem Template | ⚠️ Parcial | Inserida no banco mas não aparece |
| Criação de Arquivos | ⚠️ Parcial | Código pronto, sandbox timing issue |
| Interface do Chat | ❌ Problema | Mostra mock ao invés do template |

## 🔍 Diagnóstico Necessário

### Para Próxima Sessão:

1. **Verificar o componente de Chat**
   ```typescript
   // Onde está:
   frontend/src/app/(dashboard)/projects/[projectId]/thread/
   
   // O que verificar:
   - Como busca mensagens iniciais
   - Se espera agent_run específico
   - Se há fallback quando não há mensagens
   ```

2. **Adicionar Logs Persistentes**
   ```typescript
   // Opção 1: Backend logging
   logger.info("Template project created", {
     project_id: projectId,
     template_id: template.id,
     message_inserted: true
   })
   
   // Opção 2: LocalStorage
   const log = (msg) => {
     const logs = JSON.parse(localStorage.getItem('template_logs') || '[]');
     logs.push({time: new Date(), msg});
     localStorage.setItem('template_logs', JSON.stringify(logs));
   }
   ```

3. **Verificar Fluxo de Mensagens**
   - Query que busca mensagens: `useMessagesQuery`
   - Se filtra por agent_run_id
   - Se ordena por created_at

## 💡 Soluções Propostas

### Opção 1: Forçar Refresh do Chat
```typescript
// Após criar template
await queryClient.invalidateQueries(['messages', threadId]);
```

### Opção 2: Criar Agent Run Response
```typescript
// Inserir na tabela agent_run_responses
await supabase.from('agent_run_responses').insert({
  agent_run_id: agentRunId,
  response_type: 'message',
  response: template.messages[0].content,
  metadata: { isTemplate: true }
});
```

### Opção 3: Debug Mode
```typescript
// URL param para mostrar logs
if (searchParams.get('debug') === 'true') {
  showDebugPanel = true;
}
```

## 📝 Arquivos Importantes

```
frontend/
├── src/lib/onboarding/
│   ├── templates.ts                 # ✅ Definições dos templates
│   ├── create-template-project.ts   # ⚠️ Lógica de criação (quase OK)
│   └── TEMPLATE_CONTEXT.md         # ✅ Documentação para agent
│
├── src/app/(dashboard)/projects/[projectId]/
│   └── thread/                     # ❌ Precisa verificar
│       ├── page.tsx
│       └── _components/
│
└── src/hooks/
    └── use-messages.ts             # ❌ Precisa verificar

backend/
├── agent/
│   └── api.py                      # Endpoints do agent
└── sandbox/
    └── api.py                      # ✅ Upload de arquivos OK
```

## 🎬 Próximos Passos

1. **Adicionar logging persistente** para debug
2. **Verificar componente de chat** e como busca mensagens
3. **Testar se mensagem está no banco** após criação
4. **Verificar se há filtro** por agent_run_id
5. **Implementar fallback melhor** para templates

## 🏁 Critério de Sucesso

O sistema estará completo quando:
- [ ] Usuário vê mensagem do template ao entrar no projeto
- [ ] Arquivos aparecem no workspace
- [ ] Pode enviar mensagens e agent responde
- [ ] Não aparece mock/fallback genérico
- [ ] Logs são visíveis para debug

---

**Status Geral**: 70% Completo
**Bloqueador Principal**: Interface do chat não mostra mensagem do template
**Tempo Estimado para Conclusão**: 1-2 horas de debug e ajustes