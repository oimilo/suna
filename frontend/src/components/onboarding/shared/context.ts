import { UserContext } from './types';

// Extend UserContext with additional properties for credentials step
declare module './types' {
  interface UserContext {
    profileMappings?: Record<string, string>;
    customMcpConfigs?: Record<string, Record<string, any>>;
  }
}

// Global user context - this will be replaced with proper state management
export let userContext: UserContext = {
  name: '',
  primaryGoals: [],
  selectedAgents: []
};

export const updateUserContext = (updates: Partial<UserContext>) => {
  userContext = { ...userContext, ...updates };
};

export const resetUserContext = () => {
  userContext = {
    name: '',
    primaryGoals: [],
    selectedAgents: []
  };
};

// MCP requirement interface for credentials step
export interface McpRequirement {
  qualified_name: string;
  display_name: string;
  custom_type?: 'composio' | 'sse' | 'http' | 'credential_profile';
  app_slug?: string;
  required_config?: string[];
}

// Returns aggregated MCP requirements based on selected agents
// This is a placeholder - actual implementation should come from agent configuration
export const getAggregatedMcpRequirements = (): McpRequirement[] => {
  // Return empty array for now - will be populated based on selected agents' requirements
  return [];
};

