'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { ChatInput, ChatInputHandles } from '@/components/thread/chat-input/chat-input';
import { ThreadContent } from '@/components/thread/content/ThreadContent';
import { useAgentStream } from '@/hooks/useAgentStream';
import { useAddUserMessageMutation } from '@/hooks/react-query/threads/use-messages';
import { useStartAgentMutation, useStopAgentMutation } from '@/hooks/react-query/threads/use-agent-run';
import { useInitiateAgentWithInvalidation } from '@/hooks/react-query/dashboard/use-initiate-agent';
import { useAgentBuilderChatHistory } from '@/hooks/react-query/agents/use-agents';
import { toast } from 'sonner';
import { UnifiedMessage } from '@/components/thread/types';
import { BillingError } from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';
import { agentKeys } from '@/hooks/react-query/agents/keys';
import { normalizeFilenameToNFC } from '@/lib/utils/unicode';
import { usePtTranslations } from '@/hooks/use-pt-translations';
import { AgentBuilderIntro } from './agent-builder-intro';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, Sparkles, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAgents } from '@/hooks/react-query/agents/use-agents';

interface AgentBuilderChatProps {
  agentId: string;
  formData: any;
  handleFieldChange: (field: string, value: any) => void;
  handleStyleChange: (emoji: string, color: string) => void;
  currentStyle: { avatar: string; color: string };
  activeTab: string;
  onTabChange: (value: string) => void;
}

