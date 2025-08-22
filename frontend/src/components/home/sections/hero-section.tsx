'use client';
import { BRANDING } from '@/lib/branding';
import { HeroVideoSection } from '@/components/home/sections/hero-video-section';
import { siteConfig } from '@/lib/site';
import { ArrowRight, Github, X, AlertCircle, Square } from 'lucide-react';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useState, useEffect, useRef, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthProvider';
import {
  BillingError,
} from '@/lib/api';
import { useInitiateAgentMutation } from '@/hooks/react-query/dashboard/use-initiate-agent';
import { useThreadQuery } from '@/hooks/react-query/threads/use-threads';
import { generateThreadName } from '@/lib/actions/threads';
import GoogleSignIn from '@/components/GoogleSignIn';
import { useAgents } from '@/hooks/react-query/agents/use-agents';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogOverlay,
} from '@/components/ui/dialog';
import { BillingErrorAlert } from '@/components/billing/usage-limit-alert';
import { useBillingError } from '@/hooks/useBillingError';
import { useAccounts } from '@/hooks/use-accounts';
import { isLocalMode, config } from '@/lib/config';
import { toast } from 'sonner';
import { useModal } from '@/hooks/use-modal-store';
import GitHubSignIn from '@/components/GithubSignIn';
import { ChatInput, ChatInputHandles } from '@/components/thread/chat-input/chat-input';
import { normalizeFilenameToNFC } from '@/lib/utils/unicode';
import { createQueryHook } from '@/hooks/use-query';
import { agentKeys } from '@/hooks/react-query/agents/keys';
import { getAgents } from '@/hooks/react-query/agents/utils';
import { usePtTranslations } from '@/hooks/use-pt-translations';
import { FloatingPills } from './floating-pills';

// Custom dialog overlay with blur effect
const BlurredDialogOverlay = () => (
  <DialogOverlay className="bg-background/40 backdrop-blur-md" />
);

// Constant for localStorage key to ensure consistency
const PENDING_PROMPT_KEY = 'pendingAgentPrompt';

