'use client';

import { createMutationHook } from '@/hooks/use-query';
import { 
  createProject, 
  updateProject, 
  deleteProject,
  Project 
} from '@/lib/api';
import { toast } from 'sonner';
import { projectKeys, threadKeys } from './keys';
import { useQueryClient } from '@tanstack/react-query';

export const useCreateProject = createMutationHook(
  (data: { name: string; description: string; accountId?: string }) => 
    createProject(data, data.accountId),
  {
    onSuccess: () => {
      toast.success('Project created successfully');
    },
    errorContext: {
      operation: 'create project',
      resource: 'project'
    }
  }
);

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return createMutationHook(
    ({ projectId, data }: { projectId: string; data: Partial<Project> }) => 
      updateProject(projectId, data),
    {
      onSuccess: (_, variables) => {
        // Invalidate all project queries
        queryClient.invalidateQueries({ queryKey: projectKeys.all });
        // Invalidate all thread queries (they contain project names)
        queryClient.invalidateQueries({ queryKey: threadKeys.all });
        // Invalidate specific project query
        queryClient.invalidateQueries({ queryKey: projectKeys.details(variables.projectId) });
      },
      errorContext: {
        operation: 'update project',
        resource: 'project'
      }
    }
  )();
};

export const useDeleteProject = createMutationHook(
  ({ projectId }: { projectId: string }) => deleteProject(projectId),
  {
    onSuccess: () => {
      toast.success('Project deleted successfully');
    },
    errorContext: {
      operation: 'delete project',
      resource: 'project'
    }
  }
); 