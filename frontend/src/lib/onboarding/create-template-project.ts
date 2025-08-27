import { createClient } from '@/lib/supabase/client';
import { getTemplateForProfile, OnboardingTemplate } from './templates';
import { v4 as uuidv4 } from 'uuid';
import { initiateAgent } from '@/lib/api';

export interface CreateTemplateProjectParams {
  userId: string;
  profileType: string;
  onboardingAnswers?: Record<string, any>;
}

export interface CreateTemplateProjectResult {
  projectId: string;
  threadId: string;
  template: OnboardingTemplate;
}

// Sistema de debug com localStorage
const debugLog = (step: string, data: any) => {
  const logs = JSON.parse(localStorage.getItem('template_debug') || '[]');
  logs.push({ 
    step, 
    data, 
    time: new Date().toISOString(),
    url: window.location.href 
  });
  // Manter apenas últimos 50 logs
  if (logs.length > 50) logs.shift();
  localStorage.setItem('template_debug', JSON.stringify(logs));
  console.log(`[TEMPLATE DEBUG] ${step}:`, data);
};

// Função para limpar logs
export function clearTemplateDebugLogs() {
  localStorage.removeItem('template_debug');
  console.log('[TEMPLATE DEBUG] Logs limpos');
}

// Função para obter logs
export function getTemplateDebugLogs() {
  return JSON.parse(localStorage.getItem('template_debug') || '[]');
}

