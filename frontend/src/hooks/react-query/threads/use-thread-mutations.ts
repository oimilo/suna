'use client';

import { createMutationHook } from '@/hooks/use-query';
import { sunaThreads } from '@/upstream/suna/threads';
import { toast } from 'sonner';

export const useCreateThread = createMutationHook(
  ({ projectId }: { projectId: string }) => sunaThreads.createThread(projectId),
  {
    onSuccess: () => {
      toast.success('Conversa criada com sucesso');
    },
    errorContext: {
      operation: 'create thread',
      resource: 'thread'
    }
  }
);

export const useAddUserMessage = createMutationHook(
  ({ threadId, content }: { threadId: string; content: string }) => 
    sunaThreads.addUserMessage(threadId, content),
  {
    errorContext: {
      operation: 'add message',
      resource: 'message'
    }
  }
); 