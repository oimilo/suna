import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDashed, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getToolIcon, getUserFriendlyToolName } from '@/components/thread/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BRANDING } from '@/lib/branding';

export interface ToolCallInput {
  assistantCall: {
    content?: string;
    name?: string;
    timestamp?: string;
  };
  toolResult?: {
    content?: string;
    isSuccess?: boolean;
    timestamp?: string;
  };
  messages?: any[];
}

interface FloatingToolPreviewProps {
  toolCalls: ToolCallInput[];
  currentIndex: number;
  onExpand: () => void;
  agentName?: string;
  isVisible: boolean;
  // Indicators for multiple notification types (not tool calls)
  showIndicators?: boolean;
  indicatorIndex?: number;
  indicatorTotal?: number;
  onIndicatorClick?: (index: number) => void;
  // Navigation callbacks
  onNavigate?: (index: number) => void;
}

const FLOATING_LAYOUT_ID = 'tool-panel-float';
const CONTENT_LAYOUT_ID = 'tool-panel-content';

const getToolResultStatus = (toolCall: any): boolean => {
  const content = toolCall?.toolResult?.content;
  if (!content) return toolCall?.toolResult?.isSuccess ?? true;

  const safeParse = (data: any) => {
    try { return typeof data === 'string' ? JSON.parse(data) : data; }
    catch { return null; }
  };

  const parsed = safeParse(content);
  if (!parsed) return toolCall?.toolResult?.isSuccess ?? true;

  if (parsed.content) {
    const inner = safeParse(parsed.content);
    if (inner?.tool_execution?.result?.success !== undefined) {
      return inner.tool_execution.result.success;
    }
  }
  const success = parsed.tool_execution?.result?.success ??
    parsed.result?.success ??
    parsed.success;

  return success !== undefined ? success : (toolCall?.toolResult?.isSuccess ?? true);
};

export const FloatingToolPreview: React.FC<FloatingToolPreviewProps> = ({
  toolCalls,
  currentIndex,
  onExpand,
  agentName,
  isVisible,
  showIndicators = false,
  indicatorIndex = 0,
  indicatorTotal = 1,
  onIndicatorClick,
  onNavigate,
}) => {
  const [isExpanding, setIsExpanding] = React.useState(false);
  const [internalIndex, setInternalIndex] = React.useState(currentIndex);
  const currentToolCall = toolCalls[internalIndex] || toolCalls[currentIndex];
  const totalCalls = toolCalls.length;
  
  // Update internal index when external index changes
  React.useEffect(() => {
    setInternalIndex(currentIndex);
  }, [currentIndex]);

  React.useEffect(() => {
    if (isVisible) {
      setIsExpanding(false);
    }
  }, [isVisible]);

  if (!currentToolCall || totalCalls === 0) return null;

  const toolName = currentToolCall.assistantCall?.name || 'Tool Call';
  const CurrentToolIcon = getToolIcon(toolName);
  const isStreaming = currentToolCall.toolResult?.content === 'STREAMING';
  const isSuccess = isStreaming ? true : getToolResultStatus(currentToolCall);

  const handleClick = () => {
    setIsExpanding(true);
    requestAnimationFrame(() => {
      onExpand();
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          layoutId={FLOATING_LAYOUT_ID}
          layout
          transition={{
            layout: {
              type: "spring",
              stiffness: 300,
              damping: 30
            }
          }}
          className="w-full"
          style={{ pointerEvents: 'auto' }}
        >
          <motion.div
            layoutId={CONTENT_LAYOUT_ID}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            className="relative bg-muted/30 backdrop-blur-sm border border-border/50 dark:border-zinc-700 rounded-xl pl-12 pr-12 py-1.5 w-full cursor-pointer group shadow-sm hover:shadow-md transition-shadow"
            onClick={handleClick}
            style={{ opacity: isExpanding ? 0 : 1 }}
          >
            {/* Navigation Arrow Left */}
            {totalCalls > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex-shrink-0 hover:bg-muted/50"
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = internalIndex > 0 ? internalIndex - 1 : totalCalls - 1;
                  setInternalIndex(newIndex);
                  onNavigate?.(newIndex);
                }}
                style={{ opacity: isExpanding ? 0 : 1 }}
              >
                <ChevronLeft className="h-3 w-3" />
              </Button>
            )}
            
            {/* Tool Thumbnail - positioned after arrow */}
            <motion.div
              layoutId="tool-icon"
              className="absolute left-11 top-1/2 -translate-y-1/2 w-14 h-12 rounded-lg bg-card dark:bg-card border border-border/60 dark:border-zinc-700 overflow-hidden shadow-md"
              style={{ 
                opacity: isExpanding ? 0 : 1,
                marginTop: '-4px' // Projeta para cima
              }}
            >
              {/* Thumbnail preview - simplified representation */}
              <div className="absolute inset-0 flex items-center justify-center bg-muted/20">
                <CurrentToolIcon className="h-6 w-6 text-muted-foreground/70" />
              </div>
              {/* Status indicator overlay */}
              <div className={cn(
                "absolute top-1 right-1 w-2 h-2 rounded-full",
                isStreaming
                  ? "bg-blue-500 animate-pulse"
                  : isSuccess
                    ? "bg-green-500"
                    : "bg-red-500"
              )} />
            </motion.div>

            <div className="flex items-center justify-start gap-3 pl-28 pr-14" style={{ opacity: isExpanding ? 0 : 1 }}>
              <motion.div layoutId="tool-title" className="flex items-center gap-2">
                <h4 className="text-sm font-medium text-foreground truncate">
                  {getUserFriendlyToolName(toolName)}
                </h4>
                {totalCalls > 1 && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap px-1.5 py-0.5 bg-muted/50 rounded-full">
                    {internalIndex + 1}/{totalCalls}
                  </span>
                )}
              </motion.div>

              <motion.div layoutId="tool-status" className="text-xs text-muted-foreground">
                {isStreaming
                  ? "executando..."
                  : isSuccess
                    ? "sucesso"
                    : "falha"
                }
              </motion.div>
            </div>

            {/* Navigation Arrow Right */}
            {totalCalls > 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-12 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex-shrink-0 hover:bg-muted/50"
                onClick={(e) => {
                  e.stopPropagation();
                  const newIndex = internalIndex < totalCalls - 1 ? internalIndex + 1 : 0;
                  setInternalIndex(newIndex);
                  onNavigate?.(newIndex);
                }}
                style={{ opacity: isExpanding ? 0 : 1 }}
              >
                <ChevronRight className="h-3 w-3" />
              </Button>
            )}

            {/* Expand Button */}
            <Button 
              variant="ghost" 
              size="icon"
              className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex-shrink-0 hover:bg-muted/50" 
              style={{ opacity: isExpanding ? 0 : 1 }}
            >
              <Maximize2 className="h-3 w-3" />
            </Button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 