import { initiateAgent } from '@/lib/api';
import { getTemplateForProfile, OnboardingTemplate } from './templates';
import { createClient } from '@/lib/supabase/client';

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

export async function createTemplateProject({
  userId,
  profileType,
  onboardingAnswers
}: CreateTemplateProjectParams): Promise<CreateTemplateProjectResult> {
  console.log('🚀 [TEMPLATE] Iniciando criação de projeto com template:', { userId, profileType });
  
  // Buscar o template baseado no perfil
  const template = getTemplateForProfile(profileType);
  
  if (!template) {
    throw new Error(`Template não encontrado para o perfil: ${profileType}`);
  }
  
  console.log('📋 [TEMPLATE] Template selecionado:', template.name);
  
  try {
    // Criar FormData como no dashboard normal
    const formData = new FormData();
    
    // Usar prompt vazio para criar o projeto sem mensagem inicial
    formData.append('prompt', '');
    
    // Adicionar metadados do template e nome do projeto
    formData.append('metadata', JSON.stringify({
      isOnboardingProject: true,
      templateId: template.id,
      profileType,
      onboardingAnswers,
      projectName: template.name
    }));
    
    // Adicionar nome do projeto explicitamente
    formData.append('project_name', template.name);
    
    // Se o template tiver arquivos, adicioná-los como files
    if (template.files && template.files.length > 0) {
      console.log(`📁 [TEMPLATE] Adicionando ${template.files.length} arquivos ao FormData`);
      
      template.files.forEach((file, index) => {
        // Criar um Blob/File a partir do conteúdo do template
        const blob = new Blob([file.content], { type: 'text/plain' });
        const fileName = file.path.split('/').pop() || `file${index}.txt`;
        const fileObj = new File([blob], fileName, {
          type: 'text/plain'
        });
        
        formData.append('files', fileObj);
        console.log(`📄 [TEMPLATE] Arquivo adicionado: ${file.path}`);
      });
    }
    
    // Configurações padrão para templates
    formData.append('enable_thinking', 'false');
    formData.append('stream', 'true');
    formData.append('enable_context_manager', 'false');
    
    console.log('🚀 [TEMPLATE] Chamando initiateAgent com FormData');
    
    // Usar initiateAgent como o dashboard faz
    const result = await initiateAgent(formData);
    
    console.log('✅ [TEMPLATE] Resultado do initiateAgent:', {
      threadId: result.thread_id,
      agentRunId: result.agent_run_id
    });
    
    if (!result.thread_id) {
      throw new Error('initiateAgent não retornou thread_id');
    }
    
    // Buscar o project_id da thread criada
    const supabase = createClient();
    let projectId: string | null = null;
    let retries = 0;
    const maxRetries = 5;
    
    while (!projectId && retries < maxRetries) {
      const { data: thread } = await supabase
        .from('threads')
        .select('project_id')
        .eq('thread_id', result.thread_id)
        .single();
      
      if (thread?.project_id) {
        projectId = thread.project_id;
        console.log('✅ [TEMPLATE] Project ID encontrado:', projectId);
        break;
      }
      
      retries++;
      console.log(`⏳ [TEMPLATE] Aguardando project_id... tentativa ${retries}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!projectId) {
      throw new Error('Não foi possível obter o project_id');
    }
    
    // Aguardar o agente processar (se houver algum processamento)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Deletar mensagens vazias que possam ter sido criadas
    try {
      const { data: existingMessages } = await supabase
        .from('messages')
        .select('message_id, type, content')
        .eq('thread_id', result.thread_id)
        .order('created_at', { ascending: true });
      
      if (existingMessages) {
        for (const msg of existingMessages) {
          // Deletar mensagens vazias ou muito curtas
          if (!msg.content || msg.content.trim().length < 2) {
            await supabase
              .from('messages')
              .delete()
              .eq('message_id', msg.message_id);
            console.log('🗑️ [TEMPLATE] Mensagem vazia removida');
          }
        }
      }
    } catch (error) {
      console.log('⚠️ [TEMPLATE] Erro ao limpar mensagens vazias:', error);
    }
    
    // Agora inserir a mensagem do template como assistente
    const templateContent = template.messages[0].content;
    const { data: templateMessage, error: messageError } = await supabase
      .from('messages')
      .insert({
        message_id: crypto.randomUUID(),
        thread_id: result.thread_id,
        type: 'assistant',  // IMPORTANTE: tipo assistente
        is_llm_message: true,
        content: templateContent,
        created_at: new Date().toISOString(),
        metadata: JSON.stringify({
          isTemplateMessage: true,
          templateId: template.id,
          profileType,
          templateFiles: template.files
        })
      })
      .select()
      .single();
    
    if (messageError) {
      console.error('⚠️ [TEMPLATE] Erro ao inserir mensagem do template:', messageError);
    } else {
      console.log('✅ [TEMPLATE] Mensagem do template inserida como assistente');
    }
    
    console.log('🎉 [TEMPLATE] Projeto template criado com sucesso!');
    console.log('📊 [TEMPLATE] Resumo:', {
      projectId,
      threadId: result.thread_id,
      templateId: template.id,
      templateName: template.name,
      filesCount: template.files?.length || 0,
      messageInserted: !messageError
    });
    
    return {
      projectId,
      threadId: result.thread_id,
      template
    };
    
  } catch (error) {
    console.error('❌ [TEMPLATE] Erro ao criar projeto com template:', error);
    throw error;
  }
}

// Funções auxiliares para debug
export function clearTemplateDebugLogs() {
  localStorage.removeItem('template_debug');
  console.log('[TEMPLATE DEBUG] Logs limpos');
}

export function getTemplateDebugLogs() {
  return JSON.parse(localStorage.getItem('template_debug') || '[]');
}