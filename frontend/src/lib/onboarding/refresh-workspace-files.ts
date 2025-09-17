/**
 * Força o refresh do workspace para mostrar os arquivos do template
 */

import { createClient } from '@/lib/supabase/client';

export async function refreshWorkspaceFiles(projectId: string, sandboxId: string): Promise<boolean> {
  try {
    if (!sandboxId || sandboxId === 'undefined') {
      console.log('[REFRESH] ❌ Sandbox ID inválido');
      return false;
    }
    
    console.log('[REFRESH] 🔄 Atualizando workspace...');
    
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('[REFRESH] Sem sessão ativa');
      return false;
    }
    
    // Tentar listar arquivos na raiz do sandbox
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/sandboxes/${sandboxId}/files/list?path=/`,
      {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        }
      }
    );
    
    if (response.ok) {
      const files = await response.json();
      console.log('[REFRESH] 📁 Arquivos encontrados:', files.length);
      
      // Forçar um evento customizado para atualizar o workspace
      window.dispatchEvent(new CustomEvent('workspace-files-updated', { 
        detail: { projectId, sandboxId, files } 
      }));
      
      return true;
    } else {
      console.log('[REFRESH] ⚠️ Sandbox ainda não está pronto:', response.status);
    }
    
    return false;
  } catch (error) {
    console.error('[REFRESH] Erro:', error);
    return false;
  }
}

/**
 * Verifica se o projeto tem arquivos template e força criação se necessário
 */
export async function ensureTemplateFiles(projectId: string): Promise<boolean> {
  const supabase = createClient();
  
  console.log('[TEMPLATE FILES] 🔍 Verificando arquivos do template para projeto:', projectId);
  
  // Buscar o projeto com retry
  let project = null;
  let retries = 0;
  const maxRetries = 5; // Aumentado para dar mais tempo ao sandbox
  
  while (!project && retries < maxRetries) {
    const { data } = await supabase
      .from('projects')
      .select('sandbox')
      .eq('project_id', projectId)
      .single();
    
    if (data?.sandbox?.id) {
      project = data;
      console.log('[TEMPLATE FILES] ✅ Sandbox encontrado:', data.sandbox.id);
      break;
    }
    
    retries++;
    console.log(`[TEMPLATE FILES] ⏳ Tentativa ${retries}/${maxRetries} para buscar sandbox...`);
    await new Promise(resolve => setTimeout(resolve, 3000)); // Aumentado para 3s
  }
  
  if (!project?.sandbox?.id) {
    console.log('[TEMPLATE FILES] ❌ Sandbox não disponível após tentativas');
    return false;
  }
  
  const sandboxId = project.sandbox.id;
  const templateFiles = project.sandbox.templateFiles || [];
  
  if (templateFiles.length === 0) {
    console.log('[TEMPLATE FILES] ⚠️ Sem arquivos template para criar');
    return true; // Não é erro, apenas não há arquivos
  }
  
  console.log(`[TEMPLATE FILES] 📝 Criando ${templateFiles.length} arquivos no workspace...`);
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) {
    console.error('[TEMPLATE FILES] ❌ Sem sessão ativa');
    return false;
  }
  
  // Aguardar sandbox estar pronto
  let sandboxReady = false;
  let sandboxRetries = 0;
  const maxSandboxRetries = 10;
  
  while (!sandboxReady && sandboxRetries < maxSandboxRetries) {
    try {
      const listResponse = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/sandboxes/${sandboxId}/files/list?path=/`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          }
        }
      );
      
      if (listResponse.ok) {
        sandboxReady = true;
        console.log('[TEMPLATE FILES] ✅ Sandbox está pronto!');
        break;
      } else if (listResponse.status === 404) {
        sandboxRetries++;
        console.log(`[TEMPLATE FILES] ⏳ Sandbox ainda não pronto, tentativa ${sandboxRetries}/${maxSandboxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.error('[TEMPLATE FILES] ❌ Erro inesperado:', listResponse.status);
        return false;
      }
    } catch (error) {
      sandboxRetries++;
      console.log(`[TEMPLATE FILES] ⏳ Erro ao verificar sandbox, tentativa ${sandboxRetries}/${maxSandboxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  if (!sandboxReady) {
    console.error('[TEMPLATE FILES] ❌ Sandbox não ficou pronto a tempo');
    return false;
  }
  
  // Agora criar os arquivos
  try {
    let createdCount = 0;
    
    for (const file of templateFiles) {
      console.log(`[TEMPLATE FILES] 📄 Criando: ${file.path}`);
      
      try {
        const formData = new FormData();
        const blob = new Blob([file.content], { type: 'text/plain' });
        formData.append('file', blob, file.path.split('/').pop() || 'file.txt');
        
        // Garantir que o path está correto
        const filePath = file.path.startsWith('/') ? file.path : `/${file.path}`;
        formData.append('path', filePath);
        
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/sandboxes/${sandboxId}/files`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: formData
          }
        );
        
        if (response.ok) {
          createdCount++;
          console.log(`[TEMPLATE FILES] ✅ Arquivo criado: ${file.path}`);
        } else {
          console.error(`[TEMPLATE FILES] ❌ Erro ao criar ${file.path}:`, response.status);
        }
        
        // Pequeno delay entre criações
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`[TEMPLATE FILES] ❌ Erro ao criar arquivo ${file.path}:`, error);
      }
    }
    
    console.log(`[TEMPLATE FILES] 📊 Criados ${createdCount}/${templateFiles.length} arquivos`);
    
    // Forçar refresh final
    await refreshWorkspaceFiles(projectId, sandboxId);
    
    return createdCount > 0;
    
  } catch (error) {
    console.error('[TEMPLATE FILES] ❌ Erro geral:', error);
    return false;
  }
}