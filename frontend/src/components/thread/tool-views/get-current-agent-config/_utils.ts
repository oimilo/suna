import { extractToolData } from '../utils';

export interface AgentpressTool {
  enabled: boolean;
  description: string;
}

export interface CustomMcp {
  name: string;
  type: string;
  config: {
    url: string;
    headers?: Record<string, string>;
    profile_id?: string;
  };
  enabled_tools: string[];
}

export interface AgentConfiguration {
  agent_id: string;
  name: string;
  description: string;
  avatar?: string;
  avatar_color?: string;
  agentpress_tools: Record<string, AgentpressTool>;
  configured_mcps: any[];
  custom_mcps: CustomMcp[];
  created_at: string;
  updated_at: string;
  current_version: string;
}

export interface GetCurrentAgentConfigData {
  summary: string | null;
  configuration: AgentConfiguration | null;
  success?: boolean;
  timestamp?: string;
}

const normalizeCustomMcps = (customMcps?: any[]): CustomMcp[] => {
  if (!Array.isArray(customMcps)) return [];

  return customMcps.map((mcp) => {
    const enabledTools =
      Array.isArray(mcp?.enabled_tools) && mcp.enabled_tools.length > 0
        ? mcp.enabled_tools
        : Array.isArray(mcp?.enabledTools)
          ? mcp.enabledTools
          : [];

    const config = mcp?.config ?? {};

    return {
      name: mcp?.name ?? 'Unknown MCP',
      type: mcp?.type ?? 'unknown',
      config: {
        url: config?.url ?? config?.mcp_url ?? '',
        headers: config?.headers,
        profile_id: config?.profile_id ?? config?.profileId,
      },
      enabled_tools: enabledTools,
    };
  });
};

const normalizeAgentConfiguration = (
  config: any,
): AgentConfiguration | null => {
  if (!config || typeof config !== 'object') {
    return null;
  }

  const normalizedCustomMcps = normalizeCustomMcps(
    config.custom_mcps ?? config.customMcps,
  );

  const configuredMcps =
    config.configured_mcps ??
    config.configuredMcps ??
    config.configuredMCPs ??
    [];

  const agentpressTools =
    config.agentpress_tools ??
    config.agentpressTools ??
    {};

  return {
    ...config,
    agentpress_tools: agentpressTools,
    configured_mcps: configuredMcps,
    custom_mcps: normalizedCustomMcps,
  } as AgentConfiguration;
};

const parseContent = (content: any): any => {
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (e) {
      return content;
    }
  }
  return content;
};

const extractFromNewFormat = (content: any): GetCurrentAgentConfigData => {
  const parsedContent = parseContent(content);
  
  if (!parsedContent || typeof parsedContent !== 'object') {
    return { 
      summary: null,
      configuration: null,
      success: undefined,
      timestamp: undefined 
    };
  }

  if ('tool_execution' in parsedContent && typeof parsedContent.tool_execution === 'object') {
    const toolExecution = parsedContent.tool_execution;
    
    let parsedOutput = toolExecution.result?.output;
    if (typeof parsedOutput === 'string') {
      try {
        parsedOutput = JSON.parse(parsedOutput);
      } catch (e) {
      }
    }
    parsedOutput = parsedOutput || {};

    const extractedData = {
      summary: parsedOutput.summary || null,
      configuration: normalizeAgentConfiguration(parsedOutput.configuration),
      success: toolExecution.result?.success,
      timestamp: toolExecution.execution_details?.timestamp
    };
    
    return extractedData;
  }

  if ('parameters' in parsedContent && 'output' in parsedContent) {
    const extractedData = {
      summary: parsedContent.output?.summary || null,
      configuration: normalizeAgentConfiguration(parsedContent.output?.configuration),
      success: parsedContent.success,
      timestamp: undefined
    };

    return extractedData;
  }

  if ('role' in parsedContent && 'content' in parsedContent) {
    return extractFromNewFormat(parsedContent.content);
  }

  return { 
    summary: null,
    configuration: null,
    success: undefined,
    timestamp: undefined 
  };
};

const extractFromLegacyFormat = (content: any): Omit<GetCurrentAgentConfigData, 'success' | 'timestamp'> => {
  const toolData = extractToolData(content);
  
  if (toolData.toolResult) {
    return {
      summary: null,
      configuration: null
    };
  }
  
  return {
    summary: null,
    configuration: null
  };
};

export function extractGetCurrentAgentConfigData(
  assistantContent: any,
  toolContent: any,
  isSuccess: boolean,
  toolTimestamp?: string,
  assistantTimestamp?: string
): {
  summary: string | null;
  configuration: AgentConfiguration | null;
  actualIsSuccess: boolean;
  actualToolTimestamp?: string;
  actualAssistantTimestamp?: string;
} {
  let data: GetCurrentAgentConfigData;
  
  if (toolContent) {
    data = extractFromNewFormat(toolContent);
    if (data.success !== undefined || data.configuration || data.summary) {
      return {
        ...data,
        actualIsSuccess: data.success !== undefined ? data.success : isSuccess,
        actualToolTimestamp: data.timestamp || toolTimestamp,
        actualAssistantTimestamp: assistantTimestamp
      };
    }
  }

  if (assistantContent) {
    data = extractFromNewFormat(assistantContent);
    if (data.success !== undefined || data.configuration || data.summary) {
      return {
        ...data,
        actualIsSuccess: data.success !== undefined ? data.success : isSuccess,
        actualToolTimestamp: toolTimestamp,
        actualAssistantTimestamp: data.timestamp || assistantTimestamp
      };
    }
  }

  const toolLegacy = extractFromLegacyFormat(toolContent);
  const assistantLegacy = extractFromLegacyFormat(assistantContent);

  const combinedData = {
    summary: toolLegacy.summary || assistantLegacy.summary,
    configuration: toolLegacy.configuration || assistantLegacy.configuration,
    actualIsSuccess: isSuccess,
    actualToolTimestamp: toolTimestamp,
    actualAssistantTimestamp: assistantTimestamp
  };

  return combinedData;
} 
