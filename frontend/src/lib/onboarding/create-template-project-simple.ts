import { initiateAgent } from '@/lib/api';
import { getTemplateForProfile, OnboardingTemplate } from './templates';
import { createClient } from '@/lib/supabase/client';

export interface CreateTemplateProjectParams {
  userId: string;
  profileType: string;
  persona?: {
    goal?: string;
    focus?: string;
    tone?: string;
    profile?: string;
    interests?: string[];
  };
  onboardingAnswers?: Record<string, any>;
}

export interface CreateTemplateProjectResult {
  projectId: string;
  threadId: string;
  template: OnboardingTemplate;
}

/**
 * Versão simplificada que usa o fluxo normal do initiateAgent
 * Aceita que a mensagem do template apareça como do usuário
 * Mas garante que o conteúdo e arquivos estejam corretos
 */
export async function createTemplateProject({
  userId,
  profileType,
  persona,
  onboardingAnswers
}: CreateTemplateProjectParams): Promise<CreateTemplateProjectResult> {
  console.log('🚀 [TEMPLATE SIMPLE] Iniciando criação:', { userId, profileType, persona });
  
  const template = getTemplateForProfile(profileType);
  
  if (!template) {
    throw new Error(`Template não encontrado para o perfil: ${profileType}`);
  }
  
  console.log('📋 [TEMPLATE SIMPLE] Template selecionado:', template.name);
  
  try {
    const formData = new FormData();
    
    // Enviar prompt simples
    formData.append('prompt', 'Projeto criado via template');
    
    // Metadados para criação do projeto
    formData.append('metadata', JSON.stringify({
      isOnboardingProject: true,
      templateId: template.id,
      profileType,
      persona,
      onboardingAnswers,
      projectName: template.name
    }));
    
    formData.append('project_name', template.name);
    
    // Adicionar arquivos do template
    if (template.files && template.files.length > 0) {
      console.log(`📁 [TEMPLATE SIMPLE] Adicionando ${template.files.length} arquivos`);
      
      template.files.forEach((file, index) => {
        const blob = new Blob([file.content], { type: 'text/plain' });
        const fileName = file.path.split('/').pop() || `file${index}.txt`;
        const fileObj = new File([blob], fileName, {
          type: 'text/plain'
        });
        
        formData.append('files', fileObj);
        console.log(`📄 [TEMPLATE SIMPLE] Arquivo: ${file.path}`);
      });
    }
    
    // Configurações - stream false para não iniciar agente automaticamente
    formData.append('enable_thinking', 'false');
    formData.append('stream', 'false');
    formData.append('enable_context_manager', 'false');
    
    console.log('🚀 [TEMPLATE SIMPLE] Chamando initiateAgent...');
    const result = await initiateAgent(formData);
    
    console.log('✅ [TEMPLATE SIMPLE] Agent iniciado:', {
      threadId: result.thread_id,
      agentRunId: result.agent_run_id
    });
    
    if (!result.thread_id) {
      throw new Error('initiateAgent não retornou thread_id');
    }
    
    // Buscar project_id
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
        console.log('✅ [TEMPLATE SIMPLE] Project ID:', projectId);
        break;
      }
      
      retries++;
      console.log(`⏳ [TEMPLATE SIMPLE] Aguardando project_id... ${retries}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (!projectId) {
      throw new Error('Não foi possível obter o project_id');
    }
    
    // Inserir mensagem mock do template como mensagem do assistente
    console.log('💬 [TEMPLATE SIMPLE] Inserindo mensagem mock do template...');
    
    await supabase.from('messages').insert({
      thread_id: result.thread_id,
      type: 'assistant',
      content: JSON.stringify({
        content: template.messages[0].content
      }),
      metadata: JSON.stringify({
        isTemplateMockMessage: true,
        templateId: template.id
      }),
      created_at: new Date(Date.now() - 2000).toISOString(),
      updated_at: new Date(Date.now() - 2000).toISOString()
    });
    
    // Inserir segunda mensagem mock para impedir resposta do agente
    console.log('💬 [TEMPLATE SIMPLE] Inserindo mensagem final do assistente...');
    
    await supabase.from('messages').insert({
      thread_id: result.thread_id,
      type: 'assistant',
      content: JSON.stringify({
        content: 'Como deseja continuar?'
      }),
      metadata: JSON.stringify({
        isTemplateMockMessage: true,
        templateId: template.id,
        isFinalMessage: true
      }),
      created_at: new Date(Date.now() + 1000).toISOString(),
      updated_at: new Date(Date.now() + 1000).toISOString()
    });
    
    console.log('🎉 [TEMPLATE SIMPLE] Sucesso!', {
      projectId,
      threadId: result.thread_id,
      templateName: template.name,
      filesCount: template.files?.length || 0
    });
    
    return {
      projectId,
      threadId: result.thread_id,
      template
    };
    
  } catch (error) {
    console.error('❌ [TEMPLATE SIMPLE] Erro:', error);
    throw error;
  }
}