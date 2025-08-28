export interface TemplateMessage {
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp?: string;
  metadata?: any;
  tool_call_id?: string;
  tool_calls?: any[];
}

export interface TemplateFile {
  path: string;
  content: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  messages: TemplateMessage[];
  files: TemplateFile[];
}

// Type alias for compatibility
export type OnboardingTemplate = Template;