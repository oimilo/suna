import { createMutationHook, createQueryHook } from "@/hooks/use-query";
import { threadKeys } from "./keys";
import { sunaThreads } from "@/upstream/suna/threads";

export const useMessagesQuery = (threadId: string) =>
  createQueryHook(
    threadKeys.messages(threadId),
    () => sunaThreads.getMessages(threadId),
    {
      enabled: !!threadId,
      retry: 1,
    }
  )();

export const useAddUserMessageMutation = () =>
  createMutationHook(
    ({
      threadId,
      message,
    }: {
      threadId: string;
      message: string;
    }) => sunaThreads.addUserMessage(threadId, message)
  )();
