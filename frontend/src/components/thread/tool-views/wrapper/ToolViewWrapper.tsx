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
      {headerContent && (
        <div className={cn(
          styles.toolViewHeader,
          headerClassName
        )}>
          {headerContent}
        </div>
      )}

      <div className={cn(styles.toolViewBody, contentClassName)}>
        {children}
      </div>

      {footerContent && (
        <div className={cn(
          styles.toolViewFooter,
          footerClassName
        )}>
          <div className={styles.toolViewFooterContent}>
            {footerContent}
          </div>
        </div>
      )}
    </div>
  );
} 
