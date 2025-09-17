'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createTemplateProject, CreateTemplateProjectParams, CreateTemplateProjectResult } from './create-template-project-simple';

export function useCreateTemplateProjectSimple() {
  return useMutation<CreateTemplateProjectResult, Error, CreateTemplateProjectParams>({
    mutationFn: createTemplateProject,
    onSuccess: (data) => {
      toast.success('Workspace personalizado criado com sucesso!');
      console.log('[HOOK SIMPLE] Projeto template criado:', data);
      return data;
    },
    onError: (error) => {
      console.error('[HOOK SIMPLE] Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto. Tente novamente.');
    }
  });
}