/**
 * Força o refresh do workspace para mostrar os arquivos do template
 */

import { createClient } from '@/lib/supabase/client';

export async function refreshWorkspaceFiles(projectId: string, sandboxId: string): Promise<boolean> {
  try {
    if (!sandboxId || sandboxId === 'undefined') {
      console.log('❌ Sandbox ID inválido, não é possível fazer refresh');
      return false;
    }
    
    console.log('🔄 Forçando refresh do workspace...');
    
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.access_token) {
      console.error('Sem sessão ativa');
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
      console.log('📁 Arquivos no workspace:', files);
      
      // Forçar um evento customizado para atualizar o workspace
      window.dispatchEvent(new CustomEvent('workspace-files-updated', { 
        detail: { projectId, sandboxId, files } 
      }));
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Erro ao fazer refresh do workspace:', error);
    return false;
  }
}

/**
 * Verifica se o projeto tem arquivos template e força criação se necessário
 */
export async function ensureTemplateFiles(projectId: string): Promise<void> {
  const supabase = createClient();
  
  // Buscar o projeto com retry
  let project = null;
  let retries = 0;
  const maxRetries = 3;
  
  while (!project && retries < maxRetries) {
    const { data } = await supabase
      .from('projects')
      .select('sandbox')
      .eq('project_id', projectId)
      .single();
    
    if (data?.sandbox?.id) {
      project = data;
      break;
    }
    
    retries++;
    console.log(`Tentativa ${retries}/${maxRetries} para buscar sandbox...`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  if (!project?.sandbox?.id) {
    console.log('Sandbox ainda não disponível após múltiplas tentativas');
    return;
  }
  
  const sandboxId = project.sandbox.id;
  const templateFiles = project.sandbox.templateFiles || project.sandbox.pendingFiles || [];
  
  if (templateFiles.length === 0) {
    console.log('Sem arquivos template para criar');
    return;
  }
  
  console.log(`📝 Garantindo ${templateFiles.length} arquivos template no workspace...`);
  
  // Verificar se os arquivos já existem
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) return;
  
  try {
    // Tentar listar arquivos existentes (pode falhar se sandbox não estiver pronto)
    let existingFiles = [];
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
        existingFiles = await listResponse.json();
      } else {
        console.log('Sandbox ainda não está pronto para listar arquivos');
        return; // Sair se sandbox não estiver pronto
      }
    } catch (error) {
      console.log('Erro ao listar arquivos, sandbox pode não estar pronto:', error);
      return;
    }
    const existingPaths = new Set(existingFiles.map((f: any) => f.path || f.name));
    
    // Criar apenas arquivos que não existem
    for (const file of templateFiles) {
      if (!existingPaths.has(file.path)) {
        console.log(`Criando arquivo ausente: ${file.path}`);
        
        const formData = new FormData();
        const blob = new Blob([file.content], { type: 'text/plain' });
        formData.append('file', blob, file.path);
        // Não adicionar /workspace/ prefix - já está no path ou não é necessário
        formData.append('path', file.path.startsWith('/') ? file.path : `/${file.path}`);
        
        await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'}/sandboxes/${sandboxId}/files`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
            body: formData
          }
        );
        
        // Pequeno delay entre criações
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    // Forçar refresh final
    await refreshWorkspaceFiles(projectId, sandboxId);
    
  } catch (error) {
    console.error('Erro ao garantir template files:', error);
  }
}