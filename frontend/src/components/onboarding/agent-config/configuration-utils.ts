import { ConfigurationField } from '../shared/types';
import { integrationsByAgent } from '../shared/data';

// Configuration fields for each agent type
export const getConfigurationFields = (agentId: string): ConfigurationField[] => {
  const configs: { [key: string]: ConfigurationField[] } = {
    'email-assistant': [
      {
        key: 'inboxFocus',
        label: 'Inbox focus',
        type: 'multiselect',
        options: ['Priority senders', 'Customer success', 'Sales pipeline', 'Internal updates'],
      },
      {
        key: 'replyTone',
        label: 'Reply tone',
        type: 'select',
        options: ['Professional', 'Friendly', 'Concise', 'Detailed'],
        default: 'Professional',
      },
      {
        key: 'workingHours',
        label: 'Working hours',
        type: 'select',
        options: ['9am-5pm', 'Always on', 'Custom schedule'],
        default: '9am-5pm',
      },
    ],
    'daily-recap': [
      {
        key: 'includeSections',
        label: 'Include sections',
        type: 'multiselect',
        options: ['Calendar', 'Tasks', 'Team updates', 'News highlights'],
      },
      {
        key: 'deliveryTime',
        label: 'Delivery time',
        type: 'select',
        options: ['05:00', '06:00', '07:00', '08:00'],
        default: '07:00',
      },
    ],
    'weekly-recap': [
      {
        key: 'summaryFocus',
        label: 'Summary focus',
        type: 'multiselect',
        options: ['Wins', 'Metrics', 'Team highlights', 'Risks'],
      },
      {
        key: 'preferredFormat',
        label: 'Preferred format',
        type: 'select',
        options: ['Email', 'Deck outline', 'Bullet points'],
        default: 'Email',
      },
    ],
    'lead-generator': [
      {
        key: 'targetIndustries',
        label: 'Target industries',
        type: 'multiselect',
        options: ['SaaS', 'E-commerce', 'Finance', 'Health', 'Education'],
      },
      {
        key: 'leadVolume',
        label: 'Weekly lead volume',
        type: 'select',
        options: ['10', '25', '50', '100'],
        default: '25',
      },
      {
        key: 'qualificationCriteria',
        label: 'Qualification criteria',
        type: 'multiselect',
        options: ['Revenue', 'Company size', 'Funding stage', 'Tech stack'],
      },
    ],
    'meeting-researcher': [
      {
        key: 'briefingDepth',
        label: 'Briefing depth',
        type: 'select',
        options: ['Quick overview', 'Detailed', 'Executive'],
        default: 'Detailed',
      },
      {
        key: 'focusAreas',
        label: 'Focus areas',
        type: 'multiselect',
        options: ['Professional history', 'Company news', 'Mutual connections', 'Conversation starters'],
      },
    ],
    'presentation-creator': [
      {
        key: 'presentationType',
        label: 'Presentation type',
        type: 'select',
        options: ['Pitch deck', 'Status update', 'Marketing', 'Product demo'],
        default: 'Pitch deck',
      },
      {
        key: 'visualStyle',
        label: 'Visual style',
        type: 'select',
        options: ['Minimal', 'Bold', 'Corporate', 'Playful'],
        default: 'Minimal',
      },
      {
        key: 'requiredSections',
        label: 'Required sections',
        type: 'multiselect',
        options: ['Problem', 'Solution', 'Metrics', 'Roadmap', 'Call-to-action'],
      },
    ],
  };
  
  return configs[agentId] || [];
};

// Get integration fields for an agent
export const getIntegrationFields = (agentId: string): ConfigurationField[] => {
  const integrations = integrationsByAgent[agentId] || [];
  
  if (integrations.length === 0) return [];
  
  return [
    {
      key: 'integrations',
      label: 'Connect Your Tools',
      type: 'integrations',
      options: integrations,
      description: `Select the tools and platforms you want ${agentId} to integrate with`
    }
  ];
};

// Calculate configuration completeness
export const getConfigurationCompleteness = (agentId: string, configuration: Record<string, any>) => {
  const fields = [...getConfigurationFields(agentId), ...getIntegrationFields(agentId)];
  const configuredFields = fields.filter(field => {
    const value = configuration[field.key];
    return value && (Array.isArray(value) ? value.length > 0 : true);
  });
  
  return {
    configured: configuredFields.length,
    total: fields.length,
    percentage: fields.length > 0 ? Math.round((configuredFields.length / fields.length) * 100) : 0
  };
};

