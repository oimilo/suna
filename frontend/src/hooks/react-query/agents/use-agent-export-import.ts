import { useMutation } from '@tanstack/react-query';
import { backendApi } from '@/lib/api-client';
import { toast } from 'sonner';

export function useExportAgent() {
  return useMutation({
    mutationFn: async (agentId: string) => {
      if (!agentId) throw new Error('agentId is required');
      const res = await backendApi.get<Record<string, any>>(`/agents/${agentId}/export`);
      if (!res.success || !res.data) {
        throw new Error(res.error?.message || 'Failed to export agent');
      }

      // Convert JSON response into downloadable file
      const jsonContent = JSON.stringify(res.data, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `agent-${agentId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      return true;
    },
    onSuccess: () => {
      toast.success('Agent exported successfully');
    },
    onError: (err: any) => {
      toast.error(err?.message || 'Failed to export agent');
    },
  });
}

