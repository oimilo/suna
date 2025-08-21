'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDateTime, formatDate as formatDateBR, formatNumber } from '@/lib/date-utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { ExternalLink, Loader2, Sparkles, Check } from 'lucide-react';
import { useUsageLogs } from '@/hooks/react-query/subscriptions/use-billing';
import { useSubscription } from '@/hooks/react-query/subscriptions/use-subscriptions';
import { useCreditsStatus } from '@/hooks/react-query/subscriptions/use-credits-status';
import { UsageLogEntry } from '@/lib/api';



interface DailyUsage {
  date: string;
  logs: UsageLogEntry[];
  totalTokens: number;
  totalCost: number;
  requestCount: number;
  models: string[];
}

interface Props {
  accountId: string;
}

// Mapeamento de modelos seguindo a mesma lógica do seletor
const getModelAlias = (model: string): string => {
  // IDs exatos dos modelos conforme definido no sistema
  const DEFAULT_PREMIUM_MODEL_ID = 'claude-sonnet-4-20250514';
  const DEFAULT_FREE_MODEL_ID = 'gemini-2.5-pro';
  
  // Verifica match exato primeiro
  if (model === DEFAULT_FREE_MODEL_ID) {
    return 'Agente padrão';
  }
  if (model === DEFAULT_PREMIUM_MODEL_ID) {
    return 'Agente avançado';
  }
  
  // Verifica por padrões conhecidos
  const modelLower = model.toLowerCase();
  
  // Gemini models -> Agente padrão
  if (modelLower.includes('gemini')) {
    return 'Agente padrão';
  }
  
  // Claude models -> Agente avançado
  if (modelLower.includes('claude')) {
    return 'Agente avançado';
  }
  
  // GPT models
  if (modelLower.includes('gpt-4')) {
    return 'Agente avançado';
  }
  if (modelLower.includes('gpt-3')) {
    return 'Agente padrão';
  }
  
  // Default: retorna o nome original
  return model;
};