export function HeroSection() {
  const { hero } = siteConfig;
  const tablet = useMediaQuery('(max-width: 1024px)');
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  const [isInputFocused, setIsInputFocused] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { billingError, handleBillingError, clearBillingError } =
    useBillingError();
  const { data: accounts } = useAccounts();
  const personalAccount = accounts?.find((account) => account.personal_account);
  const { onOpen } = useModal();
  const initiateAgentMutation = useInitiateAgentMutation();
  const [initiatedThreadId, setInitiatedThreadId] = useState<string | null>(null);
  const threadQuery = useThreadQuery(initiatedThreadId || '');
  const chatInputRef = useRef<ChatInputHandles>(null);
  const { t } = usePtTranslations();

  // Fetch agents for selection
  const { data: agentsResponse } = createQueryHook(
    agentKeys.list({
      limit: 100,
      sort_by: 'name',
      sort_order: 'asc'
    }),
    () => getAgents({
      limit: 100,
      sort_by: 'name',
      sort_order: 'asc'
    }),
    {
      enabled: !!user && !isLoading,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    }
  )();

  const agents = agentsResponse?.agents || [];

  // Auth dialog state
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);


  useEffect(() => {
    if (authDialogOpen && inputValue.trim()) {
      localStorage.setItem(PENDING_PROMPT_KEY, inputValue.trim());
    }
  }, [authDialogOpen, inputValue]);

  useEffect(() => {
    if (authDialogOpen && user && !isLoading) {
      setAuthDialogOpen(false);
      router.push('/dashboard');
    }
  }, [user, isLoading, authDialogOpen, router]);

  useEffect(() => {
    if (threadQuery.data && initiatedThreadId) {
      const thread = threadQuery.data;
      if (thread.project_id) {
        router.push(`/projects/${thread.project_id}/thread/${initiatedThreadId}`);
      } else {
        router.push(`/agents/${initiatedThreadId}`);
      }
      setInitiatedThreadId(null);
    }
  }, [threadQuery.data, initiatedThreadId, router]);

  // Handle ChatInput submission
  const handleChatInputSubmit = async (
    message: string,
    options?: { model_name?: string; enable_thinking?: boolean }
  ) => {
    if ((!message.trim() && !chatInputRef.current?.getPendingFiles().length) || isSubmitting) return;

    // If user is not logged in, save prompt and show auth dialog
    if (!user && !isLoading) {
      localStorage.setItem(PENDING_PROMPT_KEY, message.trim());
      setAuthDialogOpen(true);
      return;
    }

    // User is logged in, create the agent with files like dashboard does
    setIsSubmitting(true);
    try {
      const files = chatInputRef.current?.getPendingFiles() || [];
      localStorage.removeItem(PENDING_PROMPT_KEY);

      const formData = new FormData();
      formData.append('prompt', message);

      // Add selected agent if one is chosen
      if (selectedAgentId) {
        formData.append('agent_id', selectedAgentId);
      }

      // Add files if any
      files.forEach((file) => {
        const normalizedName = normalizeFilenameToNFC(file.name);
        formData.append('files', file, normalizedName);
      });

      if (options?.model_name) formData.append('model_name', options.model_name);
      formData.append('enable_thinking', String(options?.enable_thinking ?? false));
      formData.append('reasoning_effort', 'low');
      formData.append('stream', 'true');
      formData.append('enable_context_manager', 'false');

      const result = await initiateAgentMutation.mutateAsync(formData);

      if (result.thread_id) {
        setInitiatedThreadId(result.thread_id);
      } else {
        throw new Error('Agent initiation did not return a thread_id.');
      }

      chatInputRef.current?.clearPendingFiles();
      setInputValue('');
    } catch (error: any) {
      if (error instanceof BillingError) {
        console.log('Billing error:', error.detail);
        onOpen("paymentRequiredDialog");
      } else {
        const isConnectionError =
          error instanceof TypeError &&
          error.message.includes('Failed to fetch');
        if (!isLocalMode() || isConnectionError) {
          toast.error(
            error.message || 'Falha ao criar agente. Por favor, tente novamente.',
          );
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="hero" className="w-full relative overflow-hidden min-h-screen flex items-center">
      <div className="relative flex flex-col items-center w-full px-6">
        <div className="relative z-10 max-w-4xl mx-auto h-full w-full flex flex-col items-center justify-center">
          
          {/* Prophet AI Badge */}
          <div className="animate-subtle-pulse mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20">
              <span className="text-xs font-medium text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                Prophet AI
              </span>
            </div>
          </div>
          
          {/* Title */}
          <div className="text-center mb-12">
            <h1 className="text-4xl lg:text-5xl font-semibold text-foreground mb-4">
              O que devemos construir?
            </h1>
            <p className="text-lg text-muted-foreground">
              usando seu contexto de design e código existente
            </p>
          </div>
          
          {/* Input Container with Floating Pills */}
          <div className="w-full max-w-[750px] mx-auto relative" style={{ minHeight: '400px' }}>
            {/* Floating Pills around the input */}
            <div className="hidden lg:block">
              <FloatingPills />
            </div>
            
            {/* ChatInput - centered */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] z-20">
              {/* Blinking cursor when not focused */}
              {!isInputFocused && !inputValue && (
                <div className="absolute left-4 top-[1.375rem] h-6 w-0.5 bg-muted-foreground z-30" 
                  style={{ animation: 'blink 1s infinite' }} 
                />
              )}
              <ChatInput
                ref={chatInputRef}
                onSubmit={handleChatInputSubmit}
                placeholder="Pergunte ao Prophet para construir uma aplicação completa..."
                loading={isSubmitting}
                disabled={isSubmitting}
                value={inputValue}
                onChange={setInputValue}
                isLoggedIn={!!user}
                selectedAgentId={selectedAgentId}
                onAgentSelect={setSelectedAgentId}
                autoFocus={false}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Auth Dialog */}
      <Dialog open={authDialogOpen} onOpenChange={setAuthDialogOpen}>
        <BlurredDialogOverlay />
        <DialogContent className="sm:max-w-md rounded-xl bg-background border border-border">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-medium">
                Sign in to continue
              </DialogTitle>
              {/* <button 
                onClick={() => setAuthDialogOpen(false)}
                className="rounded-full p-1 hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button> */}
            </div>
            <DialogDescription className="text-muted-foreground">
              Sign in or create an account to talk with {BRANDING.name}
            </DialogDescription>
          </DialogHeader>



          {/* OAuth Sign In */}
          <div className="w-full">
            <GoogleSignIn returnUrl="/dashboard" />
            <GitHubSignIn returnUrl="/dashboard" />
          </div>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#F3F4F6] dark:bg-[#F9FAFB]/[0.02] text-muted-foreground">
                or continue with email
              </span>
            </div>
          </div>

          {/* Sign in options */}
          <div className="space-y-4 pt-4">
            <Link
              href={`/auth?returnUrl=${encodeURIComponent('/dashboard')}`}
              className="flex h-12 items-center justify-center w-full text-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all shadow-md"
              onClick={() => setAuthDialogOpen(false)}
            >
              Sign in with email
            </Link>

            <Link
              href={`/auth?mode=signup&returnUrl=${encodeURIComponent('/dashboard')}`}
              className="flex h-12 items-center justify-center w-full text-center rounded-full border border-border bg-background hover:bg-accent/20 transition-all"
              onClick={() => setAuthDialogOpen(false)}
            >
              Create new account
            </Link>
          </div>

          <div className="mt-4 text-center text-xs text-muted-foreground">
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Billing Error Alert here */}
      <BillingErrorAlert
        message={billingError?.message}
        currentUsage={billingError?.currentUsage}
        limit={billingError?.limit}
        accountId={personalAccount?.account_id}
        onDismiss={clearBillingError}
        isOpen={!!billingError}
      />
    </section>
  );
}
