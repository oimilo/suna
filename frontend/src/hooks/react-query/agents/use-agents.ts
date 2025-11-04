import { createMutationHook, createQueryHook } from '@/hooks/use-query';
import { useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { agentKeys } from './keys';
import { Agent, AgentUpdateRequest, AgentsParams, createAgent, deleteAgent, getAgent, getAgents, getThreadAgent, updateAgent, AgentBuilderChatRequest, AgentBuilderStreamData, startAgentBuilderChat, getAgentBuilderChatHistory } from './utils';
import { useRef, useCallback, useMemo } from 'react';
import { generateRandomAvatar } from '@/lib/utils/_avatar-generator';
import { DEFAULT_AGENTPRESS_TOOLS } from '@/components/agents/tools';

export const useAgents = (
  params: AgentsParams = {},
  customOptions?: Omit<
    UseQueryOptions<Awaited<ReturnType<typeof getAgents>>, Error, Awaited<ReturnType<typeof getAgents>>, ReturnType<typeof agentKeys.list>>,
    'queryKey' | 'queryFn'
  >,
) => {
  return createQueryHook(
    agentKeys.list(params),
    () => getAgents(params),
    {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  )(customOptions);
};

export const useAgent = (agentId: string) => {
  return createQueryHook(
    agentKeys.detail(agentId),
    () => getAgent(agentId),
    {
      enabled: !!agentId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  )();
};

export const useCreateAgent = () => {
  const queryClient = useQueryClient();
  
  return createMutationHook(
    createAgent,
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
        queryClient.setQueryData(agentKeys.detail(data.agent_id), data);
        toast.success('Agent created successfully');
      },
    }
  )();
};

export const useCreateNewAgent = () => {
  const createAgentMutation = useCreateAgent();
  
  return createMutationHook(
    async (_: void) => {
      const { avatar, avatar_color } = generateRandomAvatar();
      
      const defaultAgentData = {
        name: 'Novo Agente',
        description: '',
        system_prompt: 'Você é um assistente útil. Forneça respostas claras, precisas e úteis às consultas do usuário.',
        avatar,
        avatar_color,
        configured_mcps: [],
        agentpress_tools: Object.fromEntries(
          Object.entries(DEFAULT_AGENTPRESS_TOOLS).map(([key, value]) => [
            key, 
            { enabled: value.enabled, description: value.description }
          ])
        ),
        is_default: false,
      };

      const newAgent = await createAgentMutation.mutateAsync(defaultAgentData);
      return newAgent;
    },
    {
      onError: (error) => {
        console.error('Error creating agent:', error);
        toast.error('Failed to create agent. Please try again.');
      },
    }
  )();
};

export const useUpdateAgent = () => {
  const queryClient = useQueryClient();
  
  return createMutationHook(
    ({ agentId, ...data }: { agentId: string } & AgentUpdateRequest) => 
      updateAgent(agentId, data),
    {
      onSuccess: (data, variables) => {
        queryClient.setQueryData(agentKeys.detail(variables.agentId), data);
        queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
        if (variables.configured_mcps !== undefined || variables.custom_mcps !== undefined) {
          queryClient.invalidateQueries({ queryKey: ['agent-tools', variables.agentId] });
          queryClient.invalidateQueries({ queryKey: ['custom-mcp-tools', variables.agentId] });
        }
      },
    }
  )();
};

export const useDeleteAgent = () => {
  const queryClient = useQueryClient();
  
  return createMutationHook(
    deleteAgent,
    {
      onSuccess: (_, agentId) => {
        queryClient.removeQueries({ queryKey: agentKeys.detail(agentId) });
        queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
        toast.success('Agent deleted successfully');
      },
    }
  )();
};

export const useOptimisticAgentUpdate = () => {
  const queryClient = useQueryClient();
  
  return {
    optimisticallyUpdateAgent: (agentId: string, updates: Partial<Agent>) => {
      queryClient.setQueryData(
        agentKeys.detail(agentId),
        (oldData: Agent | undefined) => {
          if (!oldData) return oldData;
          return { ...oldData, ...updates };
        }
      );
    },
    
    revertOptimisticUpdate: (agentId: string) => {
      queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
    },
  };
};

export const useThreadAgent = (threadId: string) => {
  return createQueryHook(
    agentKeys.threadAgent(threadId),
    () => getThreadAgent(threadId),
    {
      enabled: !!threadId,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  )();
};

export const useAgentBuilderChat = () => {
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (
    request: AgentBuilderChatRequest,
    callbacks: {
      onData: (data: AgentBuilderStreamData) => void;
      onComplete: () => void;
      onError?: (error: Error) => void;
    }
  ) => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      await startAgentBuilderChat(
        request,
        callbacks.onData,
        callbacks.onComplete,
        abortControllerRef.current.signal
      );
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        console.error('Error in agent builder chat:', error);
        callbacks.onError?.(error);
      }
    } finally {
      abortControllerRef.current = null;
    }
  }, []);

  const cancelStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    sendMessage,
    cancelStream,
  };
};

export const useAgentBuilderChatHistory = (agentId: string) =>
  createQueryHook(
    agentKeys.builderChatHistory(agentId),
    () => getAgentBuilderChatHistory(agentId),
    {
      enabled: !!agentId,
      retry: 1,
    }
  )();

export const useAgentFromCache = (agentId: string | undefined): Agent | undefined => {
  const queryClient = useQueryClient();

  return useMemo(() => {
    if (!agentId) return undefined;

    const cachedAgent = queryClient.getQueryData<Agent>(agentKeys.detail(agentId));
    if (cachedAgent) return cachedAgent;

    const allAgentLists = queryClient.getQueriesData<{ agents: Agent[] }>({
      queryKey: agentKeys.lists(),
    });

    for (const [, data] of allAgentLists) {
      if (data?.agents) {
        const found = data.agents.find((agent) => agent.agent_id === agentId);
        if (found) return found;
      }
    }

    return undefined;
  }, [agentId, queryClient]);
};

export const useAgentsFromCache = (agentIds: string[]): Map<string, Agent> => {
  const queryClient = useQueryClient();

  return useMemo(() => {
    const agentsMap = new Map<string, Agent>();

    if (!agentIds || agentIds.length === 0) return agentsMap;

    const allAgentLists = queryClient.getQueriesData<{ agents: Agent[] }>({
      queryKey: agentKeys.lists(),
    });

    const allCachedAgents = new Map<string, Agent>();
    for (const [, data] of allAgentLists) {
      if (data?.agents) {
        data.agents.forEach((agent) => {
          allCachedAgents.set(agent.agent_id, agent);
        });
      }
    }

    for (const agentId of agentIds) {
      const cachedAgent = queryClient.getQueryData<Agent>(agentKeys.detail(agentId));
      if (cachedAgent) {
        allCachedAgents.set(agentId, cachedAgent);
      }
    }

    for (const agentId of agentIds) {
      const agent = allCachedAgents.get(agentId);
      if (agent) {
        agentsMap.set(agentId, agent);
      }
    }

    return agentsMap;
  }, [agentIds, queryClient]);
};