export const AgentBuilderChat = React.memo(function AgentBuilderChat({
  agentId,
  formData,
  handleFieldChange,
  handleStyleChange,
  currentStyle,
  activeTab,
  onTabChange
}: AgentBuilderChatProps) {
  const { t } = usePtTranslations();
  const [threadId, setThreadId] = useState<string | null>(null);
  const [agentRunId, setAgentRunId] = useState<string | null>(null);
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [agentStatus, setAgentStatus] = useState<'idle' | 'running' | 'connecting' | 'error'>('idle');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStartedConversation, setHasStartedConversation] = useState(false);
  const [isContextOpen, setIsContextOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<ChatInputHandles>(null);
  const previousMessageCountRef = useRef(0);
  const hasInitiallyLoadedRef = useRef(false);
  const previousAgentIdRef = useRef<string | null>(null);

  // Debug mount/unmount
  useEffect(() => {
    console.log('[AgentBuilderChat] Component mounted');
    return () => {
      console.log('[AgentBuilderChat] Component unmounted');
    };
  }, []);

  // Reset hasInitiallyLoadedRef when agentId changes
  useEffect(() => {
    if (previousAgentIdRef.current !== null && previousAgentIdRef.current !== agentId) {
      console.log('[AgentBuilderChat] Agent ID changed, resetting state');
      hasInitiallyLoadedRef.current = false;
      setMessages([]);
      setThreadId(null);
      setAgentRunId(null);
      setHasStartedConversation(false);
      previousMessageCountRef.current = 0;
    }
    previousAgentIdRef.current = agentId;
  }, [agentId]);

  const initiateAgentMutation = useInitiateAgentWithInvalidation();
  const addUserMessageMutation = useAddUserMessageMutation();
  const startAgentMutation = useStartAgentMutation();
  const stopAgentMutation = useStopAgentMutation();
  const chatHistoryQuery = useAgentBuilderChatHistory(agentId);
  const queryClient = useQueryClient();
  const { data: agentsResponse } = useAgents();
  const agentList = agentsResponse?.agents;
  const agents = useMemo(() => agentList ?? [], [agentList]);
  
  // Find the default Prophet agent to use for execution
  const defaultProphetAgent = useMemo(() => agents.find((agent: any) => agent.metadata?.is_suna_default === true), [agents]);
  const prophetAgentId = defaultProphetAgent?.agent_id;
  
  // Debug log
  useEffect(() => {
    console.log('[AGENT BUILDER] Agents loaded:', agents.length);
    console.log('[AGENT BUILDER] Default Prophet agent:', defaultProphetAgent);
    console.log('[AGENT BUILDER] Prophet agent ID:', prophetAgentId);
  }, [agents, defaultProphetAgent, prophetAgentId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (messages && messages.length > previousMessageCountRef.current) {
      scrollToBottom();
    }
    previousMessageCountRef.current = messages?.length || 0;
  }, [messages, messages?.length]);

  useEffect(() => {
    if (chatHistoryQuery.data && chatHistoryQuery.status === 'success' && !hasInitiallyLoadedRef.current) {
      console.log('[AgentBuilderChat] Loading chat history for agent:', agentId);
      const { messages: historyMessages, thread_id } = chatHistoryQuery.data;
      if (historyMessages && historyMessages.length > 0) {
        const unifiedMessages = historyMessages
          .filter((msg) => msg.type !== 'status')
          .map((msg: any) => ({
            message_id: msg.message_id || `msg-${Date.now()}-${Math.random()}`,
            thread_id: msg.thread_id || thread_id,
            type: (msg.type || 'system') as UnifiedMessage['type'],
            is_llm_message: Boolean(msg.is_llm_message),
            content: msg.content || '',
            metadata: msg.metadata || '{}',
            created_at: msg.created_at || new Date().toISOString(),
            updated_at: msg.updated_at || new Date().toISOString(),
            sequence: 0,
          }));
        setMessages(unifiedMessages);
        setHasStartedConversation(unifiedMessages.length > 0);
        previousMessageCountRef.current = unifiedMessages.length;
        if (thread_id) {
          setThreadId(thread_id);
        }
      }

      hasInitiallyLoadedRef.current = true;
    } else if (chatHistoryQuery.status === 'error') {
      console.error('[AgentBuilderChat] Error loading chat history:', chatHistoryQuery.error);
      hasInitiallyLoadedRef.current = true;
    }
  }, [chatHistoryQuery.data, chatHistoryQuery.status, chatHistoryQuery.error, agentId]);

  const handleNewMessageFromStream = useCallback((message: UnifiedMessage) => {
    setMessages((prev) => {
      if (!prev) prev = [];

      if (message.type === 'user') {
        const optimisticIndex = prev.findIndex(m =>
          m.message_id.startsWith('temp-user-') &&
          m.content === message.content &&
          m.type === 'user'
        );

        if (optimisticIndex !== -1) {
          console.log(`[AGENT BUILDER] Replacing optimistic message with real message`);
          const newMessages = [...prev];
          newMessages[optimisticIndex] = message;
          return newMessages;
        }
      }
      const messageExists = prev.some(m => m.message_id === message.message_id);
      if (messageExists) {
        return prev.map(m => m.message_id === message.message_id ? message : m);
      }
      return [...prev, message];
    });
  }, []);

  const handleStreamStatusChange = useCallback((status: string) => {
    switch (status) {
      case 'idle':
      case 'completed':
      case 'stopped':
      case 'agent_not_running':
      case 'error':
      case 'failed':
        setAgentStatus('idle');
        setAgentRunId(null);
        if (status === 'completed') {
          setSaveStatus('saved');
          queryClient.invalidateQueries({ queryKey: agentKeys.lists() });
          queryClient.invalidateQueries({ queryKey: agentKeys.detail(agentId) });
          queryClient.invalidateQueries({ queryKey: agentKeys.builderChatHistory(agentId) });
          setTimeout(() => setSaveStatus('idle'), 2000);
        }
        break;
      case 'connecting':
        setAgentStatus('connecting');
        break;
      case 'streaming':
        setAgentStatus('running');
        break;
    }
  }, [agentId, queryClient]);

  const handleStreamError = useCallback((errorMessage: string) => {
    if (!errorMessage.toLowerCase().includes('not found') &&
      !errorMessage.toLowerCase().includes('agent run is not running')) {
      toast.error(`Erro de Stream: ${errorMessage}`);
    }
  }, []);

  const handleStreamClose = useCallback(() => {
    console.log(`[AGENT BUILDER] Stream closed`);
  }, []);

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

  useEffect(() => {
    if (agentRunId && agentRunId !== currentHookRunId && threadId) {
      startStreaming(agentRunId);
    }
  }, [agentRunId, startStreaming, currentHookRunId, threadId]);

  const handleSubmitFirstMessage = async (
    message: string,
    options?: {
      model_name?: string;
      enable_thinking?: boolean;
      reasoning_effort?: string;
      stream?: boolean;
      enable_context_manager?: boolean;
    },
  ) => {
    if (!message.trim() && !chatInputRef.current?.getPendingFiles().length) return;

    setIsSubmitting(true);
    setHasStartedConversation(true);
    setSaveStatus('saving');

    try {
      const files = chatInputRef.current?.getPendingFiles() || [];

      const agentFormData = new FormData();
      agentFormData.append('prompt', message);
      agentFormData.append('is_agent_builder', String(true));
      agentFormData.append('target_agent_id', agentId);
      
      // Use the default Prophet agent for execution
      // Only append if we have a valid UUID (not undefined or empty)
      if (prophetAgentId && prophetAgentId !== 'agent-builder-virtual') {
        console.log('[AGENT BUILDER] Using Prophet agent ID:', prophetAgentId);
        agentFormData.append('agent_id', prophetAgentId);
      } else {
        console.log('[AGENT BUILDER] No valid Prophet agent ID found, will use default');
        // Don't send any agent_id - let backend use the default
      }

      files.forEach((file) => {
        const normalizedName = normalizeFilenameToNFC(file.name);
        agentFormData.append('files', file, normalizedName);
      });

      if (options?.model_name) agentFormData.append('model_name', options.model_name);
      agentFormData.append('enable_thinking', String(options?.enable_thinking ?? false));
      agentFormData.append('reasoning_effort', options?.reasoning_effort ?? 'low');
      agentFormData.append('stream', String(options?.stream ?? true));
      agentFormData.append('enable_context_manager', String(options?.enable_context_manager ?? false));

      const result = await initiateAgentMutation.mutateAsync(agentFormData);

      if (result.thread_id) {
        setThreadId(result.thread_id);
        if (result.agent_run_id) {
          console.log('[AGENT BUILDER] Setting agent run ID:', result.agent_run_id);
          setAgentRunId(result.agent_run_id);
        }

        const userMessage: UnifiedMessage = {
          message_id: `user-${Date.now()}`,
          thread_id: result.thread_id,
          type: 'user',
          is_llm_message: false,
          content: message,
          metadata: '{}',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          sequence: 0,
        };
        setMessages(prev => [...prev, userMessage]);
      }

      chatInputRef.current?.clearPendingFiles();
      setInputValue('');
    } catch (error: any) {
      if (error instanceof BillingError) {
        toast.error('Limite de faturamento atingido. Por favor, atualize seu plano.');
      } else {
        toast.error('Falha ao iniciar sessão do construtor de agentes');
      }
      setHasStartedConversation(false);
      setSaveStatus('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitMessage = useCallback(
    async (
      message: string,
      options?: { model_name?: string; enable_thinking?: boolean; reasoning_effort?: string; enable_context_manager?: boolean },
    ) => {
      if (!message.trim() || !threadId) return;
      setIsSubmitting(true);
      setSaveStatus('saving');

      const optimisticUserMessage: UnifiedMessage = {
        message_id: `temp-user-${Date.now()}-${Math.random()}`,
        thread_id: threadId,
        type: 'user',
        is_llm_message: false,
        content: message,
        metadata: '{}',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sequence: messages.length,
      };

      setMessages((prev) => [...prev, optimisticUserMessage]);
      setInputValue('');

      try {
        const messagePromise = addUserMessageMutation.mutateAsync({
          threadId,
          message
        });

        const agentPromise = startAgentMutation.mutateAsync({
          threadId,
          options
        });

        const results = await Promise.allSettled([messagePromise, agentPromise]);

        if (results[0].status === 'rejected') {
          throw new Error(`Failed to send message: ${results[0].reason?.message || results[0].reason}`);
        }
        if (results[1].status === 'rejected') {
          const error = results[1].reason;
          if (error instanceof BillingError) {
            toast.error('Limite de faturamento atingido. Por favor, atualize seu plano.');
            setMessages(prev => prev.filter(m => m.message_id !== optimisticUserMessage.message_id));
            return;
          }
          throw new Error(`Failed to start agent: ${error?.message || error}`);
        }
        const agentResult = results[1].value;
        setAgentRunId(agentResult.agent_run_id);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Operação falhou');
        setMessages((prev) => prev.map((m) =>
          m.message_id === optimisticUserMessage.message_id
            ? { ...m, message_id: `user-error-${Date.now()}` }
            : m
        ));
        setSaveStatus('idle');
      } finally {
        setIsSubmitting(false);
      }
    },
    [threadId, messages?.length, addUserMessageMutation, startAgentMutation],
  );

  const handleStopAgent = useCallback(async () => {
    setAgentStatus('idle');
    await stopStreaming();

    if (agentRunId) {
      try {
        await stopAgentMutation.mutateAsync(agentRunId);
      } catch (error) {
        console.error('[AGENT BUILDER] Error stopping agent:', error);
      }
    }
  }, [stopStreaming, agentRunId, stopAgentMutation]);


  const handleOpenFileViewer = useCallback(() => { }, []);


  return (
    <div className="flex flex-col h-full">
      {/* Card de contexto do agente - Desktop */}
      <div className="hidden md:block mx-4 mt-4 mb-2 p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="text-xs text-muted-foreground">Configurando:</div>
            <div className="flex items-center gap-2">
              <div 
                className="h-6 w-6 rounded flex items-center justify-center text-xs"
                style={{ backgroundColor: currentStyle.color }}
              >
                {currentStyle.avatar}
              </div>
              <span className="font-medium text-sm">{formData.name || 'Novo Agente'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Card de contexto do agente - Mobile (Colapsável) */}
      <div className="md:hidden">
        <Collapsible open={isContextOpen} onOpenChange={setIsContextOpen}>
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between p-3 bg-muted/30 border-b">
              <span className="text-xs text-muted-foreground">
                Configurando: <span className="font-medium text-foreground">{formData.name || 'Novo Agente'}</span>
              </span>
              <ChevronDown 
                className={cn(
                  "h-3 w-3 transition-transform duration-200",
                  isContextOpen && "rotate-180"
                )}
              />
            </div>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="p-3 bg-muted/20 border-b space-y-3">
              <div className="flex items-center gap-3">
                <div 
                  className="h-8 w-8 rounded flex items-center justify-center text-sm"
                  style={{ backgroundColor: currentStyle.color }}
                >
                  {currentStyle.avatar}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-sm">{formData.name || 'Novo Agente'}</div>
                  <div className="text-xs text-muted-foreground">Clique acima para fechar</div>
                </div>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto scrollbar-hide">
          <ThreadContent
            messages={messages || []}
            streamingTextContent={streamingTextContent}
            streamingToolCall={streamingToolCall}
            agentStatus={agentStatus}
            handleToolClick={() => { }}
            handleOpenFileViewer={handleOpenFileViewer}
            streamHookStatus={streamHookStatus}
            agentName={formData.name || 'Novo Agente'}
            agentAvatar={null}
            emptyStateComponent={
              messages.length === 0 ? (
                <AgentBuilderIntro />
              ) : null
            }
          />
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex-shrink-0 px-4 pb-4">
        <ChatInput
          ref={chatInputRef}
          onSubmit={threadId ? handleSubmitMessage : handleSubmitFirstMessage}
          loading={isSubmitting}
          placeholder={`Mandar mensagem para ${formData.name || 'Novo Agente'}`}
          value={inputValue}
          onChange={setInputValue}
          disabled={isSubmitting}
          isAgentRunning={agentStatus === 'running' || agentStatus === 'connecting'}
          onStopAgent={handleStopAgent}
          agentName={formData.name || 'Novo Agente'}
          hideAttachments={true}
          bgColor='bg-muted-foreground/10'
          hideAgentSelection={true}
          selectedAgentId={prophetAgentId}
        />
      </div>
    </div>
  );
}, (prevProps, nextProps) => {

  return (
    prevProps.agentId === nextProps.agentId &&
    JSON.stringify(prevProps.formData) === JSON.stringify(nextProps.formData) &&
    prevProps.currentStyle.avatar === nextProps.currentStyle.avatar &&
    prevProps.currentStyle.color === nextProps.currentStyle.color &&
    prevProps.handleFieldChange === nextProps.handleFieldChange &&
    prevProps.handleStyleChange === nextProps.handleStyleChange
  );
}); 