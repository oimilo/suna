import { useVersionStore } from '@/lib/versioning';

export function useAgentVersionStore() {
  return useVersionStore();
}