'use client';

import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { createTemplateProject, CreateTemplateProjectParams, CreateTemplateProjectResult } from './create-template-project';

export function useCreateTemplateProject() {
  return useMutation<CreateTemplateProjectResult, Error, CreateTemplateProjectParams>({
    mutationFn: createTemplateProject,
    onSuccess: (data) => {
      toast.success('Workspace personalizado preparado com sucesso!');
      console.log('Projeto template criado:', data);
      // O redirecionamento será feito no componente
      return data;
    },
    onError: (error) => {
      console.error('Erro ao criar projeto:', error);
      toast.error('Erro ao criar projeto. Tente novamente.');
    }
  });
}