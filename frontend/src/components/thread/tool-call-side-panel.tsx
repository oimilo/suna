'use client';

import { Project } from '@/lib/api';
import { getToolIcon, getUserFriendlyToolName } from '@/components/thread/utils';
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ApiMessageType } from '@/components/thread/types';
import { CircleDashed, Computer, Radio, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { Button } from '@/components/ui/button';
import { ToolView } from './tool-views/wrapper';
import { formatTimestamp } from './tool-views/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { BRANDING } from '@/lib/branding';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { ToolNavigationDropdown } from './tool-navigation-dropdown';
import { WindowControls } from './window-controls';
import {
  ToolCallInput,
  AUXILIARY_FILE_NAME_SET,
  MAIN_FILE_TOOL_NAMES,
  MAIN_FILE_SCORE_THRESHOLD,
  computeMainFileScore,
  detectMainFileIndex,
  extractToolCallFileInfo,
  isMainFileName,
  logMainFileDebug,
  normalizeToolName,
} from './tool-call-helpers';

interface ToolCallSidePanelProps {
  isOpen: boolean;
  isPanelMinimized?: boolean;
  onClose: () => void;
  onMinimize?: () => void;
  toolCalls: ToolCallInput[];
  currentIndex: number;
  onNavigate: (newIndex: number) => void;
  externalNavigateToIndex?: number;
  messages?: ApiMessageType[];
  agentStatus: string;
  project?: Project;
  renderAssistantMessage?: (
    assistantContent?: string,
    toolContent?: string,
  ) => React.ReactNode;
  renderToolResult?: (
    toolContent?: string,
    isSuccess?: boolean,
  ) => React.ReactNode;
  isLoading?: boolean;
  agentName?: string;
  onFileClick?: (filePath: string) => void;
  disableInitialAnimation?: boolean;
  onRequestOpen?: () => void;
  onMainFileDetected?: () => void;  // Callback quando arquivo principal é detectado
}

interface ToolCallSnapshot {
  id: string;
  toolCall: ToolCallInput;
  index: number;
  timestamp: number;
}

const FLOATING_LAYOUT_ID = 'tool-panel-float';
const CONTENT_LAYOUT_ID = 'tool-panel-content';

export function ToolCallSidePanel({
  isOpen,
  isPanelMinimized = false,
  onClose,
  onMinimize,
  toolCalls,
  currentIndex,
  onNavigate,
  messages,
  agentStatus,
  project,
  isLoading = false,
  externalNavigateToIndex,
  agentName,
  onFileClick,
  disableInitialAnimation,
  onRequestOpen,
  onMainFileDetected,
}: ToolCallSidePanelProps) {
  const [dots, setDots] = React.useState('');
  const [internalIndex, setInternalIndex] = React.useState(0);
  const [navigationMode, setNavigationMode] = React.useState<'live' | 'manual'>('live');
  const [toolCallSnapshots, setToolCallSnapshots] = React.useState<ToolCallSnapshot[]>([]);
  const [isInitialized, setIsInitialized] = React.useState(false);
  const [mainDeliveryIndex, setMainDeliveryIndex] = React.useState<number>(-1);
  const [showTechnicalDetails, setShowTechnicalDetails] = React.useState(false);
  const [hasUserInteracted, setHasUserInteracted] = React.useState(false);
  const [isMaximized, setIsMaximized] = React.useState(false);

  const isMobile = useIsMobile();
  
  // Try to use sidebar context, but fall back to false if not available
  let isPinned = false;
  try {
    const context = useSidebarContext();
    isPinned = context.isPinned;
  } catch {
    // Context not available, use default
  }

  const handleClose = React.useCallback(() => {
    onClose();
  }, [onClose]);
  
  const handleMinimize = React.useCallback(() => {
    if (onMinimize) {
      onMinimize();
    }
  }, [onMinimize]);

  const getToolCallFileInfo = React.useCallback(extractToolCallFileInfo, []);

  // Detecta se é um momento de entrega relevante
  const isDeliveryMoment = React.useCallback((toolCall: ToolCallInput): boolean => {
    const rawName = toolCall.assistantCall?.name;
    if (!rawName) return false;

    const normalizedName = normalizeToolName(rawName);

    if (MAIN_FILE_TOOL_NAMES.has(normalizedName)) {
      const { fileName, filePath } = getToolCallFileInfo(toolCall);
      if (!fileName) {
        return false;
      }

      const normalizedFileName = fileName.toLowerCase();
      if (
        AUXILIARY_FILE_NAME_SET.has(normalizedFileName) ||
        normalizedFileName.includes('test.') ||
        normalizedFileName.includes('spec.') ||
        normalizedFileName.includes('_test.') ||
        normalizedFileName.includes('.test.')
      ) {
        return false;
      }

      const candidateIndex = toolCalls.findIndex(candidate => candidate === toolCall);
      const index = candidateIndex >= 0 ? candidateIndex : toolCalls.length - 1;
      const score = computeMainFileScore({
        index,
        totalCalls: Math.max(toolCalls.length, 1),
        fileName,
        filePath,
        toolName: normalizedName,
      });

      const passed = score >= MAIN_FILE_SCORE_THRESHOLD || isMainFileName(fileName);

      logMainFileDebug('delivery-check', {
        toolName: normalizedName,
        fileName,
        filePath,
        score,
        passed,
      });

      if (score >= MAIN_FILE_SCORE_THRESHOLD) {
        return true;
      }

      return isMainFileName(fileName);
    }

    if (normalizedName === 'deploy' || normalizedName === 'expose-port') {
      logMainFileDebug('delivery-check', {
        toolName: normalizedName,
        reason: 'forced-delivery-tool',
      });
      return true;
    }

    if (
      normalizedName === 'create-credential-profile' ||
      normalizedName === 'connect-credential-profile'
    ) {
      logMainFileDebug('delivery-check', {
        toolName: normalizedName,
        reason: 'credential-tool',
      });
      return true;
    }

    return false;
  }, [getToolCallFileInfo, toolCalls]);

  // Detecta o arquivo principal baseado no contexto do projeto
  const detectMainFile = React.useCallback((calls: ToolCallInput[]): number => detectMainFileIndex(calls), []);

  // Verifica se é uma operação técnica que deve ser ocultada
  const isTechnicalOperation = (name?: string): boolean => {
    if (!name) return false;
    const technicalOps = [
      'execute-command',
      'str-replace',
      'edit-file',
      'read-file',
      'check-command-output',
      'list-commands',
      'terminate-command',
      'ask',
      'complete'
    ];
    return technicalOps.includes(name);
  };

  React.useEffect(() => {
    const newSnapshots = toolCalls.map((toolCall, index) => ({
      id: `${index}-${toolCall.assistantCall.timestamp || Date.now()}`,
      toolCall,
      index,
      timestamp: Date.now(),
    }));

    const hadSnapshots = toolCallSnapshots.length > 0;
    const hasNewSnapshots = newSnapshots.length > toolCallSnapshots.length;
    setToolCallSnapshots(newSnapshots);

    if (!isInitialized && newSnapshots.length > 0) {
      const completedCount = newSnapshots.filter(s =>
        s.toolCall.toolResult?.content &&
        s.toolCall.toolResult.content !== 'STREAMING'
      ).length;

      if (completedCount > 0) {
        let lastCompletedIndex = -1;
        for (let i = newSnapshots.length - 1; i >= 0; i--) {
          const snapshot = newSnapshots[i];
          if (snapshot.toolCall.toolResult?.content &&
            snapshot.toolCall.toolResult.content !== 'STREAMING') {
            lastCompletedIndex = i;
            break;
          }
        }
        setInternalIndex(Math.max(0, lastCompletedIndex));
      } else {
        setInternalIndex(Math.max(0, newSnapshots.length - 1));
      }
      setIsInitialized(true);
    } else if (hasNewSnapshots && navigationMode === 'live') {
      const latestSnapshot = newSnapshots[newSnapshots.length - 1];
      const isLatestStreaming = latestSnapshot?.toolCall.toolResult?.content === 'STREAMING';
      if (isLatestStreaming) {
        let lastCompletedIndex = -1;
        for (let i = newSnapshots.length - 1; i >= 0; i--) {
          const snapshot = newSnapshots[i];
          if (snapshot.toolCall.toolResult?.content &&
            snapshot.toolCall.toolResult.content !== 'STREAMING') {
            lastCompletedIndex = i;
            break;
          }
        }
        if (lastCompletedIndex >= 0) {
          setInternalIndex(lastCompletedIndex);
        } else {
          setInternalIndex(newSnapshots.length - 1);
        }
      } else {
        setInternalIndex(newSnapshots.length - 1);
      }
    } else if (hasNewSnapshots && navigationMode === 'manual') {
    }
  }, [toolCalls, navigationMode, toolCallSnapshots.length, isInitialized]);

  React.useEffect(() => {
    if (isOpen && !isInitialized && toolCallSnapshots.length > 0) {
      setInternalIndex(Math.min(currentIndex, toolCallSnapshots.length - 1));
    }
  }, [isOpen, currentIndex, isInitialized, toolCallSnapshots.length]);

  // Detecta arquivo principal sempre que toolCalls mudar
  React.useEffect(() => {
    // console.log('[DEBUG-USEEFFECT] ===== useEffect de detecção disparado =====');
    // console.log('[DEBUG-USEEFFECT] toolCalls.length:', toolCalls.length);
    
    if (!toolCalls.length) {
      // console.log('[DEBUG-USEEFFECT] Sem tool calls, retornando');
      return;
    }
    
    // Sempre detecta o arquivo principal para mostrar a tag "Principal"
    const mainIdx = detectMainFile(toolCalls);
    // console.log('[DEBUG-USEEFFECT] Resultado de detectMainFile:', mainIdx);
    
    if (mainIdx > -1) {
      // console.log('[DEBUG-USEEFFECT] ✓ Arquivo principal detectado! Setando mainDeliveryIndex para:', mainIdx);
      setMainDeliveryIndex(mainIdx);
    } else {
      // console.log('[DEBUG-USEEFFECT] ✗ Nenhum arquivo principal. Resetando mainDeliveryIndex para -1');
      setMainDeliveryIndex(-1);
    }
  }, [toolCalls, detectMainFile]); // Roda sempre que toolCalls mudar

  // Auto-abertura inteligente e navegação para arquivo principal
  React.useEffect(() => {
    if (!toolCalls.length || hasUserInteracted || isLoading) return;

    // console.log('[PANEL] 🔍 Verificando', toolCalls.length, 'toolCalls para entregas relevantes');
    
    // Detecta se há entregas relevantes (não apenas qualquer toolcall)
    const hasDelivery = toolCalls.some(tc => isDeliveryMoment(tc));
    
    // console.log('[PANEL] Tem entrega relevante?', hasDelivery);
    
    if (hasDelivery) {
      // Encontra o arquivo principal
      const mainIdx = detectMainFile(toolCalls);
      
      // console.log('[PANEL] Índice do arquivo principal:', mainIdx);
      
      // Se não encontrou arquivo principal, procura por outras entregas importantes
      const deliveryIdx = mainIdx > -1 ? mainIdx : toolCalls.findIndex(tc => {
        const name = tc.assistantCall?.name;
        return name === 'deploy' || name === 'expose_port' || 
               name === 'create_credential_profile';
      });
      
      if (deliveryIdx > -1) {
        // console.log('[PANEL] 🎯 Navegando para entrega no índice:', deliveryIdx);
        setMainDeliveryIndex(deliveryIdx);
        // SEMPRE navega para a entrega principal quando detectada
        setInternalIndex(deliveryIdx);
        // Também atualiza o índice externo para sincronizar
        onNavigate(deliveryIdx);
        
        // Se encontrou arquivo principal (mainIdx > -1), abre maximizado
        if (mainIdx > -1) {
          // console.log('[PANEL] ✅ Arquivo principal detectado no índice', mainIdx, '- abrindo workspace maximizado');
          // Garante que o painel está aberto
          if (!isOpen && onRequestOpen) {
            // console.log('[PANEL] Abrindo painel para mostrar arquivo principal');
            onRequestOpen();
          }
          // Chama callback para maximizar o painel quando arquivo principal é detectado
          // Este callback SEMPRE deve ser chamado quando arquivo principal é detectado
          if (onMainFileDetected) {
            // console.log('[PANEL] 🚀 Chamando onMainFileDetected para maximizar workspace');
            onMainFileDetected();
          } else {
            // console.log('[PANEL] ⚠️ onMainFileDetected não está definido!');
          }
        } else if (!isOpen && !isPanelMinimized && navigationMode === 'live' && onRequestOpen) {
          // Para outras entregas que não são arquivo principal, apenas abre se necessário
          // console.log('[PANEL] Solicitando abertura do painel');
          onRequestOpen();
        }
      }
    } else {
      // console.log('[PANEL] Nenhuma entrega relevante detectada - mantendo painel como está');
    }
    // Se não há entregas relevantes, mantém o painel como está (fechado ou minimizado)
  }, [toolCalls, hasUserInteracted, navigationMode, isOpen, isPanelMinimized, isLoading, onNavigate, onRequestOpen, onMainFileDetected, detectMainFile, isDeliveryMoment]);

  const safeInternalIndex = Math.min(internalIndex, Math.max(0, toolCallSnapshots.length - 1));
  const currentSnapshot = toolCallSnapshots[safeInternalIndex];
  const currentToolCall = currentSnapshot?.toolCall;
  const totalCalls = toolCallSnapshots.length;

  const extractToolName = (toolCall: any) => {
    const rawName = toolCall?.assistantCall?.name || 'Tool Call';
    if (rawName === 'call-mcp-tool') {
      const assistantContent = toolCall?.assistantCall?.content;
      if (assistantContent) {
        try {
          const toolNameMatch = assistantContent.match(/tool_name="([^"]+)"/);
          if (toolNameMatch && toolNameMatch[1]) {
            const mcpToolName = toolNameMatch[1];
            return getUserFriendlyToolName(mcpToolName);
          }
        } catch (e) {
        }
      }
      return 'External Tool';
    }
    return getUserFriendlyToolName(rawName);
  };

  const completedToolCalls = toolCallSnapshots.filter(snapshot =>
    snapshot.toolCall.toolResult?.content &&
    snapshot.toolCall.toolResult.content !== 'STREAMING'
  );
  const totalCompletedCalls = completedToolCalls.length;

  let displayToolCall = currentToolCall;
  let displayIndex = safeInternalIndex;
  let displayTotalCalls = totalCalls;

  const isCurrentToolStreaming = currentToolCall?.toolResult?.content === 'STREAMING';
  if (isCurrentToolStreaming && totalCompletedCalls > 0) {
    const lastCompletedSnapshot = completedToolCalls[completedToolCalls.length - 1];
    displayToolCall = lastCompletedSnapshot.toolCall;
    displayIndex = totalCompletedCalls - 1;
    displayTotalCalls = totalCompletedCalls;
  } else if (!isCurrentToolStreaming) {
    const completedIndex = completedToolCalls.findIndex(snapshot => snapshot.id === currentSnapshot?.id);
    if (completedIndex >= 0) {
      displayIndex = completedIndex;
      displayTotalCalls = totalCompletedCalls;
    }
  }

  const currentToolName = displayToolCall?.assistantCall?.name || 'Tool Call';
  const CurrentToolIcon = getToolIcon(
    currentToolCall?.assistantCall?.name || 'unknown',
  );
  const isStreaming = displayToolCall?.toolResult?.content === 'STREAMING';

  // Extract actual success value from tool content with fallbacks
  const getActualSuccess = (toolCall: any): boolean => {
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

  const isSuccess = isStreaming ? true : getActualSuccess(displayToolCall);

  const internalNavigate = React.useCallback((newIndex: number, source: string = 'internal') => {
    if (newIndex < 0 || newIndex >= totalCalls) return;

    const isNavigatingToLatest = newIndex === totalCalls - 1;

    console.log(`[INTERNAL_NAV] ${source}: ${internalIndex} -> ${newIndex}, mode will be: ${isNavigatingToLatest ? 'live' : 'manual'}`);

    setInternalIndex(newIndex);

    if (isNavigatingToLatest) {
      setNavigationMode('live');
    } else {
      setNavigationMode('manual');
    }

    if (source === 'user_explicit') {
      onNavigate(newIndex);
    }
  }, [internalIndex, totalCalls, onNavigate]);

  const isLiveMode = navigationMode === 'live';
  const showJumpToLive = navigationMode === 'manual' && agentStatus === 'running';
  const showJumpToLatest = navigationMode === 'manual' && agentStatus !== 'running';

  const navigateToPrevious = React.useCallback(() => {
    setHasUserInteracted(true); // Marca que o usuário interagiu
    
    if (displayIndex > 0) {
      let targetIndex = displayIndex - 1;
      
      // Se estamos ocultando detalhes técnicos, pula operações técnicas
      if (!showTechnicalDetails) {
        while (targetIndex > 0) {
          const snapshot = completedToolCalls[targetIndex];
          const name = snapshot?.toolCall?.assistantCall?.name;
          
          // Pula operações técnicas
          if (isTechnicalOperation(name)) {
            targetIndex--;
            continue;
          }
          
          // Pula 'complete' se não for a entrega principal
          if (name === 'complete' && mainDeliveryIndex > -1 && targetIndex !== mainDeliveryIndex) {
            targetIndex--;
            continue;
          }
          
          break;
        }
      }
      
      const targetSnapshot = completedToolCalls[targetIndex];
      if (targetSnapshot) {
        const actualIndex = toolCallSnapshots.findIndex(s => s.id === targetSnapshot.id);
        if (actualIndex >= 0) {
          setNavigationMode('manual');
          internalNavigate(actualIndex, 'user_explicit');
        }
      }
    }
  }, [displayIndex, completedToolCalls, toolCallSnapshots, internalNavigate, showTechnicalDetails, mainDeliveryIndex]);

  const navigateToNext = React.useCallback(() => {
    setHasUserInteracted(true); // Marca que o usuário interagiu
    
    if (displayIndex < displayTotalCalls - 1) {
      let targetIndex = displayIndex + 1;
      
      // Se estamos ocultando detalhes técnicos, pula operações técnicas
      if (!showTechnicalDetails) {
        while (targetIndex < displayTotalCalls) {
          const snapshot = completedToolCalls[targetIndex];
          const name = snapshot?.toolCall?.assistantCall?.name;
          
          // Pula operações técnicas
          if (isTechnicalOperation(name)) {
            targetIndex++;
            continue;
          }
          
          // Pula 'complete' se não for a entrega principal e houver arquivo principal
          if (name === 'complete' && mainDeliveryIndex > -1 && targetIndex !== mainDeliveryIndex) {
            targetIndex++;
            continue;
          }
          
          break;
        }
        
        // Garante que não ultrapassa o limite
        targetIndex = Math.min(targetIndex, displayTotalCalls - 1);
      }
      
      const targetSnapshot = completedToolCalls[targetIndex];
      if (targetSnapshot) {
        const actualIndex = toolCallSnapshots.findIndex(s => s.id === targetSnapshot.id);
        if (actualIndex >= 0) {
          const isLatestCompleted = targetIndex === completedToolCalls.length - 1;
          if (isLatestCompleted) {
            setNavigationMode('live');
          } else {
            setNavigationMode('manual');
          }
          internalNavigate(actualIndex, 'user_explicit');
        }
      }
    }
  }, [displayIndex, displayTotalCalls, completedToolCalls, toolCallSnapshots, internalNavigate, showTechnicalDetails, mainDeliveryIndex]);

  const jumpToLive = React.useCallback(() => {
    setNavigationMode('live');
    internalNavigate(totalCalls - 1, 'user_explicit');
  }, [totalCalls, internalNavigate]);

  const jumpToLatest = React.useCallback(() => {
    setNavigationMode('manual');
    internalNavigate(totalCalls - 1, 'user_explicit');
  }, [totalCalls, internalNavigate]);

  const renderStatusButton = React.useCallback(() => {
    const baseClasses = "flex items-center justify-center gap-1.5 px-2 py-0.5 rounded-full w-[116px]";
    const dotClasses = "w-1.5 h-1.5 rounded-full";
    const textClasses = "text-xs font-medium";

    if (isLiveMode) {
      if (agentStatus === 'running') {
        return (
          <div className={`${baseClasses} bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8`}>
            <div className={`${dotClasses} bg-emerald-500 animate-pulse`} />
            <span className={`${textClasses} text-muted-foreground`}>Atualizações ao Vivo</span>
          </div>
        );
      } else {
        return (
          <div className={`${baseClasses} bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8`}>
            <div className={`${dotClasses} bg-zinc-400 opacity-60`} />
            <span className={`${textClasses} text-muted-foreground`}>Última Ferramenta</span>
          </div>
        );
      }
    } else {
      if (agentStatus === 'running') {
        return (
          <div
            className={`${baseClasses} bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer`}
            onClick={jumpToLive}
          >
            <div className={`${dotClasses} bg-emerald-500 animate-pulse`} />
            <span className={`${textClasses} text-muted-foreground`}>Ir para Ao Vivo</span>
          </div>
        );
      } else {
        return (
          <div
            className={`${baseClasses} bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition-colors cursor-pointer`}
            onClick={jumpToLatest}
          >
            <div className={`${dotClasses} bg-blue-500 opacity-80`} />
            <span className={`${textClasses} text-muted-foreground`}>Ir para última</span>
          </div>
        );
      }
    }
  }, [isLiveMode, agentStatus, jumpToLive, jumpToLatest]);

  const handleSliderChange = React.useCallback(([newValue]: [number]) => {
    const targetSnapshot = completedToolCalls[newValue];
    if (targetSnapshot) {
      const actualIndex = toolCallSnapshots.findIndex(s => s.id === targetSnapshot.id);
      if (actualIndex >= 0) {
        const isLatestCompleted = newValue === completedToolCalls.length - 1;
        if (isLatestCompleted) {
          setNavigationMode('live');
        } else {
          setNavigationMode('manual');
        }

        internalNavigate(actualIndex, 'user_explicit');
      }
    }
  }, [completedToolCalls, toolCallSnapshots, internalNavigate]);

  React.useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'i') {
        event.preventDefault();
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  React.useEffect(() => {
    if (!isOpen) return;
    const handleSidebarToggle = (event: CustomEvent) => {
      if (event.detail.expanded) {
        handleClose();
      }
    };

    window.addEventListener(
      'sidebar-left-toggled',
      handleSidebarToggle as EventListener,
    );
    return () =>
      window.removeEventListener(
        'sidebar-left-toggled',
        handleSidebarToggle as EventListener,
      );
  }, [isOpen, handleClose]);

  React.useEffect(() => {
    if (externalNavigateToIndex !== undefined && externalNavigateToIndex >= 0 && externalNavigateToIndex < totalCalls) {
      internalNavigate(externalNavigateToIndex, 'external_click');
    }
  }, [externalNavigateToIndex, totalCalls, internalNavigate]);

  React.useEffect(() => {
    if (!isStreaming) return;
    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev === '...') return '';
        return prev + '.';
      });
    }, 500);

    return () => clearInterval(interval);
  }, [isStreaming]);

  // Oculta o painel quando está minimizado OU fechado
  if (!isOpen || isPanelMinimized) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-30 pointer-events-none">
        <div className="p-4 h-full flex items-stretch justify-end pointer-events-auto">
          <div
            className={cn(
              'border rounded-2xl flex flex-col shadow-2xl bg-background',
              'w-full',
            )}
          >
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex flex-col h-full">
                {/* Native window header */}
                <div className="h-10 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-3 select-none cursor-default">
                  <WindowControls
                    onMinimize={handleMinimize}
                    onMaximize={() => setIsMaximized(!isMaximized)}
                    isMaximized={isMaximized}
                    variant="macos"
                  />
                  <div className="flex-1 flex items-center justify-center">
                    <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                      {agentName ? `Área de trabalho de ${agentName}` : `Área de trabalho de ${BRANDING.name}`}
                    </h2>
                  </div>
                  <div className="w-[34px]" /> {/* Spacer for balance */}
                </div>
                <div className="flex-1 p-4 overflow-auto">
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-20 w-full rounded-md" />
                    <Skeleton className="h-40 w-full rounded-md" />
                    <Skeleton className="h-20 w-full rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (!displayToolCall && toolCallSnapshots.length === 0) {
      return (
        <div className="flex flex-col h-full">
          {/* Native window header */}
          <div className="h-10 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-3 select-none cursor-default">
            <WindowControls
              onMinimize={handleMinimize}
              onMaximize={() => setIsMaximized(!isMaximized)}
              isMaximized={isMaximized}
              variant="macos"
            />
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {agentName ? `Área de trabalho de ${agentName}` : `Área de trabalho de ${BRANDING.name}`}
              </h2>
            </div>
            <div className="w-[34px]" /> {/* Spacer for balance */}
          </div>
          <div className="flex flex-col items-center justify-center flex-1 p-8">
            <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
              <div className="relative">
                <div className="w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-b from-zinc-100 to-zinc-50 shadow-inner dark:from-zinc-800/40 dark:to-zinc-900/60">
                  <Computer className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
                </div>
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                  Sem atividade de ferramentas
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Chamadas de ferramentas e interações do computador aparecerão aqui quando estiverem sendo executadas.
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!displayToolCall && toolCallSnapshots.length > 0) {
      const firstStreamingTool = toolCallSnapshots.find(s => s.toolCall.toolResult?.content === 'STREAMING');
      if (firstStreamingTool && totalCompletedCalls === 0) {
        return (
          <div className="flex flex-col h-full">
            {/* Native window header */}
            <div className="h-10 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-3 select-none cursor-default">
              <WindowControls
                onClose={handleClose}
                onMinimize={handleMinimize}
                onMaximize={() => setIsMaximized(!isMaximized)}
                isMaximized={isMaximized}
                variant="macos"
              />
              <div className="flex-1 flex items-center justify-center gap-2">
                <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                  {agentName ? `Área de trabalho de ${agentName}` : `Área de trabalho de ${BRANDING.name}`}
                </h2>
                <div className="px-2 py-0.5 rounded text-xs font-medium bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 text-muted-foreground flex items-center gap-1">
                  <CircleDashed className="h-3 w-3 animate-spin opacity-60" />
                  <span>Executando</span>
                </div>
              </div>
              <div className="w-[34px]" /> {/* Spacer for balance */}
            </div>
            <div className="flex flex-col items-center justify-center flex-1 p-8">
              <div className="flex flex-col items-center space-y-4 max-w-sm text-center">
                <div className="relative">
                  <div className="w-16 h-16 bg-gradient-to-b from-zinc-100 to-zinc-50 shadow-inner dark:from-zinc-800/40 dark:to-zinc-900/60 rounded-full flex items-center justify-center">
                    <CircleDashed className="h-8 w-8 text-zinc-400 dark:text-zinc-600 animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100">
                    Ferramenta em execução
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                    {getUserFriendlyToolName(firstStreamingTool.toolCall.assistantCall.name || 'Tool')} está em execução. Os resultados aparecerão aqui quando concluído.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      }

      return (
        <div className="flex flex-col h-full">
          {/* Native window header */}
          <div className="h-10 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-3 select-none cursor-default">
            <WindowControls
              onMinimize={handleMinimize}
              onMaximize={() => setIsMaximized(!isMaximized)}
              isMaximized={isMaximized}
              variant="macos"
            />
            <div className="flex-1 flex items-center justify-center">
              <h2 className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
                {agentName ? `Área de trabalho de ${agentName}` : `Área de trabalho de ${BRANDING.name}`}
              </h2>
            </div>
            <div className="w-[34px]" /> {/* Spacer for balance */}
          </div>
          <div className="flex-1 p-4 overflow-auto">
            <div className="space-y-4">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
          </div>
        </div>
      );
    }

    const toolView = (
      <ToolView
        name={displayToolCall.assistantCall.name}
        assistantContent={displayToolCall.assistantCall.content}
        toolContent={displayToolCall.toolResult?.content}
        assistantTimestamp={displayToolCall.assistantCall.timestamp}
        toolTimestamp={displayToolCall.toolResult?.timestamp}
        isSuccess={isSuccess}
        isStreaming={isStreaming}
        project={project}
        messages={messages}
        agentStatus={agentStatus}
        currentIndex={displayIndex}
        totalCalls={displayTotalCalls}
        onFileClick={onFileClick}
        isPanelMinimized={isPanelMinimized}
      />
    );

    return (
      <div className="flex flex-col h-full">
        {/* Native window header */}
        <motion.div
          layoutId={CONTENT_LAYOUT_ID}
          className="h-10 bg-gradient-to-b from-zinc-100 to-zinc-50 dark:from-zinc-900 dark:to-zinc-950 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-3 select-none cursor-default"
        >
          <WindowControls
            onMinimize={handleMinimize}
            onMaximize={() => setIsMaximized(!isMaximized)}
            isMaximized={isMaximized}
            variant="macos"
          />
          <div className="flex-1 flex items-center justify-center gap-2">
            <motion.h2 layoutId="tool-icon" className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {agentName ? `Área de trabalho de ${agentName}` : `Área de trabalho de ${BRANDING.name}`}
            </motion.h2>
            {isStreaming && (
              <div className="px-2 py-0.5 rounded text-xs font-medium bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 text-muted-foreground flex items-center gap-1">
                <CircleDashed className="h-3 w-3 animate-spin opacity-60" />
                <span>Executando</span>
              </div>
            )}
          </div>
          <div className="w-[34px]" /> {/* Spacer for balance */}
        </motion.div>

        <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-zinc-300 dark:scrollbar-thumb-zinc-700 scrollbar-track-transparent">
          {toolView}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="sidepanel"
          layoutId={FLOATING_LAYOUT_ID}
          initial={disableInitialAnimation ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: disableInitialAnimation ? 0 : 0.15 },
            layout: {
              type: "spring",
              stiffness: 400,
              damping: 35
            }
          }}
          className={cn(
            'fixed border border-black/6 dark:border-white/8 rounded-2xl flex flex-col z-30',
            'shadow-lg dark:shadow-none',
            isMaximized
              ? 'inset-4' // Maximizado: ocupa quase toda a tela
              : cn(
                  'right-4',
                  isMobile
                    ? 'left-4'
                    : isPinned 
                      ? 'left-[calc(256px+(100%-256px)*0.4+16px)]' // Quando pinned: sidebar + 40% do espaço restante + gap
                      : 'left-[calc(40%+16px)]', // Quando não pinned: 40% da tela + gap
                ),
          )}
          style={{
            overflow: 'hidden',
            ...(isMaximized ? {} : {
              top: '25px',
              bottom: '25px',
            })
          }}
        >
          <div className="flex-1 flex flex-col overflow-hidden bg-background">
            {renderContent()}
          </div>
          {(displayTotalCalls > 1 || (isCurrentToolStreaming && totalCompletedCalls > 0)) && (
            <div
              className={cn(
                'border-t border-black/6 dark:border-white/8 bg-background',
                isMobile ? 'p-2' : 'px-4 py-2.5',
              )}
            >
              <div className="flex items-center justify-between w-full">
                <ToolNavigationDropdown
                  toolCallSnapshots={toolCallSnapshots}
                  currentIndex={safeInternalIndex}
                  mainDeliveryIndex={mainDeliveryIndex}
                  onNavigate={(index) => {
                    setNavigationMode('manual');
                    internalNavigate(index, 'user_explicit');
                    setHasUserInteracted(true);
                  }}
                  showTechnicalDetails={showTechnicalDetails}
                  onToggleTechnicalDetails={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  isTechnicalOperation={isTechnicalOperation}
                  isDeliveryMoment={isDeliveryMoment}
                />
                
                <div className="text-xs text-muted-foreground/60">
                  {displayToolCall?.toolResult?.timestamp && !isStreaming
                    ? formatTimestamp(displayToolCall.toolResult.timestamp)
                    : displayToolCall?.assistantCall?.timestamp
                      ? formatTimestamp(displayToolCall.assistantCall.timestamp)
                      : ""}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}