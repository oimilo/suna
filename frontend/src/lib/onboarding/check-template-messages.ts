import { createClient } from '@/lib/supabase/client';

export async function checkAndFixTemplateMessages(projectId: string, threadId: string) {
  const supabase = createClient();
  
  try {
    // Check if project has template metadata
    const { data: project } = await supabase
      .from('projects')
      .select('sandbox')
      .eq('project_id', projectId)
      .single();
    
    if (!project?.sandbox?.isOnboardingProject) {
      console.log('[TEMPLATE] Not a template project');
      return false;
    }
    
    // Check if messages exist
    const { data: messages, error } = await supabase
      .from('messages')
      .select('message_id')
      .eq('thread_id', threadId)
      .limit(1);
    
    if (error) {
      console.error('[TEMPLATE] Error checking messages:', error);
      return false;
    }
    
    if (messages && messages.length > 0) {
      console.log('[TEMPLATE] Messages already exist');
      return true;
    }
    
    // No messages found for template project - this is the issue!
    console.log('[TEMPLATE] Template project has no messages! This needs fixing.');
    
    // Get template info from project metadata
    const templateId = project.sandbox.templateId;
    const profileType = project.sandbox.profileType;
    
    console.log('[TEMPLATE] Template info:', { templateId, profileType });
    
    // We could insert a fallback message here, but it's better to fix the root cause
    // in create-template-project.ts
    
    return false;
  } catch (error) {
    console.error('[TEMPLATE] Error in checkAndFixTemplateMessages:', error);
    return false;
  }
}