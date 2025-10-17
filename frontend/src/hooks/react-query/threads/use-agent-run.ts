import { createMutationHook, createQueryHook } from "@/hooks/use-query";
import { threadKeys } from "./keys";
import { BillingError } from "@/lib/api";
import { sunaThreads } from "@/upstream/suna/threads";

export const useAgentRunsQuery = (threadId: string) =>
  createQueryHook(
    threadKeys.agentRuns(threadId),
    () => sunaThreads.getAgentRuns(threadId),
    {
      enabled: !!threadId,
      retry: 1,
    }
  )();

export const useStartAgentMutation = () =>
  createMutationHook(
    ({
      threadId,
      options,
    }: {
      threadId: string;
      options?: {
        model_name?: string;
        enable_thinking?: boolean;
        reasoning_effort?: string;
        stream?: boolean;
        agent_id?: string;
      };
    }) => sunaThreads.startAgent(threadId, options),
    {
      onError: (error) => {
        if (!(error instanceof BillingError)) {
          throw error;
        }
      },
    }
  )();

export const useStopAgentMutation = () =>
  createMutationHook((agentRunId: string) => sunaThreads.stopAgent(agentRunId))();