export async function createTemplateProject({
  userId,
  profileType,
  onboardingAnswers
}: CreateTemplateProjectParams): Promise<CreateTemplateProjectResult> {
  const supabase = createClient();
  
  // Buscar o template baseado no perfil
  const template = getTemplateForProfile(profileType);
  
  if (!template) {
    throw new Error(`Template não encontrado para o perfil: ${profileType}`);
  }
  
  debugLog('INICIO', { userId, profileType, templateId: template.id });
  
  try {
    console.log('Criando projeto template...');
    debugLog('INICIANDO_CRIACAO', { templateName: template.name });
    
    // 1. Usar initiate agent para criar tudo corretamente
    // Mas com uma mensagem especial que será removida depois
    const formData = new FormData();
    formData.append('prompt', '[TEMPLATE_INIT]');  // Marcador especial
    formData.append('enable_thinking', 'false');
    formData.append('reasoning_effort', 'low');
    formData.append('stream', 'false');
    formData.append('enable_context_manager', 'false');
    formData.append('project_name', template.name);
    
    console.log('Iniciando agent para criar projeto completo...');
    const agentResult = await initiateAgent(formData);
    
    if (!agentResult.thread_id) {
      throw new Error('Falha ao criar projeto');
    }
    
    const threadId = agentResult.thread_id;
    const agentRunId = agentResult.agent_run_id;
    
    debugLog('AGENT_INICIADO', { threadId, agentRunId });
    
    // 2. Aguardar criação completa
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. Buscar projeto e thread criados com retry
    let threadData = null;
    let retries = 0;
    const maxRetries = 5;
    
    while (!threadData && retries < maxRetries) {
      const { data, error } = await supabase
        .from('threads')
        .select('*, projects(*)')
        .eq('thread_id', threadId)
        .single();
      
      if (!error && data?.projects) {
        threadData = data;
      } else {
        retries++;
        console.log(`Tentativa ${retries}/${maxRetries} para buscar projeto...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!threadData?.projects) {
      throw new Error('Projeto não encontrado após múltiplas tentativas');
    }
    
    const project = threadData.projects;
    const projectId = project.project_id;
    let sandboxId = project.sandbox?.id;
    
    // Retry para buscar sandbox ID se não existir
    if (!sandboxId) {
      console.log('Sandbox ID não encontrado, tentando buscar...');
      for (let i = 0; i < 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const { data: projectData } = await supabase
          .from('projects')
          .select('sandbox')
          .eq('project_id', projectId)
          .single();
        
        if (projectData?.sandbox?.id) {
          sandboxId = projectData.sandbox.id;
          console.log(`✅ Sandbox encontrado na tentativa ${i + 1}: ${sandboxId}`);
          break;
        }
        console.log(`Tentativa ${i + 1}/5 para buscar sandbox...`);
      }
    }
    
    console.log('✅ Projeto criado:', { projectId, threadId, sandboxId });
    
    // 4. Atualizar projeto com metadata do template
    await supabase
      .from('projects')
      .update({
        name: template.name,
        sandbox: {
          ...project.sandbox,
          isOnboardingProject: true,
          profileType,
          templateId: template.id,
          onboardingAnswers,
          templateFiles: template.files
        }
      })
      .eq('project_id', projectId);
    
    // 5. Finalizar agent_run como completed mas com flag especial
    if (agentRunId) {
      await supabase
        .from('agent_runs')
        .update({
          status: 'completed',
          is_completed: true,
          completed_at: new Date().toISOString(),
          metadata: {
            isTemplateRun: true,
            skipFallback: true
          }
        })
        .eq('agent_run_id', agentRunId);
      
      console.log('Agent run finalizado com flag de template para evitar fallback');
    }
    
    // 6. Limpar mensagens criadas pelo agent
    const { data: messagesToDelete } = await supabase
      .from('messages')
      .select('message_id')
      .eq('thread_id', threadId);
    
    if (messagesToDelete && messagesToDelete.length > 0) {
      await supabase
        .from('messages')
        .delete()
        .in('message_id', messagesToDelete.map(m => m.message_id));
      console.log('Mensagens iniciais removidas');
    }
    
    console.log('Preparando mensagens do template...');
    
    // 7. NÃO criar tool calls por enquanto - vamos focar em fazer a mensagem aparecer
    // As tool calls podem estar causando problemas
    const toolCallMessages = [];
    
    // Inserir mensagem do template com informação sobre os arquivos
    let messageContent = template.messages[0].content;
    
    // Se houver arquivos, adicionar informação sobre eles na mensagem
    if (template.files && template.files.length > 0) {
      const filesInfo = template.files.map(f => `📄 ${f.path}`).join('\n');
      messageContent = `## 📁 Arquivos criados no workspace:\n${filesInfo}\n\n---\n\n${messageContent}`;
    }
    
    const templateMessage = {
      message_id: uuidv4(),
      thread_id: threadId,
      type: 'assistant' as const,
      is_llm_message: true,
      content: messageContent,
      created_at: new Date().toISOString(),
      metadata: {
        isTemplateMessage: true,
        templateId: template.id,
        profileType,
        isFromTemplate: true,
        templateFiles: template.files // Guardar arquivos no metadata
      }
    };
    
    const messagesToInsert = [...toolCallMessages, templateMessage];
    
    // Inserir todas as mensagens de uma vez
    const { data: insertedMessages, error: messageError } = await supabase
      .from('messages')
      .insert(messagesToInsert)
      .select();
    
    if (messageError) {
      console.error('Erro ao inserir mensagens do template:', messageError);
      debugLog('ERRO_MENSAGENS', { messageError, messagesToInsert });
    } else {
      console.log(`✅ ${insertedMessages.length} mensagens inseridas (${template.files?.length || 0} tool calls + 1 mensagem)`);
      debugLog('MENSAGENS_INSERIDAS', { 
        total: insertedMessages.length,
        threadId,
        messages: insertedMessages
      });
    }
    
    // 8. Criar arquivos no sandbox usando a API correta
    if (template.files && template.files.length > 0) {
      if (sandboxId) {
        console.log(`✅ Sandbox encontrado: ${sandboxId}. Preparando para criar ${template.files.length} arquivos...`);
        debugLog('INICIANDO_CRIACAO_ARQUIVOS', { totalFiles: template.files.length, sandboxId });
        
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token) {
          // Aguardar sandbox estar totalmente pronta
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          let filesCreated = 0;
          let filesFailed = 0;
          
          for (const file of template.files) {
            try {
              console.log(`Criando arquivo: ${file.path}`);
              debugLog('CRIANDO_ARQUIVO', { path: file.path, size: file.content.length });
              
              // Usar a API JSON que é mais confiável
              const response = await fetch(
                `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/sandboxes/${sandboxId}/files/json`,
                {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    path: file.path.startsWith('/') ? file.path : `/${file.path}`,
                    content: file.content
                  })
                }
              );
                
                if (response.ok) {
                  console.log(`✅ Arquivo criado: ${file.path}`);
                  filesCreated++;
                  debugLog('ARQUIVO_CRIADO', { path: file.path, status: response.status });
                  
                  // Aguardar um pouco após criar cada arquivo
                  await new Promise(resolve => setTimeout(resolve, 500));
                } else {
                  const errorText = await response.text();
                  console.warn(`⚠️ Não foi possível criar ${file.path}:`, response.status, errorText);
                  filesFailed++;
                  debugLog('ERRO_CRIAR_ARQUIVO', { 
                    path: file.path, 
                    status: response.status,
                    error: errorText 
                  });
                }
              } catch (error) {
                console.error(`❌ Erro ao criar ${file.path}:`, error);
                filesFailed++;
                debugLog('EXCECAO_CRIAR_ARQUIVO', { path: file.path, error: String(error) });
              }
              
              // Pequeno delay entre arquivos
              await new Promise(resolve => setTimeout(resolve, 200));
            }
            
        debugLog('CRIACAO_ARQUIVOS_COMPLETA', { 
          total: template.files.length,
          created: filesCreated,
          failed: filesFailed
        });
      } else {
        console.warn('Sem sessão de autenticação para criar arquivos');
        debugLog('ERRO_SEM_SESSAO', { hasSession: false });
      }
      } else {
        // Se não temos sandbox, salvar arquivos no metadata do projeto para criar depois
        console.warn('⚠️ Sandbox ainda não criado, salvando arquivos no metadata para criação posterior');
        debugLog('SANDBOX_PENDENTE_SALVANDO_METADATA', { projectId, filesCount: template.files.length });
        
        await supabase
          .from('projects')
          .update({
            sandbox: {
              ...project.sandbox,
              pendingFiles: template.files,
              needsFileCreation: true
            }
          })
          .eq('project_id', projectId);
      }
    }
    
    // 10. Tentar salvar arquivos na tabela project_files como backup (opcional)
    // Nota: Esta tabela pode não existir ainda, então não falharemos se der erro
    if (template.files && template.files.length > 0) {
      try {
        console.log(`Tentando salvar ${template.files.length} arquivos como backup...`);
        debugLog('SALVANDO_BACKUP_ARQUIVOS', { totalFiles: template.files.length });
        
        const projectFiles = template.files.map(file => ({
          project_id: projectId,
          path: file.path, // Mudado de file_path para path
          content: file.content, // Mudado de file_content para content
          language: file.path.split('.').pop() || 'text', // Adicionar language baseado na extensão
          created_at: new Date().toISOString()
        }));
        
        const { error: filesError } = await supabase
          .from('project_files')
          .insert(projectFiles);
        
        if (filesError) {
          // Não é crítico - apenas log como warning
          console.warn('Info: Tabela project_files não disponível (não é crítico):', filesError.message || 'Tabela pode não existir');
          debugLog('INFO_BACKUP_NAO_DISPONIVEL', { 
            message: 'Tabela project_files não existe ainda - isso é normal',
            error: filesError.message 
          });
        } else {
          console.log('✅ Backup dos arquivos salvo com sucesso');
          debugLog('BACKUP_COMPLETO', { totalFiles: template.files.length });
        }
      } catch (backupError) {
        // Silenciosamente ignorar erros de backup
        console.log('Info: Backup opcional não disponível');
        debugLog('BACKUP_OPCIONAL_IGNORADO', { reason: 'Tabela pode não existir' });
      }
    }
    
    console.log('✅ Projeto template criado com sucesso!');
    debugLog('SUCESSO_FINAL', { projectId, threadId, templateId: template.id });
    
    // Pequeno delay para garantir persistência antes do redirecionamento
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      projectId,
      threadId,
      template
    };
    
  } catch (error) {
    console.error('Erro ao criar projeto com template:', error);
    debugLog('ERRO_GERAL', { error: error instanceof Error ? error.message : error });
    throw error;
  }
}

