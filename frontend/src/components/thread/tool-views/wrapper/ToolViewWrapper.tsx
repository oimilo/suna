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
              <div className="flex items-center gap-2">
                {isSuccess ? (
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                )}
                <span>
                  {isSuccess
                    ? customStatus?.success || "Completed successfully"
                    : customStatus?.failure || "Execution failed"}
                </span>
              </div>
            )}

            {isStreaming && showStatus && (
              <div className="flex items-center gap-2">
                <CircleDashed className="h-3.5 w-3.5 text-blue-500 animate-spin" />
                <span>{customStatus?.streaming || "Processing..."}</span>
              </div>
            )}

            <div className="text-xs">
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
