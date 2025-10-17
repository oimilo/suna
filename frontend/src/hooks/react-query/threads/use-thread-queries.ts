'use client';

import { createQueryHook } from '@/hooks/use-query';
import { sunaThreads } from '@/upstream/suna/threads';
import { threadKeys } from './keys';

export const useThreadsByProject = (projectId?: string) =>
  createQueryHook(
    threadKeys.byProject(projectId || ''),
    () => projectId ? sunaThreads.getThreads(projectId) : Promise.resolve([]),
    {
      enabled: !!projectId,
      staleTime: 2 * 60 * 1000, 
      refetchOnWindowFocus: false,
    }
  )();

export const useAllThreads = createQueryHook(
  threadKeys.all,
  () => sunaThreads.getThreads(),
  {
    staleTime: 2 * 60 * 1000, 
    refetchOnWindowFocus: false,
  }
); 