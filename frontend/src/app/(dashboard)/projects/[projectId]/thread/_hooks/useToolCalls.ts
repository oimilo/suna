import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import {
  ToolCallInput,
  shouldAutoOpenForStreaming,
  normalizeToolName,
} from '@/components/thread/tool-call-helpers';
import { UnifiedMessage, ParsedMetadata, StreamingToolCall, AgentStatus } from '../_types';
import { safeJsonParse } from '@/components/thread/utils';
import { ParsedContent } from '@/components/thread/types';
import { extractToolName } from '@/components/thread/tool-views/xml-parser';
import { extractAskData } from '@/components/thread/tool-views/ask-tool/_utils';

const DEBUG_TOOLCALLS = process.env.NEXT_PUBLIC_WORKSPACE_DEBUG !== 'false';

const logToolCallDebug = (...args: unknown[]) => {
  if (DEBUG_TOOLCALLS) {
    console.debug('[workspace:toolcalls]', ...args);
  }
};

export const shouldFilterAskTool = (
  toolName: string,
  assistantContent: any,
  toolContent: any,
): boolean => {
  if (toolName.toLowerCase() !== 'ask') {
    return false;
  }
  const { attachments } = extractAskData(assistantContent, toolContent, true);
  return !attachments || attachments.length === 0;
};

interface UseToolCallsReturn {
  toolCalls: ToolCallInput[];
  setToolCalls: React.Dispatch<React.SetStateAction<ToolCallInput[]>>;
  currentToolIndex: number;
  setCurrentToolIndex: React.Dispatch<React.SetStateAction<number>>;
  isSidePanelOpen: boolean;
  setIsSidePanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  autoOpenedPanel: boolean;
  setAutoOpenedPanel: React.Dispatch<React.SetStateAction<boolean>>;
  externalNavIndex: number | undefined;
  setExternalNavIndex: React.Dispatch<React.SetStateAction<number | undefined>>;
  handleToolClick: (clickedAssistantMessageId: string | null, clickedToolName: string) => void;
  handleStreamingToolCall: (toolCall: StreamingToolCall | null) => void;
  toggleSidePanel: () => void;
  handleSidePanelNavigate: (newIndex: number) => void;
  userClosedPanelRef: React.MutableRefObject<boolean>;
}

// Helper function to parse tool content from the new format
function parseToolContent(content: any): {
  toolName: string;
  parameters: any;
  result: any;
} | null {
  try {
    // First try to parse as JSON if it's a string
    const parsed = typeof content === 'string' ? safeJsonParse(content, content) : content;
    
    // Check if it's the new structured format
    if (parsed && typeof parsed === 'object') {
      // New format: { tool_name, xml_tag_name, parameters, result }
      if ('tool_name' in parsed || 'xml_tag_name' in parsed) {
        return {
          toolName: parsed.tool_name || parsed.xml_tag_name || 'unknown',
          parameters: parsed.parameters || {},
          result: parsed.result || null
        };
      }
      
      // Check if it has a content field that might contain the structured data
      if ('content' in parsed && typeof parsed.content === 'object') {
        const innerContent = parsed.content;
        if ('tool_name' in innerContent || 'xml_tag_name' in innerContent) {
          return {
            toolName: innerContent.tool_name || innerContent.xml_tag_name || 'unknown',
            parameters: innerContent.parameters || {},
            result: innerContent.result || null
          };
        }
      }
    }
  } catch (e) {
    // Continue with old format parsing
  }
  
  return null;
}