export default function UsageLogs({ accountId }: Props) {
  const [page, setPage] = useState(0);
  const [allLogs, setAllLogs] = useState<UsageLogEntry[]>([]);
  const [hasMore, setHasMore] = useState(true);
  
  const ITEMS_PER_PAGE = 1000;

  // Use React Query hooks
  const { data: currentPageData, isLoading, error } = useUsageLogs(page, ITEMS_PER_PAGE);
  const { data: subscriptionData } = useSubscription();
  const { data: creditsData } = useCreditsStatus();

  // Update accumulated logs when new data arrives
  useEffect(() => {
    if (currentPageData) {
      if (page === 0) {
        // First page - replace all logs
        setAllLogs(currentPageData.logs || []);
      } else {
        // Subsequent pages - append to existing logs
        setAllLogs(prev => [...prev, ...(currentPageData.logs || [])]);
      }
      setHasMore(currentPageData.has_more || false);
    }
  }, [currentPageData, page]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
  };

  const formatDate = (dateString: string) => {
    return formatDateTime(dateString);
  };

  const formatCost = (cost: number | string) => {
    if (typeof cost === 'string') {
      return cost;
    }
    // Convert dollars to credits (1 dollar = 100 credits)
    const credits = Math.round(cost * 100);
    if (credits === 0) {
      return '0 créditos';
    }
    return `${credits.toLocaleString('pt-BR')} créditos`;
  };

  const formatDateOnly = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('pt-BR', {
        timeZone: 'America/Sao_Paulo',
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return formatDateBR(dateString);
    }
  };

  const handleThreadClick = (threadId: string, projectId: string) => {
    // Navigate to the thread using the correct project_id
    const threadUrl = `/projects/${projectId}/thread/${threadId}`;
    window.open(threadUrl, '_blank');
  };

  // Group usage logs by date
  const groupLogsByDate = (logs: UsageLogEntry[]): DailyUsage[] => {
    const grouped = logs.reduce(
      (acc, log) => {
        const date = new Date(log.created_at).toDateString();

        if (!acc[date]) {
          acc[date] = {
            date,
            logs: [],
            totalTokens: 0,
            totalCost: 0,
            requestCount: 0,
            models: [],
          };
        }

        acc[date].logs.push(log);
        acc[date].totalTokens += log.total_tokens;
        acc[date].totalCost +=
          typeof log.estimated_cost === 'number' ? log.estimated_cost : 0;
        acc[date].requestCount += 1;

        if (!acc[date].models.includes(log.content.model)) {
          acc[date].models.push(log.content.model);
        }

        return acc;
      },
      {} as Record<string, DailyUsage>,
    );

    return Object.values(grouped).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  };

  // Calculate usage summary
  const calculateUsageSummary = () => {
    // Use credits data if available (more up-to-date), fallback to subscription data
    const dataSource = creditsData || subscriptionData;
    
    // Debug log to see what we're receiving
    if (creditsData) {
      console.log('[DEBUG] Credits data (using this):', {
        daily_credits: creditsData.daily_credits,
        daily_credits_granted: creditsData.daily_credits_granted,
        daily_credits_used: creditsData.daily_credits_used,
        daily_expires_in: creditsData.daily_expires_in,
        tier_credits_used: creditsData.tier_credits_used,
        tier_credits_limit: creditsData.tier_credits_limit,
        total_credits_available: creditsData.total_credits_available
      });
    } else if (subscriptionData) {
      console.log('[DEBUG] Subscription data (fallback):', {
        daily_credits: subscriptionData.daily_credits,
        daily_credits_granted: subscriptionData.daily_credits_granted,
        daily_credits_used: subscriptionData.daily_credits_used,
        daily_expires_in: subscriptionData.daily_expires_in
      });
    }
    
    // Use credits API data if available (it's more accurate and updates more frequently)
    if (creditsData) {
      return {
        usedCredits: Math.min(creditsData.tier_credits_used, creditsData.tier_credits_limit),
        subscriptionCredits: creditsData.tier_credits_limit,
        subscriptionCreditsRemaining: creditsData.tier_credits_remaining,
        dailyCredits: creditsData.daily_credits_granted,
        dailyCreditsUsed: creditsData.daily_credits_used,
        dailyCreditsRemaining: creditsData.daily_credits,
        totalCredits: creditsData.daily_credits_granted + creditsData.tier_credits_limit,
        totalAvailable: creditsData.total_credits_available,
        percentageUsed: creditsData.tier_credits_limit > 0 ? Math.min((creditsData.tier_credits_used / creditsData.tier_credits_limit) * 100, 100) : 0,
        dailyExpiresIn: creditsData.daily_expires_in
      };
    }
    
    // Get current usage and limit from subscription data
    const currentUsageInDollars = subscriptionData?.current_usage || 0;
    const costLimitInDollars = subscriptionData?.cost_limit || 0;
    
    // Convert to credits (1 dollar = 100 credits)
    const usedCredits = Math.round(currentUsageInDollars * 100);
    const subscriptionCredits = Math.round(costLimitInDollars * 100);
    
    // Daily credits from backend or defaults
    const dailyCreditsGranted = subscriptionData?.daily_credits_granted || 200;
    const dailyCreditsUsed = subscriptionData?.daily_credits_used || 0;
    // Calculate remaining based on granted - used, not trust backend's daily_credits
    const dailyCreditsRemaining = Math.max(0, dailyCreditsGranted - dailyCreditsUsed);
    
    // Calculate remaining subscription credits (never negative for display)
    const subscriptionCreditsRemaining = Math.max(0, subscriptionCredits - usedCredits);
    
    // Never show usage above limit for display
    const displayedUsedCredits = Math.min(usedCredits, subscriptionCredits);
    
    // Total credits (daily granted + subscription total limit)
    const totalCredits = dailyCreditsGranted + subscriptionCredits;
    
    // Total available credits: daily credits remaining + subscription credits remaining
    const totalAvailable = dailyCreditsRemaining + subscriptionCreditsRemaining;
    
    return {
      usedCredits: displayedUsedCredits,
      subscriptionCredits,
      subscriptionCreditsRemaining,
      dailyCredits: dailyCreditsGranted,
      dailyCreditsUsed,
      dailyCreditsRemaining,
      totalCredits,
      totalAvailable,
      percentageUsed: subscriptionCredits > 0 ? Math.min((usedCredits / subscriptionCredits) * 100, 100) : 0,
      dailyExpiresIn: subscriptionData?.daily_expires_in
    };
  };

  const summary = calculateUsageSummary();

  if (isLoading && page === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logs de Uso</CardTitle>
          <CardDescription>Carregando seu histórico de uso...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logs de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
            <p className="text-sm text-destructive">
              Erro: {error.message || 'Falha ao carregar logs de uso'}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle local development mode message
  if (currentPageData?.message) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Logs de Uso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/30 border border-border rounded-lg text-center">
            <p className="text-sm text-muted-foreground">
              {currentPageData.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const dailyUsage = groupLogsByDate(allLogs);

  return (
    <div className="space-y-6">
      {/* Barra de Créditos com Design Suna */}
      <Card className="border border-black/6 dark:border-white/8 bg-black/[0.02] dark:bg-white/[0.03]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium">Créditos</CardTitle>
            <span className="text-sm text-muted-foreground">
              {summary.totalAvailable > 0 
                ? `${summary.totalAvailable.toLocaleString('pt-BR')} restantes`
                : '0 restantes'}
            </span>
          </div>
        </CardHeader>
        <CardContent className="pb-8">
          {/* Barra de progresso com seções fixas */}
          <div className="space-y-3">
            <div className="h-2 bg-black/[0.04] dark:bg-white/[0.04] rounded-full overflow-hidden flex">
              {/* Seção de créditos do plano (85% da largura) */}
              <div className="flex-[85] h-full bg-black/[0.04] dark:bg-white/[0.04] relative overflow-hidden">
                {/* Barra de créditos restantes do plano */}
                <div 
                  className="absolute inset-y-0 left-0 bg-blue-500 transition-all duration-500"
                  style={{ 
                    width: summary.subscriptionCredits > 0 
                      ? `${(summary.subscriptionCreditsRemaining / summary.subscriptionCredits) * 100}%`
                      : '0%'
                  }}
                />
              </div>
              
              {/* Divisor visual */}
              <div className="w-[2px] h-full bg-black/10 dark:bg-white/10" />
              
              {/* Seção de créditos diários (15% da largura) */}
              <div className="flex-[15] h-full bg-black/[0.04] dark:bg-white/[0.04] relative overflow-hidden">
                {/* Barra de créditos diários restantes */}
                <div 
                  className="absolute inset-y-0 left-0 bg-amber-500 transition-all duration-500"
                  style={{ 
                    width: `${(summary.dailyCreditsRemaining / summary.dailyCredits) * 100}%`
                  }}
                />
              </div>
            </div>
            
            {/* Legenda com design Suna minimalista */}
            <div className="flex flex-col gap-2.5 pt-1 pb-6">
              {/* Sempre mostra créditos do plano primeiro se existirem */}
              {summary.subscriptionCredits > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {Math.max(0, summary.subscriptionCreditsRemaining).toLocaleString('pt-BR')} de {summary.subscriptionCredits.toLocaleString('pt-BR')} créditos do plano
                    {summary.subscriptionCreditsRemaining <= 0 && ' (esgotados)'}
                    {subscriptionData?.current_period_end && ` • Renova em ${new Date(subscriptionData.current_period_end).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`}
                  </span>
                </div>
              )}
              {/* Sempre mostra créditos diários */}
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                </div>
                <span className="text-xs text-muted-foreground">
                  {summary.dailyCreditsUsed} de {summary.dailyCredits} créditos diários usados
                  {summary.dailyCreditsRemaining > 0 && ` (${summary.dailyCreditsRemaining} disponíveis)`}
                  {summary.dailyExpiresIn && ` • Renova em ${summary.dailyExpiresIn}`}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Logs de Uso Diário com Design Suna */}
      <Card className="border border-black/6 dark:border-white/8 bg-transparent">
        <CardHeader className="px-6 py-4">
          <CardTitle className="text-lg font-semibold">Histórico Detalhado</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Uso de créditos organizado por dia
          </CardDescription>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          {dailyUsage.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              <p>Nenhum log de uso encontrado.</p>
            </div>
          ) : (
            <>
              <Accordion type="single" collapsible className="w-full">
                {dailyUsage.map((day) => (
                  <AccordionItem 
                    key={day.date} 
                    value={day.date}
                    className="border-black/6 dark:border-white/8"
                  >
                    <AccordionTrigger className="hover:no-underline hover:bg-black/[0.02] dark:hover:bg-white/[0.03] px-3 py-3 rounded-lg transition-all duration-200">
                      <div className="flex justify-between items-center w-full mr-4">
                        <div className="text-left">
                          <div className="font-medium text-sm">
                            {formatDateOnly(day.date)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {day.requestCount} {day.requestCount !== 1 ? 'requisições' : 'requisição'} • {' '}
                            {day.models.map(m => getModelAlias(m)).join(', ')}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-semibold text-sm">
                            {formatCost(day.totalCost)}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {day.totalTokens.toLocaleString('pt-BR')} tokens
                          </div>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="rounded-lg border border-black/6 dark:border-white/8 mt-3 overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-black/6 dark:border-white/8 hover:bg-transparent">
                              <TableHead className="text-xs">Horário</TableHead>
                              <TableHead className="text-xs">Modelo</TableHead>
                              <TableHead className="text-right text-xs">Tokens</TableHead>
                              <TableHead className="text-right text-xs">Créditos</TableHead>
                              <TableHead className="text-center text-xs">Thread</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {day.logs.map((log) => (
                              <TableRow 
                                key={log.message_id}
                                className="border-black/6 dark:border-white/8 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                              >
                                <TableCell className="font-mono text-xs text-muted-foreground">
                                  {new Date(log.created_at).toLocaleTimeString('pt-BR', {
                                    timeZone: 'America/Sao_Paulo',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                  })}
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="secondary"
                                    className="font-mono text-xs bg-black/[0.02] dark:bg-white/[0.03] border-black/6 dark:border-white/8"
                                  >
                                    {getModelAlias(log.content.model)}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs">
                                  <span className="text-muted-foreground">
                                    {formatNumber(log.content.usage.prompt_tokens)}
                                  </span>
                                  <span className="text-muted-foreground/60 mx-1">→</span>
                                  <span className="text-foreground">
                                    {formatNumber(log.content.usage.completion_tokens)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right font-mono font-medium text-xs">
                                  {formatCost(log.estimated_cost)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleThreadClick(
                                        log.thread_id,
                                        log.project_id,
                                      )
                                    }
                                    className="h-7 w-7 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5 opacity-60" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {hasMore && (
                <div className="flex justify-center pt-6">
                  <Button
                    onClick={loadMore}
                    disabled={isLoading}
                    variant="outline"
                    className="border-black/6 dark:border-white/8 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                        Carregando...
                      </>
                    ) : (
                      'Carregar Mais'
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}