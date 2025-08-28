import { createClient } from '@/lib/supabase/client';
import { getTemplateForProfile, OnboardingTemplate } from './templates';
import { v4 as uuidv4 } from 'uuid';

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

/**
 * Cria um projeto de template de forma simplificada
 * Sem usar initiateAgent para evitar complexidade
 */
export async function createTemplateProject({
  userId,
  profileType,
  onboardingAnswers
}: CreateTemplateProjectParams): Promise<CreateTemplateProjectResult> {
  console.log('🚀 [TEMPLATE V2] Iniciando criação simplificada:', { userId, profileType });
  
  const supabase = createClient();
  const template = getTemplateForProfile(profileType);
  
  if (!template) {
    throw new Error(`Template não encontrado para o perfil: ${profileType}`);
  }
  
  console.log('📋 [TEMPLATE V2] Template selecionado:', template.name);
  
  try {
    // 1. Criar projeto diretamente
    const projectId = uuidv4();
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        project_id: projectId,
        account_id: userId,
        name: template.name,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (projectError) {
      console.error('❌ [TEMPLATE V2] Erro ao criar projeto:', projectError);
      throw projectError;
    }
    
    console.log('✅ [TEMPLATE V2] Projeto criado:', projectId);
    
    // 2. Criar thread
    const threadId = uuidv4();
    const { data: thread, error: threadError } = await supabase
      .from('threads')
      .insert({
        thread_id: threadId,
        project_id: projectId,
        account_id: userId,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (threadError) {
      console.error('❌ [TEMPLATE V2] Erro ao criar thread:', threadError);
      throw threadError;
    }
    
    console.log('✅ [TEMPLATE V2] Thread criada:', threadId);
    
    // 3. Inserir mensagem do template
    const messageId = uuidv4();
    let messageContent = template.messages[0].content;
    
    // Se houver arquivos, adicionar informação
    if (template.files && template.files.length > 0) {
      const filesInfo = template.files.map(f => `📄 ${f.path}`).join('\n');
      messageContent = `## 📁 Arquivos do Template\n${filesInfo}\n\n---\n\n${messageContent}`;
    }
    
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        message_id: messageId,
        thread_id: threadId,
        type: 'assistant',
        is_llm_message: true,
        content: messageContent,
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
      console.error('⚠️ [TEMPLATE V2] Erro ao inserir mensagem:', messageError);
    } else {
      console.log('✅ [TEMPLATE V2] Mensagem inserida');
    }
    
    // 4. Criar sandbox via API backend
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.access_token) {
      try {
        console.log('🏗️ [TEMPLATE V2] Criando sandbox...');
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/api/projects/${projectId}/sandbox`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              template_files: template.files
            })
          }
        );
        
        if (response.ok) {
          const sandboxData = await response.json();
          console.log('✅ [TEMPLATE V2] Sandbox criado:', sandboxData);
          
          // Atualizar projeto com sandbox ID
          await supabase
            .from('projects')
            .update({
              sandbox: {
                id: sandboxData.sandbox_id,
                templateFiles: template.files,
                isOnboardingProject: true,
                profileType,
                templateId: template.id
              }
            })
            .eq('project_id', projectId);
        } else {
          console.warn('⚠️ [TEMPLATE V2] Não foi possível criar sandbox:', response.status);
        }
      } catch (error) {
        console.warn('⚠️ [TEMPLATE V2] Erro ao criar sandbox:', error);
      }
    }
    
    // 5. Salvar arquivos como backup
    if (template.files && template.files.length > 0) {
      try {
        const projectFiles = template.files.map(file => ({
          project_id: projectId,
          path: file.path,
          content: file.content,
          language: file.path.split('.').pop() || 'text',
          created_at: new Date().toISOString()
        }));
        
        await supabase
          .from('project_files')
          .insert(projectFiles);
        
        console.log('✅ [TEMPLATE V2] Arquivos salvos no backup');
      } catch (error) {
        console.log('ℹ️ [TEMPLATE V2] Backup de arquivos opcional não disponível');
      }
    }
    
    console.log('🎉 [TEMPLATE V2] Projeto criado com sucesso!');
    
    return {
      projectId,
      threadId,
      template
    };
    
  } catch (error) {
    console.error('❌ [TEMPLATE V2] Erro ao criar projeto:', error);
    throw error;
  }
}