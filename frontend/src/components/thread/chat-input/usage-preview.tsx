import React from 'react';
import { motion } from 'framer-motion';
import { X, Zap, Sparkles } from 'lucide-react';
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
                total_credits_available 
            } = creditsData;
            
            // Show proper status based on what credits are available
            return (
                <span className="flex items-center gap-2">
                    <span className={cn(
                        tier_credits_used >= tier_credits_limit && "text-red-500 dark:text-red-400"
                    )}>
                        {formatCredits(tier_credits_used)} / {formatCredits(tier_credits_limit)}
                    </span>
                    <span className={cn(
                        "flex items-center gap-1",
                        daily_credits > 0 
                            ? "text-emerald-500 dark:text-emerald-400"
                            : "text-muted-foreground/60"
                    )}>
                        <Sparkles className="h-3 w-3" />
                        {daily_credits > 0 
                            ? `+${formatCredits(daily_credits)} diários`
                            : `0 / ${formatCredits(daily_credits_granted)} diários`}
                    </span>
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

    return (
        <div className="flex items-center gap-3">
            {/* Icon */}
            <div className="flex-shrink-0">
                <motion.div
                    className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center",
                        isOverLimit()
                            ? "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                            : "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                    )}
                >
                    <Zap className={cn(
                        "h-5 w-5",
                        isOverLimit()
                            ? "text-red-500 dark:text-red-400"
                            : "text-blue-500 dark:text-blue-400"
                    )} />
                </motion.div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <motion.div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-medium text-foreground truncate">
                        {isOverLimit() && creditsData?.daily_credits === 0
                            ? "Créditos esgotados - faça upgrade para continuar"
                            : "Faça upgrade para mais uso e melhores modelos de IA"}
                    </h4>
                </motion.div>

                <motion.div className="flex items-center gap-2">
                    <div className={cn(
                        "w-2 h-2 rounded-full",
                        isOverLimit() ? "bg-red-500" : "bg-blue-500"
                    )} />
                    <div className="text-xs text-muted-foreground truncate">
                        {getUsageDisplay()}
                    </div>
                </motion.div>
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

            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 hover:bg-muted/50" onClick={(e) => { e.stopPropagation(); onClose?.(); }}>
                <X className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors" />
            </Button>
        </div>
    );
}; 