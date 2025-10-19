'use client';

import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useMemo,
} from 'react';
import { useSearchParams } from 'next/navigation';
import { BRANDING } from '@/lib/branding';
import { BillingError } from '@/lib/api';
import { toast } from 'sonner';
import { ChatInput } from '@/components/thread/chat-input/chat-input';
import { useSidebarSafe } from '@/hooks/use-sidebar-safe';
import { useAgentStream } from '@/hooks/useAgentStream';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
import { isLocalMode } from '@/lib/config';
import { ThreadContent } from '@/components/thread/content/ThreadContent';
import { ThreadSkeleton } from '@/components/thread/content/ThreadSkeleton';
import { useAddUserMessageMutation } from '@/hooks/react-query/threads/use-messages';
import { useStartAgentMutation, useStopAgentMutation } from '@/hooks/react-query/threads/use-agent-run';
import { useSubscription } from '@/hooks/react-query/subscriptions/use-subscriptions';
import { SubscriptionStatus } from '@/components/thread/chat-input/_use-model-selection';

import { UnifiedMessage, ApiMessageType, ToolCallInput, Project } from '../_types';
import { useThreadData, useToolCalls, useBilling, useKeyboardShortcuts } from '../_hooks';
import { ThreadError, UpgradeDialog, ThreadLayout } from '../_components';
import { useVncPreloader } from '@/hooks/useVncPreloader';
import { useThreadAgent } from '@/hooks/react-query/agents/use-agents';
import { useTranslations } from '@/hooks/use-translations';
import { useSidebarContext } from '@/contexts/sidebar-context';

