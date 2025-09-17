import React from 'react';
import { motion } from 'framer-motion';
import { X, Clock, Coins, AlertCircle } from 'lucide-react';
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
        // Always use the same structure to avoid layout shift
        const tier_credits_used = creditsData?.tier_credits_used ?? (subscriptionData?.current_usage ? subscriptionData.current_usage * 100 : 0);
        const tier_credits_limit = creditsData?.tier_credits_limit ?? (subscriptionData?.cost_limit ? subscriptionData.cost_limit * 100 : 0);
        const daily_credits = creditsData?.daily_credits ?? 0;
        const daily_credits_granted = creditsData?.daily_credits_granted ?? 0;
        const subscription_name = creditsData?.subscription_name ?? subscriptionData?.subscription_name ?? '';
        
        // Check if user is on free plan (no daily credits for free users)
        const isFreeUser = subscription_name === 'free' || tier_credits_limit === 0;
        
        // Show proper status based on what credits are available
        // Never show values above the limit
        const displayedUsed = Math.min(tier_credits_used, tier_credits_limit);
        
        // For free users, only show plan credits
        if (isFreeUser) {
            return (
                <span className={cn(
                    "text-xs",
                    tier_credits_used >= tier_credits_limit && "text-red-600 dark:text-red-400"
                )}>
                    {formatCredits(displayedUsed)} / {formatCredits(tier_credits_limit)} créditos
                    {tier_credits_limit > 0 && ` (acima do limite)`}
                </span>
            );
        }
        
        // For paid users, always show the same structure
        return (
            <span className="inline-flex items-center gap-2 text-xs">
                <span className={cn(
                    tier_credits_used >= tier_credits_limit && "text-amber-600 dark:text-amber-400"
                )}>
                    {formatCredits(displayedUsed)} / {formatCredits(tier_credits_limit)} créditos
                </span>
                {daily_credits_granted > 0 && (
                    <>
                        <span className="text-black/20 dark:text-white/20">•</span>
                        <span className={cn(
                            "inline-flex items-center gap-1",
                            daily_credits > 0 
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-muted-foreground/60"
                        )}>
                            <Clock className="h-3 w-3" />
                            {formatCredits(daily_credits)} diários
                        </span>
                    </>
                )}
            </span>
        );
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

    return (
        <div className="flex items-center gap-2.5 px-3 py-1.5">
            {/* Icon simples sem fundo */}
            <div className="flex-shrink-0">
                {isOverLimit() ? (
                    <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400 opacity-80" />
                ) : (
                    <Coins className="h-4 w-4 text-amber-500 dark:text-amber-400 opacity-80" />
                )}
            </div>

            {/* Content compacto */}
            <div className="flex-1 min-w-0 flex items-center gap-2">
                <span className={cn(
                    "text-sm font-medium",
                    isOverLimit() 
                        ? "text-red-600 dark:text-red-400"
                        : "text-foreground"
                )}>
                    {isOverLimit() ? "Créditos esgotados" : "Créditos limitados"}
                </span>
                <span className="text-black/20 dark:text-white/20">•</span>
                <span className="text-xs text-muted-foreground">
                    {getUsageDisplay()}
                </span>
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

            <button 
                className="p-1 flex-shrink-0 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors" 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    onClose?.(); 
                }}
            >
                <X className="h-3.5 w-3.5 opacity-50 hover:opacity-100 transition-opacity" />
            </button>
        </div>
    );
}; 