import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { threadKeys } from '@/hooks/react-query/threads/keys';
import { Project } from '@/app/(dashboard)/projects/[projectId]/thread/_types';

export function useProjectRealtime(projectId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const supabase = createClient();

    const channel = supabase
      .channel(`project-${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newData = payload.new as Project;
          const oldData = payload.old as Project;

          if (
            newData?.sandbox &&
            (!oldData?.sandbox ||
              JSON.stringify(newData.sandbox) !== JSON.stringify(oldData.sandbox))
          ) {
            queryClient.invalidateQueries({
              queryKey: threadKeys.project(projectId),
            });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [projectId, queryClient]);
}
