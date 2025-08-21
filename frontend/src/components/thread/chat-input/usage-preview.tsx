import React from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Sparkles, Coins, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isLocalMode } from '@/lib/config';
import { Button } from '@/components/ui/button';
import { useCreditsStatus } from '@/hooks/react-query';

export interface UsagePreviewProps {
    type: 'tokens' | 'upgrade';
    subscriptionData?: any;
    onClose?: () => void;
    onOpenUpgrade?: () => void;
    hasMultiple?: boolean;
    showIndicators?: boolean;
    currentIndex?: number;
    totalCount?: number;
    onIndicatorClick?: (index: number) => void;
}

export const UsagePreview: React.FC<UsagePreviewProps> = ({
    type,
    subscriptionData,
    onClose,
    onOpenUpgrade,
    hasMultiple = false,
    showIndicators = false,
    currentIndex = 0,
    totalCount = 1,
    onIndicatorClick,
}) => {
    const { data: creditsData } = useCreditsStatus();
    
    if (isLocalMode()) return null;

    // Format credits display
    const formatCredits = (credits: number) => {
        return Math.floor(credits).toLocaleString('pt-BR');
    };

    const getUsageDisplay = () => {
        // Use credits data if available
        if (creditsData) {
            const { 
                tier_credits_used, 
                tier_credits_limit, 
                daily_credits, 
                daily_credits_granted,
                total_credits_available,
                subscription_name
            } = creditsData;
            
            // Check if user is on free plan (no daily credits for free users)
            const isFreeUser = subscription_name === 'free' || tier_credits_limit === 0;
            
            // Show proper status based on what credits are available
            // Never show values above the limit
            const displayedUsed = Math.min(tier_credits_used, tier_credits_limit);
            const dailyUsed = daily_credits_granted - daily_credits;
            
            // For free users, only show plan credits
            if (isFreeUser) {
                return (
                    <span className={cn(
                        "text-xs",
                        tier_credits_used >= tier_credits_limit && "text-red-600 dark:text-red-400"
                    )}>
                        {formatCredits(displayedUsed)} / {formatCredits(tier_credits_limit)} créditos
                    </span>
                );
            }
            
            // For paid users, show both plan and daily credits
            return (
                <span className="flex items-center gap-3 text-xs">
                    <span className={cn(
                        tier_credits_used >= tier_credits_limit && "text-amber-600 dark:text-amber-400"
                    )}>
                        {formatCredits(displayedUsed)} / {formatCredits(tier_credits_limit)}
                    </span>
                    {daily_credits_granted > 0 && (
                        <>
                            <span className="text-black/20 dark:text-white/20">•</span>
                            <span className={cn(
                                "flex items-center gap-1",
                                daily_credits > 0 
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-muted-foreground/60"
                            )}>
                                <Sparkles className="h-3 w-3" />
                                {formatCredits(daily_credits)} diários
                            </span>
                        </>
                    )}
                </span>
            );
        }
        
        // Fallback to old display if credits data not available
        if (!subscriptionData) return 'Carregando uso...';

        const current = subscriptionData.current_usage || 0;
        const limit = subscriptionData.cost_limit || 0;

        if (limit === 0) return 'Sem limite de uso definido';

        // Convert dollars to credits (100 credits = $1)
        const currentCredits = current * 100;
        const limitCredits = limit * 100;

        const isOverLimit = current > limit;
        const usageText = `${formatCredits(currentCredits)} / ${formatCredits(limitCredits)} créditos`;

        if (isOverLimit) {
            return `${usageText} (acima do limite)`;
        }

        return usageText;
    };

    const isOverLimit = () => {
        // Check using credits data if available
        if (creditsData) {
            return creditsData.total_credits_available <= 0;
        }
        
        // Fallback to old check
        if (!subscriptionData) return false;
        const current = subscriptionData.current_usage || 0;
        const limit = subscriptionData.cost_limit || 0;
        return current > limit;
    };

    // Design system Suna - minimalista com transparências baixas
    return (
        <div className="flex items-center gap-3 px-4 py-3 bg-black/[0.02] dark:bg-white/[0.03] border-y border-black/6 dark:border-white/8">
            {/* Icon com design Suna */}
            <div className="flex-shrink-0">
                <div className={cn(
                    "p-2 rounded-lg",
                    isOverLimit()
                        ? "bg-red-500/10"
                        : "bg-amber-500/10"
                )}>
                    {isOverLimit() ? (
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                    ) : (
                        <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <h4 className={cn(
                        "text-sm font-medium",
                        isOverLimit() 
                            ? "text-red-600 dark:text-red-400"
                            : "text-foreground"
                    )}>
                        {isOverLimit() && creditsData?.daily_credits === 0
                            ? "Créditos esgotados"
                            : "Créditos limitados"}
                    </h4>
                    <span className="text-black/20 dark:text-white/20">•</span>
                    <div className="text-muted-foreground">
                        {getUsageDisplay()}
                    </div>
                </div>
            </div>

            {/* Apple-style notification indicators - only for multiple notification types */}
            {showIndicators && totalCount === 2 && (
                <button
                    data-indicator-click
                    onClick={(e) => {
                        e.stopPropagation();
                        const nextIndex = currentIndex === 0 ? 1 : 0;
                        onIndicatorClick?.(nextIndex);
                    }}
                    className="flex items-center gap-1.5 mr-3 px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors"
                >
                    {Array.from({ length: totalCount }).map((_, index) => (
                        <div
                            key={index}
                            className={cn(
                                "transition-all duration-300 ease-out rounded-full",
                                index === currentIndex
                                    ? "w-6 h-2 bg-foreground"
                                    : "w-3 h-2 bg-muted-foreground/40"
                            )}
                        />
                    ))}
                </button>
            )}

            <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 p-0 flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/5" 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onClose?.(); 
                }}
            >
                <X className="h-3.5 w-3.5 opacity-60 hover:opacity-100 transition-opacity" />
            </Button>
        </div>
    );
}; 