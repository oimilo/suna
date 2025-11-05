import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDashed, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getToolIcon, getUserFriendlyToolName } from '@/components/thread/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
  agentName: _agentName,
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

  const goToIndex = React.useCallback((newIndex: number) => {
    const next = (newIndex + totalCalls) % totalCalls;
    setInternalIndex(next);
    onNavigate?.(next);
  }, [totalCalls, onNavigate]);

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
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{
            type: 'spring',
            stiffness: 520,
            damping: 34,
          }}
          className="w-full max-w-[210px]"
          style={{ pointerEvents: 'auto' }}
        >
          <motion.div
            layoutId={CONTENT_LAYOUT_ID}
            className={cn(
              'relative overflow-hidden cursor-pointer',
              'rounded-xl border border-black/6 dark:border-white/8',
              'bg-background'
            )}
            onClick={handleClick}
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            style={{ opacity: isExpanding ? 0 : 1 }}
          >
            <div className="px-3 py-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="flex-shrink-0 w-7 h-7 rounded-lg border border-border/60 bg-muted/20 flex items-center justify-center">
                    {isStreaming ? (
                      <CircleDashed className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                    ) : (
                      <CurrentToolIcon className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </div>

                  <span className="text-xs font-medium text-foreground truncate">
                    {getUserFriendlyToolName(toolName)}
                  </span>

                  {totalCalls > 1 && (
                    <span className="text-[10px] text-muted-foreground bg-background/70 px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {internalIndex + 1}/{totalCalls}
                    </span>
                  )}

                  {isStreaming && (
                    <div className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-600 flex items-center gap-1 flex-shrink-0">
                      <CircleDashed className="h-2.5 w-2.5 animate-spin" />
                      <span>Executando</span>
                    </div>
                  )}
                  {!isStreaming && isSuccess && (
                    <div className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-600 flex-shrink-0">
                      Concluído
                    </div>
                  )}
                  {!isStreaming && !isSuccess && (
                    <div className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-red-500/10 text-red-600 flex-shrink-0">
                      Erro
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  {showIndicators && indicatorTotal === 2 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextIndex = indicatorIndex === 0 ? 1 : 0;
                        onIndicatorClick?.(nextIndex);
                      }}
                      className="flex items-center gap-1 px-1.5 py-1 rounded-md hover:bg-muted/40 transition-colors"
                    >
                      {Array.from({ length: indicatorTotal }).map((_, index) => (
                        <div
                          key={index}
                          className={cn(
                            'transition-all duration-300 ease-out rounded-full',
                            index === indicatorIndex
                              ? 'w-4 h-1.5 bg-foreground'
                              : 'w-2.5 h-1.5 bg-muted-foreground/40'
                          )}
                        />
                      ))}
                    </button>
                  )}
                  {totalCalls > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToIndex(internalIndex - 1);
                        }}
                      >
                        <ChevronLeft className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-foreground"
                        onClick={(e) => {
                          e.stopPropagation();
                          goToIndex(internalIndex + 1);
                        }}
                      >
                        <ChevronRight className="h-3 w-3" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick();
                    }}
                  >
                    <Maximize2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};