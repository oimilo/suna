import React from 'react';
import {
    Rocket,
    CheckCircle,
    AlertTriangle,
    ExternalLink,
    Folder,
    TerminalIcon,
} from 'lucide-react';
import { ToolViewProps } from './types';
import { getToolTitle, normalizeContentToString } from './utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingState } from './shared/LoadingState';

interface DeployResult {
    message?: string;
    output?: string;
    success?: boolean;
    url?: string;
}

function extractDeployData(assistantContent: any, toolContent: any): {
    name: string | null;
    directoryPath: string | null;
    deployResult: DeployResult | null;
    rawContent: string | null;
} {
    let name: string | null = null;
    let directoryPath: string | null = null;
    let deployResult: DeployResult | null = null;
    let rawContent: string | null = null;

    // Try to extract from assistant content first
    const assistantStr = normalizeContentToString(assistantContent);
    if (assistantStr) {
        try {
            const parsed = JSON.parse(assistantStr);
            if (parsed.parameters) {
                name = parsed.parameters.name || null;
                directoryPath = parsed.parameters.directory_path || null;
            }
        } catch (e) {
            // Try regex extraction
            const nameMatch = assistantStr.match(/name["']\s*:\s*["']([^"']+)["']/);
            const dirMatch = assistantStr.match(/directory_path["']\s*:\s*["']([^"']+)["']/);
            if (nameMatch) name = nameMatch[1];
            if (dirMatch) directoryPath = dirMatch[1];
        }
    }

    // Extract deploy result from tool content
    const toolStr = normalizeContentToString(toolContent);
    if (toolStr) {
        rawContent = toolStr;
        try {
            const parsed = JSON.parse(toolStr);

            // Handle the nested tool_execution structure
            let resultData = null;
            if (parsed.tool_execution && parsed.tool_execution.result) {
                resultData = parsed.tool_execution.result;
                // Also extract arguments if not found in assistant content
                if (!name && parsed.tool_execution.arguments) {
                    name = parsed.tool_execution.arguments.name || null;
                    directoryPath = parsed.tool_execution.arguments.directory_path || null;
                }
            } else if (parsed.output) {
                // Fallback to old format
                resultData = parsed;
            }

            if (resultData) {
                deployResult = {
                    message: resultData.output?.message || null,
                    output: resultData.output?.output || null,
                    success: resultData.success !== undefined ? resultData.success : true,
                };

                // Try to extract deployment URL from output
                if (deployResult.output) {
                    const urlMatch = deployResult.output.match(/https:\/\/[^\s]+\.pages\.dev[^\s]*/);
                    if (urlMatch) {
                        deployResult.url = urlMatch[0];
                    }
                }
            }
        } catch (e) {
            // If parsing fails, treat as raw content
            deployResult = {
                message: 'Publicação concluída',
                output: toolStr,
                success: true,
            };
        }
    }

    return { name, directoryPath, deployResult, rawContent };
}

export function DeployToolView({
    name = 'deploy',
    assistantContent,
    toolContent,
    assistantTimestamp,
    toolTimestamp,
    isSuccess = true,
    isStreaming = false,
}: ToolViewProps) {
    const { name: projectName, directoryPath, deployResult, rawContent } = extractDeployData(
        assistantContent,
        toolContent
    );

    const toolTitle = getToolTitle(name);
    const actualIsSuccess = deployResult?.success !== undefined ? deployResult.success : isSuccess;

    // Clean up terminal output for display
    const cleanOutput = React.useMemo(() => {
        if (!deployResult?.output) return [];

        let output = deployResult.output;
        // Remove ANSI escape codes
        output = output.replace(/\u001b\[[0-9;]*m/g, '');
        // Replace escaped newlines with actual newlines
        output = output.replace(/\\n/g, '\n');

        return output.split('\n').filter(line => line.trim().length > 0);
    }, [deployResult?.output]);

    return (
        <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col overflow-hidden bg-card">
            <CardHeader className="px-4 py-3 bg-black/[0.01] dark:bg-white/[0.01] backdrop-blur-sm border-b border-black/6 dark:border-white/8">
                <div className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Rocket className="h-4 w-4 text-muted-foreground opacity-60" />
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
                                {actualIsSuccess ? 'Publicação realizada' : 'Publicação falhou'}
                            </span>
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
                {isStreaming ? (
                    <LoadingState
                        icon={Rocket}
                        iconColor="text-orange-500 dark:text-orange-400"
                        bgColor="bg-gradient-to-b from-orange-100 to-orange-50 shadow-inner dark:from-orange-800/40 dark:to-orange-900/60 dark:shadow-orange-950/20"
                        title="Implantando site"
                        filePath={projectName || 'Processando publicação...'}
                        showProgress={true}
                    />
                ) : (
                    <ScrollArea className="h-full w-full">
                        <div className="p-4">

                            {/* Success State */}
                            {actualIsSuccess && deployResult ? (
                                <div className="space-y-4">
                                    {/* Deployment URL Card */}
                                    {deployResult.url && (
                                        <div className="space-y-3">
                                            <div>
                                                <h3 className="text-xs font-medium text-muted-foreground mb-2">Site Publicado</h3>
                                                <div className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/6 dark:border-white/8 rounded-lg p-3">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 dark:bg-emerald-400/10">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                                            <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Live</span>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={deployResult.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-2 break-all"
                                                    >
                                                        {deployResult.url}
                                                        <ExternalLink className="flex-shrink-0 h-3.5 w-3.5 opacity-60" />
                                                    </a>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Terminal Output */}
                                    {cleanOutput.length > 0 && (
                                        <div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                                <TerminalIcon className="h-3.5 w-3.5 opacity-60" />
                                                Log da Publicação
                                            </h3>
                                            <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-lg overflow-hidden border border-black/6 dark:border-white/8">
                                                <div className="p-3 max-h-96 overflow-auto scrollbar-hide">
                                                    <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all">
                                                        {cleanOutput.map((line, index) => (
                                                            <div key={index} className="py-0.5">
                                                                {line || ' '}
                                                            </div>
                                                        ))}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Failure State */
                                <div className="space-y-4">
                                    <div className="bg-red-500/5 dark:bg-red-400/5 border border-red-500/10 dark:border-red-400/10 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="h-3.5 w-3.5 text-red-600 dark:text-red-400 opacity-80 mt-0.5 flex-shrink-0" />
                                            <div className="space-y-1">
                                                <h3 className="text-sm font-medium text-red-700 dark:text-red-400">
                                                    Publicação Falhou
                                                </h3>
                                                <p className="text-xs text-red-700/80 dark:text-red-400/80">
                                                    A publicação encontrou um erro. Verifique os logs abaixo para mais detalhes.
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Raw Error Output */}
                                    {rawContent && (
                                        <div>
                                            <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                                                <TerminalIcon className="h-3.5 w-3.5 opacity-60" />
                                                Detalhes do Erro
                                            </h3>
                                            <div className="bg-black/[0.02] dark:bg-white/[0.02] rounded-lg overflow-hidden border border-black/6 dark:border-white/8">
                                                <div className="p-3 max-h-96 overflow-auto scrollbar-hide">
                                                    <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-all">
                                                        {rawContent}
                                                    </pre>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                )}
            </CardContent>

    </Card>
    );
} 