import { Project } from '@/lib/api/threads';

/**
 * Structured tool call data from metadata
 */
export interface ToolCallData {
  tool_call_id: string;
  function_name: string;
  arguments: Record<string, any>;
  source: 'native' | 'xml';
  name?: string;
  xml_tag_name?: string;
  tool_name?: string;
}

/**
 * Structured tool result data from metadata
 */
export interface ToolResultData {
  success: boolean;
  output: any;
  error?: string | null;
  content?: any;
  timestamp?: string;
  isSuccess?: boolean;
}

export interface ToolViewProps {
  // Structured data from metadata - NO CONTENT PARSING
  toolCall: ToolCallData;
  toolResult?: ToolResultData;
  name?: string;
  assistantContent?: any;
  toolContent?: any;
  
  // Metadata
  assistantTimestamp?: string;
  toolTimestamp?: string;
  isSuccess?: boolean;
  isStreaming?: boolean;
  project?: Project;
  messages?: any[];
  agentStatus?: string;
  currentIndex?: number;
  totalCalls?: number;
  onFileClick?: (filePath: string) => void;
  viewToggle?: React.ReactNode;
  streamingText?: string; // Live streaming content from assistant message
  isWorkspaceReady?: boolean; // Whether the workspace/sandbox is ready for file operations
}

export interface BrowserToolViewProps extends ToolViewProps {
  name?: string;
}
