'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
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
import {
  useStartAgentMutation,
  useStopAgentMutation,
} from '@/hooks/react-query/threads/use-agent-run';
import { useSubscription } from '@/hooks/react-query/subscriptions/use-subscriptions';
import { SubscriptionStatus } from '@/components/thread/chat-input/_use-model-selection';
import {
  UnifiedMessage,
  ApiMessageType,
  ToolCallInput,
} from '@/app/(dashboard)/projects/[projectId]/thread/_types';
import {
  useThreadData,
  useToolCalls,
  useBilling,
  useKeyboardShortcuts,
} from '@/app/(dashboard)/projects/[projectId]/thread/_hooks';
import {
  ThreadError,
  UpgradeDialog,
  ThreadLayout,
} from '@/app/(dashboard)/projects/[projectId]/thread/_components';
import { useVncPreloader } from '@/hooks/useVncPreloader';
import { useThreadAgent, useAgents } from '@/hooks/react-query/agents/use-agents';
import { useTranslations } from '@/hooks/use-translations';
import { useSidebarContext } from '@/contexts/sidebar-context';
import { useAgentSelection } from '@/lib/stores/agent-selection-store';
import { useProjectRealtime } from '@/hooks/useProjectRealtime';
import { handleGoogleSlidesUpload } from '@/components/thread/tool-views/utils/presentation-utils';

const DEBUG_THREAD = process.env.NEXT_PUBLIC_WORKSPACE_DEBUG !== 'false';
const logThreadDebug = (...args: unknown[]) => {
  if (DEBUG_THREAD) {
    console.debug('[workspace:thread]', ...args);
  }
};

interface ThreadComponentProps {
  projectId: string;
  threadId: string;
}

