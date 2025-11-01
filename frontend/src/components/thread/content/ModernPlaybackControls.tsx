'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight,
  FileText,
  Clock,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UnifiedMessage } from '../types';
import { ToolCallInput } from '../tool-call-helpers';

const HIDE_STREAMING_XML_TAGS = new Set([
  'execute-command',
  'create-file',
  'delete-file',
  'full-file-rewrite',
  'str-replace',
  'edit-file',
  'browser-click-element',
  'browser-close-tab',
  'browser-drag-drop',
  'browser-get-dropdown-options',
  'browser-go-back',
  'browser-input-text',
  'browser-navigate-to',
  'browser-scroll-down',
  'browser-scroll-to-text',
  'browser-scroll-up',
  'browser-select-dropdown-option',
  'browser-send-keys',
  'browser-switch-tab',
  'browser-wait',
  'deploy',
  'ask',
  'complete',
  'crawl-webpage',
  'web-search',
  'see-image',
  'call-mcp-tool',
]);

interface PlaybackState {
  isPlaying: boolean;
  currentMessageIndex: number;
  visibleMessages: UnifiedMessage[];
  streamingText: string;
  isStreamingText: boolean;
  currentToolCall: any | null;
}

interface PlaybackControllerResult {
  playbackState: PlaybackState;
  renderHeader: () => React.ReactNode;
  renderFloatingControls: () => React.ReactNode;
  renderWelcomeOverlay: () => React.ReactNode;
  togglePlayback: () => void;
  resetPlayback: () => void;
  skipToEnd: () => void;
}

interface PlaybackControlsProps {
  messages: UnifiedMessage[];
  isSidePanelOpen: boolean;
  onToggleSidePanel: () => void;
  toolCalls: ToolCallInput[];
  setCurrentToolIndex: (index: number) => void;
  onFileViewerOpen: (filePath?: string, filePathList?: string[]) => void;
  projectName: string;
  onOpenSidePanel?: () => void; // Função para abrir o painel
  onCloseSidePanel?: () => void; // Função para fechar o painel
}