export function useToolCalls(
  messages: UnifiedMessage[],
  setLeftSidebarOpen: (open: boolean) => void,
  agentStatus?: AgentStatus
): UseToolCallsReturn {
  const [toolCalls, setToolCalls] = useState<ToolCallInput[]>([]);
  const [currentToolIndex, setCurrentToolIndex] = useState<number>(0);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [autoOpenedPanel, setAutoOpenedPanel] = useState(false);
  const [externalNavIndex, setExternalNavIndex] = useState<number | undefined>(undefined);
  const userClosedPanelRef = useRef(false);
  const userNavigatedRef = useRef(false); // Track if user manually navigated
  const lastHistoricalSignatureRef = useRef<string>('');

  useEffect(() => {
    logToolCallDebug('state:update', {
      toolCallCount: toolCalls.length,
      currentToolIndex,
      isSidePanelOpen,
      autoOpenedPanel,
      userClosedPanel: userClosedPanelRef.current,
      userNavigated: userNavigatedRef.current,
    });
  }, [toolCalls, currentToolIndex, isSidePanelOpen, autoOpenedPanel]);

  const toggleSidePanel = useCallback(() => {
    setIsSidePanelOpen((prevIsOpen) => {
      const newState = !prevIsOpen;
      if (!newState) {
        userClosedPanelRef.current = true;
      }
      if (newState) {
        setLeftSidebarOpen(false);
      }
      return newState;
    });
  }, [setLeftSidebarOpen]);

  const handleSidePanelNavigate = useCallback((newIndex: number) => {
    setCurrentToolIndex(newIndex);
    userNavigatedRef.current = true; // Mark that user manually navigated
  }, []);

  // Create a map of assistant message IDs to their tool call indices for faster lookup
  const assistantMessageToToolIndex = useRef<Map<string, number>>(new Map());

  const buildHistoricalToolPairs = useCallback(() => {
    const historicalToolPairs: ToolCallInput[] = [];
    const messageIdToIndex = new Map<string, number>();
    const assistantMessages = messages.filter(m => m.type === 'assistant' && m.message_id);

    assistantMessages.forEach(assistantMsg => {
      const resultMessage = messages.find(toolMsg => {
        if (toolMsg.type !== 'tool' || !toolMsg.metadata || !assistantMsg.message_id) return false;
        try {
          const metadata = safeJsonParse<ParsedMetadata>(toolMsg.metadata, {});
          return metadata.assistant_message_id === assistantMsg.message_id;
        } catch (e) {
          return false;
        }
      });

      if (resultMessage) {
        let toolName = 'unknown';
        let isSuccess = true;
        
        // First try to parse the new format from the tool message
        const toolContentParsed = parseToolContent(resultMessage.content);
        
        if (toolContentParsed) {
          // New format detected
          toolName = normalizeToolName(toolContentParsed.toolName);
          
          // Extract success status from the result
          if (toolContentParsed.result && typeof toolContentParsed.result === 'object') {
            isSuccess = toolContentParsed.result.success !== false;
          }
        } else {
          // Fall back to old format parsing
          try {
            const assistantContent = (() => {
              try {
                const parsed = safeJsonParse<ParsedContent>(assistantMsg.content, {});
                return parsed.content || assistantMsg.content;
              } catch {
                return assistantMsg.content;
              }
            })();
            
            const extractedToolName = extractToolName(assistantContent);
            if (extractedToolName) {
              toolName = extractedToolName;
            } else {
              const assistantContentParsed = safeJsonParse<{
                tool_calls?: Array<{ function?: { name?: string }; name?: string }>;
              }>(assistantMsg.content, {});
              if (
                assistantContentParsed.tool_calls &&
                assistantContentParsed.tool_calls.length > 0
              ) {
                const firstToolCall = assistantContentParsed.tool_calls[0];
                const rawName = firstToolCall.function?.name || firstToolCall.name || 'unknown';
                toolName = normalizeToolName(rawName);
              }
            }
          } catch { }

          // Parse success status from old format
          try {
            const toolResultContent = (() => {
              try {
                const parsed = safeJsonParse<ParsedContent>(resultMessage.content, {});
                return parsed.content || resultMessage.content;
              } catch {
                return resultMessage.content;
              }
            })();
            
            if (toolResultContent && typeof toolResultContent === 'string') {
              const toolResultMatch = toolResultContent.match(/ToolResult\s*\(\s*success\s*=\s*(True|False|true|false)/i);
              if (toolResultMatch) {
                isSuccess = toolResultMatch[1].toLowerCase() === 'true';
              } else {
                const toolContent = toolResultContent.toLowerCase();
                isSuccess = !(toolContent.includes('failed') ||
                  toolContent.includes('error') ||
                  toolContent.includes('failure'));
              }
            }
          } catch { }
        }

        if (shouldFilterAskTool(toolName, assistantMsg.content, resultMessage.content)) {
          logToolCallDebug('ask-tool-filtered', {
            assistantMessageId: assistantMsg.message_id,
            reason: 'missing-attachments',
          });
          return;
        }

        const toolIndex = historicalToolPairs.length;
        historicalToolPairs.push({
          assistantCall: {
            name: toolName,
            content: assistantMsg.content,
            timestamp: assistantMsg.created_at,
          },
          toolResult: {
            content: resultMessage.content,
            isSuccess: isSuccess,
            timestamp: resultMessage.created_at,
          },
        });

        // Map the assistant message ID to its tool index
        if (assistantMsg.message_id) {
          messageIdToIndex.set(assistantMsg.message_id, toolIndex);
        }
      }
    });

    return { historicalToolPairs, messageIdToIndex };
  }, [messages]);

  const getToolCallsSignature = useCallback((pairs: ToolCallInput[]) => {
    if (pairs.length === 0) {
      return 'empty';
    }

    const serializeSegment = (value: string | undefined): string => {
      if (!value) {
        return '∅';
      }

      const normalized = value.trim();
      if (normalized.length <= 160) {
        return normalized;
      }

      const start = normalized.slice(0, 80);
      const end = normalized.slice(-40);
      return `${start}…${end}`;
    };

    return pairs
      .map(pair => {
        const assistant = pair.assistantCall;
        const toolResult = pair.toolResult;
        const assistantContent = typeof assistant?.content === 'string'
          ? assistant.content
          : JSON.stringify(assistant?.content ?? '');
        const toolResultContent = typeof toolResult?.content === 'string'
          ? toolResult.content
          : JSON.stringify(toolResult?.content ?? '');
        return [
          assistant?.name ?? 'unknown',
          assistant?.timestamp ?? 'no-timestamp',
          serializeSegment(assistantContent),
          toolResult?.timestamp ?? 'no-result-ts',
          serializeSegment(toolResultContent),
        ].join('|');
      })
      .join('::');
  }, []);

  useEffect(() => {
    const { historicalToolPairs, messageIdToIndex } = buildHistoricalToolPairs();
    const signature = getToolCallsSignature(historicalToolPairs);

    assistantMessageToToolIndex.current = messageIdToIndex;

    let didUpdateToolCalls = false;
    setToolCalls(prev => {
      if (lastHistoricalSignatureRef.current === signature) {
        return prev;
      }
      didUpdateToolCalls = true;
      lastHistoricalSignatureRef.current = signature;
      return historicalToolPairs;
    });

    if (!didUpdateToolCalls) {
      return;
    }

    if (historicalToolPairs.length > 0) {
      if (agentStatus === 'running' && !userNavigatedRef.current) {
        setCurrentToolIndex(historicalToolPairs.length - 1);
      } else if (isSidePanelOpen && !userClosedPanelRef.current && !userNavigatedRef.current) {
        setCurrentToolIndex(historicalToolPairs.length - 1);
      }
      // Removido: auto-abertura genérica do painel
      // O painel agora só abre automaticamente quando o ToolCallSidePanel
      // detecta uma entrega relevante (arquivo principal, deploy, etc.)
    }
  }, [buildHistoricalToolPairs, getToolCallsSignature, agentStatus, isSidePanelOpen]);

  // Reset user navigation flag when agent stops
  useEffect(() => {
    if (agentStatus === 'idle') {
      userNavigatedRef.current = false;
    }
  }, [agentStatus]);

  useEffect(() => {
    if (!isSidePanelOpen) {
      setAutoOpenedPanel(false);
    }
  }, [isSidePanelOpen]);

  const handleToolClick = useCallback((clickedAssistantMessageId: string | null, clickedToolName: string) => {
    if (!clickedAssistantMessageId) {
      console.warn("Clicked assistant message ID is null. Cannot open side panel.");
      toast.warning("Não é possível visualizar detalhes: ID da mensagem do assistente está ausente.");
      return;
    }

    userClosedPanelRef.current = false;
    userNavigatedRef.current = true; // Mark that user manually navigated

    console.log(
      '[PAGE] Tool Click Triggered. Assistant Message ID:',
      clickedAssistantMessageId,
      'Tool Name:',
      clickedToolName,
    );

    // Use the pre-computed mapping for faster lookup
    const toolIndex = assistantMessageToToolIndex.current.get(clickedAssistantMessageId);

    if (toolIndex !== undefined) {
      console.log(
        `[PAGE] Found tool call at index ${toolIndex} for assistant message ${clickedAssistantMessageId}`,
      );
      setExternalNavIndex(toolIndex);
      setCurrentToolIndex(toolIndex);
      setIsSidePanelOpen(true);

      setTimeout(() => setExternalNavIndex(undefined), 100);
    } else {
      console.warn(
        `[PAGE] Could not find matching tool call in toolCalls array for assistant message ID: ${clickedAssistantMessageId}`,
      );
      
      // Fallback: Try to find by matching the tool name and approximate position
      const assistantMessage = messages.find(
        m => m.message_id === clickedAssistantMessageId && m.type === 'assistant'
      );
      
      if (assistantMessage) {
        // Find the index of this assistant message among all assistant messages
        const assistantMessages = messages.filter(m => m.type === 'assistant' && m.message_id);
        const messageIndex = assistantMessages.findIndex(m => m.message_id === clickedAssistantMessageId);
        
        // Check if we have a tool call at this index
        if (messageIndex !== -1 && messageIndex < toolCalls.length) {
          console.log(`[PAGE] Using fallback: found tool at index ${messageIndex}`);
          setExternalNavIndex(messageIndex);
          setCurrentToolIndex(messageIndex);
          setIsSidePanelOpen(true);
          setTimeout(() => setExternalNavIndex(undefined), 100);
          return;
        }
      }
      
      toast.info('Não foi possível encontrar detalhes para esta chamada de ferramenta.');
      logToolCallDebug('tool-click-miss', {
        assistantMessageId: clickedAssistantMessageId,
        toolName: clickedToolName,
      });
    }
  }, [messages, toolCalls]);

  const handleStreamingToolCall = useCallback(
    (toolCall: StreamingToolCall | null) => {
      if (!toolCall) return;

      // Get the raw tool name and ensure it uses hyphens
      const rawToolName = toolCall.name || toolCall.xml_tag_name || 'Unknown Tool';
      const toolName = normalizeToolName(rawToolName);

      console.log('[STREAM] Received tool call:', toolName, '(raw:', rawToolName, ')');

      if (userClosedPanelRef.current) return;

      const toolArguments = toolCall.arguments || '';
      let formattedContent = toolArguments;
      if (
        toolName.includes('command') &&
        !toolArguments.includes('<execute-command>')
      ) {
        formattedContent = `<execute-command>${toolArguments}</execute-command>`;
      } else if (
        toolName.includes('file') ||
        toolName === 'create-file' ||
        toolName === 'delete-file' ||
        toolName === 'full-file-rewrite' ||
        toolName === 'edit-file'
      ) {
        const fileOpTags = ['create-file', 'delete-file', 'full-file-rewrite', 'edit-file'];
        const matchingTag = fileOpTags.find((tag) => toolName === tag);
        if (matchingTag) {
          if (!toolArguments.includes(`<${matchingTag}>`) && !toolArguments.includes('file_path=') && !toolArguments.includes('target_file=')) {
            const filePath = toolArguments.trim();
            if (filePath && !filePath.startsWith('<')) {
              if (matchingTag === 'edit-file') {
                formattedContent = `<${matchingTag} target_file="${filePath}">`;
              } else {
              formattedContent = `<${matchingTag} file_path="${filePath}">`;
              }
            } else {
              formattedContent = `<${matchingTag}>${toolArguments}</${matchingTag}>`;
            }
          } else {
            formattedContent = toolArguments;
          }
        }
      }

      const newToolCall: ToolCallInput = {
        assistantCall: {
          name: toolName, 
          content: formattedContent,
          timestamp: new Date().toISOString(),
        },
        toolResult: {
          content: 'STREAMING',
          isSuccess: true,
          timestamp: new Date().toISOString(),
        },
      };

      setToolCalls((prev) => {
        // Check if we're updating an existing streaming tool or adding a new one
        const existingStreamingIndex = prev.findIndex(
          tc => tc.toolResult?.content === 'STREAMING'
        );
        
        if (existingStreamingIndex !== -1 && prev[existingStreamingIndex].assistantCall.name === toolName) {
          // Update existing streaming tool
          const updated = [...prev];
          updated[existingStreamingIndex] = {
            ...updated[existingStreamingIndex],
            assistantCall: {
              ...updated[existingStreamingIndex].assistantCall,
              content: formattedContent,
            },
          };
          return updated;
        } else {
          // Add new streaming tool at the end
          return [...prev, newToolCall];
        }
      });

      // If agent is running and user hasn't manually navigated, show the latest tool
      if (!userNavigatedRef.current) {
        setCurrentToolIndex(prev => {
          const newLength = toolCalls.length + 1; // Account for the new tool being added
          return newLength - 1;
        });
      }
      
      const importantToolAutoOpen =
        toolName === 'deploy' ||
        toolName === 'expose-port' ||
        toolName === 'create_credential_profile' ||
        toolName === 'connect_credential_profile';

      if (importantToolAutoOpen) {
        setIsSidePanelOpen(true);
        logToolCallDebug('auto-open', {
          reason: 'streaming-important-tool',
          toolName,
        });
      } else if (
        (toolName === 'create-file' ||
          toolName === 'full-file-rewrite' ||
          toolName === 'edit-file' ||
          toolName === 'create-slide' ||
          toolName === 'validate-slide') &&
        formattedContent
      ) {
        const decision = shouldAutoOpenForStreaming(toolName, formattedContent, {
          index: toolCalls.length,
          totalCalls: toolCalls.length + 1,
        });

        if (decision.shouldOpen) {
          console.log('[STREAM] Main file detected via heurística:', decision.fileName, '- abrindo painel');
          logToolCallDebug('auto-open', {
            reason: 'streaming-main-file-heuristic',
            fileName: decision.fileName,
            filePath: decision.filePath,
            score: decision.score,
            toolName,
          });
          setIsSidePanelOpen(true);
        } else if (decision.fileName) {
          console.log('[STREAM] Heurística reprovou', decision.fileName, '- painel permanece fechado');
        }
      }
    },
    [toolCalls.length],
  );

  return {
    toolCalls,
    setToolCalls,
    currentToolIndex,
    setCurrentToolIndex,
    isSidePanelOpen,
    setIsSidePanelOpen,
    autoOpenedPanel,
    setAutoOpenedPanel,
    externalNavIndex,
    setExternalNavIndex,
    handleToolClick,
    handleStreamingToolCall,
    toggleSidePanel,
    handleSidePanelNavigate,
    userClosedPanelRef,
  };
}


