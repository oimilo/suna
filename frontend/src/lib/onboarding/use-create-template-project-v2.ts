'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createTemplateProject, CreateTemplateProjectParams, CreateTemplateProjectResult } from './create-template-project-v2';

export function useCreateTemplateProjectV2() {
  return useMutation<CreateTemplateProjectResult, Error, CreateTemplateProjectParams>({
    mutationFn: createTemplateProject,
    onSuccess: (data) => {
      toast.success('Workspace personalizado preparado com sucesso!');
      console.log('[HOOK V2] Projeto template criado:', data);
      return data;
    },
    onError: (error) => {
      console.error('[HOOK V2] Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto. Tente novamente.');
    }
  });
}