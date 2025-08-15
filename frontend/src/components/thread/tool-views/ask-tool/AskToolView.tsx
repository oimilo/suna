import React, { useState, useEffect } from 'react';
import {
  MessageCircleQuestion,
  CheckCircle,
  AlertTriangle,
  Loader2,
  MessageSquare,
  Paperclip,
} from 'lucide-react';
import { ToolViewProps } from '../types';
import {
  formatTimestamp,
  getToolTitle,
} from '../utils';
import { extractAskData } from './_utils';
import { cn, truncateString } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileAttachment } from '../../file-attachment';

interface AskToolViewProps extends ToolViewProps {
  onFileClick?: (filePath: string) => void;
}

export function AskToolView({
  name = 'ask',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
  onFileClick,
  project,
}: AskToolViewProps) {

  const {
    text,
    attachments,
    status,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp
  } = extractAskData(
    assistantContent,
    toolContent,
    isSuccess,
    toolTimestamp,
    assistantTimestamp
  );

  const isImageFile = (filePath: string): boolean => {
    const filename = filePath.split('/').pop() || '';
    return filename.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i) !== null;
  };

  const isPreviewableFile = (filePath: string): boolean => {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    return ext === 'html' || ext === 'htm' || ext === 'md' || ext === 'markdown' || ext === 'csv' || ext === 'tsv';
  };

  const toolTitle = getToolTitle(name) || 'Ask User';

  const handleFileClick = (filePath: string) => {
    if (onFileClick) {
      onFileClick(filePath);
    }
  };

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col h-full overflow-hidden bg-card">
      <CardHeader className="px-4 py-3 bg-black/[0.01] dark:bg-white/[0.01] backdrop-blur-sm border-b border-black/6 dark:border-white/8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageCircleQuestion className="h-4 w-4 text-muted-foreground opacity-60" />
            <CardTitle className="text-sm font-medium text-foreground">
              {toolTitle}
            </CardTitle>
          </div>

          {!isStreaming && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8"
            >
              {actualIsSuccess ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 opacity-80" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 opacity-80" />
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {actualIsSuccess ? 'Sucesso' : 'Falhou'}
              </span>
            </div>
          )}

          {isStreaming && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground opacity-60" />
              <span className="text-xs font-medium text-muted-foreground">Aguardando Resposta</span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 overflow-hidden relative">
        <ScrollArea className="h-full w-full">
          <div className="p-4 space-y-6">
            {text && (
              <div className="space-y-3">
                <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <MessageCircleQuestion className="h-3.5 w-3.5 opacity-60" />
                  Pergunta
                </h3>
                <div className="bg-black/[0.03] dark:bg-white/[0.04] border border-black/6 dark:border-white/8 rounded-lg p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">{text}</p>
                </div>
                {isStreaming && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/10 dark:border-amber-400/10">
                    <Loader2 className="h-4 w-4 text-amber-600 dark:text-amber-400 animate-spin flex-shrink-0" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                      Aguardando sua resposta no campo de input abaixo...
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {attachments && attachments.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Paperclip className="h-3.5 w-3.5 opacity-60" />
                    Arquivos Anexados
                  </h3>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                    <span className="text-xs font-medium text-muted-foreground">{attachments.length} arquivo{attachments.length !== 1 ? 's' : ''}</span>
                  </div>
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
                              isImage ? "aspect-square w-full" : "w-full",
                              isImage ? "" :
                                isPreviewable ? "min-h-full max-h-[400px] overflow-auto" : "h-[54px]"
                            )}
                            customStyle={
                              isImage ? {
                                width: '100%',
                                height: '100%',
                                '--attachment-height': '100%'
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
            ) : !text && !attachments ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-black/[0.02] dark:bg-white/[0.02] border border-black/6 dark:border-white/8">
                  <MessageSquare className="h-6 w-6 text-muted-foreground opacity-60" />
                </div>
                <h3 className="text-sm font-medium mb-1 text-foreground">
                  Pergunta Enviada
                </h3>
                <p className="text-xs text-muted-foreground">
                  Nenhum arquivo anexado a esta pergunta
                </p>
              </div>
            ) : null}
          </div>
        </ScrollArea>
      </CardContent>

      <div className="h-10 px-4 bg-gradient-to-r from-zinc-50/90 to-zinc-100/90 dark:from-zinc-900/90 dark:to-zinc-800/90 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
        <div className="h-full flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
            <MessageCircleQuestion className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
            <span className="text-xs font-medium text-muted-foreground">Interação do Usuário</span>
          </div>
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {actualAssistantTimestamp ? formatTimestamp(actualAssistantTimestamp) : ''}
        </div>
      </div>
    </Card>
  );
} 