import { ToolCallData, ToolResultData } from '../types';

export interface DeployToolData {
  name: string | null;
  directoryPath: string | null;
  url: string | null;
  projectName: string | null;
  message: string | null;
  actualIsSuccess: boolean;
  actualToolTimestamp?: string;
  actualAssistantTimestamp?: string;
}

export function extractDeployData(
  toolCall: ToolCallData,
  toolResult: ToolResultData | undefined,
  isSuccess: boolean = true,
  toolTimestamp?: string,
  assistantTimestamp?: string
): DeployToolData {
  const args = toolCall.arguments || {};
  let name: string | null = null;
  let directoryPath: string | null = null;
  let url: string | null = null;
  let projectName: string | null = null;
  let message: string | null = null;

  // Extract from arguments
  if (args.name) {
    name = String(args.name);
  }
  if (args.directory_path) {
    directoryPath = String(args.directory_path);
  }

  // Extract from toolResult output
  if (toolResult?.output) {
    const output = toolResult.output;

    if (typeof output === 'string') {
      try {
        // Try to parse as JSON first
        const parsed = JSON.parse(output);
        url = parsed.url || null;
        projectName = parsed.project_name || null;
        message = parsed.message || null;
        if (parsed.directory && !directoryPath) {
          directoryPath = parsed.directory;
        }
      } catch {
        // Not JSON, check for URL pattern
        const urlMatch = output.match(/https:\/\/[^\s"']*\.pages\.dev[^\s"']*/);
        if (urlMatch) {
          url = urlMatch[0];
        }
        message = output;
      }
    } else if (typeof output === 'object' && output !== null) {
      const obj = output as Record<string, unknown>;
      url = (obj.url as string) || null;
      projectName = (obj.project_name as string) || null;
      message = (obj.message as string) || null;
      if (obj.directory && !directoryPath) {
        directoryPath = obj.directory as string;
      }
    }
  }

  const actualIsSuccess = toolResult?.success !== undefined ? toolResult.success : isSuccess;

  return {
    name,
    directoryPath,
    url,
    projectName,
    message,
    actualIsSuccess,
    actualToolTimestamp: toolTimestamp,
    actualAssistantTimestamp: assistantTimestamp,
  };
}
