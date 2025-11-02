import React from 'react';
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
import { constructHtmlPreviewUrl, constructProjectPreviewProxyUrl } from '@/lib/utils/url';
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

const DEBUG_PREVIEW = process.env.NEXT_PUBLIC_WORKSPACE_DEBUG !== 'false';
const logPreviewDebug = (...args: unknown[]) => {
  if (DEBUG_PREVIEW) {
    console.debug('[workspace:preview]', ...args);
  }
};

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
  isPanelMinimized = false,
  outcome,
  failureReason,
}: ToolViewProps) {
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';
  const [iframeError, setIframeError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);
  const [isInitialLoad, setIsInitialLoad] = React.useState(true);
  const [isRetrying, setIsRetrying] = React.useState(false);
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

  const derivedOutcome: 'pending' | 'success' | 'failure' | 'conflict' = outcome
    ?? (isStreaming ? 'pending' : (isSuccess ? 'success' : 'failure'));

  const isConflictOutcome = derivedOutcome === 'conflict' || failureReason === 'already_exists';
  const isAlreadyExistsConflict = isConflictOutcome && failureReason === 'already_exists';
  const isPendingOutcome = derivedOutcome === 'pending';
  const effectiveSuccess = derivedOutcome === 'success' || isAlreadyExistsConflict;
  const allowPreview = derivedOutcome === 'success' || isAlreadyExistsConflict;

  const statusLabel = React.useMemo(() => {
    if (isPendingOutcome) return 'Processando';
    if (isConflictOutcome) return 'Conflito';
    if (derivedOutcome === 'failure') return 'Falhou';
    return 'Sucesso';
  }, [derivedOutcome, isConflictOutcome, isPendingOutcome]);

  const maxRetryAttempts = isAlreadyExistsConflict ? 2 : 5;

  React.useEffect(() => {
    if (isPendingOutcome) {
      logPreviewDebug('awaiting-server', { fileName, outcome: derivedOutcome });
    }
  }, [isPendingOutcome, fileName, derivedOutcome]);

  React.useEffect(() => {
    if (iframeError) {
      logPreviewDebug('iframe-error', { fileName, retryCount });
    }
  }, [iframeError, fileName, retryCount]);

  React.useEffect(() => {
    if (isAlreadyExistsConflict) {
      logPreviewDebug('conflict-existing-file', { fileName });
    }
  }, [isAlreadyExistsConflict, fileName]);

  const isMarkdown = isFileType.markdown(fileExtension);
  const isHtml = isFileType.html(fileExtension);
  const isCsv = isFileType.csv(fileExtension);

  const language = getLanguageFromFileName(fileName);
  const hasHighlighting = hasLanguageHighlighting(language);
  const contentLines = splitContentIntoLines(fileContent);

  // Heurística adicional: tratar como HTML se o conteúdo aparenta ser HTML (ou HTML escapado)
  const looksLikeHtml = typeof fileContent === 'string' && /<(?:!DOCTYPE|html)[\s>]/i.test(fileContent);
  const looksLikeEncodedHtml = typeof fileContent === 'string' && /&lt;\s*(?:!DOCTYPE|html)[\s>]/i.test(fileContent);
  const isHtmlFile = isHtml || looksLikeHtml || looksLikeEncodedHtml;

  const combinedContent = React.useMemo(() => {
    const assistantStr = normalizeContentToString(assistantContent) || '';
    const toolStr = normalizeContentToString(toolContent) || '';
    return `${assistantStr}\n${toolStr}`;
  }, [assistantContent, toolContent]);

  const projectId = (project as any)?.project_id || (project as any)?.id;
  const projectSandboxUrl = (project as any)?.sandbox?.sandbox_url;
  const derivePreviewPort = React.useCallback(() => {
    const a = normalizeContentToString(assistantContent) || '';
    const t = normalizeContentToString(toolContent) || '';
    const s = `${a}\n${t}`;
    // Ex.: "HTTP server available at: https://8080-xxxx.proxy.daytona.works"
    const m1 = s.match(/https?:\/\/(\d{2,5})-/i);
    if (m1 && m1[1]) return parseInt(m1[1], 10);
    // Ex.: python3 -m http.server 8080
    const m2 = s.match(/http\.server\s+(\d{2,5})/i);
    if (m2 && m2[1]) return parseInt(m2[1], 10);
    // Ex.: Port 3000/5173 citado em logs
    const m3 = s.match(/port\s*(\d{2,5})/i);
    if (m3 && m3[1]) return parseInt(m3[1], 10);
    return 8080;
  }, [assistantContent, toolContent]);
  const previewPort = derivePreviewPort();

  const autoDetectedPreviewUrl = React.useMemo(() => {
    const matches = combinedContent.match(/https?:\/\/[^\s)\'"`]+/gi);
    if (!matches) {
      return undefined;
    }

    const sanitize = (candidate: string) => candidate.replace(/[)>\'"`]+$/, '');
    const uniqueSanitized = Array.from(new Set(matches.map(sanitize)));

    const parsedUrls = uniqueSanitized
      .map((candidate) => {
        try {
          return { raw: candidate, parsed: new URL(candidate) };
        } catch {
          return null;
        }
      })
      .filter((entry): entry is { raw: string; parsed: URL } => Boolean(entry));

    const pickUrl = (
      predicate: (parsed: URL) => boolean,
    ): string | undefined => {
      const match = parsedUrls.find(({ parsed }) => {
        try {
          return predicate(parsed);
        } catch {
          return false;
        }
      });
      return match?.raw;
    };

    const isLikelyPreviewHost = (parsed: URL) => {
      const { hostname, pathname } = parsed;
      if (hostname === 'www.w3.org' && pathname === '/2000/svg') {
        return false;
      }
      if (hostname.endsWith('.proxy.daytona.works')) {
        return true;
      }
      if (hostname === 'prophet.build' || hostname === 'www.prophet.build') {
        return pathname.startsWith('/api/preview/');
      }
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        return true;
      }
      return false;
    };

    const preferredPreview = pickUrl(isLikelyPreviewHost);
    if (preferredPreview) {
      return preferredPreview;
    }

    const fallbackNonSvg = pickUrl((parsed) => parsed.hostname !== 'www.w3.org' && parsed.hostname !== 'w3.org');
    if (fallbackNonSvg) {
      return fallbackNonSvg;
    }

    return parsedUrls[0]?.raw;
  }, [combinedContent]);

  const normalizedAutoPreviewUrl = React.useMemo(() => {
    if (!autoDetectedPreviewUrl) return undefined;
    if (!projectId || !previewPort) return autoDetectedPreviewUrl;

    try {
      const parsedAuto = new URL(autoDetectedPreviewUrl);
      const sandboxHost = (() => {
        if (!projectSandboxUrl) return null;
        try {
          return new URL(projectSandboxUrl).host;
        } catch {
          return null;
        }
      })();

      const isLocalhost = ['localhost', '127.0.0.1', '::1'].includes(parsedAuto.hostname);

      if (sandboxHost && parsedAuto.host === sandboxHost) {
        const proxied = constructProjectPreviewProxyUrl(
          projectId,
          previewPort,
          parsedAuto.pathname,
        );
        if (proxied) {
          return `${proxied}${parsedAuto.search || ''}${parsedAuto.hash || ''}`;
        }
      } else if (isLocalhost) {
        const prefix = `/api/preview/${projectId}/p/${previewPort}`;
        const remainingPath = parsedAuto.pathname.startsWith(prefix)
          ? parsedAuto.pathname.slice(prefix.length)
          : undefined;
        const proxied = constructProjectPreviewProxyUrl(
          projectId,
          previewPort,
          remainingPath,
        );
        if (proxied) {
          return `${proxied}${parsedAuto.search || ''}${parsedAuto.hash || ''}`;
        }
      }
    } catch {
      // Ignore parsing errors and fall back to the original URL
    }

    return autoDetectedPreviewUrl;
  }, [autoDetectedPreviewUrl, projectId, previewPort, projectSandboxUrl]);

  const proxiedBaseHref = React.useMemo(() => {
    const proxied = constructProjectPreviewProxyUrl(projectId, previewPort);
    if (proxied) {
      return proxied;
    }
    if (projectSandboxUrl) {
      return `${projectSandboxUrl.replace(/\/$/, '')}/`;
    }
    return undefined;
  }, [projectId, previewPort, projectSandboxUrl]);

  const sandboxHtmlPreviewUrl = React.useMemo(() => {
    if (isHtml && projectSandboxUrl && processedFilePath) {
      return constructHtmlPreviewUrl(projectSandboxUrl, processedFilePath);
    }
    return undefined;
  }, [isHtml, processedFilePath, projectSandboxUrl]);

  const proxiedHtmlPreviewUrl = React.useMemo(() => {
    if (!isHtmlFile || !allowPreview) return undefined;
    return constructProjectPreviewProxyUrl(projectId, previewPort, processedFilePath);
  }, [isHtmlFile, allowPreview, projectId, previewPort, processedFilePath]);

  const rawHtmlPreviewUrl = React.useMemo(() => {
    if (!isHtmlFile || !allowPreview) return undefined;
    return normalizedAutoPreviewUrl || proxiedHtmlPreviewUrl || sandboxHtmlPreviewUrl || proxiedBaseHref;
  }, [normalizedAutoPreviewUrl, proxiedHtmlPreviewUrl, sandboxHtmlPreviewUrl, proxiedBaseHref, isHtmlFile, allowPreview]);

  const htmlPreviewUrl = React.useMemo(() => {
    if (!rawHtmlPreviewUrl) return undefined;
    const trimmed = rawHtmlPreviewUrl.trim();
    if (!trimmed) return undefined;

    const lower = trimmed.toLowerCase();
    const invalidSchemes = ['javascript:', 'data:', 'about:', 'blob:', 'chrome-extension:'];
    if (invalidSchemes.some(prefix => lower.startsWith(prefix))) {
      return undefined;
    }

    if (trimmed.startsWith('/workspace/') || trimmed.startsWith('workspace/')) {
      return undefined;
    }

    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed;
    }

    if (trimmed.startsWith('//')) {
      return trimmed;
    }

    if (trimmed.startsWith('/')) {
      return trimmed;
    }

    if (trimmed.startsWith('./') || trimmed.startsWith('../')) {
      return undefined;
    }

    return undefined;
  }, [rawHtmlPreviewUrl]);

  const hasRejectedPreviewUrl = React.useMemo(
    () => Boolean(rawHtmlPreviewUrl && !htmlPreviewUrl),
    [rawHtmlPreviewUrl, htmlPreviewUrl],
  );

  const FileIcon = getFileIcon(fileName);

  // Initial load delay to give sandbox time to start - only if not minimized
  React.useEffect(() => {
    if (!allowPreview) {
      setIframeError(false);
      setRetryCount(0);
      setIsInitialLoad(false);
      setIsRetrying(false);
      return;
    }

    if (isHtml && htmlPreviewUrl && isInitialLoad && !isPanelMinimized) {
      const timer = setTimeout(() => {
        setIsInitialLoad(false);
      }, 5000); // Wait 5 seconds before first load to ensure sandbox is ready
      
      return () => clearTimeout(timer);
    }
  }, [allowPreview, isHtml, htmlPreviewUrl, isInitialLoad, isPanelMinimized]);

  // Auto-retry logic for iframe loading errors with progressive delays - only if not minimized
  React.useEffect(() => {
    if (!allowPreview) {
      return;
    }
    if (!htmlPreviewUrl) {
      return;
    }

    if (iframeError && retryCount < maxRetryAttempts && !isPanelMinimized) {
      setIsRetrying(true);
      // Progressive delays: 3s, 5s, 7s, 9s, 11s
      const delay = 3000 + (retryCount * 2000);
      const timer = setTimeout(() => {
        setIframeError(false);
        setRetryCount(prev => prev + 1);
        if (iframeRef.current) {
          iframeRef.current.src = htmlPreviewUrl || '';
        }
      }, delay);
      
      return () => clearTimeout(timer);
    } else if (retryCount >= maxRetryAttempts) {
      // Stop retrying after max attempts
      setIsRetrying(false);
    }
  }, [allowPreview, iframeError, retryCount, htmlPreviewUrl, isPanelMinimized, maxRetryAttempts]);

  // Reset error state when htmlPreviewUrl changes or when panel is expanded
  React.useEffect(() => {
    if (!isPanelMinimized) {
      setIframeError(false);
      setRetryCount(0);
      setIsInitialLoad(true);
      setIsRetrying(false);
    }
  }, [htmlPreviewUrl, isPanelMinimized, allowPreview]);

  if (!isStreaming && !processedFilePath && !fileContent) {
    return (
      <GenericToolView
        name={name || `file-${operation}`}
        assistantContent={assistantContent}
        toolContent={toolContent}
        assistantTimestamp={assistantTimestamp}
        toolTimestamp={toolTimestamp}
        isSuccess={effectiveSuccess}
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

    if (!allowPreview) {
      const statusMessage = (() => {
        if (isPendingOutcome) {
          return 'Aguardando o servidor ficar disponível para exibir o preview...';
        }
        if (derivedOutcome === 'failure') {
          if (failureReason === 'already_exists') {
            return 'O arquivo já existe no workspace. Mantendo o preview anterior enquanto evitamos sobrescritas.';
          }
          return 'Não foi possível gerar a pré-visualização desta execução.';
        }
        return 'Pré-visualização indisponível para esta chamada de ferramenta.';
      })();

      return (
        <div className="flex items-center justify-center h-full p-12">
          <div className="text-center max-w-sm">
            <FileIcon className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">{statusMessage}</p>
          </div>
        </div>
      );
    }

    if (isHtmlFile) {
      // Prefer project proxy when available; otherwise, inline preview via srcDoc
      if (htmlPreviewUrl) {
      // Don't render iframe when panel is minimized
      if (isPanelMinimized) {
        return (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-zinc-500/10">
              <Eye className="h-10 w-10 text-zinc-600 dark:text-zinc-400" />
            </div>
            <h3 className="text-lg font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
              Preview Pausado
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
              Expanda o painel para visualizar o preview
            </p>
          </div>
        );
      }
      
      // Show loading during initial load or retry
      if (isInitialLoad || isRetrying) {
        return (
          <div className="flex flex-col items-center justify-center h-full pt-32">
            {/* Modern animated loading indicator */}
            <div className="relative mb-8">
              <div className="w-16 h-16">
                <div className="absolute inset-0 rounded-full border-2 border-zinc-200 dark:border-zinc-800"></div>
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-zinc-900 dark:border-t-zinc-100 animate-spin" style={{ animationDuration: '2s' }}></div>
                <div className="absolute inset-2 rounded-full border-2 border-transparent border-r-zinc-400 dark:border-r-zinc-600 animate-spin" style={{ animationDuration: '3s', animationDirection: 'reverse' }}></div>
                <div className="absolute inset-4 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-900 animate-pulse" style={{ animationDuration: '2s' }}></div>
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
              Projeto Iniciando...
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
              Por favor aguarde enquanto preparamos o ambiente.
            </p>
          </div>
        );
      }
      
      // Show error state after max retries
      if (iframeError && retryCount >= 5) {
        return (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-red-500/10">
              <ExternalLink className="h-10 w-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-xl font-semibold mb-3 text-zinc-900 dark:text-zinc-100">
              Preview indisponível
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-6 text-center max-w-md">
              O projeto está demorando mais que o esperado. Tente novamente.
            </p>
            <Button
              onClick={() => {
                setIframeError(false);
                setRetryCount(0);
                setIsRetrying(true);
                if (iframeRef.current) {
                  iframeRef.current.src = htmlPreviewUrl;
                }
              }}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </Button>
          </div>
        );
      }

        // Only render iframe when not loading or retrying
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
                  const bodyContent = doc?.body?.innerHTML || '';
                  // Check for both 502 and 404 errors, and other gateway errors
                  if (bodyContent.includes('File not found: 502') || 
                      bodyContent.includes('File not found: 404') ||
                      bodyContent.includes('"error":"File not found: 404"') ||
                      bodyContent.includes('502 Bad Gateway') ||
                      bodyContent.includes('status of 502')) {
                    setIframeError(true);
                  } else {
                    // Successfully loaded
                    setIsRetrying(false);
                  }
                } catch {
                  // CORS error is expected for external content, assume success
                  setIsRetrying(false);
                }
              }}
            />
          </div>
        );
      }

      // Inline fallback when we don't have a proxied preview URL yet
      const decodeEntities = (s: string) =>
        s
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&amp;/g, '&')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
      let srcDocContent = typeof fileContent === 'string'
        ? (looksLikeEncodedHtml ? decodeEntities(fileContent) : fileContent)
        : '';
      // Injeta <base href> para resolver CSS/JS relativos via proxy do projeto
      if (proxiedBaseHref) {
        if (/<head[\s>]/i.test(srcDocContent)) {
          srcDocContent = srcDocContent.replace(/<head(\s*[^>]*)?>/i, (m) => `${m}<base href="${proxiedBaseHref}">`);
        } else if (/<html[\s>]/i.test(srcDocContent)) {
          srcDocContent = srcDocContent.replace(/<html(\s*[^>]*)>/i, (m) => `${m}<head><base href="${proxiedBaseHref}"></head>`);
        } else {
          // Fallback: prefixa head mínimo
          srcDocContent = `<head><base href="${proxiedBaseHref}"></head>` + srcDocContent;
        }
      }
      return (
        <div className="flex flex-col h-[calc(100vh-16rem)]">
          {hasRejectedPreviewUrl && (
            <div className="px-4 py-3 bg-amber-50 dark:bg-amber-500/10 text-amber-900 dark:text-amber-200 border-b border-amber-200 dark:border-amber-500/40 text-xs flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>
                Link de preview fornecido pela ferramenta foi ignorado por não ser incorporável com segurança.
                O conteúdo abaixo mostra o HTML bruto enquanto o proxy é configurado.
              </span>
            </div>
          )}
          <iframe
            title={`Preview (inline) de ${fileName}`}
            className="flex-grow border-0 bg-white"
            // Render HTML diretamente; assets relativos podem não resolver antes do servidor
            srcDoc={srcDocContent}
            sandbox="allow-same-origin allow-scripts"
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
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col overflow-hidden bg-card">
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
                  {derivedOutcome === 'success' ? (
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 opacity-80" />
                  ) : derivedOutcome === 'pending' ? (
                    <Loader2 className="h-3.5 w-3.5 text-blue-500 opacity-80 animate-spin" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500 opacity-80" />
                  )}
                  <span className="text-xs font-medium text-muted-foreground">{statusLabel}</span>
                </div>
              )}
              {isHtmlFile && htmlPreviewUrl && !isStreaming && (
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="code"
                      className="flex items-center px-2 py-1.5 text-xs font-medium transition-all rounded-md [&[data-state=active]]:bg-black/[0.08] [&[data-state=active]]:dark:bg-white/[0.08] [&[data-state=active]]:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-muted-foreground [&[data-state=active]]:text-foreground data-[state=inactive]:opacity-50"
                    >
                      <Code className="h-3.5 w-3.5" />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Código</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <TabsTrigger
                      value="preview"
                      className="flex items-center px-2 py-1.5 text-xs font-medium transition-all rounded-md [&[data-state=active]]:bg-black/[0.08] [&[data-state=active]]:dark:bg-white/[0.08] [&[data-state=active]]:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/[0.04] text-muted-foreground [&[data-state=active]]:text-foreground data-[state=inactive]:opacity-50"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </TabsTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Visualizar</p>
                  </TooltipContent>
                </Tooltip>
              </TabsList>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
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
        </CardContent>
      </Tabs>
    </Card>
  );
}
