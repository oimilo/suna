import React from 'react';
import {
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Computer
} from 'lucide-react';
import { ToolViewProps } from '../types';
import {
  formatTimestamp,
} from '../utils';
import { extractExposePortData } from './_utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingState } from '../shared/LoadingState';

export function ExposePortToolView({
  assistantContent,
  toolContent,
  isSuccess = true,
  isStreaming = false,
  assistantTimestamp,
  toolTimestamp,
}: ToolViewProps) {

  const {
    port,
    url,
    proxyUrl,
    directUrl,
    legacyProxyUrl,
    message,
    actualIsSuccess,
    actualToolTimestamp
  } = extractExposePortData(
    assistantContent,
    toolContent,
    isSuccess,
    toolTimestamp,
    assistantTimestamp
  );

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col overflow-hidden bg-card">
      <CardHeader className="px-4 py-3 bg-black/[0.01] dark:bg-white/[0.01] backdrop-blur-sm border-b border-black/6 dark:border-white/8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Computer className="h-4 w-4 text-muted-foreground opacity-60" />
            <CardTitle className="text-sm font-medium text-foreground">
              Exposição de Porta
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
                {actualIsSuccess ? 'Porta exposta com sucesso' : 'Falha ao expor porta'}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
        {isStreaming ? (
          <LoadingState
            icon={Computer}
            iconColor="text-emerald-500 dark:text-emerald-400"
            bgColor="bg-gradient-to-b from-emerald-100 to-emerald-50 shadow-inner dark:from-emerald-800/40 dark:to-emerald-900/60 dark:shadow-emerald-950/20"
            title="Expondo porta"
            filePath={port?.toString()}
            showProgress={true}
          />
        ) : (
          <ScrollArea className="h-full w-full">
            <div className="p-4 pt-4 pb-0 space-y-6">
              {(url || proxyUrl || directUrl || legacyProxyUrl) && (
                <div className="space-y-4">
                  {/* URL Exposta Section */}
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-2">URLs Disponíveis</h3>
                    <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/6 dark:border-white/8 rounded-lg p-3">
                      {proxyUrl && (
                        <div className="mb-2 last:mb-0">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            Proxy do Projeto
                          </div>
                          <a
                            href={proxyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 break-all"
                          >
                            {proxyUrl}
                            <ExternalLink className="flex-shrink-0 h-3.5 w-3.5 opacity-60" />
                          </a>
                        </div>
                      )}
                      {legacyProxyUrl && legacyProxyUrl !== proxyUrl && (
                        <div className="mt-2">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            API Legacy (Compatibilidade)
                          </div>
                          <a
                            href={legacyProxyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 break-all"
                          >
                            {legacyProxyUrl}
                            <ExternalLink className="flex-shrink-0 h-3.5 w-3.5 opacity-60" />
                          </a>
                        </div>
                      )}
                      {directUrl && (!proxyUrl || directUrl !== proxyUrl) && (
                        <div className="mt-2">
                          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
                            URL Direta (Daytona)
                          </div>
                          <a
                            href={directUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 break-all"
                          >
                            {directUrl}
                            <ExternalLink className="flex-shrink-0 h-3.5 w-3.5 opacity-60" />
                          </a>
                        </div>
                      )}
                      {!proxyUrl && !directUrl && url && (
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 break-all"
                        >
                          {url}
                          <ExternalLink className="flex-shrink-0 h-3.5 w-3.5 opacity-60" />
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Detalhes da Porta */}
                  <div>
                    <h3 className="text-xs font-medium text-muted-foreground mb-2">Detalhes da Porta</h3>
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                        <Computer className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                        <span className="text-xs font-medium text-muted-foreground">Porta: {port}</span>
                      </div>
                    </div>
                  </div>

                  {message && (
                    <div className="text-sm text-muted-foreground bg-black/[0.02] dark:bg-white/[0.02] border border-black/6 dark:border-white/8 rounded-lg p-3">
                      {message}
                    </div>
                  )}

                  {/* Warning */}
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 dark:bg-amber-400/5 border border-amber-500/10 dark:border-amber-400/10">
                    <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 opacity-80 mt-0.5 flex-shrink-0" />
                    <span className="text-xs text-amber-700 dark:text-amber-400">Esta URL pode estar disponível apenas temporariamente e pode expirar após algum tempo.</span>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!port && !url && !proxyUrl && !legacyProxyUrl && !directUrl && !isStreaming && (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-zinc-100 to-zinc-50 shadow-inner dark:from-zinc-800/40 dark:to-zinc-900/60">
                    <Computer className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
                    Sem Informações de Porta
                  </h3>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
                    Nenhuma informação de exposição de porta disponível ainda. Use o comando expose-port para compartilhar uma porta local.
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>

    </Card>
  );
}