export default function ThreadPage({
  params,
}: {
  params: Promise<{
    projectId: string;
    threadId: string;
  }>;
}) {
  const unwrappedParams = React.use(params);
  const { projectId, threadId } = unwrappedParams;
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const { t } = useTranslations();

  // State
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileToView, setFileToView] = useState<string | null>(null);
  const [filePathList, setFilePathList] = useState<string[] | undefined>(undefined);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [initialPanelOpenAttempted, setInitialPanelOpenAttempted] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>(undefined);
  const [isSidePanelAnimating, setIsSidePanelAnimating] = useState(false);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [hasMainFileDetected, setHasMainFileDetected] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const latestMessageRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userHasScrolled, setUserHasScrolled] = useState(false);
  const hasInitiallyScrolled = useRef<boolean>(false);
  const initialLayoutAppliedRef = useRef(false);

  // Sidebar
  const { state: leftSidebarState, setOpen: setLeftSidebarOpen } = useSidebarSafe();
  const { isPinned } = useSidebarContext();

  // Custom hooks
  const {
    messages,
    setMessages,
    project,
    sandboxId,
    projectName,
    agentRunId,
    setAgentRunId,
    agentStatus,
    setAgentStatus,
    isLoading,
    error,
    initialLoadCompleted,
    threadQuery,
    messagesQuery,
    projectQuery,
    agentRunsQuery,
  } = useThreadData(threadId, projectId);

  const {
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
  } = useToolCalls(messages, setLeftSidebarOpen, agentStatus);

  const {
    showBillingAlert,
    setShowBillingAlert,
    billingData,
    setBillingData,
    checkBillingLimits,
    billingStatusQuery,
  } = useBilling(project?.account_id, agentStatus, initialLoadCompleted);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    isSidePanelOpen,
    setIsSidePanelOpen,
    leftSidebarState,
    setLeftSidebarOpen,
    userClosedPanelRef,
  });

  const addUserMessageMutation = useAddUserMessageMutation();
  const startAgentMutation = useStartAgentMutation();
  const stopAgentMutation = useStopAgentMutation();
  const { data: threadAgentData } = useThreadAgent(threadId);
  const agent = threadAgentData?.agent;
  const workflowId = threadQuery.data?.metadata?.workflow_id;

  // Set initial selected agent from thread data
  useEffect(() => {
    if (threadAgentData?.agent && !selectedAgentId) {
      setSelectedAgentId(threadAgentData.agent.agent_id);
    }
  }, [threadAgentData, selectedAgentId]);

  const { data: subscriptionData } = useSubscription();
  const subscriptionStatus: SubscriptionStatus = subscriptionData?.status === 'active'
    ? 'active'
    : 'no_subscription';

  // Memoize project for VNC preloader to prevent re-preloading on every render
  const memoizedProject = useMemo(() => project, [project?.id, project?.sandbox?.vnc_preview, project?.sandbox?.pass]);

  useVncPreloader(memoizedProject);


  const handleProjectRenamed = useCallback((newName: string) => {
  }, []);

  const handleSidePanelClose = useCallback(() => {
    setIsSidePanelOpen(false);
    userClosedPanelRef.current = true;
    setAutoOpenedPanel(true);
    setIsPanelMinimized(false);
  }, [setIsSidePanelOpen, setAutoOpenedPanel, setIsPanelMinimized]);

  const handleSidePanelMinimize = useCallback(() => {
    console.log('[PAGE] onSidePanelMinimize chamado - minimizando workspace');
    setIsPanelMinimized(true);
    setHasMainFileDetected(false);
  }, [setIsPanelMinimized, setHasMainFileDetected]);

  const handleSidePanelMaximize = useCallback(() => {
    console.log('[PAGE] onSidePanelMaximize chamado - maximizando workspace');
    setIsPanelMinimized(false);
    setIsSidePanelOpen(true);
    setHasMainFileDetected(true);
  }, [setIsPanelMinimized, setIsSidePanelOpen, setHasMainFileDetected]);

  const handleSidePanelRequestOpen = useCallback(() => {
    setIsSidePanelOpen(true);
    userClosedPanelRef.current = false;
  }, [setIsSidePanelOpen]);

  const handleExpandToolPreview = useCallback(() => {
    setIsPanelMinimized(false);
    setIsSidePanelOpen(true);
    userClosedPanelRef.current = false;
  }, [setIsPanelMinimized, setIsSidePanelOpen]);

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // Função para detectar se o usuário está próximo do final do scroll
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // Considera "próximo" se estiver a menos de 100px do final
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Handler para detectar scroll manual do usuário
  const handleUserScroll = useCallback(() => {
    const nearBottom = isNearBottom();
    // Se o usuário scrollou para longe do final, marca como scroll manual
    if (!nearBottom && (agentStatus === 'running' || agentStatus === 'connecting')) {
      setUserHasScrolled(true);
    }
    // Se voltou para perto do final, permite auto-scroll novamente
    if (nearBottom) {
      setUserHasScrolled(false);
    }
  }, [isNearBottom, agentStatus]);

  const handleNewMessageFromStream = useCallback((message: UnifiedMessage) => {
    console.log(
      `[STREAM HANDLER] Received message: ID=${message.message_id}, Type=${message.type}`,
    );

    if (!message.message_id) {
      console.warn(
        `[STREAM HANDLER] Received message is missing ID: Type=${message.type}, Content=${message.content?.substring(0, 50)}...`,
      );
    }

    setMessages((prev) => {
      const messageExists = prev.some(
        (m) => m.message_id === message.message_id,
      );
      if (messageExists) {
        return prev.map((m) =>
          m.message_id === message.message_id ? message : m,
        );
      } else {
        return [...prev, message];
      }
    });

    if (message.type === 'tool') {
      setAutoOpenedPanel(false);
    }
  }, [setMessages, setAutoOpenedPanel]);

  const handleStreamStatusChange = useCallback((hookStatus: string) => {
    console.log(`[PAGE] Hook status changed: ${hookStatus}`);
    switch (hookStatus) {
      case 'idle':
      case 'completed':
      case 'stopped':
      case 'agent_not_running':
      case 'error':
      case 'failed':
        setAgentStatus('idle');
        setAgentRunId(null);
        setAutoOpenedPanel(false);

        if (
          [
            'completed',
            'stopped',
            'agent_not_running',
            'error',
            'failed',
          ].includes(hookStatus)
        ) {
          scrollToBottom('smooth');
        }
        break;
      case 'connecting':
        setAgentStatus('connecting');
        // Reset scroll tracking when agent starts
        setUserHasScrolled(false);
        break;
      case 'streaming':
        setAgentStatus('running');
        // Reset scroll tracking when agent starts streaming
        setUserHasScrolled(false);
        break;
    }
  }, [setAgentStatus, setAgentRunId, setAutoOpenedPanel]);

  const handleStreamError = useCallback((errorMessage: string) => {
    console.error(`[PAGE] Stream hook error: ${errorMessage}`);
    if (
      !errorMessage.toLowerCase().includes('not found') &&
      !errorMessage.toLowerCase().includes('agent run is not running')
    ) {
      toast.error(`Erro de Stream: ${errorMessage}`);
    }
  }, []);

  const handleStreamClose = useCallback(() => {
    console.log(`[PAGE] Stream hook closed with final status: ${agentStatus}`);
    
    // Clean up any orphaned STREAMING tool calls
    setToolCalls(prev => prev.map(tc => {
      if (tc.toolResult?.content === 'STREAMING') {
        console.log('[PAGE] Finalizing orphaned STREAMING tool call:', tc.assistantCall?.name);
        return {
          ...tc,
          toolResult: {
            ...tc.toolResult,
            content: JSON.stringify({ 
              message: 'Stream interrupted', 
              status: 'stream_lost' 
            }),
            isSuccess: false
          }
        };
      }
      return tc;
    }));
  }, [agentStatus]);

  // Agent stream hook
  const {
    status: streamHookStatus,
    textContent: streamingTextContent,
    toolCall: streamingToolCall,
    error: streamError,
    agentRunId: currentHookRunId,
    startStreaming,
    stopStreaming,
  } = useAgentStream(
    {
      onMessage: handleNewMessageFromStream,
      onStatusChange: handleStreamStatusChange,
      onError: handleStreamError,
      onClose: handleStreamClose,
    },
    threadId,
    setMessages,
  );

  const handleSubmitMessage = useCallback(
    async (
      message: string,
      options?: { model_name?: string; enable_thinking?: boolean },
    ) => {
      if (!message.trim()) return;
      setIsSending(true);

      const optimisticUserMessage: UnifiedMessage = {
        message_id: `temp-${Date.now()}`,
        thread_id: threadId,
        type: 'user',
        is_llm_message: false,
        content: message,
        metadata: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, optimisticUserMessage]);
      setNewMessage('');
      scrollToBottom('smooth');

      try {
        const messagePromise = addUserMessageMutation.mutateAsync({
          threadId,
          message
        });

        const agentPromise = startAgentMutation.mutateAsync({
          threadId,
          options: {
            ...options,
            agent_id: selectedAgentId
          }
        });

        const results = await Promise.allSettled([messagePromise, agentPromise]);

        if (results[0].status === 'rejected') {
          const reason = results[0].reason;
          console.error("Failed to send message:", reason);
          throw new Error(`Failed to send message: ${reason?.message || reason}`);
        }

        if (results[1].status === 'rejected') {
          const error = results[1].reason;
          console.error("Failed to start agent:", error);

          if (error instanceof BillingError) {
            console.log("Caught BillingError:", error.detail);
            setBillingData({
              currentUsage: error.detail.currentUsage as number | undefined,
              limit: error.detail.limit as number | undefined,
              message: error.detail.message || 'Monthly usage limit reached. Please upgrade.',
              accountId: project?.account_id || null
            });
            setShowBillingAlert(true);

            setMessages(prev => prev.filter(m => m.message_id !== optimisticUserMessage.message_id));
            return;
          }

          throw new Error(`Failed to start agent: ${error?.message || error}`);
        }

        const agentResult = results[1].value;
        setAgentRunId(agentResult.agent_run_id);

        messagesQuery.refetch();
        agentRunsQuery.refetch();

      } catch (err) {
        console.error('Error sending message or starting agent:', err);
        if (!(err instanceof BillingError)) {
          toast.error(err instanceof Error ? err.message : 'Operação falhou');
        }
        setMessages((prev) =>
          prev.filter((m) => m.message_id !== optimisticUserMessage.message_id),
        );
      } finally {
        setIsSending(false);
      }
    },
    [threadId, project?.account_id, addUserMessageMutation, startAgentMutation, messagesQuery, agentRunsQuery, setMessages, setBillingData, setShowBillingAlert, setAgentRunId],
  );

  const handleStopAgent = useCallback(async () => {
    console.log(`[PAGE] Requesting agent stop via hook.`);
    setAgentStatus('idle');

    await stopStreaming();

    if (agentRunId) {
      try {
        await stopAgentMutation.mutateAsync(agentRunId);
        agentRunsQuery.refetch();
      } catch (error) {
        console.error('Error stopping agent:', error);
      }
    }
  }, [stopStreaming, agentRunId, stopAgentMutation, agentRunsQuery, setAgentStatus]);

  const handleOpenFileViewer = useCallback((filePath?: string, filePathList?: string[]) => {
    if (filePath) {
      setFileToView(filePath);
    } else {
      setFileToView(null);
    }
    setFilePathList(filePathList);
    setFileViewerOpen(true);
  }, []);

  const toolViewAssistant = useCallback(
    (assistantContent?: string, toolContent?: string) => {
      if (!assistantContent) return null;

      return (
        <div className="space-y-1">
          <div className="text-xs font-medium text-muted-foreground">
            Assistant Message
          </div>
          <div className="rounded-md border bg-muted/50 p-3">
            <div className="text-xs prose prose-xs dark:prose-invert chat-markdown max-w-none">{assistantContent}</div>
          </div>
        </div>
      );
    },
    [],
  );

  const toolViewResult = useCallback(
    (toolContent?: string, isSuccess?: boolean) => {
      if (!toolContent) return null;

      return (
        <div className="space-y-1">
          <div className="flex justify-between items-center">
            <div className="text-xs font-medium text-muted-foreground">
              Tool Result
            </div>
            <div
              className={`px-2 py-0.5 rounded-full text-xs ${isSuccess
                ? 'bg-green-50 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-red-50 text-red-700 dark:bg-red-900 dark:text-red-300'
                }`}
            >
              {isSuccess ? 'Success' : 'Failed'}
            </div>
          </div>
          <div className="rounded-md border bg-muted/50 p-3">
            <div className="text-xs prose prose-xs dark:prose-invert chat-markdown max-w-none">{toolContent}</div>
          </div>
        </div>
      );
    },
    [],
  );

  // Effects
  useEffect(() => {
    if (!initialLayoutAppliedRef.current) {
      setLeftSidebarOpen(false);
      initialLayoutAppliedRef.current = true;
    }
  }, [setLeftSidebarOpen]);

  useEffect(() => {
    if (initialLoadCompleted && !initialPanelOpenAttempted) {
      setInitialPanelOpenAttempted(true);

      // Lógica inteligente de inicialização
      if (toolCalls.length > 0) {
        console.log('[INIT] Verificando toolCalls para detecção de arquivo principal:', toolCalls.length);
        console.log('[INIT] ToolCalls existentes:', toolCalls.map((tc, i) => ({
          index: i,
          name: tc.assistantCall?.name,
          contentPreview: typeof tc.assistantCall?.content === 'string' 
            ? tc.assistantCall.content.substring(0, 100) 
            : JSON.stringify(tc.assistantCall?.content).substring(0, 100)
        })));
        
        // Padrões de arquivos principais
        const FILE_PATTERNS = {
          web: ['index.html', 'home.html', 'main.html', 'app.html'],
          game: ['game.html', 'play.html', 'index.html', 'main.js'],
          python: ['main.py', 'app.py', 'server.py', 'bot.py', 'script.py'],
          node: ['index.js', 'app.js', 'server.js', 'main.js', 'index.ts'],
          dashboard: ['dashboard.html', 'admin.html', 'panel.html'],
          api: ['webhook.js', 'api.py', 'handler.js', 'function.js']
        };

        // Detecta se há arquivo principal ou entrega importante
        let mainDeliveryIndex = -1;
        const allPatterns = Object.values(FILE_PATTERNS).flat();
        
        for (let i = 0; i < toolCalls.length; i++) {
          const tc = toolCalls[i];
          const name = tc.assistantCall?.name;
          
          // Verifica se é deploy ou expose-port (sempre importante)
          if (name === 'deploy' || name === 'expose_port') {
            console.log('[INIT] Encontrado deploy/expose-port no índice:', i);
            mainDeliveryIndex = i;
            break;
          }
          
          // Verifica se é criação/edição de arquivo principal
          // Suporta tanto underscore quanto hífen nos nomes
          if (name === 'create_file' || name === 'create-file' || 
              name === 'full_file_rewrite' || name === 'full-file-rewrite' || 
              name === 'edit_file' || name === 'edit-file' ||
              name === 'str_replace_editor' || name === 'str-replace-editor') {
            
            // Extração inteligente do conteúdo real
            let content = '';
            const rawContent = tc.assistantCall?.content;
            
            if (typeof rawContent === 'string') {
              try {
                const parsed = JSON.parse(rawContent);
                // Se tiver um campo 'content', usa ele
                content = parsed.content ? 
                  (typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content)) : 
                  rawContent;
              } catch {
                // Não é JSON, usa como string
                content = rawContent;
              }
            } else if (rawContent && typeof rawContent === 'object') {
              // Se já for objeto, procura o campo content
              const objContent = (rawContent as any).content;
              content = objContent ? 
                (typeof objContent === 'string' ? objContent : JSON.stringify(objContent)) : 
                JSON.stringify(rawContent);
            } else {
              content = String(rawContent || '');
            }
            
            console.log('[INIT] Conteúdo extraído para análise:', content.substring(0, 200));
            
            // Procura por padrões de arquivo principal no conteúdo
            // Usa detecção específica para evitar falsos positivos com arquivos anexados
            for (const pattern of allPatterns) {
              // Cria regex para capturar o arquivo independente do caminho
              // Por exemplo: detecta "index.html" em "./index.html", "/tmp/index.html", etc.
              const escapedPattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
              const fileRegex = new RegExp(
                `(file[_-]path|target[_-]file)["'\\s:=]+["']([^"']*[\\/])?${escapedPattern}["']|` +
                `<parameter name="(file[_-]path|target[_-]file)">([^<]*[\\/])?${escapedPattern}</parameter>`,
                'i'
              );
              
              const isFileCreation = fileRegex.test(content);
              
              if (isFileCreation) {
                // Exclui arquivos auxiliares comuns - verifica apenas o nome do arquivo, não todo o conteúdo
                const auxiliaryPatterns = [
                  'style.css', 'styles.css', 'config.js', 'config.json', 
                  'package.json', 'requirements.txt', '.env', '.gitignore',
                  'README.md', 'test.', 'spec.', '_test.', '.test.'
                ];
                
                // Verifica se o padrão (nome do arquivo) é auxiliar
                const isAuxiliary = auxiliaryPatterns.some(aux => pattern === aux);
                
                if (!isAuxiliary) {
                  console.log('[INIT] 🎯 Encontrado arquivo principal (criação/edição):', pattern, 'no índice:', i);
                  mainDeliveryIndex = i;
                  break;
                } else {
                  console.log('[INIT] Arquivo auxiliar ignorado:', pattern);
                }
              }
            }
            
            // Se encontrou arquivo principal, não precisa continuar (a menos que encontre deploy/expose-port depois)
          }
        }
        
        console.log('[INIT] Resultado da detecção - mainDeliveryIndex:', mainDeliveryIndex);
        
        if (mainDeliveryIndex >= 0) {
          // Há entrega principal - abre mostrando ela
          console.log('[INIT] ✅ Abrindo área de trabalho MAXIMIZADA com arquivo principal no índice:', mainDeliveryIndex);
          setIsSidePanelOpen(true);
          setIsPanelMinimized(false); // IMPORTANTE: Garante que abre maximizado
          setHasMainFileDetected(true); // Marca que arquivo principal foi detectado
          setCurrentToolIndex(mainDeliveryIndex);
        } else {
          // Só operações técnicas - mantém minimizado mas visível
          console.log('[INIT] ⚠️ Sem arquivo principal detectado - mantendo minimizado');
          console.log('[INIT] ToolCalls verificados mas não encontraram arquivo principal');
          setIsSidePanelOpen(true);
          setIsPanelMinimized(true);
          setHasMainFileDetected(false);
          // NÃO navega para nenhum índice específico - fica minimizado sem mostrar nada
        }
      }
    }
  }, [initialPanelOpenAttempted, toolCalls, initialLoadCompleted, setCurrentToolIndex, setIsSidePanelOpen, setIsPanelMinimized]);

  // Garante que o painel permanece maximizado quando arquivo principal é detectado
  useEffect(() => {
    if (hasMainFileDetected && isPanelMinimized) {
      console.log('[PAGE] Forçando maximização - arquivo principal foi detectado');
      setIsPanelMinimized(false);
    }
  }, [hasMainFileDetected, isPanelMinimized]);

  // Auto-scroll to bottom when initial load is completed
  useEffect(() => {
    if (initialLoadCompleted) {
      if (messages.length > 0) {
        // Normal project flow
        const firstMessage = messages[0];
        if ((firstMessage?.metadata as any)?.isTemplateMessage) {
          console.log('[TEMPLATE] Template message detected, skipping auto-agent');
          // Don't start any agent for template projects
        }
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
          scrollToBottom('auto');
        }, 100);
      }
      
      // Garantir que os arquivos do template sejam criados
      if ((project?.sandbox as any)?.isOnboardingProject) {
        // Template files are now created during initiateAgent
        // No need to ensure them here
        console.log('[TEMPLATE] Template project detected, files should be in sandbox');
      }
    }
  }, [initialLoadCompleted, messagesQuery, projectId, threadId, project]);

  useEffect(() => {
    if (agentRunId && agentRunId !== currentHookRunId) {
      console.log(
        `[PAGE] Target agentRunId set to ${agentRunId}, initiating stream...`,
      );
      startStreaming(agentRunId);
    }
  }, [agentRunId, startStreaming, currentHookRunId]);

  // Auto-scroll melhorado durante streaming
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const isNewUserMessage = lastMsg?.type === 'user';
    
    // Scroll imediato quando usuário envia mensagem (coloca no topo visível)
    if (isNewUserMessage && messages.length > 1) {
      setUserHasScrolled(false);
      // Pequeno delay para garantir que a mensagem foi renderizada
      setTimeout(() => {
        scrollToBottom('smooth');
      }, 50);
    }
    
    // Auto-scroll contínuo durante streaming se usuário não fez scroll manual
    if ((agentStatus === 'running' || agentStatus === 'connecting') && !userHasScrolled) {
      scrollToBottom('smooth');
    }
    
    // Também faz scroll quando há novo conteúdo de streaming
    if (streamingTextContent && !userHasScrolled) {
      scrollToBottom('smooth');
    }
  }, [messages, agentStatus, userHasScrolled, streamingTextContent]);

  // Auto-scroll quando toolcalls são atualizadas durante streaming
  useEffect(() => {
    if (streamingToolCall && !userHasScrolled && (agentStatus === 'running' || agentStatus === 'connecting')) {
      scrollToBottom('smooth');
    }
  }, [streamingToolCall, userHasScrolled, agentStatus]);

  useEffect(() => {
    if (!latestMessageRef.current || messages.length === 0) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollButton(!entry?.isIntersecting),
      { root: messagesContainerRef.current, threshold: 0.1 },
    );
    observer.observe(latestMessageRef.current);
    return () => observer.disconnect();
  }, [messages, streamingTextContent, streamingToolCall]);

  useEffect(() => {
    console.log(`[PAGE] 🔄 Page AgentStatus: ${agentStatus}, Hook Status: ${streamHookStatus}, Target RunID: ${agentRunId || 'none'}, Hook RunID: ${currentHookRunId || 'none'}`);

    if ((streamHookStatus === 'completed' || streamHookStatus === 'stopped' ||
      streamHookStatus === 'agent_not_running' || streamHookStatus === 'error') &&
      (agentStatus === 'running' || agentStatus === 'connecting')) {
      console.log('[PAGE] Detected hook completed but UI still shows running, updating status');
      setAgentStatus('idle');
      setAgentRunId(null);
      setAutoOpenedPanel(false);
    }
  }, [agentStatus, streamHookStatus, agentRunId, currentHookRunId, setAgentStatus, setAgentRunId, setAutoOpenedPanel]);
  
  // Clean up orphaned STREAMING tool calls when agent becomes idle
  useEffect(() => {
    if ((agentStatus === 'idle' || agentStatus === 'error') && toolCalls.length > 0) {
      const hasStreamingTools = toolCalls.some(tc => tc.toolResult?.content === 'STREAMING');
      
      if (hasStreamingTools) {
        console.log('[PAGE] Cleaning up orphaned STREAMING tool calls (agent is idle)');
        const timer = setTimeout(() => {
          setToolCalls(prev => prev.map(tc => {
            if (tc.toolResult?.content === 'STREAMING') {
              return {
                ...tc,
                toolResult: {
                  ...tc.toolResult,
                  content: JSON.stringify({ 
                    message: 'Tool call completed', 
                    status: 'finalized' 
                  }),
                  isSuccess: true
                }
              };
            }
            return tc;
          }));
        }, 1000); // Wait 1 second before cleaning up to avoid false positives
        
        return () => clearTimeout(timer);
      }
    }
  }, [agentStatus, toolCalls]);

  // SEO title update
  useEffect(() => {
    if (projectName) {
      document.title = `${projectName} | ${BRANDING.company} ${BRANDING.name}`;

      const metaDescription = document.querySelector(
        'meta[name="description"]',
      );
      if (metaDescription) {
        metaDescription.setAttribute(
          'content',
          `${projectName} - Interactive agent conversation powered by ${BRANDING.company} ${BRANDING.name}`,
        );
      }

      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle) {
        ogTitle.setAttribute('content', `${projectName} | ${BRANDING.company} ${BRANDING.name}`);
      }

      const ogDescription = document.querySelector(
        'meta[property="og:description"]',
      );
      if (ogDescription) {
        ogDescription.setAttribute(
          'content',
          `Interactive AI conversation for ${projectName}`,
        );
      }
    }
  }, [projectName]);

  useEffect(() => {
    const debugParam = searchParams.get('debug');
    setDebugMode(debugParam === 'true');
    
    // Template logs removed - using normal flow now
  }, [searchParams]);

  const hasCheckedUpgradeDialog = useRef(false);

  useEffect(() => {
    if (initialLoadCompleted && subscriptionData && !hasCheckedUpgradeDialog.current) {
      hasCheckedUpgradeDialog.current = true;
      const hasSeenUpgradeDialog = localStorage.getItem('kortix_upgrade_dialog_displayed');
      const isFreeTier = subscriptionStatus === 'no_subscription';
      if (!hasSeenUpgradeDialog && isFreeTier && !isLocalMode()) {
        setShowUpgradeDialog(true);
      }
    }
  }, [subscriptionData, subscriptionStatus, initialLoadCompleted]);

  const handleDismissUpgradeDialog = () => {
    setShowUpgradeDialog(false);
    localStorage.setItem('kortix_upgrade_dialog_displayed', 'true');
  };

  useEffect(() => {
    if (streamingToolCall) {
      handleStreamingToolCall(streamingToolCall);
    }
  }, [streamingToolCall, handleStreamingToolCall]);

  useEffect(() => {
    setIsSidePanelAnimating(true);
    const timer = setTimeout(() => setIsSidePanelAnimating(false), 200); // Match transition duration
    return () => clearTimeout(timer);
  }, [isSidePanelOpen]);

  if (!initialLoadCompleted || isLoading) {
    return <ThreadSkeleton isSidePanelOpen={isSidePanelOpen} />;
  }

  if (error) {
    return (
      <ThreadLayout
        threadId={threadId}
        projectName={projectName}
        projectId={project?.id || ''}
        project={project}
        sandboxId={sandboxId}
        isSidePanelOpen={isSidePanelOpen}
        onToggleSidePanel={toggleSidePanel}
        onViewFiles={handleOpenFileViewer}
        fileViewerOpen={fileViewerOpen}
        setFileViewerOpen={setFileViewerOpen}
        fileToView={fileToView}
        filePathList={filePathList}
        toolCalls={toolCalls}
        messages={messages as ApiMessageType[]}
        externalNavIndex={externalNavIndex}
        agentStatus={agentStatus}
        currentToolIndex={currentToolIndex}
        onSidePanelNavigate={handleSidePanelNavigate}
        onSidePanelClose={handleSidePanelClose}
        onSidePanelMinimize={handleSidePanelMinimize}
        onSidePanelMaximize={handleSidePanelMaximize}
        onSidePanelRequestOpen={handleSidePanelRequestOpen}
        renderAssistantMessage={toolViewAssistant}
        renderToolResult={toolViewResult}
        isLoading={!initialLoadCompleted || isLoading}
        showBillingAlert={showBillingAlert}
        billingData={billingData}
        onDismissBilling={() => setShowBillingAlert(false)}
        debugMode={debugMode}
        isMobile={isMobile}
        initialLoadCompleted={initialLoadCompleted}
        agentName={agent && agent.name}
      >
        <ThreadError error={error} />
      </ThreadLayout>
    );
  }

  return (
    <>
      <ThreadLayout
        threadId={threadId}
        projectName={projectName}
        projectId={project?.id || ''}
        project={project}
        sandboxId={sandboxId}
        isSidePanelOpen={isSidePanelOpen}
        isPanelMinimized={isPanelMinimized}
        onToggleSidePanel={toggleSidePanel}
        onProjectRenamed={handleProjectRenamed}
        onViewFiles={handleOpenFileViewer}
        fileViewerOpen={fileViewerOpen}
        setFileViewerOpen={setFileViewerOpen}
        fileToView={fileToView}
        filePathList={filePathList}
        toolCalls={toolCalls}
        messages={messages as ApiMessageType[]}
        externalNavIndex={externalNavIndex}
        agentStatus={agentStatus}
        currentToolIndex={currentToolIndex}
        onSidePanelNavigate={handleSidePanelNavigate}
        onSidePanelClose={handleSidePanelClose}
        onSidePanelMinimize={handleSidePanelMinimize}
        onSidePanelMaximize={handleSidePanelMaximize}
        onSidePanelRequestOpen={handleSidePanelRequestOpen}
        renderAssistantMessage={toolViewAssistant}
        renderToolResult={toolViewResult}
        isLoading={!initialLoadCompleted || isLoading}
        showBillingAlert={showBillingAlert}
        billingData={billingData}
        onDismissBilling={() => setShowBillingAlert(false)}
        debugMode={debugMode}
        isMobile={isMobile}
        initialLoadCompleted={initialLoadCompleted}
        agentName={agent && agent.name}
        disableInitialAnimation={!initialLoadCompleted && toolCalls.length > 0}
      >
        {/* {workflowId && (
          <div className="px-4 pt-4">
            <WorkflowInfo workflowId={workflowId} />
          </div>
        )} */}

        <ThreadContent
          messages={messages}
          streamingTextContent={streamingTextContent}
          streamingToolCall={streamingToolCall}
          agentStatus={agentStatus}
          handleToolClick={handleToolClick}
          handleOpenFileViewer={handleOpenFileViewer}
          readOnly={false}
          streamHookStatus={streamHookStatus}
          sandboxId={sandboxId}
          project={project}
          debugMode={debugMode}
          agentName={agent && agent.name}
          agentAvatar={agent && agent.avatar}
          messagesEndRef={messagesEndRef}
          onScroll={handleUserScroll}
        />

        <div
          className={cn(
            "fixed bottom-0 z-10 bg-gradient-to-t from-background via-background/90 to-transparent pt-8",
            isSidePanelAnimating ? "" : "transition-all duration-200 ease-in-out",
            isPinned && !isMobile ? 'left-64' : leftSidebarState === 'expanded' ? 'left-4 md:left-6' : 'left-4',
            isSidePanelOpen && !isPanelMinimized
              ? (isPinned && !isMobile ? 'right-[50%]' : 'right-[60%]') // Ajusta apenas quando pinned e não minimizado
              : 'right-0',
            isMobile ? 'left-0 right-0' : ''
          )}
          style={{ paddingBottom: '25px' }}
        >
          <div className={cn(
            "relative w-full mx-auto max-w-3xl px-4"
          )}>
            <ChatInput
              value={newMessage}
              onChange={setNewMessage}
              onSubmit={handleSubmitMessage}
              placeholder={t('dashboard.inputPlaceholder')}
              loading={isSending}
              disabled={isSending || agentStatus === 'running' || agentStatus === 'connecting'}
              isAgentRunning={agentStatus === 'running' || agentStatus === 'connecting'}
              onStopAgent={handleStopAgent}
              autoFocus={false}
              onFileBrowse={handleOpenFileViewer}
              sandboxId={sandboxId || undefined}
              messages={messages}
              agentName={agent && agent.name}
              selectedAgentId={selectedAgentId}
              onAgentSelect={setSelectedAgentId}
              toolCalls={toolCalls}
              toolCallIndex={currentToolIndex}
              showToolPreview={isPanelMinimized && toolCalls.length > 0}
              onExpandToolPreview={handleExpandToolPreview}
              defaultShowSnackbar="tokens"
            />
          </div>
        </div>
      </ThreadLayout>

      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        onDismiss={handleDismissUpgradeDialog}
      />
      
      {/* Template debug panel removed - using normal flow now */}
      {/* <TemplateDebugPanel
        show={showDebugPanel}
        onClose={() => setShowDebugPanel(false)}
        onRefresh={() => {
          messagesQuery.refetch();
          agentRunsQuery.refetch();
        }}
      /> */}
    </>
  );
} 