export function ThreadComponent({ projectId, threadId }: ThreadComponentProps) {
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const { t } = useTranslations();

  // State
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [fileViewerOpen, setFileViewerOpen] = useState(false);
  const [fileToView, setFileToView] = useState<string | null>(null);
  const [filePathList, setFilePathList] = useState<string[] | undefined>(
    undefined,
  );
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [debugMode, setDebugMode] = useState(false);
  const [initialPanelOpenAttempted, setInitialPanelOpenAttempted] =
    useState(false);
  const [isSidePanelAnimating, setIsSidePanelAnimating] = useState(false);
  const [userInitiatedRun, setUserInitiatedRun] = useState(false);
  const [isPanelMinimized, setIsPanelMinimized] = useState(false);
  const [hasMainFileDetected, setHasMainFileDetected] = useState(false);

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const initialLayoutAppliedRef = useRef(false);
  const lastStreamStartedRef = useRef<string | null>(null);

  // Sidebar
  const { state: leftSidebarState, setOpen: setLeftSidebarOpen } =
    useSidebarSafe();
  const { isPinned } = useSidebarContext();
  const { data: agentsResponse } = useAgents();
  const agents = useMemo(
    () => agentsResponse?.agents ?? [],
    [agentsResponse?.agents],
  );
  const {
    selectedAgentId,
    setSelectedAgent,
    initializeFromAgents,
  } = useAgentSelection();

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
    activeSandboxId,
  } = useToolCalls(messages, setLeftSidebarOpen, agentStatus);

  useEffect(() => {
    if (!DEBUG_THREAD) return;
    logThreadDebug('state:snapshot', {
      isSidePanelOpen,
      isPanelMinimized,
      currentToolIndex,
      autoOpenedPanel,
      hasMainFileDetected,
      toolCallCount: toolCalls.length,
      userClosedPanel: userClosedPanelRef.current,
    });
  }, [
    isSidePanelOpen,
    isPanelMinimized,
    currentToolIndex,
    autoOpenedPanel,
    hasMainFileDetected,
    toolCalls.length,
    userClosedPanelRef,
  ]);

  const {
    showBillingAlert,
    setShowBillingAlert,
    billingData,
    setBillingData,
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

  useEffect(() => {
    if (agents.length > 0) {
      initializeFromAgents(agents, threadAgentData?.agent?.agent_id);
    }
  }, [agents, threadAgentData?.agent?.agent_id, initializeFromAgents]);

  const { data: subscriptionData } = useSubscription();
  const subscriptionStatus: SubscriptionStatus =
    subscriptionData?.status === 'active' ? 'active' : 'no_subscription';

  // Memoize project for VNC preloader to prevent re-preloading on every render
  const memoizedProject = useMemo(() => project, [project]);

  useVncPreloader(memoizedProject);
  useProjectRealtime(projectId);
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);

    if (urlParams.get('google_auth') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      const uploadIntent = sessionStorage.getItem(
        'google_slides_upload_intent',
      );

      if (uploadIntent) {
        sessionStorage.removeItem('google_slides_upload_intent');
        try {
          const uploadData = JSON.parse(uploadIntent);
          const { presentation_path, sandbox_url } = uploadData;
          if (presentation_path && sandbox_url) {
            (async () => {
              const loadingToast = toast.loading(
                'Google authentication successful! Uploading presentation...',
              );
              try {
                await handleGoogleSlidesUpload(sandbox_url, presentation_path);
              } catch (error) {
                console.error('Upload failed:', error);
              } finally {
                toast.dismiss(loadingToast);
              }
            })();
          }
        } catch (error) {
          console.error('Error processing Google Slides upload from session:', error);
          toast.success('Google authentication successful!');
        }
      } else {
        toast.success('Google authentication successful!');
      }
    } else if (urlParams.get('google_auth') === 'error') {
      const error = urlParams.get('error');
      sessionStorage.removeItem('google_slides_upload_intent');
      window.history.replaceState({}, '', window.location.pathname);
      toast.error(`Google authentication failed: ${error || 'Unknown error'}`);
    }
  }, []);

  const handleProjectRenamed = useCallback((newName: string) => {
    // no-op placeholder for now
  }, []);

  const handleSidePanelClose = useCallback(() => {
    setIsSidePanelOpen(false);
    userClosedPanelRef.current = true;
    setAutoOpenedPanel(true);
    setIsPanelMinimized(false);
  }, [setIsSidePanelOpen, setAutoOpenedPanel, setIsPanelMinimized, userClosedPanelRef]);

  const handleSidePanelMinimize = useCallback(() => {
    if (DEBUG_THREAD) {
      logThreadDebug('action:minimize');
    }
    setIsPanelMinimized(true);
    setHasMainFileDetected(false);
  }, []);

  const handleExpandToolPreview = useCallback(() => {
    setIsPanelMinimized(false);
    setIsSidePanelOpen(true);
    userClosedPanelRef.current = false;
  }, [setIsSidePanelOpen, userClosedPanelRef]);

  const handleOpenFileViewer = useCallback(
    async (filePath?: string, fileList?: string[]) => {
      if (filePath) {
        setFileToView(filePath);
      }
      if (fileList) {
        setFilePathList(fileList);
      }
      setFileViewerOpen(true);
    },
    [],
  );

  const effectiveSandboxId =
    activeSandboxId ?? sandboxId ?? (typeof project?.sandbox === 'string' ? project?.sandbox : project?.sandbox?.id ?? null);

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  // Função para detectar se o usuário está próximo do final do scroll
  const isNearBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } =
      messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  const handleUserScroll = useCallback(() => {
    isNearBottom();
  }, [isNearBottom]);

  const handleNewMessageFromStream = useCallback(
    (message: UnifiedMessage) => {
      if (!message.message_id) {
        console.warn(
          `[STREAM HANDLER] Received message is missing ID: Type=${message.type}`,
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
    },
    [setMessages, setAutoOpenedPanel],
  );

  const handleStreamStatusChange = useCallback(
    (hookStatus: string) => {
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
          break;
        case 'connecting':
          setAgentStatus('connecting');
          break;
        case 'streaming':
          setAgentStatus('running');
          break;
      }
    },
    [setAgentStatus, setAgentRunId, setAutoOpenedPanel],
  );

  const handleStreamError = useCallback((errorMessage: string) => {
    const lower = errorMessage.toLowerCase();
    const isExpected =
      lower.includes('not found') || lower.includes('agent run is not running');

    if (isExpected) {
      console.info(`[PAGE] Stream skipped for inactive run: ${errorMessage}`);
      return;
    }

    console.error(`[PAGE] Stream hook error: ${errorMessage}`);
    toast.error(`Stream Error: ${errorMessage}`);
  }, []);

  const handleStreamClose = useCallback(() => {}, []);

  const {
    status: streamHookStatus,
    textContent: streamingTextContent,
    toolCall: streamingToolCall,
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
    threadAgentData?.agent?.agent_id,
  );

  const toolViewAssistant = useCallback(
    (assistantContent?: string) => assistantContent,
    [],
  );

  const toolViewResult = useCallback(
    (toolContent?: string) => toolContent,
    [],
  );

  const handleAgentSelect = useCallback(
    (agentId?: string) => {
      setSelectedAgent(agentId);
    },
    [setSelectedAgent],
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
          message,
        });

        const agentPromise = startAgentMutation.mutateAsync({
          threadId,
          options: {
            ...options,
            agent_id: selectedAgentId,
          },
        });

        const results = await Promise.allSettled([
          messagePromise,
          agentPromise,
        ]);

        if (results[0].status === 'rejected') {
          const reason = results[0].reason;
          console.error('Failed to send message:', reason);
          throw new Error(
            `Failed to send message: ${reason?.message || reason}`,
          );
        }

        if (results[1].status === 'rejected') {
          const error = results[1].reason;
          console.error('Failed to start agent:', error);

          if (error instanceof BillingError) {
            console.log('Caught BillingError:', error.detail);
            setBillingData({
              currentUsage: error.detail.currentUsage as number | undefined,
              limit: error.detail.limit as number | undefined,
              message:
                error.detail.message ||
                'Monthly usage limit reached. Please upgrade.',
              accountId: project?.account_id || null,
            });
            setShowBillingAlert(true);

            setMessages((prev) =>
              prev.filter(
                (m) => m.message_id !== optimisticUserMessage.message_id,
              ),
            );
            return;
          }

          throw new Error(`Failed to start agent: ${error?.message || error}`);
        }

        const agentResult = results[1].value;
        setUserInitiatedRun(true);
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
    [
      addUserMessageMutation,
      agentRunsQuery,
      messagesQuery,
      project?.account_id,
      scrollToBottom,
      selectedAgentId,
      setBillingData,
      setMessages,
      setShowBillingAlert,
      startAgentMutation,
      setAgentRunId,
      threadId,
    ],
  );

  const handleStopAgent = useCallback(async () => {
    if (!agentRunId) return;
    try {
      await stopAgentMutation.mutateAsync(agentRunId);
      setAgentStatus('idle');
      setAgentRunId(null);
      setAutoOpenedPanel(false);
      stopStreaming();
    } catch (err) {
      console.error('Failed to stop agent:', err);
      toast.error('Falha ao parar o agente');
    }
  }, [
    agentRunId,
    setAgentRunId,
    setAgentStatus,
    setAutoOpenedPanel,
    stopAgentMutation,
    stopStreaming,
  ]);

  useEffect(() => {
    if (!initialLayoutAppliedRef.current) {
      setLeftSidebarOpen(false);
      initialLayoutAppliedRef.current = true;
    }
  }, [setLeftSidebarOpen]);

  useEffect(() => {
    if (initialLoadCompleted && !initialPanelOpenAttempted) {
      setInitialPanelOpenAttempted(true);

      if (toolCalls.length > 0) {
        console.log(
          '[INIT] ToolCalls existentes:',
          toolCalls.map((tc, i) => ({
            index: i,
            name: tc.assistantCall?.name,
            contentPreview:
              typeof tc.assistantCall?.content === 'string'
                ? tc.assistantCall.content.substring(0, 100)
                : JSON.stringify(tc.assistantCall?.content).substring(0, 100),
          })),
        );
      }
    }
  }, [initialPanelOpenAttempted, toolCalls, initialLoadCompleted]);

  useEffect(() => {
    if (hasMainFileDetected && isPanelMinimized) {
      setIsPanelMinimized(false);
    }
  }, [hasMainFileDetected, isPanelMinimized]);

  useEffect(() => {
    if (initialLoadCompleted) {
      if (messages.length > 0) {
        const firstMessage = messages[0];
        if ((firstMessage?.metadata as any)?.isTemplateMessage) {
          console.log(
            '[TEMPLATE] Template message detected, skipping auto-agent',
          );
        }

        setTimeout(() => {
          scrollToBottom('auto');
        }, 100);
      }

      if ((project?.sandbox as any)?.isOnboardingProject) {
        console.log(
          '[TEMPLATE] Template project detected, files should be in sandbox',
        );
      }
    }
  }, [
    initialLoadCompleted,
    messagesQuery,
    projectId,
    threadId,
    project,
    messages,
    scrollToBottom,
  ]);

  useEffect(() => {
    if (agentRunId && lastStreamStartedRef.current === agentRunId) {
      return;
    }

    if (agentRunId && agentRunId !== currentHookRunId && userInitiatedRun) {
      startStreaming(agentRunId);
      lastStreamStartedRef.current = agentRunId;
      setUserInitiatedRun(false);
      return;
    }

    if (
      agentRunId &&
      agentRunId !== currentHookRunId &&
      initialLoadCompleted &&
      !userInitiatedRun &&
      agentStatus === 'running'
    ) {
      startStreaming(agentRunId);
      lastStreamStartedRef.current = agentRunId;
    }
  }, [
    agentRunId,
    startStreaming,
    currentHookRunId,
    initialLoadCompleted,
    agentStatus,
    userInitiatedRun,
  ]);

  useEffect(() => {
    if (
      (streamHookStatus === 'completed' ||
        streamHookStatus === 'stopped' ||
        streamHookStatus === 'agent_not_running' ||
        streamHookStatus === 'error') &&
      (agentStatus === 'running' || agentStatus === 'connecting')
    ) {
      setAgentStatus('idle');
      setAgentRunId(null);
    }
  }, [streamHookStatus, agentStatus, setAgentStatus, setAgentRunId]);

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
        ogTitle.setAttribute(
          'content',
          `${projectName} | ${BRANDING.company} ${BRANDING.name}`,
        );
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
  }, [searchParams]);

  const hasCheckedUpgradeDialog = useRef(false);

  useEffect(() => {
    if (
      initialLoadCompleted &&
      subscriptionData &&
      !hasCheckedUpgradeDialog.current
    ) {
      hasCheckedUpgradeDialog.current = true;
      const hasSeenUpgradeDialog = localStorage.getItem(
        'kortix_upgrade_dialog_displayed',
      );
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
    const timer = setTimeout(() => setIsSidePanelAnimating(false), 200);
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
        sandboxId={effectiveSandboxId}
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
        sandboxId={effectiveSandboxId}
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
        <ThreadContent
          messages={messages}
          streamingTextContent={streamingTextContent}
          streamingToolCall={streamingToolCall}
          agentStatus={agentStatus}
          handleToolClick={handleToolClick}
          handleOpenFileViewer={handleOpenFileViewer}
          readOnly={false}
          streamHookStatus={streamHookStatus}
          sandboxId={effectiveSandboxId}
          project={project}
          debugMode={debugMode}
          agentName={agent && agent.name}
          agentAvatar={agent && agent.avatar}
          messagesEndRef={messagesEndRef}
          onScroll={handleUserScroll}
        />

        <div
          className={cn(
            'fixed bottom-0 z-10 bg-gradient-to-t from-background via-background/90 to-transparent pt-8',
            isSidePanelAnimating ? '' : 'transition-all duration-200 ease-in-out',
            isPinned && !isMobile
              ? 'left-64'
              : leftSidebarState === 'expanded'
                ? 'left-4 md:left-6'
                : 'left-4',
            isSidePanelOpen && !isPanelMinimized
              ? isPinned && !isMobile
                ? 'right-[50%]'
                : 'right-[60%]'
              : 'right-0',
            isMobile ? 'left-0 right-0' : '',
          )}
          style={{ paddingBottom: '25px' }}
        >
          <div className={cn('relative w-full mx-auto max-w-3xl px-4')}>
            <ChatInput
              value={newMessage}
              onChange={setNewMessage}
              onSubmit={handleSubmitMessage}
              placeholder={t('dashboard.inputPlaceholder')}
              loading={isSending}
              disabled={
                isSending ||
                agentStatus === 'running' ||
                agentStatus === 'connecting'
              }
              isAgentRunning={
                agentStatus === 'running' || agentStatus === 'connecting'
              }
              onStopAgent={handleStopAgent}
              autoFocus={false}
              onFileBrowse={handleOpenFileViewer}
              sandboxId={effectiveSandboxId || undefined}
              messages={messages}
              agentName={agent && agent.name}
              selectedAgentId={selectedAgentId}
              onAgentSelect={handleAgentSelect}
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
    </>
  );
}
