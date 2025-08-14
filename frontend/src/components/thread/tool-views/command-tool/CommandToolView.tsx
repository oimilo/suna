import React, { useState } from 'react';
import {
  Terminal,
  CheckCircle,
  AlertTriangle,
  CircleDashed,
  Code,
  ArrowRight,
  TerminalIcon,
} from 'lucide-react';
import { ToolViewProps } from '../types';
import { formatTimestamp, getToolTitle } from '../utils';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingState } from '../shared/LoadingState';
import { extractCommandData } from './_utils';

export function CommandToolView({
  name = 'execute-command',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';
  const [showFullOutput, setShowFullOutput] = useState(true);

  const {
    command,
    output,
    exitCode,
    sessionName,
    cwd,
    completed,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp
  } = extractCommandData(
    assistantContent,
    toolContent,
    isSuccess,
    toolTimestamp,
    assistantTimestamp
  );

  const displayText = name === 'check-command-output' ? sessionName : command;
  const displayLabel = name === 'check-command-output' ? 'Sessão' : 'Comando';
  const displayPrefix = name === 'check-command-output' ? 'tmux:' : '$';

  const toolTitle = getToolTitle(name);

  const formattedOutput = React.useMemo(() => {
    if (!output) return [];
    let processedOutput = output;

    // Handle case where output is already an object
    if (typeof output === 'object' && output !== null) {
      try {
        processedOutput = JSON.stringify(output, null, 2);
      } catch (e) {
        processedOutput = String(output);
      }
    } else if (typeof output === 'string') {
      // Try to parse as JSON first
      try {
        if (output.trim().startsWith('{') || output.trim().startsWith('[')) {
          const parsed = JSON.parse(output);
          if (parsed && typeof parsed === 'object') {
            // If it's a complex object, stringify it nicely
            processedOutput = JSON.stringify(parsed, null, 2);
          } else {
            processedOutput = String(parsed);
          }
        } else {
          processedOutput = output;
        }
      } catch (e) {
        // If parsing fails, use as plain text
        processedOutput = output;
      }
    } else {
      processedOutput = String(output);
    }

    processedOutput = processedOutput.replace(/\\\\/g, '\\');
    processedOutput = processedOutput
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t')
      .replace(/\\"/g, '"')
      .replace(/\\'/g, "'");

    processedOutput = processedOutput.replace(/\\u([0-9a-fA-F]{4})/g, (_match, group) => {
      return String.fromCharCode(parseInt(group, 16));
    });
    return processedOutput.split('\n');
  }, [output]);

  const hasMoreLines = formattedOutput.length > 10;
  const previewLines = formattedOutput.slice(0, 10);
  const linesToShow = showFullOutput ? formattedOutput : previewLines;

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col h-full overflow-hidden bg-card">
      <CardHeader className="px-4 py-3 bg-black/[0.01] dark:bg-white/[0.01] backdrop-blur-sm border-b border-black/6 dark:border-white/8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-muted-foreground opacity-60" />
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
                {actualIsSuccess ?
                  (name === 'check-command-output' ? 'Saída recuperada' : 'Comando executado') :
                  (name === 'check-command-output' ? 'Falha ao recuperar' : 'Comando falhou')
                }
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
        {isStreaming ? (
          <LoadingState
            icon={Terminal}
            iconColor="text-purple-500 dark:text-purple-400"
            bgColor="bg-gradient-to-b from-purple-100 to-purple-50 shadow-inner dark:from-purple-800/40 dark:to-purple-900/60 dark:shadow-purple-950/20"
            title={name === 'check-command-output' ? 'Verificando saída do comando' : 'Executando comando'}
            filePath={displayText || 'Processando comando...'}
            showProgress={true}
          />
        ) : displayText ? (
          <ScrollArea className="h-full w-full">
            <div className="p-4">


              <div className="mb-4">
                <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-lg overflow-hidden border border-black/6 dark:border-white/8">
                  <div className="flex items-center justify-between border-b border-black/6 dark:border-white/8">
                    <div className="w-full px-4 py-2 flex items-center gap-2">
                      <TerminalIcon className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                      <span className="text-xs font-medium text-muted-foreground">Terminal</span>
                    </div>
                    {exitCode !== null && exitCode !== 0 && (
                      <div className="mr-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-500/5 dark:bg-red-400/5 border border-red-500/10 dark:border-red-400/10">
                        <AlertTriangle className="h-3 w-3 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-medium text-red-700 dark:text-red-400">Erro</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 max-h-96 overflow-auto scrollbar-hide">
                    <pre className="text-xs text-foreground/80 font-mono whitespace-pre-wrap break-all overflow-visible">
                      {/* Show command only */}
                      {command && (
                        <div className="py-0.5 bg-transparent">
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{displayPrefix} </span>
                          <span className="text-foreground">{command}</span>
                        </div>
                      )}

                      {!showFullOutput && hasMoreLines && (
                        <div className="text-muted-foreground mt-2 border-t border-black/6 dark:border-white/8 pt-2">
                          + {formattedOutput.length - 10} linhas adicionais
                        </div>
                      )}
                    </pre>
                  </div>
                </div>
              </div>

              {!output && !isStreaming && (
                <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-lg overflow-hidden border border-black/6 dark:border-white/8 p-6 flex items-center justify-center">
                  <div className="text-center">
                    <CircleDashed className="h-6 w-6 text-muted-foreground opacity-60 mx-auto mb-2" />
                    <p className="text-muted-foreground text-sm">Nenhuma saída recebida</p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-8 px-6">
            <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4 bg-black/[0.02] dark:bg-white/[0.02] border border-black/6 dark:border-white/8">
              <Terminal className="h-6 w-6 text-muted-foreground opacity-60" />
            </div>
            <h3 className="text-sm font-medium mb-1 text-foreground">
              {name === 'check-command-output' ? 'Nenhuma Sessão Encontrada' : 'Nenhum Comando Encontrado'}
            </h3>
            <p className="text-xs text-muted-foreground text-center max-w-md">
              {name === 'check-command-output'
                ? 'Nenhum nome de sessão foi detectado. Por favor forneça um nome de sessão válido para verificar.'
                : 'Nenhum comando foi detectado. Por favor forneça um comando válido para executar.'
              }
            </p>
          </div>
        )}
      </CardContent>

      <div className="h-10 px-4 bg-gradient-to-r from-zinc-50/90 to-zinc-100/90 dark:from-zinc-900/90 dark:to-zinc-800/90 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
        <div className="h-full flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          {!isStreaming && displayText && (
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
              <Terminal className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
              <span className="text-xs font-medium text-muted-foreground">{displayLabel}</span>
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