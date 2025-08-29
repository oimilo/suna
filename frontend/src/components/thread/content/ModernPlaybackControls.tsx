'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  ChevronRight,
  FileText,
  Layers,
  Sparkles,
  Clock,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { UnifiedMessage } from '../types';
import { ToolCallInput } from '../tool-call-side-panel';

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
}

export const ModernPlaybackControls = ({
  messages,
  isSidePanelOpen,
  onToggleSidePanel,
  toolCalls,
  setCurrentToolIndex,
  onFileViewerOpen,
  projectName,
}: PlaybackControlsProps): PlaybackControllerResult => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [visibleMessages, setVisibleMessages] = useState<UnifiedMessage[]>([]);
  const [streamingText, setStreamingText] = useState('');
  const [isStreamingText, setIsStreamingText] = useState(false);
  const [currentToolCall, setCurrentToolCall] = useState<any | null>(null);
  const [progress, setProgress] = useState(0);

  const playbackTimeout = useRef<NodeJS.Timeout | null>(null);
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

  const togglePlayback = useCallback(() => {
    if (currentMessageIndex >= messages.length && !isPlaying) {
      // Reset if at the end
      setCurrentMessageIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying, currentMessageIndex, messages.length]);

  const resetPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentMessageIndex(0);
    setVisibleMessages([]);
    setStreamingText('');
    setIsStreamingText(false);
    setCurrentToolCall(null);
    setShowWelcome(true);
  }, []);

  const skipToEnd = useCallback(() => {
    setIsPlaying(false);
    setCurrentMessageIndex(messages.length);
    setVisibleMessages(messages);
    setStreamingText('');
    setIsStreamingText(false);
    setCurrentToolCall(null);
  }, [messages]);

  // Playback logic
  useEffect(() => {
    if (isPlaying && currentMessageIndex < messages.length) {
      playbackTimeout.current = setTimeout(() => {
        setCurrentMessageIndex(prev => prev + 1);
      }, 500);
    } else if (isPlaying && currentMessageIndex >= messages.length) {
      setIsPlaying(false);
    }

    return () => {
      if (playbackTimeout.current) {
        clearTimeout(playbackTimeout.current);
      }
    };
  }, [isPlaying, currentMessageIndex, messages.length]);

  // Modern header with glass morphism
  const renderHeader = useCallback(() => (
    <div className="border-b bg-background/80 backdrop-blur-xl relative z-[50]">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Logo and Title */}
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 group-hover:border-indigo-500/30 transition-colors">
                <Sparkles className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
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
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleSidePanel}
              className={cn(
                "h-8 px-3 hover:bg-black/5 dark:hover:bg-white/5",
                isSidePanelOpen && "bg-black/5 dark:bg-white/5"
              )}
            >
              <Layers className="h-3.5 w-3.5 mr-1.5 opacity-60" />
              <span className="text-sm">Ferramentas</span>
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
    isSidePanelOpen,
    currentMessageIndex,
    messages.length,
    progress,
    projectName,
    onToggleSidePanel,
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
          className="fixed inset-0 z-30 flex items-center justify-center p-6 bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full max-w-md"
          >
            <div className="relative bg-card/50 backdrop-blur border rounded-2xl p-8 shadow-2xl">
              {/* Decorative gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 rounded-2xl" />
              
              <div className="relative space-y-6">
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20">
                    <MessageSquare className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                  </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-semibold">
                    Reproduzir Conversa
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Esta conversa tem {messages.length} mensagens. 
                    Clique em reproduzir para começar a visualização.
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                    <div className="text-xs text-muted-foreground mb-1">Mensagens</div>
                    <div className="text-lg font-semibold">{messages.length}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                    <div className="text-xs text-muted-foreground mb-1">Ferramentas</div>
                    <div className="text-lg font-semibold">{toolCalls.length}</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={togglePlayback}
                    className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white border-0"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Iniciar Reprodução
                  </Button>
                  <Button
                    onClick={skipToEnd}
                    variant="outline"
                    className="flex-1"
                  >
                    Ver Tudo
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  ), [
    showWelcome,
    messages.length,
    toolCalls.length,
    togglePlayback,
    skipToEnd,
  ]);

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