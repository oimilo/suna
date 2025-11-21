export * from './api/agents';
export * from './api/api-keys';
export * from './api/billing';
export * from './api/errors';
export * from './api/health';
export * from './api/phone-verification';
export * from './api/projects';
export * from './api/sandbox';
export * from './api/streaming';
export * from './api/threads';
export * from './api/transcription';
export * from './api/usage';

import { unifiedAgentStart } from './api/agents';

export interface InitiateAgentResponse {
  thread_id: string;
  agent_run_id: string;
  status: string;
}

const extractStringValue = (value: FormDataEntryValue | null): string | undefined => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
};

export const initiateAgent = async (formData: FormData): Promise<InitiateAgentResponse> => {
  const promptEntry = formData.get('prompt');
  const modelNameEntry = formData.get('model_name');
  const agentIdEntry = formData.get('agent_id');
  const files = formData
    .getAll('files')
    .filter((file): file is File => typeof File !== 'undefined' && file instanceof File);

  return unifiedAgentStart({
    prompt: typeof promptEntry === 'string' ? promptEntry : undefined,
    model_name: extractStringValue(modelNameEntry),
    agent_id: extractStringValue(agentIdEntry),
    files: files.length ? files : undefined,
  });
};

export const startAgent = async (
  threadId: string,
  options?: { model_name?: string; agent_id?: string },
) => {
  return unifiedAgentStart({
    threadId,
    model_name: options?.model_name?.trim() || undefined,
    agent_id: options?.agent_id,
  });
};
