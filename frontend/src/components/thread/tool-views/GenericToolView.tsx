'use client'

import React from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Wrench,
} from 'lucide-react';
import { ToolViewProps } from './types';
import { formatTimestamp, getToolTitle, extractToolData } from './utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingState } from './shared/LoadingState';

export function GenericToolView({
  name = 'generic-tool',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {
  const toolTitle = getToolTitle(name);

  const formatContent = (content: any) => {
    if (!content) return null;

    // Use the new parser for backwards compatibility
    const { toolResult } = extractToolData(content);

    if (toolResult) {
      // Format the structured content nicely
      const formatted: any = {
        tool: toolResult.xmlTagName || toolResult.functionName,
      };

      if (toolResult.arguments && Object.keys(toolResult.arguments).length > 0) {
        formatted.parameters = toolResult.arguments;
      }

      if (toolResult.toolOutput) {
        formatted.output = toolResult.toolOutput;
      }

      if (toolResult.isSuccess !== undefined) {
        formatted.success = toolResult.isSuccess;
      }

      return JSON.stringify(formatted, null, 2);
    }

    // Fallback to legacy format handling
    if (typeof content === 'object') {
      // Check for direct structured format (legacy)
      if ('tool_name' in content || 'xml_tag_name' in content) {
        const formatted: any = {
          tool: content.tool_name || content.xml_tag_name || 'unknown',
        };

        if (content.parameters && Object.keys(content.parameters).length > 0) {
          formatted.parameters = content.parameters;
        }

        if (content.result) {
          formatted.result = content.result;
        }

        return JSON.stringify(formatted, null, 2);
      }

      // Check if it has a content field that might contain the structured data (legacy)
      if ('content' in content && typeof content.content === 'object') {
        const innerContent = content.content;
        if ('tool_name' in innerContent || 'xml_tag_name' in innerContent) {
          const formatted: any = {
            tool: innerContent.tool_name || innerContent.xml_tag_name || 'unknown',
          };

          if (innerContent.parameters && Object.keys(innerContent.parameters).length > 0) {
            formatted.parameters = innerContent.parameters;
          }

          if (innerContent.result) {
            formatted.result = innerContent.result;
          }

          return JSON.stringify(formatted, null, 2);
        }
      }

      // Fall back to old format handling
      if (content.content && typeof content.content === 'string') {
        return content.content;
      }
      return JSON.stringify(content, null, 2);
    }

    if (typeof content === 'string') {
      try {
        const parsedJson = JSON.parse(content);
        return JSON.stringify(parsedJson, null, 2);
      } catch (e) {
        return content;
      }
    }

    return String(content);
  };

  const formattedAssistantContent = React.useMemo(
    () => formatContent(assistantContent),
    [assistantContent],
  );
  const formattedToolContent = React.useMemo(
    () => formatContent(toolContent),
    [toolContent],
  );

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col overflow-hidden bg-card">
      <CardHeader className="px-4 py-3 bg-black/[0.01] dark:bg-white/[0.01] backdrop-blur-sm border-b border-black/6 dark:border-white/8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="h-4 w-4 text-muted-foreground opacity-60" />
            <div>
              <CardTitle className="text-sm font-medium text-foreground">
                {toolTitle}
              </CardTitle>
            </div>
          </div>

          {!isStreaming && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
              {isSuccess ? (
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 opacity-80" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-red-500 opacity-80" />
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {isSuccess ? 'Ferramenta executada' : 'Execução falhou'}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
        {isStreaming ? (
          <LoadingState
            icon={Wrench}
            iconColor="text-orange-500 dark:text-orange-400"
            bgColor="bg-gradient-to-b from-orange-100 to-orange-50 shadow-inner dark:from-orange-800/40 dark:to-orange-900/60 dark:shadow-orange-950/20"
            title="Executing tool"
            filePath={name}
            showProgress={true}
          />
        ) : formattedAssistantContent || formattedToolContent ? (
          <ScrollArea className="h-full w-full">
            <div className="p-4 space-y-4">
              {formattedAssistantContent && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center">
                    <Wrench className="h-4 w-4 mr-2 text-zinc-500 dark:text-zinc-400" />
                    Input
                  </div>
                  <div className="border-muted bg-muted/20 rounded-lg overflow-hidden border">
                    <div className="p-4">
                      <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words font-mono">
                        {formattedAssistantContent}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {formattedToolContent && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300 flex items-center">
                    <Wrench className="h-4 w-4 mr-2 text-zinc-500 dark:text-zinc-400" />
                    Output
                  </div>
                  <div className="border-muted bg-muted/20 rounded-lg overflow-hidden border">
                    <div className="p-4">
                      <pre className="text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words font-mono">
                        {formattedToolContent}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-zinc-100 to-zinc-50 shadow-inner dark:from-zinc-800/40 dark:to-zinc-900/60">
              <Wrench className="h-10 w-10 text-zinc-400 dark:text-zinc-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
              No Content Available
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
              This tool execution did not produce any input or output content to display.
            </p>
          </div>
        )}
      </CardContent>

    </Card>
  );
}
