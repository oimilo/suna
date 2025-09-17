/**
 * Garante que o template foi carregado corretamente
 * Chamado da página da thread quando detecta um projeto de template
 */

import { createClient } from '@/lib/supabase/client';
import { ensureTemplateFiles } from './refresh-workspace-files';

export async function ensureTemplateLoaded(projectId: string, threadId: string): Promise<boolean> {
  console.log('[ENSURE TEMPLATE] 🔍 Verificando projeto de template:', projectId);
  
  const supabase = createClient();
  
  try {
    // 1. Verificar se é um projeto de template
    const { data: project } = await supabase
      .from('projects')
      .select('sandbox')
      .eq('project_id', projectId)
      .single();
    
    if (!project?.sandbox) {
      console.log('[ENSURE TEMPLATE] ❌ Projeto não tem sandbox');
      return false;
    }
    
    const sandbox = project.sandbox as any;
    
    if (!sandbox.isOnboardingProject) {
      console.log('[ENSURE TEMPLATE] ℹ️ Não é um projeto de onboarding');
      return false;
    }
    
    console.log('[ENSURE TEMPLATE] ✅ É um projeto de template:', {
      templateId: sandbox.templateId,
      profileType: sandbox.profileType,
      hasFiles: !!(sandbox.templateFiles?.length)
    });
    
    // 2. Verificar se já tem mensagens do template
    const { data: messages } = await supabase
      .from('messages')
      .select('message_id, metadata')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true })
      .limit(5);
    
    const hasTemplateMessage = messages?.some(m => {
      try {
        const meta = typeof m.metadata === 'string' ? JSON.parse(m.metadata) : m.metadata;
        return meta?.isTemplateMessage === true;
      } catch {
        return false;
      }
    });
    
    if (hasTemplateMessage) {
      console.log('[ENSURE TEMPLATE] ✅ Mensagem do template já existe');
    } else {
      console.log('[ENSURE TEMPLATE] ⚠️ Mensagem do template não encontrada');
      
      // 3. Recriar mensagem do template se necessário
      const { getTemplateForProfile } = await import('./templates');
      const template = getTemplateForProfile(sandbox.profileType);
      
      if (template) {
        console.log('[ENSURE TEMPLATE] 📝 Recriando mensagem do template...');
        
        let messageContent = template.messages[0].content;
        
        // Se houver arquivos, adicionar informação sobre eles
        if (template.files && template.files.length > 0) {
          const filesInfo = template.files.map(f => `📄 ${f.path}`).join('\n');
          messageContent = `## 📁 Arquivos do template:\n${filesInfo}\n\n---\n\n${messageContent}`;
        }
        
        const { error } = await supabase
          .from('messages')
          .insert({
            message_id: crypto.randomUUID(),
            thread_id: threadId,
            type: 'assistant',
            is_llm_message: true,
            content: messageContent,
            created_at: new Date().toISOString(),
            metadata: {
              isTemplateMessage: true,
              templateId: template.id,
              profileType: sandbox.profileType,
              isFromTemplate: true,
              templateFiles: template.files
            }
          });
        
        if (error) {
          console.error('[ENSURE TEMPLATE] ❌ Erro ao recriar mensagem:', error);
        } else {
          console.log('[ENSURE TEMPLATE] ✅ Mensagem do template recriada');
        }
      }
    }
    
    // 4. Garantir que os arquivos sejam criados no sandbox
    if (sandbox.templateFiles?.length > 0 && sandbox.id) {
      console.log('[ENSURE TEMPLATE] 📁 Garantindo arquivos no workspace...');
      const filesCreated = await ensureTemplateFiles(projectId);
      console.log('[ENSURE TEMPLATE] 📁 Resultado da criação de arquivos:', filesCreated);
    }
    
    return true;
    
  } catch (error) {
    console.error('[ENSURE TEMPLATE] ❌ Erro:', error);
    return false;
  }
}

/**
 * Hook para ser usado em componentes React
 */
export function useEnsureTemplateLoaded(projectId: string | null, threadId: string | null) {
  const { useEffect, useState } = require('react');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    if (!projectId || !threadId) return;
    
    let cancelled = false;
    
    async function load() {
      if (cancelled) return;
      
      setIsLoading(true);
      try {
        const result = await ensureTemplateLoaded(projectId, threadId);
        if (!cancelled) {
          setIsLoaded(result);
        }
      } catch (error) {
        console.error('[useEnsureTemplateLoaded] Erro:', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }
    
    load();
    
    return () => {
      cancelled = true;
    };
  }, [projectId, threadId]);
  
  return { isLoading, isLoaded };
}