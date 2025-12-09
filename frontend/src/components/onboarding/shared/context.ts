import { UserContext } from './types';

// Global user context - this will be replaced with proper state management
export let userContext: UserContext = {
  name: '',
  primaryGoals: [],
  selectedAgents: [],
  // New functional onboarding fields
  selectedTemplates: [],
  profileMappings: {},
  customMcpConfigs: {},
  installedAgentIds: []
};

export const updateUserContext = (updates: Partial<UserContext>) => {
  userContext = { ...userContext, ...updates };
};

export const resetUserContext = () => {
  userContext = {
    name: '',
    primaryGoals: [],
    selectedAgents: [],
    selectedTemplates: [],
    profileMappings: {},
    customMcpConfigs: {},
    installedAgentIds: []
  };
};

// Helper to get all unique MCP requirements from selected templates
export const getAggregatedMcpRequirements = () => {
  const templates = userContext.selectedTemplates || [];
  const requirementsMap = new Map<string, {
    qualified_name: string;
    display_name: string;
    custom_type?: 'sse' | 'http' | 'composio';
    app_slug?: string;
    required_config?: string[];
  }>();

  templates.forEach(template => {
    (template.mcp_requirements || []).forEach(req => {
      // Deduplicate by qualified_name
      if (!requirementsMap.has(req.qualified_name)) {
        requirementsMap.set(req.qualified_name, {
          qualified_name: req.qualified_name,
          display_name: req.display_name,
          custom_type: req.custom_type,
          app_slug: req.app_slug,
          required_config: req.required_config
        });
      }
    });
  });

  return Array.from(requirementsMap.values());
};

