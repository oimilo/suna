import React from 'react';
import {
  Rocket,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  Globe,
  Folder,
  Clock,
  Copy,
  Check
} from 'lucide-react';
import { ToolViewProps } from '../types';
import { formatTimestamp, getToolTitle } from '../utils';
import { extractDeployData } from './_utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingState } from '../shared/LoadingState';

export function DeployToolView({
  toolCall,
  toolResult,
  isSuccess = true,
  isStreaming = false,
  assistantTimestamp,
  toolTimestamp,
}: ToolViewProps) {
  const [copied, setCopied] = React.useState(false);

  const {
    name,
    directoryPath,
    url,
    projectName,
    message,
    actualIsSuccess,
    actualToolTimestamp,
  } = extractDeployData(toolCall, toolResult, isSuccess, toolTimestamp, assistantTimestamp);

  const toolTitle = getToolTitle(toolCall.function_name.replace(/_/g, '-'));

  const handleCopyUrl = () => {
    if (url) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col h-full overflow-hidden bg-card">
      <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4 space-y-2">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative p-2 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20">
              <Rocket className="w-5 h-5 text-orange-500 dark:text-orange-400" />
            </div>
            <div>
              <CardTitle className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                {toolTitle}
              </CardTitle>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {url && !isStreaming && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs bg-white dark:bg-muted/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-none"
                asChild
              >
                <a href={url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Open Website
                </a>
              </Button>
            )}

            {!isStreaming && (
              <Badge
                variant="secondary"
                className={
                  actualIsSuccess
                    ? "bg-gradient-to-b from-emerald-200 to-emerald-100 text-emerald-700 dark:from-emerald-800/50 dark:to-emerald-900/60 dark:text-emerald-300"
                    : "bg-gradient-to-b from-rose-200 to-rose-100 text-rose-700 dark:from-rose-800/50 dark:to-rose-900/60 dark:text-rose-300"
                }
              >
                {actualIsSuccess ? (
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 mr-1" />
                )}
                {actualIsSuccess ? 'Deployed' : 'Failed'}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
        {isStreaming ? (
          <LoadingState
            icon={Rocket}
            iconColor="text-orange-500 dark:text-orange-400"
            bgColor="bg-gradient-to-b from-orange-100 to-orange-50 shadow-inner dark:from-orange-800/40 dark:to-orange-900/60 dark:shadow-orange-950/20"
            title="Deploying website"
            filePath={name || directoryPath || 'Processing...'}
            showProgress={true}
          />
        ) : actualIsSuccess && url ? (
          <div className="flex flex-col h-full">
            {/* Success Card */}
            <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <div className="bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Globe className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                      Website Deployed Successfully
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Your site is now live on Cloudflare Pages
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className="ml-auto text-xs h-5 px-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                  >
                    Live
                  </Badge>
                </div>

                {/* URL Display */}
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-lg p-3 mb-3">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono text-blue-600 dark:text-blue-400 break-all flex-1">
                      {url}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 flex-shrink-0"
                      onClick={handleCopyUrl}
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Info badges */}
                <div className="flex flex-wrap gap-2">
                  {projectName && (
                    <Badge variant="outline" className="text-xs bg-zinc-50 dark:bg-zinc-800">
                      <Folder className="h-3 w-3 mr-1" />
                      {projectName}
                    </Badge>
                  )}
                </div>

                {/* Permanent URL notice */}
                <div className="text-xs bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/50 rounded-md p-3 text-blue-700 dark:text-blue-300 flex items-start gap-2 mt-3">
                  <CheckCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <span>This is a permanent URL. Your website will remain accessible at this address.</span>
                </div>
              </div>
            </div>

            {/* Iframe Preview */}
            <div className="flex-1 bg-white dark:bg-zinc-950">
              <iframe
                src={url}
                title="Deployed Website Preview"
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-downloads"
              />
            </div>
          </div>
        ) : (
          /* Failure or No URL State */
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-rose-100 to-rose-50 shadow-inner dark:from-rose-800/40 dark:to-rose-900/60">
              <AlertTriangle className="h-10 w-10 text-rose-500 dark:text-rose-400" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
              {actualIsSuccess ? 'Deployment Complete' : 'Deployment Failed'}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
              {message || (actualIsSuccess 
                ? 'The deployment completed but no URL was returned.'
                : 'The deployment encountered an error. Please check the logs and try again.'
              )}
            </p>
            {(name || directoryPath) && (
              <div className="flex flex-wrap gap-2 mt-4">
                {name && (
                  <Badge variant="outline" className="text-xs">
                    Name: {name}
                  </Badge>
                )}
                {directoryPath && (
                  <Badge variant="outline" className="text-xs">
                    Directory: {directoryPath}
                  </Badge>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <div className="px-4 py-2 h-10 bg-gradient-to-r from-zinc-50/90 to-zinc-100/90 dark:from-zinc-900/90 dark:to-zinc-800/90 backdrop-blur-sm border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center gap-4">
        <div className="h-full flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
          {!isStreaming && url && (
            <Badge variant="outline" className="h-6 py-0.5 bg-zinc-50 dark:bg-zinc-900">
              <Globe className="h-3 w-3 mr-1" />
              Cloudflare Pages
            </Badge>
          )}
        </div>

        <div className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5" />
          {actualToolTimestamp && formatTimestamp(actualToolTimestamp)}
        </div>
      </div>
    </Card>
  );
}
