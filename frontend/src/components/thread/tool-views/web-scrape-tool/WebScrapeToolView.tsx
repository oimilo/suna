import React, { useState, useEffect } from 'react';
import {
  Globe,
  CheckCircle,
  AlertTriangle,
  Loader2,
  FileText,
  Copy,
  Calendar,
  Check,
  ArrowUpRight,
  Zap
} from 'lucide-react';
import { ToolViewProps } from '../types';
import {
  formatTimestamp,
  getToolTitle,
} from '../utils';
import { extractWebScrapeData } from './_utils';
import { cn, truncateString } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function WebScrapeToolView({
  name = 'scrape-webpage',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  const { resolvedTheme } = useTheme();
  const [progress, setProgress] = useState(0);
  const [copiedFile, setCopiedFile] = useState<string | null>(null);

  const {
    url,
    files,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp
  } = extractWebScrapeData(
    assistantContent,
    toolContent,
    isSuccess,
    toolTimestamp,
    assistantTimestamp
  );

  const toolTitle = getToolTitle(name);
  const formatDomain = (url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.replace('www.', '');
    } catch (e) {
      return url;
    }
  };

  const domain = url ? formatDomain(url) : 'Unknown';

  const getFavicon = (url: string) => {
    try {
      const domain = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
    } catch (e) {
      return null;
    }
  };

  const favicon = url ? getFavicon(url) : null;

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

  const copyFilePath = async (filePath: string) => {
    try {
      await navigator.clipboard.writeText(filePath);
      setCopiedFile(filePath);
      setTimeout(() => setCopiedFile(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const formatFileInfo = (filePath: string) => {
    const timestampMatch = filePath.match(/(\d{8}_\d{6})/);
    const domainMatch = filePath.match(/(\w+)_com\.json$/);
    const fileName = filePath.split('/').pop() || filePath;

    return {
      timestamp: timestampMatch ? timestampMatch[1] : '',
      domain: domainMatch ? domainMatch[1] : 'unknown',
      fileName,
      fullPath: filePath
    };
  };

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col h-full overflow-hidden bg-card">
      <CardHeader className="px-4 py-3 bg-black/[0.01] dark:bg-white/[0.01] backdrop-blur-sm border-b border-black/6 dark:border-white/8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground opacity-60" />
            <div>
              <CardTitle className="text-sm font-medium text-foreground">
                {toolTitle}
              </CardTitle>
            </div>
          </div>

          {!isStreaming && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
              {actualIsSuccess ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 opacity-80" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 opacity-80" />
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {actualIsSuccess ? 'Extração concluída' : 'Extração falhou'}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
        {isStreaming ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="text-center w-full max-w-xs">
              <div className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/20">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
              <h3 className="text-lg font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                Extracting Content
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6">
                Analyzing and processing <span className="font-mono text-xs break-all">{domain}</span>
              </p>
              <Progress value={progress} className="w-full h-1" />
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">{progress}% concluído</p>
            </div>
          </div>
        ) : url ? (
          // Results State
          <ScrollArea className="h-full w-full">
            <div className="p-4 pt-4 pb-0">
              {/* Target URL Section */}
              <div className="space-y-3 mb-6">
                <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5 opacity-60" />
                  Source URL
                </h3>
                <div className="group relative">
                  <div className="flex items-center gap-3 p-3 bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors rounded-lg border border-black/6 dark:border-white/8">
                    {favicon && (
                      <img
                        src={favicon}
                        alt=""
                        className="w-6 h-6 rounded-md flex-shrink-0"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-xs text-foreground truncate">{truncateString(url, 70)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 opacity-60">{domain}</p>
                    </div>
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                    >
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Results Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                    <Zap className="h-3.5 w-3.5 opacity-60" />
                    Generated Files
                  </h3>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                    <span className="text-xs font-medium text-muted-foreground">{files.length} file{files.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>

                {/* File List */}
                {files.length > 0 ? (
                  <div className="space-y-3">
                    {files.map((filePath, idx) => {
                      const fileInfo = formatFileInfo(filePath);
                      const isCopied = copiedFile === filePath;

                      return (
                        <div
                          key={idx}
                          className="group relative bg-black/[0.02] dark:bg-white/[0.02] border border-black/6 dark:border-white/8 rounded-lg p-3 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 rounded-md bg-emerald-500/10 dark:bg-emerald-400/10 flex-shrink-0">
                              <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                            </div>

                            <div className="flex-1 min-w-0 space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                                  <span className="text-xs font-medium text-muted-foreground">JSON</span>
                                </div>
                                {fileInfo.timestamp && (
                                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                                    <Calendar className="h-3 w-3 opacity-60" />
                                    <span className="text-xs text-muted-foreground">{fileInfo.timestamp.replace('_', ' ')}</span>
                                  </div>
                                )}
                              </div>

                              <div className="space-y-1">
                                <p className="font-mono text-xs text-foreground font-medium">
                                  {fileInfo.fileName}
                                </p>
                                <p className="font-mono text-xs text-muted-foreground opacity-60 truncate">
                                  {fileInfo.fullPath}
                                </p>
                              </div>
                            </div>

                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    className={cn(
                                      "p-1.5 rounded-md hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all duration-200",
                                      "opacity-0 group-hover:opacity-100",
                                      isCopied && "opacity-100"
                                    )}
                                    onClick={() => copyFilePath(filePath)}
                                  >
                                    {isCopied ? (
                                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                                    ) : (
                                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                    )}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{isCopied ? 'Copied!' : 'Copy file path'}</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No files generated</p>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-zinc-100 to-zinc-50 shadow-inner dark:from-zinc-800/40 dark:to-zinc-900/60">
              <Globe className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
              No URL Detected
            </h3>
            <p className="text-zinc-500 dark:text-zinc-400 text-center max-w-sm">
              Unable to extract a valid URL from the scraping request
            </p>
          </div>
        )}
      </CardContent>

      {/* Footer */}
      <div className="h-10 px-4 bg-gradient-to-r from-zinc-50/90 to-zinc-100/90 dark:from-zinc-900/90 dark:to-zinc-800/90 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
        <div className="h-full flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          {!isStreaming && files.length > 0 && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-medium text-muted-foreground">{files.length} file{files.length !== 1 ? 's' : ''} saved</span>
            </div>
          )}
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          {actualToolTimestamp && !isStreaming
            ? formatTimestamp(actualToolTimestamp)
            : actualAssistantTimestamp
              ? formatTimestamp(actualAssistantTimestamp)
              : ''}
        </div>
      </div>
    </Card>
  );
}