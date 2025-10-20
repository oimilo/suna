import React, { useState } from 'react';
import Image from 'next/image';
import {
  Search,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Shield,
  ShieldCheck,
  ExternalLink,
  Cpu,
  Server,
  ChevronRight,
  Sparkles,
  Verified,
  Tag
} from 'lucide-react';
import { ToolViewProps } from '../types';
import { formatTimestamp, getToolTitle } from '../utils';
import { cn, truncateString } from '@/lib/utils';
import { extractSearchMcpServersData, McpServerResult } from './_utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingState } from '../shared/LoadingState';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function SearchMcpServersToolView({
  name = 'search-mcp-servers',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  const [expandedResults, setExpandedResults] = useState<Record<number, boolean>>({});
  const [failedLogos, setFailedLogos] = useState<Record<string, boolean>>({});

  const {
    query,
    results,
    limit,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp
  } = extractSearchMcpServersData(
    assistantContent,
    toolContent,
    isSuccess,
    toolTimestamp,
    assistantTimestamp
  );

  const toolTitle = getToolTitle(name);

  const getAuthTypeColor = (authType: string) => {
    switch (authType?.toLowerCase()) {
      case 'oauth':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800';
      case 'api_key':
        return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800';
      case 'none':
        return 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800';
      default:
        return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800';
    }
  };

  const getAuthTypeIcon = (authType: string) => {
    switch (authType?.toLowerCase()) {
      case 'oauth':
        return ShieldCheck;
      case 'api_key':
        return Shield;
      default:
        return Shield;
    }
  };

  const toggleExpanded = (index: number) => {
    setExpandedResults(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col overflow-hidden bg-card">
      <CardHeader className="px-4 py-3 bg-black/[0.01] dark:bg-white/[0.01] backdrop-blur-sm border-b border-black/6 dark:border-white/8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground opacity-60" />
            <div>
              <CardTitle className="text-sm font-medium text-foreground">
                {toolTitle}
              </CardTitle>
            </div>
          </div>

          {!isStreaming && (
            <Badge
              variant="secondary"
              className={cn(
                "text-xs font-medium",
                actualIsSuccess
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
              )}
            >
              {actualIsSuccess ? (
                <CheckCircle className="h-3 w-3 " />
              ) : (
                <AlertTriangle className="h-3 w-3 " />
              )}
              {results.length} {results.length === 1 ? 'result' : 'results'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
        {isStreaming ? (
          <LoadingState
            icon={Search}
            iconColor="text-purple-500 dark:text-purple-400"
            bgColor="bg-gradient-to-b from-purple-100 to-purple-50 shadow-inner dark:from-purple-800/40 dark:to-purple-900/60 dark:shadow-purple-950/20"
            title="Searching MCP servers"
            filePath={query ? `"${query}"` : undefined}
            showProgress={true}
          />
        ) : results.length > 0 ? (
          <ScrollArea className="h-full w-full">
            <div className="p-4 space-y-3">
              {results.map((result: McpServerResult, index: number) => {
                const AuthIcon = getAuthTypeIcon(result.auth_type);
                const isExpanded = expandedResults[index];
                
                return (
                  <div
                    key={index}
                    className="group relative p-4 border rounded-xl"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-muted/50 border flex items-center justify-center">
                          {(() => {
                            const logoKey = result.app_slug || result.name || String(index);
                            if (result.logo_url && !failedLogos[logoKey]) {
                              return (
                                <Image
                                  src={result.logo_url}
                                  alt={`${result.name} logo`}
                                  width={32}
                                  height={32}
                                  className="w-8 h-8 object-cover"
                                  onError={() => {
                                    setFailedLogos((prev) => ({ ...prev, [logoKey]: true }));
                                  }}
                                />
                              );
                            }
                            return <Server className="w-6 h-6 text-zinc-400" />;
                          })()}
                        </div>
                        {result.is_verified && (
                          <div className="absolute -top-1 -right-1">
                            <div className="bg-blue-500 rounded-full p-1">
                              <Verified className="w-3 h-3 text-white" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                                {result.name}
                              </h3>
                              {result.is_verified && (
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <div className="flex items-center">
                                        <Sparkles className="w-4 h-4 text-blue-500" />
                                      </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Verified integration</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              )}
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 font-mono">
                              {result.app_slug}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant="outline"
                              className={cn("text-xs font-medium", getAuthTypeColor(result.auth_type))}
                            >
                              <AuthIcon className="w-3 h-3 " />
                              {result.auth_type?.replace('_', ' ') || 'Unknown'}
                            </Badge>
                          </div>
                        </div>
                        <p className={cn(
                          "text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-3",
                        )}>
                          {result.description}
                        </p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {result.url && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2 text-xs hover:bg-purple-50 dark:hover:bg-purple-900/20"
                                onClick={() => window.open(result.url!, '_blank')}
                              >
                                <ExternalLink className="w-3 h-3 " />
                                View
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-8 px-6">
            <div className="text-center w-full max-w-xs">
              <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <Search className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                No MCP servers found
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {query ? `No results found for "${query}"` : 'Try searching with different keywords'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 