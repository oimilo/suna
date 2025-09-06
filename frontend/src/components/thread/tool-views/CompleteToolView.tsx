import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  CheckCircle,
  AlertTriangle,
  Loader2,
  ListChecks,
  Sparkles,
  Trophy,
  Paperclip,
  ExternalLink,
} from 'lucide-react';
import { ToolViewProps } from './types';
import {
  formatTimestamp,
  getToolTitle,
  normalizeContentToString,
  extractToolData,
  getFileIconAndColor,
} from './utils';
import { extractCompleteData } from './complete-tool/_utils';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from '@/components/ui/progress';
import { Markdown } from '@/components/ui/markdown';
import { FileAttachment } from '../file-attachment';

interface CompleteContent {
  summary?: string;
  result?: string | null;
  tasksCompleted?: string[];
  finalOutput?: string;
  attachments?: string[];
}

interface CompleteToolViewProps extends ToolViewProps {
  onFileClick?: (filePath: string) => void;
}

export function CompleteToolView({
  name = 'complete',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
  onFileClick,
  project,
}: CompleteToolViewProps) {
  const [completeData, setCompleteData] = useState<CompleteContent>({});
  const [progress, setProgress] = useState(0);

  const {
    text,
    attachments,
    status,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp
  } = extractCompleteData(
    assistantContent,
    toolContent,
    isSuccess,
    toolTimestamp,
    assistantTimestamp
  );

  useEffect(() => {
    if (assistantContent) {
      try {
        const contentStr = normalizeContentToString(assistantContent);
        if (!contentStr) return;

        let cleanContent = contentStr
          .replace(/<function_calls>[\s\S]*?<\/function_calls>/g, '')
          .replace(/<invoke name="complete"[\s\S]*?<\/invoke>/g, '')
          .trim();

        const completeMatch = cleanContent.match(/<complete[^>]*>([^<]*)<\/complete>/);
        if (completeMatch) {
          setCompleteData(prev => ({ ...prev, summary: completeMatch[1].trim() }));
        } else if (cleanContent) {
          setCompleteData(prev => ({ ...prev, summary: cleanContent }));
        }

        const attachmentsMatch = contentStr.match(/attachments=["']([^"']*)["']/i);
        if (attachmentsMatch) {
          const attachments = attachmentsMatch[1].split(',').map(a => a.trim()).filter(a => a.length > 0);
          setCompleteData(prev => ({ ...prev, attachments }));
        }

        const taskMatches = cleanContent.match(/- ([^\n]+)/g);
        if (taskMatches) {
          const tasks = taskMatches.map(task => task.replace('- ', '').trim());
          setCompleteData(prev => ({ ...prev, tasksCompleted: tasks }));
        }
      } catch (e) {
        console.error('Error parsing complete content:', e);
      }
    }
  }, [assistantContent]);

  useEffect(() => {
    if (toolContent && !isStreaming) {
      try {
        const contentStr = normalizeContentToString(toolContent);
        if (!contentStr) return;
        
        const toolResultMatch = contentStr.match(/ToolResult\([^)]*output=['"]([^'"]+)['"]/);
        if (toolResultMatch) {
          setCompleteData(prev => ({ ...prev, result: toolResultMatch[1] }));
        } else {
          setCompleteData(prev => ({ ...prev, result: contentStr }));
        }
      } catch (e) {
        console.error('Error parsing tool response:', e);
      }
    }
  }, [toolContent, isStreaming]);

  useEffect(() => {
    if (isStreaming) {
      const timer = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 95) {
            clearInterval(timer);
            return prevProgress;
          }
          return prevProgress + 5;
        });
      }, 300);
      return () => clearInterval(timer);
    } else {
      setProgress(100);
    }
  }, [isStreaming]);

  const isImageFile = (filePath: string): boolean => {
    const filename = filePath.split('/').pop() || '';
    return filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i) !== null;
  };

  const isPreviewableFile = (filePath: string): boolean => {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    return ext === 'html' || ext === 'htm' || ext === 'md' || ext === 'markdown' || ext === 'csv' || ext === 'tsv';
  };

  const toolTitle = getToolTitle(name) || 'Tarefa Concluída';

  const handleFileClick = (filePath: string) => {
    if (onFileClick) {
      onFileClick(filePath);
    }
  };

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col overflow-hidden bg-card">
      <CardHeader className="px-4 py-3 bg-black/[0.01] dark:bg-white/[0.01] backdrop-blur-sm border-b border-black/6 dark:border-white/8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-muted-foreground opacity-60" />
            <CardTitle className="text-sm font-medium text-foreground">
              {toolTitle}
            </CardTitle>
          </div>

          {!isStreaming && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
              {actualIsSuccess ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 opacity-80" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 opacity-80" />
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {actualIsSuccess ? 'Concluída' : 'Falhou'}
              </span>
            </div>
          )}

          {isStreaming && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
              <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground opacity-60" />
              <span className="text-xs font-medium text-muted-foreground">Completando</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden relative">
        <ScrollArea className="h-full w-full">
          <div className="p-4 space-y-6">
            {/* Success Animation/Icon - Only show when completed successfully and no text/attachments */}
            {!isStreaming && actualIsSuccess && !text && !attachments && !completeData.summary && !completeData.tasksCompleted && (
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-100 to-emerald-200 dark:from-emerald-800/40 dark:to-emerald-900/60 flex items-center justify-center">
                    <Trophy className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <Sparkles className="h-5 w-5 text-yellow-500 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {/* Text/Summary Section */}
            {(text || completeData.summary || completeData.result) && (
              <div className="space-y-2">
                <div className="bg-muted/50 rounded-2xl p-4 border border-border">
                  <Markdown className="text-sm prose prose-sm dark:prose-invert chat-markdown max-w-none [&>:first-child]:mt-0 prose-headings:mt-3">
                    {text || completeData.summary || completeData.result}
                  </Markdown>
                </div>
              </div>
            )}

            {/* Attachments Section */}
            {attachments && attachments.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                  Arquivos ({attachments.length})
                </div>

                <div className={cn(
                  "grid gap-3",
                  attachments.length === 1 ? "grid-cols-1" :
                    attachments.length > 4 ? "grid-cols-1 sm:grid-cols-2 md:grid-cols-3" :
                      "grid-cols-1 sm:grid-cols-2"
                )}>
                  {attachments
                    .sort((a, b) => {
                      const aIsImage = isImageFile(a);
                      const bIsImage = isImageFile(b);
                      const aIsPreviewable = isPreviewableFile(a);
                      const bIsPreviewable = isPreviewableFile(b);

                      if (aIsImage && !bIsImage) return -1;
                      if (!aIsImage && bIsImage) return 1;
                      if (aIsPreviewable && !bIsPreviewable) return -1;
                      if (!aIsPreviewable && bIsPreviewable) return 1;
                      return 0;
                    })
                    .map((attachment, index) => {
                      const isImage = isImageFile(attachment);
                      const isPreviewable = isPreviewableFile(attachment);
                      const shouldSpanFull = (attachments!.length % 2 === 1 &&
                        attachments!.length > 1 &&
                        index === attachments!.length - 1);

                      return (
                        <div
                          key={index}
                          className={cn(
                            "relative group",
                            isImage ? "flex items-center justify-center h-full" : "",
                            isPreviewable ? "w-full" : ""
                          )}
                          style={(shouldSpanFull || isPreviewable) ? { gridColumn: '1 / -1' } : undefined}
                        >
                          <FileAttachment
                            filepath={attachment}
                            onClick={handleFileClick}
                            sandboxId={project?.sandbox?.id}
                            showPreview={true}
                            className={cn(
                              "w-full",
                              isImage ? "h-auto min-h-[54px]" :
                                isPreviewable ? "min-h-[240px] max-h-[400px] overflow-auto" : "h-[54px]"
                            )}
                            customStyle={
                              isImage ? {
                                width: '100%',
                                height: 'auto',
                                '--attachment-height': shouldSpanFull ? '240px' : '180px'
                              } as React.CSSProperties :
                                isPreviewable ? {
                                  gridColumn: '1 / -1'
                                } :
                                  shouldSpanFull ? {
                                    gridColumn: '1 / -1'
                                  } : {
                                    width: '100%'
                                  }
                            }
                            collapsed={false}
                            project={project}
                          />
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : completeData.attachments && completeData.attachments.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Paperclip className="h-4 w-4" />
                  Arquivos ({completeData.attachments.length})
                </div>
                <div className="grid grid-cols-1 gap-2">
                  {completeData.attachments.map((attachment, index) => {
                    const { icon: FileIcon, color, bgColor } = getFileIconAndColor(attachment);
                    const fileName = attachment.split('/').pop() || attachment;
                    const filePath = attachment.includes('/') ? attachment.substring(0, attachment.lastIndexOf('/')) : '';

                    return (
                      <button
                        key={index}
                        onClick={() => handleFileClick(attachment)}
                        className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group cursor-pointer text-left"
                      >
                        <div className="flex-shrink-0">
                          <div className={cn(
                            "w-10 h-10 rounded-lg bg-gradient-to-br flex items-center justify-center",
                            bgColor
                          )}>
                            <FileIcon className={cn("h-5 w-5", color)} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {fileName}
                          </p>
                          {filePath && (
                            <p className="text-xs text-muted-foreground truncate">
                              {filePath}
                            </p>
                          )}
                        </div>
                        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Tasks Completed Section */}
            {completeData.tasksCompleted && completeData.tasksCompleted.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <ListChecks className="h-4 w-4" />
                  Tarefas Concluídas
                </div>
                <div className="space-y-2">
                  {completeData.tasksCompleted.map((task, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg border border-border/50"
                    >
                      <div className="mt-1 flex-shrink-0">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <Markdown className="text-sm prose prose-sm dark:prose-invert chat-markdown max-w-none [&>:first-child]:mt-0 [&>:last-child]:mb-0">
                          {task}
                        </Markdown>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Progress Section for Streaming */}
            {isStreaming && (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Completando tarefa...
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {progress}%
                  </span>
                </div>
                <Progress value={progress} className="h-1" />
              </div>
            )}

            {/* Empty State */}
            {!text && !attachments && !completeData.summary && !completeData.result && !completeData.attachments && !completeData.tasksCompleted && !isStreaming && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <CheckCircle2 className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Tarefa Concluída
                </h3>
                <p className="text-sm text-muted-foreground">
                  Sem detalhes adicionais fornecidos
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
} 