export const ModernPlaybackControls = ({
  messages,
  isSidePanelOpen,
  onToggleSidePanel,
  toolCalls,
  setCurrentToolIndex,
  onFileViewerOpen,
  projectName,
  onOpenSidePanel,
  onCloseSidePanel,
}: PlaybackControlsProps): PlaybackControllerResult => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<UnifiedMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreamingText, setIsStreamingText] = useState(false);
  const [currentToolCall, setCurrentToolCall] = useState<any | null>(null);
  const [toolPlaybackIndex, setToolPlaybackIndex] = useState<number>(-1);
  const [progress, setProgress] = useState(0);

  const playbackTimeout = useRef<NodeJS.Timeout | null>(null);
  const streamingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streamingCancelledRef = useRef<boolean>(false);
  const [showWelcome, setShowWelcome] = useState(true);

  // Update visible messages based on current index
  useEffect(() => {
    if (currentMessageIndex > 0) {
      setShowWelcome(false);
      setVisibleMessages(messages.slice(0, currentMessageIndex));
    } else {
      setVisibleMessages([]);
    }
  }, [currentMessageIndex, messages]);

  // Update progress
  useEffect(() => {
    if (messages.length > 0) {
      setProgress((currentMessageIndex / messages.length) * 100);
    }
  }, [currentMessageIndex, messages.length]);

  // Close panel when showing welcome screen
  useEffect(() => {
    if (showWelcome && onCloseSidePanel) {
      onCloseSidePanel();
    }
  }, [showWelcome, onCloseSidePanel]);

  const togglePlayback = useCallback(() => {
    if (currentMessageIndex >= messages.length && !isPlaying) {
      // Reset if at the end
      setCurrentMessageIndex(0);
      setIsPlaying(true);
      setShowWelcome(false); // Hide welcome when starting playback
    } else {
      setIsPlaying(!isPlaying);
      if (!isPlaying) {
        setShowWelcome(false); // Hide welcome when starting playback
      }
    }
    
    // Abrir o painel de ferramentas quando iniciar a reprodução
    if (!isPlaying && toolCalls.length > 0 && onOpenSidePanel) {
      setTimeout(() => {
        onOpenSidePanel(); // Abrir painel se houver tool calls
      }, 100); // Pequeno delay para evitar conflitos com o fechamento
    }
  }, [isPlaying, currentMessageIndex, messages.length, toolCalls, onOpenSidePanel]);

  const resetPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentMessageIndex(0);
    setVisibleMessages([]);
    setStreamingText('');
    setIsStreamingText(false);
    setCurrentToolCall(null);
    setShowWelcome(true);
    
    // Fechar o painel quando voltar para a tela inicial
    if (onCloseSidePanel) {
      onCloseSidePanel();
    }
  }, [onCloseSidePanel]);

  const skipToEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentMessageIndex(messages.length);
    setVisibleMessages(messages);
    setStreamingText('');
    setIsStreamingText(false);
    setCurrentToolCall(null);
    
    // Abrir o painel de ferramentas ao pular para o fim
    if (toolCalls.length > 0 && onOpenSidePanel) {
      onOpenSidePanel();
    }
  }, [messages, toolCalls, onOpenSidePanel]);

  // Helper: stream assistant text with typing effect
  const streamAssistantText = useCallback((fullText: string, onDone: () => void) => {
    // Clean up any previous stream
    if (streamingTimeoutRef.current) {
      clearTimeout(streamingTimeoutRef.current);
    }
    streamingCancelledRef.current = false;

    setIsStreamingText(true);
    setStreamingText('');

    let index = 0;
    const typeNext = () => {
      if (streamingCancelledRef.current) {
        setIsStreamingText(false);
        return;
      }
      if (!isPlaying) {
        // Pause/resume support: retry shortly while paused
        streamingTimeoutRef.current = setTimeout(typeNext, 100);
        return;
      }
      if (index >= fullText.length) {
        setIsStreamingText(false);
        onDone();
        return;
      }

      const char = fullText[index];
      setStreamingText(prev => prev + char);
      index += 1;

      // Dynamic delay: faster base, slight pause on punctuation
      const base = 6; // ms
      let delay = base + Math.random() * 6;
      if ('.!?,;:'.includes(char)) {
        delay = 80 + Math.random() * 80;
      }
      streamingTimeoutRef.current = setTimeout(typeNext, delay);
    };

    typeNext();
  }, [isPlaying]);

  // Playback logic: message-by-message with assistant streaming
  // Tool tag detection set (match hiding behavior)
  const findFirstToolInText = useCallback((text: string): { name: string; index: number } | null => {
    const toolCallRegex = /<([a-zA-Z\-_]+)(?:\s+[^>]*)?>(?:[\s\S]*?)<\/\1>|<([a-zA-Z\-_]+)(?:\s+[^>]*)?\/>/g;
    let match: RegExpExecArray | null;
    while ((match = toolCallRegex.exec(text)) !== null) {
      const toolName = (match[1] || match[2] || '').toLowerCase();
      if (HIDE_STREAMING_XML_TAGS.has(toolName)) {
        return { name: toolName, index: match.index };
      }
    }
    return null;
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    if (currentMessageIndex >= messages.length) {
      setIsPlaying(false);
      return;
    }

    const current = messages[currentMessageIndex];

    // Cancel any in-flight streaming before starting a new one
    if (streamingTimeoutRef.current) clearTimeout(streamingTimeoutRef.current);
    streamingCancelledRef.current = false;

    // For assistant messages, simulate typing stream
    if (current.type === 'assistant') {
      // Extract content (handles { content: string } JSON wrapper)
      let content = '';
      try {
        const parsed = typeof current.content === 'string' ? JSON.parse(current.content) : current.content;
        content = (parsed && typeof parsed === 'object' && 'content' in parsed) ? (parsed as any).content : (current.content as string);
      } catch {
        content = (current.content as string) || '';
      }

      // Pre-scan for first tool in content
      const firstTool = findFirstToolInText(content);
      const toolTriggerRef = { triggered: false } as { triggered: boolean };

      // Start streaming
      streamAssistantText(content, () => {
        // Push the complete assistant message into visible list
        setVisibleMessages(prev => [...prev, current]);
        // Advance to next message after a short pause
        playbackTimeout.current = setTimeout(() => setCurrentMessageIndex(prev => prev + 1), 250);
      });

      // While streaming, poll streamingText length to trigger tool panel when reaching the tool tag
      if (firstTool) {
        const interval = setInterval(() => {
          if (toolTriggerRef.triggered) {
            clearInterval(interval);
            return;
          }
          // If cancelled or not playing, stop
          if (streamingCancelledRef.current || !isPlaying) return;
          // Trigger when streamed length reaches the tool index
          if (typeof streamingText === 'string' && streamingText.length >= firstTool.index) {
            toolTriggerRef.triggered = true;
            // Map to next tool call index with same normalized name
            const normalized = firstTool.name.toLowerCase();
            const nextIndex = toolCalls.findIndex((tc, i) => {
              const name = (tc.assistantCall?.name || '').toString().replace(/_/g, '-').toLowerCase();
              return i > toolPlaybackIndex && (name === normalized);
            });
            const targetIndex = nextIndex !== -1 ? nextIndex : Math.min(toolPlaybackIndex + 1, Math.max(0, toolCalls.length - 1));
            if (targetIndex >= 0) {
              setCurrentToolIndex(targetIndex);
              setToolPlaybackIndex(targetIndex);
            }
            if (onOpenSidePanel) onOpenSidePanel();
            // Show transient currentToolCall indicator
            setCurrentToolCall({ name: normalized });
            setTimeout(() => setCurrentToolCall(null), 600);
            clearInterval(interval);
          }
        }, 50);
        return () => clearInterval(interval);
      }
      return () => {
        streamingCancelledRef.current = true;
        if (streamingTimeoutRef.current) clearTimeout(streamingTimeoutRef.current);
        if (playbackTimeout.current) clearTimeout(playbackTimeout.current);
      };
    }

    // Non-assistant messages: add and step forward
    setVisibleMessages(prev => [...prev, current]);
    playbackTimeout.current = setTimeout(() => setCurrentMessageIndex(prev => prev + 1), 450);

    return () => {
      if (playbackTimeout.current) clearTimeout(playbackTimeout.current);
    };
  }, [
    isPlaying,
    currentMessageIndex,
    messages,
    streamAssistantText,
    toolCalls,
    toolPlaybackIndex,
    streamingText,
    onOpenSidePanel,
    setCurrentToolIndex,
    setCurrentToolCall,
    setToolPlaybackIndex,
    findFirstToolInText,
  ]);

  // Modern header with glass morphism
  const renderHeader = useCallback(() => (
    <div className="border-b bg-background/80 backdrop-blur-xl relative z-[50]">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 group-hover:border-indigo-500/30 transition-colors">
                <MessageCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h1 className="text-sm font-semibold text-foreground">
                  {projectName}
                </h1>
                <p className="text-xs text-muted-foreground">
                  Reprodução da Conversa
                </p>
              </div>
            </Link>
          </div>

          {/* Center: Playback Controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
              <Button
                variant="ghost"
                size="sm"
                onClick={resetPlayback}
                className="h-7 w-7 p-0 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <RotateCcw className="h-3.5 w-3.5 opacity-60" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={togglePlayback}
                className="h-8 w-8 p-0 hover:bg-black/5 dark:hover:bg-white/5"
              >
                {isPlaying ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={skipToEnd}
                className="h-7 w-7 p-0 hover:bg-black/5 dark:hover:bg-white/5"
              >
                <ChevronRight className="h-4 w-4 opacity-60" />
                <ChevronRight className="h-4 w-4 opacity-60 -ml-2" />
              </Button>
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 opacity-60" />
              <span>{currentMessageIndex} / {messages.length}</span>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onFileViewerOpen()}
              className="h-8 px-3 hover:bg-black/5 dark:hover:bg-white/5"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5 opacity-60" />
              <span className="text-sm">Arquivos</span>
            </Button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-black/[0.02] dark:bg-white/[0.03] -mx-4">
          <motion.div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>
    </div>
  ), [
    isPlaying,
    currentMessageIndex,
    messages.length,
    progress,
    projectName,
    onFileViewerOpen,
    togglePlayback,
    resetPlayback,
    skipToEnd,
  ]);

  // Floating controls for mobile/minimized view
  const renderFloatingControls = useCallback(() => (
    <AnimatePresence>
      {!showWelcome && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={cn(
            "fixed bottom-6 z-40",
            isSidePanelOpen
              ? "left-1/2 -translate-x-1/4 sm:left-[calc(50%-225px)] md:left-[calc(50%-250px)]"
              : "left-1/2 -translate-x-1/2"
          )}
        >
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-background/95 backdrop-blur-xl border shadow-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={togglePlayback}
              className="h-8 w-8 p-0"
            >
              {isPlaying ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
            </Button>
            
            <div className="h-4 w-px bg-border" />
            
            <span className="text-xs text-muted-foreground px-2">
              {currentMessageIndex} / {messages.length}
            </span>
            
            <div className="h-4 w-px bg-border" />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={skipToEnd}
              className="h-8 px-2 text-xs"
            >
              Pular
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  ), [
    showWelcome,
    isPlaying,
    isSidePanelOpen,
    currentMessageIndex,
    messages.length,
    togglePlayback,
    skipToEnd,
  ]);

  // Welcome overlay with modern design
  const renderWelcomeOverlay = useCallback(() => (
    <AnimatePresence>
      {showWelcome && messages.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-30 flex items-center justify-center p-6 bg-gradient-to-br from-background via-background to-background/95"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 300,
              damping: 30,
              delay: 0.1 
            }}
            className="w-full max-w-lg"
          >
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-3xl blur-2xl opacity-50" />
              
              {/* Main card */}
              <div className="relative bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl p-10 shadow-2xl">
                {/* Background pattern */}
                <div className="absolute inset-0 rounded-2xl overflow-hidden">
                  <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-transparent rounded-full blur-3xl" />
                  <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-gradient-to-tr from-purple-500/10 via-pink-500/10 to-transparent rounded-full blur-3xl" />
                </div>
                
                <div className="relative space-y-8">
                  {/* Logo and Title */}
                  <div className="text-center space-y-4">
                    {/* Welcome text */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="space-y-2"
                    >
                      <span className="inline-block text-xs font-medium text-muted-foreground/60 uppercase tracking-[0.3em]">
                        Replay de conversa
                      </span>
                      
                      {/* Prophet Title with Dancing Script */}
                      <h1 className="text-6xl lg:text-7xl font-dancing text-foreground/90 dark:text-foreground/80 leading-none">
                        Prophet
                      </h1>
                    </motion.div>
                  </div>

                  {/* Description */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-center space-y-3"
                  >
                    <p className="text-base text-foreground/70 leading-relaxed max-w-md mx-auto">
                      Você está prestes a assistir o replay de uma conversa com um agente inteligente do Prophet
                    </p>
                    <p className="text-sm text-muted-foreground/80 max-w-sm mx-auto">
                      Acompanhe passo a passo como o agente processou e executou as tarefas
                    </p>
                  </motion.div>

                  {/* Action Buttons */}
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="space-y-3"
                  >
                    <Button
                      onClick={togglePlayback}
                      size="lg"
                      className="group relative w-full h-12 overflow-hidden bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0 shadow-lg shadow-indigo-500/25 transition-all duration-200"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Play className="h-4 w-4" />
                        Iniciar Reprodução
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </Button>
                    
                    <Button
                      onClick={skipToEnd}
                      variant="ghost"
                      size="lg"
                      className="w-full h-12 text-muted-foreground hover:text-foreground transition-all duration-200"
                    >
                      Pular para o final
                    </Button>
                  </motion.div>

                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  ), [showWelcome, messages.length, togglePlayback, skipToEnd]);

  return {
    playbackState: {
      isPlaying,
      currentMessageIndex,
      visibleMessages,
      streamingText,
      isStreamingText,
      currentToolCall,
    },
    renderHeader,
    renderFloatingControls,
    renderWelcomeOverlay,
    togglePlayback,
    resetPlayback,
    skipToEnd,
  };
};

export const PlaybackControls = ModernPlaybackControls;
export type PlaybackController = ReturnType<typeof PlaybackControls>;
