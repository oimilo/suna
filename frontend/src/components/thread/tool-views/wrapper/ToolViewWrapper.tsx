import React from 'react';
import { ToolViewProps } from '../types';
import { formatTimestamp, getToolTitle } from '../utils';
import { getToolIcon } from '../../utils';
import { CircleDashed, CheckCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from '@/styles/toolcalls.module.css';

export interface ToolViewWrapperProps extends ToolViewProps {
  children: React.ReactNode;
  headerContent?: React.ReactNode;
  footerContent?: React.ReactNode;
  className?: string;
  contentClassName?: string;
  headerClassName?: string;
  footerClassName?: string;
  showStatus?: boolean;
  customStatus?: {
    success?: string;
    failure?: string;
    streaming?: string;
  };
}

export function ToolViewWrapper({
  name = 'unknown',
  isSuccess = true,
  isStreaming = false,
  assistantTimestamp,
  toolTimestamp,
  children,
  headerContent,
  footerContent,
  className,
  contentClassName,
  headerClassName,
  footerClassName,
  showStatus = true,
  customStatus,
}: ToolViewWrapperProps) {
  const toolTitle = getToolTitle(name);
  const Icon = getToolIcon(name);

  return (
    <div className={cn(styles.toolViewContainer, className)}>
      {(headerContent || showStatus) && (
        <div className={cn(
          styles.toolViewHeader,
          headerClassName
        )}>
          <div className={styles.toolViewHeaderContent}>
            {Icon && <Icon className={styles.toolViewHeaderIcon} />}
            <span className={styles.toolViewHeaderTitle}>
              {toolTitle}
            </span>
          </div>
          {headerContent}
        </div>
      )}

      <div className={cn(styles.toolViewBody, contentClassName)}>
        {children}
      </div>

      {(footerContent || showStatus) && (
        <div className={cn(
          styles.toolViewFooter,
          footerClassName
        )}>
          <div className={styles.toolViewFooterContent}>
            {!isStreaming && showStatus && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                {isSuccess ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500 opacity-80" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500 opacity-80" />
                )}
                <span className="text-xs font-medium text-muted-foreground">
                  {isSuccess
                    ? customStatus?.success || "Sucesso"
                    : customStatus?.failure || "Falhou"}
                </span>
              </div>
            )}

            {isStreaming && showStatus && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                <CircleDashed className="h-3.5 w-3.5 text-muted-foreground opacity-60 animate-spin" />
                <span className="text-xs font-medium text-muted-foreground">{customStatus?.streaming || "Aguardando Resposta"}</span>
              </div>
            )}

            <div className="text-xs text-muted-foreground/60">
              {toolTimestamp && !isStreaming
                ? formatTimestamp(toolTimestamp)
                : assistantTimestamp
                  ? formatTimestamp(assistantTimestamp)
                  : ""}
            </div>

            {footerContent}
          </div>
        </div>
      )}
    </div>
  );
} 
