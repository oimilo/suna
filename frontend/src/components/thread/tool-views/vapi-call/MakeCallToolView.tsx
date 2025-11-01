import React, { useState, useEffect, useRef } from 'react';
import { Phone, CheckCircle, Clock, User, Mic, Brain, Loader2, AlertTriangle, MessageSquare } from 'lucide-react';
import { ToolViewProps } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { extractMakeCallData, formatPhoneNumber, statusConfig } from './_utils';
import { getToolTitle } from '../utils';
import { useVapiCallRealtime } from '@/hooks/useVapiCallRealtime';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

export function MakeCallToolView({
  name = 'make-phone-call',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  const callData = extractMakeCallData(toolContent);
  const [liveTranscript, setLiveTranscript] = useState<any[]>([]);
  const [liveStatus, setLiveStatus] = useState(callData?.status || 'queued');
  const [previousTranscriptLength, setPreviousTranscriptLength] = useState(0);
  const toolTitle = getToolTitle(name);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useVapiCallRealtime(callData?.call_id);

  const { data: realtimeData } = useQuery({
    queryKey: ['vapi-call', callData?.call_id],
    queryFn: async () => {
      if (!callData?.call_id) return null;
      const supabase = createClient();
      const { data, error } = await supabase
        .from('vapi_calls')
        .select('*')
        .eq('call_id', callData.call_id)
        .single();

      if (error) {
        console.error('[MakeCallToolView] Error fetching call:', error);
        return null;
      }

      console.log('[MakeCallToolView] Fetched call data:', {
        status: data?.status,
        transcriptLength: Array.isArray(data?.transcript) ? data.transcript.length : 0,
      });
      return data;
    },
    enabled: !!callData?.call_id,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const isLive = status && ['queued', 'ringing', 'in-progress'].includes(status);
      return isLive ? 2000 : false;
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (realtimeData) {
      console.log('[MakeCallToolView] Updating from realtime data:', {
        status: realtimeData.status,
        transcript: realtimeData.transcript,
      });

      setLiveStatus(realtimeData.status);

      if (realtimeData.transcript) {
        try {
          const parsed = typeof realtimeData.transcript === 'string'
            ? JSON.parse(realtimeData.transcript)
            : realtimeData.transcript;

          const transcriptArray = Array.isArray(parsed) ? parsed : [];
          console.log('[MakeCallToolView] Setting transcript:', transcriptArray.length, 'messages');
          setLiveTranscript(transcriptArray);
        } catch (e) {
          console.error('[MakeCallToolView] Failed to parse transcript:', e);
          setLiveTranscript([]);
        }
      } else {
        console.log('[MakeCallToolView] No transcript in realtime data');
      }
    }
  }, [realtimeData]);

  useEffect(() => {
    if (transcriptEndRef.current && liveTranscript.length > previousTranscriptLength) {
      setPreviousTranscriptLength(liveTranscript.length);
      transcriptEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [liveTranscript, previousTranscriptLength]);

  if (!callData) {
    return <div className="text-sm text-muted-foreground">No call data available</div>;
  }

  const status = liveStatus;
  const statusInfo = statusConfig[status as keyof typeof statusConfig] || statusConfig.queued;
  const isActive = status === 'ringing' || status === 'in-progress' || status === 'queued';

  const MessageBubble = React.memo(({ msg, index, isNew }: { msg: any; index: number; isNew: boolean }) => (
    <motion.div
      initial={isNew ? { opacity: 0, y: 20, scale: 0.9 } : { opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={isNew ? {
        type: 'spring',
        stiffness: 400,
        damping: 25,
      } : undefined}
      className={cn(
        'text-sm p-3 rounded-2xl relative mb-3',
        msg.role === 'assistant'
          ? 'bg-accent/50 border border-border ml-4'
          : 'bg-muted/80 border border-border mr-4',
      )}
    >
      <div className="font-medium text-xs text-muted-foreground mb-1 flex items-center gap-1">
        {msg.role === 'assistant' ? (
          <>
            <motion.div
              className="w-2 h-2 rounded-full bg-primary"
              animate={isNew ? { scale: [1, 1.2, 1] } : {}}
              transition={{ repeat: isNew ? 2 : 0, duration: 0.5 }}
            />
            AI Assistant
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-muted-foreground" />
            Caller
          </>
        )}
      </div>
      <div className="text-foreground">{msg.message}</div>
    </motion.div>
  ), (prevProps, nextProps) => prevProps.msg.message === nextProps.msg.message
      && prevProps.msg.role === nextProps.msg.role
      && prevProps.isNew === nextProps.isNew);

  MessageBubble.displayName = 'MessageBubble';

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col overflow-hidden bg-card">
      <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4 space-y-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn(
              'relative p-2 rounded-xl border',
              isActive
                ? 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border-emerald-500/20'
                : 'bg-gradient-to-br from-zinc-500/10 to-zinc-600/5 border-zinc-500/20',
            )}>
              {isActive ? (
                <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
              ) : (
                <Phone className="w-5 h-5 text-emerald-500" />
              )}
            </div>
            <div>
              <CardTitle className="text-base font-medium text-foreground">
                {toolTitle}
              </CardTitle>
              <div className="text-xs text-muted-foreground">
                {formatPhoneNumber(callData.phone_number)}
              </div>
            </div>
          </div>
          {!isStreaming && (
            <Badge variant={isSuccess ? 'default' : 'destructive'}>
              {isSuccess ? (
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 mr-1" />
              )}
              {isSuccess ? 'Call initiated' : 'Failed to initiate'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-4">
        {assistantContent && <div className="text-sm text-foreground">{assistantContent}</div>}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Call ID</div>
            <div className="text-xs font-mono text-foreground bg-muted/50 rounded p-2 border border-border truncate">
              {callData.call_id}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Model</div>
            <div className="text-sm text-foreground">{callData.model || 'Anthropic Claude'}</div>
          </div>
          {callData.voice && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Voice</div>
              <div className="text-sm text-foreground">{callData.voice}</div>
            </div>
          )}
          {callData.country && (
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground">Country</div>
              <div className="text-sm text-foreground">
                {callData.country} {callData.country_code ? `(${callData.country_code})` : ''}
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center gap-2 bg-muted/40 rounded-lg p-2 border border-muted/60">
            <Brain className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">Status:</span>
            <Badge className={cn('text-xs', statusInfo.color)}>{statusInfo.label}</Badge>
          </div>
          <div className="flex items-center gap-2 bg-muted/40 rounded-lg p-2 border border-muted/60">
            <Mic className="h-4 w-4 text-primary" />
            {isActive ? 'Live transcript updating...' : 'Transcript ready'}
          </div>
        </div>

        {callData.first_message && (
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">First Message</div>
            <div className="text-sm text-foreground bg-muted/40 rounded-lg p-3 border border-muted/50">
              {callData.first_message}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MessageSquare className="h-3 w-3" />
            Live Transcript
          </div>
          <div className="space-y-3 bg-muted/50 rounded-lg p-3 border border-border max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent hover:scrollbar-thumb-muted-foreground/50">
            {liveTranscript.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-6">
                Waiting for transcript...
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {liveTranscript.map((msg, idx) => (
                  <MessageBubble key={idx} msg={msg} index={idx} isNew={idx >= previousTranscriptLength} />
                ))}
              </AnimatePresence>
            )}
            <div ref={transcriptEndRef} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

