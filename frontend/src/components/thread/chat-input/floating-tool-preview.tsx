import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CircleDashed, Maximize2, ChevronLeft, ChevronRight } from 'lucide-react';
import { getToolIcon, getUserFriendlyToolName } from '@/components/thread/utils';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { BRANDING } from '@/lib/branding';
import type { ToolCallInput } from '../tool-call-helpers';

export type { ToolCallInput } from '../tool-call-helpers';

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
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
          className="w-full max-w-md mx-auto"
          style={{ pointerEvents: 'auto' }}
        >
          <motion.div
            className={cn(
              "relative bg-background/95 backdrop-blur-md",
              "border border-black/6 dark:border-white/8",
              "rounded-xl shadow-2xl dark:shadow-none",
              "overflow-hidden cursor-pointer",
              "hover:shadow-xl dark:hover:shadow-none transition-shadow"
            )}
            onClick={handleClick}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Header compacto */}
            <div className="bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/6 dark:border-white/8 px-3 py-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CurrentToolIcon className="h-3.5 w-3.5 text-muted-foreground opacity-60 flex-shrink-0" />
                  <span className="text-xs font-medium text-foreground truncate">
                    {getUserFriendlyToolName(toolName)}
                  </span>
                  {totalCalls > 1 && (
                    <span className="text-[10px] text-muted-foreground bg-black/[0.02] dark:bg-white/[0.03] px-1.5 py-0.5 rounded-full flex-shrink-0">
                      {internalIndex + 1}/{totalCalls}
                    </span>
                  )}
                  {isStreaming && (
                    <div className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center gap-1 flex-shrink-0">
                      <CircleDashed className="h-2.5 w-2.5 animate-spin" />
                      <span>Executando</span>
                    </div>
                  )}
                  {!isStreaming && isSuccess && (
                    <div className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                      Concluído
                    </div>
                  )}
                  {!isStreaming && !isSuccess && (
                    <div className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex-shrink-0">
                      Erro
                    </div>
                  )}
                </div>
                
                {/* Botão para expandir */}
                <div className="flex items-center gap-1 ml-2">
                  {totalCalls > 1 && (
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newIndex = internalIndex > 0 ? internalIndex - 1 : totalCalls - 1;
                          setInternalIndex(newIndex);
                          onNavigate?.(newIndex);
                        }}
                      >
                        <ChevronLeft className="h-3 w-3 opacity-60" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newIndex = internalIndex < totalCalls - 1 ? internalIndex + 1 : 0;
                          setInternalIndex(newIndex);
                          onNavigate?.(newIndex);
                        }}
                      >
                        <ChevronRight className="h-3 w-3 opacity-60" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClick();
                    }}
                  >
                    <Maximize2 className="h-3 w-3 opacity-60" />
                  </Button>
                </div>
              </div>
            </div>
            
            {/* Preview content minimalista */}
            <div className="px-3 py-2 bg-black/[0.01] dark:bg-white/[0.01]">
              <div className="text-[10px] text-muted-foreground/60">
                {agentName ? `${agentName} workspace` : 'Agent workspace'} • Clique para expandir
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}; 