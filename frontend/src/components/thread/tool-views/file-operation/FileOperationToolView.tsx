import React, { useState } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Loader2,
  Code,
  Eye,
  File,
  RefreshCw,
} from 'lucide-react';
import {
  extractFilePath,
  extractFileContent,
  extractStreamingFileContent,
  formatTimestamp,
  getToolTitle,
  normalizeContentToString,
  extractToolData,
} from '../utils';
import {
  MarkdownRenderer,
  processUnicodeContent,
} from '@/components/file-renderers/markdown-renderer';
import { CsvRenderer } from '@/components/file-renderers/csv-renderer';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { CodeBlockCode } from '@/components/ui/code-block';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  getLanguageFromFileName,
  getOperationType,
  getOperationConfigs,
  getFileIcon,
  processFilePath,
  getFileName,
  getFileExtension,
  isFileType,
  hasLanguageHighlighting,
  splitContentIntoLines,
  type FileOperation,
  type OperationConfig,
} from './_utils';
import { ToolViewProps } from '../types';
import { GenericToolView } from '../GenericToolView';
import { LoadingState } from '../shared/LoadingState';

export function FileOperationToolView({
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
  name,
  project,
}: ToolViewProps) {
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';
  const [iframeError, setIframeError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);

  const operation = getOperationType(name, assistantContent);
  const configs = getOperationConfigs();
  const config = configs[operation];
  const Icon = config.icon;

  let filePath: string | null = null;
  let fileContent: string | null = null;

  const assistantToolData = extractToolData(assistantContent);
  const toolToolData = extractToolData(toolContent);

  if (assistantToolData.toolResult) {
    filePath = assistantToolData.filePath;
    fileContent = assistantToolData.fileContent;
  } else if (toolToolData.toolResult) {
    filePath = toolToolData.filePath;
    fileContent = toolToolData.fileContent;
  }

  if (!filePath) {
    filePath = extractFilePath(assistantContent);
  }

  if (!fileContent && operation !== 'delete') {
    fileContent = isStreaming
      ? extractStreamingFileContent(
        assistantContent,
        operation === 'create' ? 'create-file' : operation === 'edit' ? 'edit-file' : 'full-file-rewrite',
      ) || ''
      : extractFileContent(
        assistantContent,
        operation === 'create' ? 'create-file' : operation === 'edit' ? 'edit-file' : 'full-file-rewrite',
      );
  }

  const toolTitle = getToolTitle(name || `file-${operation}`);
  const processedFilePath = processFilePath(filePath);
  const fileName = getFileName(processedFilePath);
  const fileExtension = getFileExtension(fileName);

  const isMarkdown = isFileType.markdown(fileExtension);
  const isHtml = isFileType.html(fileExtension);
  const isCsv = isFileType.csv(fileExtension);

  const language = getLanguageFromFileName(fileName);
  const hasHighlighting = hasLanguageHighlighting(language);
  const contentLines = splitContentIntoLines(fileContent);

  // Use proxy URL instead of Daytona URL to avoid warning
  const htmlPreviewUrl =
    isHtml && project && processedFilePath
      ? `/api/preview/${(project as any)?.project_id || (project as any)?.id}/${processedFilePath.replace(/^\/workspace\//, '').replace(/^\//, '')}`
      : undefined;

  const FileIcon = getFileIcon(fileName);

  // Auto-retry logic for iframe loading errors
  React.useEffect(() => {
    if (iframeError && retryCount < 3) {
      const timer = setTimeout(() => {
        setIframeError(false);
        setRetryCount(prev => prev + 1);
        if (iframeRef.current) {
          iframeRef.current.src = htmlPreviewUrl || '';
        }
      }, 3000); // Retry after 3 seconds
      
      return () => clearTimeout(timer);
    }
  }, [iframeError, retryCount, htmlPreviewUrl]);

  // Reset error state when htmlPreviewUrl changes
  React.useEffect(() => {
    setIframeError(false);
    setRetryCount(0);
  }, [htmlPreviewUrl]);

  if (!isStreaming && !processedFilePath && !fileContent) {
    return (
      <GenericToolView
        name={name || `file-${operation}`}
        assistantContent={assistantContent}
        toolContent={toolContent}
        assistantTimestamp={assistantTimestamp}
        toolTimestamp={toolTimestamp}
        isSuccess={isSuccess}
        isStreaming={isStreaming}
      />
    );
  }

  const renderFilePreview = () => {
    if (!fileContent) {
      return (
        <div className="flex items-center justify-center h-full p-12">
          <div className="text-center">
            <FileIcon className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhum conteúdo para visualizar</p>
          </div>
        </div>
      );
    }

    if (isHtml && htmlPreviewUrl) {
      if (iframeError) {
        return (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-amber-500/10">
              <RefreshCw className="h-10 w-10 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
              Sandbox Iniciando...
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-md">
              O ambiente de desenvolvimento está sendo preparado. Isso pode levar alguns segundos na primeira vez.
            </p>
            {retryCount < 3 ? (
              <div className="flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  <span>Tentando novamente em alguns segundos... (Tentativa {retryCount + 1}/3)</span>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => {
                  setIframeError(false);
                  setRetryCount(0);
                  if (iframeRef.current) {
                    iframeRef.current.src = htmlPreviewUrl;
                  }
                }}
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
              </Button>
            )}
          </div>
        );
      }

      return (
        <div className="flex flex-col h-[calc(100vh-16rem)]">
          <iframe
            ref={iframeRef}
            src={htmlPreviewUrl}
            title={`Visualização HTML de ${fileName}`}
            className="flex-grow border-0"
            sandbox="allow-same-origin allow-scripts"
            onError={() => setIframeError(true)}
            onLoad={(e) => {
              // Check if the iframe loaded successfully
              const iframe = e.target as HTMLIFrameElement;
              try {
                // This will throw if we can't access the contentDocument (CORS)
                // But that's OK for external content
                const doc = iframe.contentDocument;
                if (doc?.body?.innerHTML?.includes('File not found: 502')) {
                  setIframeError(true);
                }
              } catch {
                // CORS error is expected for external content, ignore it
              }
            }}
          />
        </div>
      );
    }

    if (isMarkdown) {
      return (
        <div className="p-1 py-0 prose dark:prose-invert prose-zinc max-w-none">
          <MarkdownRenderer
            content={processUnicodeContent(fileContent)}
          />
        </div>
      );
    }

    if (isCsv) {
      return (
        <div className="h-full w-full p-4">
          <div className="h-[calc(100vh-17rem)] w-full bg-muted/20 border rounded-xl overflow-auto">
            <CsvRenderer content={processUnicodeContent(fileContent)} />
          </div>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className='w-full h-full bg-muted/20 border rounded-xl px-4 py-2 pb-6'>
          <pre className="text-sm font-mono text-zinc-800 dark:text-zinc-300 whitespace-pre-wrap break-words">
            {processUnicodeContent(fileContent)}
          </pre>
        </div>
      </div>
    );
  };

  const renderDeleteOperation = () => (
    <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
      <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6", config.bgColor)}>
        <Icon className={cn("h-10 w-10", config.color)} />
      </div>
      <h3 className="text-xl font-semibold mb-6 text-zinc-900 dark:text-zinc-100">
        Arquivo Deletado
      </h3>
      <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 w-full max-w-md text-center mb-4 shadow-sm">
        <code className="text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">
          {processedFilePath || 'Unknown file path'}
        </code>
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Este arquivo foi removido permanentemente
      </p>
    </div>
  );

  const renderSourceCode = () => {
    if (!fileContent) {
      return (
        <div className="flex items-center justify-center h-full p-12">
          <div className="text-center">
            <FileIcon className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Nenhum código fonte para exibir</p>
          </div>
        </div>
      );
    }

    if (hasHighlighting) {
      return (
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 w-12 border-r border-zinc-200 dark:border-zinc-800 z-10 flex flex-col bg-zinc-50 dark:bg-zinc-900">
            {contentLines.map((_, idx) => (
              <div
                key={idx}
                className="h-6 text-right pr-3 text-xs font-mono text-zinc-500 dark:text-zinc-500 select-none"
              >
                {idx + 1}
              </div>
            ))}
          </div>
          <div className="pl-12">
            <CodeBlockCode
              code={processUnicodeContent(fileContent)}
              language={language}
              className="text-xs"
            />
          </div>
        </div>
      );
    }

    return (
      <div className="min-w-full table">
        {contentLines.map((line, idx) => (
          <div
            key={idx}
            className={cn("table-row transition-colors", config.hoverColor)}
          >
            <div className="table-cell text-right pr-3 pl-6 py-0.5 text-xs font-mono text-zinc-500 dark:text-zinc-500 select-none w-12 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
              {idx + 1}
            </div>
            <div className="table-cell pl-3 py-0.5 pr-4 text-xs font-mono whitespace-pre-wrap text-zinc-800 dark:text-zinc-300">
              {processUnicodeContent(line) || ' '}
            </div>
          </div>
        ))}
        <div className="table-row h-4"></div>
      </div>
    );
  };

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col h-full overflow-hidden bg-card">
      <Tabs defaultValue={'preview'} className="w-full h-full">
        <CardHeader className="px-4 py-3 bg-black/[0.01] dark:bg-white/[0.01] backdrop-blur-sm border-b border-black/6 dark:border-white/8">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground opacity-60" />
              <div>
                <CardTitle className="text-sm font-medium text-foreground">
                  {toolTitle}
                </CardTitle>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {!isStreaming && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                  {isSuccess ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 opacity-80" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 opacity-80" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">
                    {isSuccess ? 'Sucesso' : 'Falhou'}
                  </span>
                </div>
              )}
              {isHtml && htmlPreviewUrl && !isStreaming && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 px-3 text-xs bg-transparent hover:bg-black/[0.03] dark:hover:bg-white/[0.03] border border-black/6 dark:border-white/8 rounded-lg" 
                  asChild
                >
                  <a href={htmlPreviewUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5 opacity-60" />
                    <span className="text-muted-foreground">Abrir no Navegador</span>
                  </a>
                </Button>
              )}
              <TabsList className="h-8 bg-black/[0.02] dark:bg-white/[0.02] border border-black/6 dark:border-white/8 p-0.5 gap-0.5 rounded-lg">
                <TabsTrigger
                  value="code"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all rounded-md [&[data-state=active]]:bg-black/[0.04] [&[data-state=active]]:dark:bg-white/[0.04] [&[data-state=active]]:text-foreground [&[data-state=active]]:shadow-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.02] text-muted-foreground data-[state=inactive]:opacity-60"
                >
                  <Code className="h-3.5 w-3.5" />
                  Código
                </TabsTrigger>
                <TabsTrigger
                  value="preview"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-all rounded-md [&[data-state=active]]:bg-black/[0.04] [&[data-state=active]]:dark:bg-white/[0.04] [&[data-state=active]]:text-foreground [&[data-state=active]]:shadow-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.02] text-muted-foreground data-[state=inactive]:opacity-60"
                >
                  <Eye className="h-3.5 w-3.5" />
                  Visualizar
                </TabsTrigger>
              </TabsList>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
          <TabsContent value="code" className="flex-1 h-full mt-0 p-0 overflow-hidden">
            <ScrollArea className="h-full w-full min-h-0">
              {isStreaming && !fileContent ? (
                <LoadingState
                  icon={Icon}
                  iconColor={config.color}
                  bgColor={config.bgColor}
                  title={config.progressMessage}
                  filePath={processedFilePath || 'Processing file...'}
                  subtitle="Por favor aguarde enquanto o arquivo está sendo processado"
                  showProgress={false}
                />
              ) : operation === 'delete' ? (
                <div className="flex flex-col items-center justify-center h-full py-12 px-6">
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6", config.bgColor)}>
                    <Icon className={cn("h-10 w-10", config.color)} />
                  </div>
                  <h3 className="text-xl font-semibold mb-6 text-zinc-900 dark:text-zinc-100">
                    Operação de Exclusão
                  </h3>
                  <div className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 w-full max-w-md text-center">
                    <code className="text-sm font-mono text-zinc-700 dark:text-zinc-300 break-all">
                      {processedFilePath || 'Unknown file path'}
                    </code>
                  </div>
                </div>
              ) : (
                renderSourceCode()
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="preview" className="w-full flex-1 h-full mt-0 p-0 overflow-hidden">
            <ScrollArea className="h-full w-full min-h-0">
              {isStreaming && !fileContent ? (
                <LoadingState
                  icon={Icon}
                  iconColor={config.color}
                  bgColor={config.bgColor}
                  title={config.progressMessage}
                  filePath={processedFilePath || 'Processing file...'}
                  subtitle="Por favor aguarde enquanto o arquivo está sendo processado"
                  showProgress={false}
                />
              ) : operation === 'delete' ? (
                renderDeleteOperation()
              ) : (
                renderFilePreview()
              )}
              {isStreaming && fileContent && (
                <div className="sticky bottom-4 right-4 float-right mr-4 mb-4">
                  <Badge className="bg-blue-500/90 text-white border-none shadow-lg animate-pulse">
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    Streaming...
                  </Badge>
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}