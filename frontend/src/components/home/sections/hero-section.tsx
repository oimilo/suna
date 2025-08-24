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
import { AppLogosSlider } from './app-logos-slider';

// Custom dialog overlay with blur effect
const BlurredDialogOverlay = () => (
  <DialogOverlay className="bg-background/40 backdrop-blur-md" />
);

// Constant for localStorage key to ensure consistency
const PENDING_PROMPT_KEY = 'pendingAgentPrompt';

// Rotating text options for the subtitle
const rotatingTexts = [
  'sua automação',
  'seu app',
  'sua landing page',
  'seu relatório',
  'sua pesquisa'
];

export function HeroSection() {
  const { hero } = siteConfig;
  const tablet = useMediaQuery('(max-width: 1024px)');
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | undefined>();
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
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

  // Rotating text effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTextIndex((prevIndex) => (prevIndex + 1) % rotatingTexts.length);
    }, 5000); // Change text every 5 seconds

    return () => clearInterval(interval);
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
          
          {/* Title */}
          <div className="text-center mb-6 mt-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-5xl font-semibold text-white mb-4 px-4">
              O que vamos construir?
            </h1>
            <div className="text-base sm:text-lg lg:text-xl xl:text-xl text-gray-400 flex items-center justify-center gap-1 sm:gap-2 px-4">
              <span>Descreva</span>
              <div className="relative overflow-hidden inline-flex items-center">
                {rotatingTexts.map((text, index) => {
                  const position = (index - currentTextIndex + rotatingTexts.length) % rotatingTexts.length;
                  const isActive = position === 0;
                  const isNext = position === 1;
                  const isPrevious = position === rotatingTexts.length - 1;
                  
                  let transform = 'translateY(100%)';
                  let opacity = 0;
                  
                  if (isActive) {
                    transform = 'translateY(0)';
                    opacity = 1;
                  } else if (isPrevious) {
                    transform = 'translateY(-100%)';
                    opacity = 0;
                  } else if (isNext) {
                    transform = 'translateY(100%)';
                    opacity = 0;
                  }
                  
                  return (
                    <span
                      key={index}
                      className="absolute inset-0 flex items-center font-semibold whitespace-nowrap px-1 transition-all duration-700 ease-in-out"
                      style={{
                        color: 'rgb(168, 85, 247)',
                        opacity: opacity,
                        transform: transform
                      }}
                    >
                      {text}
                    </span>
                  );
                })}
                {/* Invisible span to maintain width based on current text */}
                <span className="invisible font-semibold whitespace-nowrap px-1">
                  {rotatingTexts[currentTextIndex]}
                </span>
              </div>
              <span>de forma natural</span>
            </div>
          </div>
          
          {/* Input Container with Floating Pills - Single Div */}
          <div className="w-full max-w-[750px] mx-auto relative -mt-16" style={{ minHeight: '400px' }}>
            {/* Floating Pills around the input */}
            <div className="hidden lg:block">
              <FloatingPills />
            </div>
            
            {/* ChatInput - centered */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-[600px] z-20">
              {/* Blinking cursor when not focused */}
              {!isInputFocused && !inputValue && (
                <div className="absolute left-4 top-[1.375rem] h-6 w-0.5 bg-gray-500 z-30" 
                  style={{ animation: 'blink 1s infinite' }} 
                />
              )}
              {/* Wrapper usando exatamente o mesmo padrão do background com opacidade */}
              <div className="relative" style={{ 
                border: '1px solid rgba(139, 92, 246, 0.15)',
                borderRadius: '16px',
                position: 'relative',
                overflow: 'hidden'
              }}>
                {/* Camada de background idêntica ao principal mas com opacidade */}
                <div className="absolute inset-0" style={{
                  background: 'rgba(10, 10, 10, 0.85)',
                  backdropFilter: 'blur(20px)'
                }} />
                
                {/* Pontos de luz roxa - mesmos do background mas localizados */}
                <div className="absolute top-0 left-[10%] w-[150px] h-[150px] bg-purple-600/15 rounded-full blur-[60px]" />
                <div className="absolute bottom-0 right-[10%] w-[120px] h-[120px] bg-violet-600/10 rounded-full blur-[50px]" />
                <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[200px] h-[100px] bg-purple-700/8 rounded-full blur-[70px]" />
                
                {/* Input com z-index maior */}
                <div className="relative z-10">
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
          
          {/* App Logos Slider */}
          <AppLogosSlider />
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
