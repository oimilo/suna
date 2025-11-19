'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Presentation,
  Loader2,
  CheckCircle,
  AlertTriangle,
  FileText,
  Maximize2,
  Download,
  ExternalLink,
} from 'lucide-react';
import { ToolViewProps } from '../types';
import { formatTimestamp, extractToolData, getToolTitle } from '../utils';
import {
  downloadPresentation,
  handleGoogleSlidesUpload,
  DownloadFormat,
} from '../utils/presentation-utils';
import { constructHtmlPreviewUrl } from '@/lib/utils/url';
import { CodeBlockCode } from '@/components/ui/code-block';
import { LoadingState } from '../shared/LoadingState';
import { FullScreenPresentationViewer } from './FullScreenPresentationViewer';
import { PresentationSlideCard } from './PresentationSlideCard';
import { usePresentationViewerStore } from '@/stores/presentation-viewer-store';

interface SlideMetadata {
  title: string;
  filename: string;
  file_path: string;
  preview_url: string;
  created_at: string;
}

interface PresentationMetadata {
  presentation_name: string;
  title: string;
  description: string;
  slides: Record<string, SlideMetadata>;
  created_at: string;
  updated_at: string;
}

interface PresentationViewerProps extends ToolViewProps {
  showHeader?: boolean;
}

const sanitizeFilename = (name: string): string =>
  name.replace(/[^a-zA-Z0-9\-_]/g, '').toLowerCase();

export function PresentationViewer({
  toolContent,
  toolTimestamp,
  isStreaming = false,
  name,
  project,
  showHeader = true,
}: PresentationViewerProps) {
  const [metadata, setMetadata] = useState<PresentationMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [hasScrolledToCurrentSlide, setHasScrolledToCurrentSlide] = useState(false);
  const [backgroundRetryInterval, setBackgroundRetryInterval] = useState<NodeJS.Timeout | null>(null);
  const [visibleSlide, setVisibleSlide] = useState<number | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    isOpen,
    presentationName,
    sandboxUrl,
    sandboxId,
    initialSlide,
    openPresentation,
    closePresentation,
  } = usePresentationViewerStore();
  const viewerState = { isOpen, presentationName, sandboxUrl, sandboxId, initialSlide };

  const { toolResult } = extractToolData(toolContent);
  let extractedPresentationName: string | undefined;
  let currentSlideNumber: number | undefined;
  let presentationTitle: string | undefined;
  let toolExecutionError: string | undefined;

  if (toolResult && toolResult.toolOutput && toolResult.toolOutput !== 'STREAMING') {
    try {
      let output;

      if (typeof toolResult.toolOutput === 'string') {
        if (toolResult.toolOutput.startsWith('Error') || toolResult.toolOutput.includes('exec')) {
          toolExecutionError = toolResult.toolOutput;
        } else {
          output = JSON.parse(toolResult.toolOutput);
        }
      } else {
        output = toolResult.toolOutput;
      }

      if (output && typeof output === 'object') {
        extractedPresentationName = output.presentation_name;
        currentSlideNumber = output.slide_number;
        presentationTitle = output.presentation_title || output.title;
      }
    } catch (err) {
      console.error('Failed to process tool output:', err);
      toolExecutionError = `Unexpected error processing tool output: ${String(err)}`;
    }
  }

  const toolTitle = getToolTitle(name || 'presentation-viewer');
  const normalizedPresentationName = extractedPresentationName
    ? sanitizeFilename(extractedPresentationName)
    : undefined;

  const loadMetadata = async (retryCount = 0, maxRetries = 5) => {
    if (!normalizedPresentationName || (!project?.sandbox?.sandbox_url && !project?.sandbox?.id)) {
      return;
    }

    setIsLoadingMetadata(true);
    setError(null);
    setRetryAttempt(retryCount);

    try {
      const metadataUrl =
        constructHtmlPreviewUrl({
          sandboxId: project?.sandbox?.id,
          sandboxUrl: project?.sandbox?.sandbox_url,
          filePath: `presentations/${normalizedPresentationName}/metadata.json`,
        }) ||
        (project?.sandbox?.sandbox_url
          ? `${project.sandbox.sandbox_url.replace(/\/$/, '')}/presentations/${normalizedPresentationName}/metadata.json`
          : undefined);

      if (!metadataUrl) {
        throw new Error('Sandbox preview URL unavailable for presentation metadata.');
      }

      const response = await fetch(`${metadataUrl}?t=${Date.now()}`, {
        cache: 'no-cache',
      });

      if (response.ok) {
        const data = await response.json();
        setMetadata(data);
        setIsLoadingMetadata(false);

        if (backgroundRetryInterval) {
          clearInterval(backgroundRetryInterval);
          setBackgroundRetryInterval(null);
        }
        return;
      }

      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      console.error(`Error loading metadata (attempt ${retryCount + 1}):`, err);

      if (retryCount < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
          loadMetadata(retryCount + 1, maxRetries);
        }, delay);
        return;
      }

      setError('Failed to load presentation metadata after multiple attempts');
      setIsLoadingMetadata(false);

      if (!backgroundRetryInterval) {
        const interval = setInterval(() => {
          loadMetadata(0, 2);
        }, 10000);
        setBackgroundRetryInterval(interval);
      }
    }
  };

  useEffect(() => {
    if (backgroundRetryInterval) {
      clearInterval(backgroundRetryInterval);
      setBackgroundRetryInterval(null);
    }
    loadMetadata();
  }, [normalizedPresentationName, project?.sandbox?.sandbox_url, project?.sandbox?.id, toolContent]);

  useEffect(() => {
    return () => {
      if (backgroundRetryInterval) {
        clearInterval(backgroundRetryInterval);
      }
    };
  }, [backgroundRetryInterval]);

  useEffect(() => {
    setHasScrolledToCurrentSlide(false);
  }, [toolContent, currentSlideNumber]);

  const slides = useMemo(() => (
    metadata
      ? Object.entries(metadata.slides)
          .map(([num, slide]) => ({ number: parseInt(num, 10), ...slide }))
          .sort((a, b) => a.number - b.number)
      : []
  ), [metadata]);

  useEffect(() => {
    if (metadata && currentSlideNumber && !hasScrolledToCurrentSlide) {
      scrollToCurrentSlide(800);
      setHasScrolledToCurrentSlide(true);
    }
  }, [metadata, currentSlideNumber, hasScrolledToCurrentSlide]);

  useEffect(() => {
    if (!slides.length) return;

    setVisibleSlide(slides[0].number);

    const handleScroll = () => {
      const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
      if (!scrollArea || slides.length === 0) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollArea;
      const scrollViewportRect = scrollArea.getBoundingClientRect();
      const viewportCenter = scrollViewportRect.top + scrollViewportRect.height / 2;

      if (scrollTop <= 10) {
        setVisibleSlide(slides[0].number);
        return;
      }

      if (scrollTop + clientHeight >= scrollHeight - 10) {
        setVisibleSlide(slides[slides.length - 1].number);
        return;
      }

      let closestSlide = slides[0];
      let smallestDistance = Infinity;

      slides.forEach((slide) => {
        const slideElement = document.getElementById(`slide-${slide.number}`);
        if (!slideElement) return;

        const slideRect = slideElement.getBoundingClientRect();
        const slideCenter = slideRect.top + slideRect.height / 2;
        const distanceFromCenter = Math.abs(slideCenter - viewportCenter);
        const isPartiallyVisible =
          slideRect.bottom > scrollViewportRect.top &&
          slideRect.top < scrollViewportRect.bottom;

        if (isPartiallyVisible && distanceFromCenter < smallestDistance) {
          smallestDistance = distanceFromCenter;
          closestSlide = slide;
        }
      });

      setVisibleSlide(closestSlide.number);
    };

    let scrollTimeout: NodeJS.Timeout;
    const debouncedHandleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(handleScroll, 50);
    };

    const scrollArea = document.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollArea) {
      scrollArea.addEventListener('scroll', debouncedHandleScroll);
      handleScroll();
    }

    return () => {
      clearTimeout(scrollTimeout);
      if (scrollArea) {
        scrollArea.removeEventListener('scroll', debouncedHandleScroll);
      }
    };
  }, [slides]);

  const scrollToCurrentSlide = (delay: number = 200) => {
    if (!currentSlideNumber || !metadata) return;

    setTimeout(() => {
      const slideElement = document.getElementById(`slide-${currentSlideNumber}`);

      if (slideElement) {
        slideElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      } else {
        setTimeout(() => {
          const retryElement = document.getElementById(`slide-${currentSlideNumber}`);
          if (retryElement) {
            retryElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
              inline: 'nearest',
            });
          }
        }, 500);
      }
    }, delay);
  };

  const handleDownload = async (
    setDownloadState: (state: boolean) => void,
    format: DownloadFormat,
  ) => {
    if (!extractedPresentationName || !project?.sandbox) return;

    setDownloadState(true);
    try {
      if (format === DownloadFormat.GOOGLE_SLIDES) {
        const result = await handleGoogleSlidesUpload(
          project.sandbox,
          `/workspace/presentations/${extractedPresentationName}`,
        );
        if (result?.redirected_to_auth) {
          return;
        }
      } else {
        await downloadPresentation(
          format,
          project.sandbox,
          `/workspace/presentations/${extractedPresentationName}`,
          extractedPresentationName,
        );
      }
    } catch (err) {
      console.error(`Error downloading ${format}:`, err);
    } finally {
      setDownloadState(false);
    }
  };

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col h-full overflow-hidden bg-card">
      {showHeader && (
        <CardHeader className="h-14 bg-zinc-50/80 dark:bg-zinc-900/80 backdrop-blur-sm border-b p-2 px-4 space-y-2">
          <div className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="relative p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
                <Presentation className="w-5 h-5 text-blue-500 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-base font-medium text-zinc-900 dark:text-zinc-100">
                  {metadata?.title || metadata?.presentation_name || presentationTitle || toolTitle}
                </CardTitle>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {metadata && slides.length > 0 && !isStreaming && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (openPresentation && project?.sandbox?.sandbox_url && extractedPresentationName) {
                        openPresentation(
                          extractedPresentationName,
                          project.sandbox.sandbox_url,
                          project.sandbox.id,
                          visibleSlide || currentSlideNumber || slides[0]?.number || 1,
                        );
                      }
                    }}
                    className="h-8 w-8 p-0"
                    title="Open in full screen"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Export presentation"
                        disabled={isDownloading}
                      >
                        {isDownloading ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Download className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-32">
                      <DropdownMenuItem
                        onClick={() => handleDownload(setIsDownloading, DownloadFormat.PDF)}
                        className="cursor-pointer"
                        disabled={isDownloading}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        PDF
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(setIsDownloading, DownloadFormat.PPTX)}
                        className="cursor-pointer"
                        disabled={isDownloading}
                      >
                        <Presentation className="h-4 w-4 mr-2" />
                        PPTX
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDownload(setIsDownloading, DownloadFormat.GOOGLE_SLIDES)}
                        className="cursor-pointer"
                        disabled={isDownloading}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Google Slides
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}

              {!isStreaming && (
                <Badge
                  variant="secondary"
                  className="bg-gradient-to-b from-emerald-200 to-emerald-100 text-emerald-700 dark:from-emerald-800/50 dark:to-emerald-900/60 dark:text-emerald-300"
                >
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                  Success
                </Badge>
              )}

              {isStreaming && (
                <Badge className="bg-gradient-to-b from-blue-200 to-blue-100 text-blue-700 dark:from-blue-800/50 dark:to-blue-900/60 dark:text-blue-300">
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />
                  Loading
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
      )}

      <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
        {isStreaming || (isLoadingMetadata && !metadata) ? (
          <LoadingState
            icon={Presentation}
            iconColor="text-blue-500 dark:text-blue-400"
            bgColor="bg-gradient-to-b from-blue-100 to-blue-50 shadow-inner dark:from-blue-800/40 dark:to-blue-900/60 dark:shadow-blue-950/20"
            title="Loading presentation"
            filePath={
              retryAttempt > 0 ? `Retrying... (attempt ${retryAttempt + 1})` : 'Loading slides...'
            }
            showProgress
          />
        ) : error || toolExecutionError || !metadata ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-rose-100 to-rose-50 shadow-inner dark:from-rose-800/40 dark:to-rose-900/60">
              <AlertTriangle className="h-10 w-10 text-rose-400 dark:text-rose-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">
              {toolExecutionError ? 'Tool Execution Error' : error || 'Failed to load presentation'}
            </h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md mb-4">
              {toolExecutionError
                ? 'The presentation tool encountered an error during execution:'
                : error || 'There was an error loading the presentation. Please try again.'}
            </p>
            {retryAttempt > 0 && !toolExecutionError && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mb-4">
                Attempted {retryAttempt + 1} times
              </p>
            )}
            {backgroundRetryInterval && !toolExecutionError && (
              <p className="text-xs text-blue-500 dark:text-blue-400 mb-4 flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Retrying in background...
              </p>
            )}
            {!toolExecutionError && error && (
              <Button
                onClick={() => loadMetadata()}
                variant="outline"
                size="sm"
                disabled={isLoadingMetadata}
                className="mb-4"
              >
                {isLoadingMetadata ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  'Try Again'
                )}
              </Button>
            )}
            {toolExecutionError && (
              <div className="w-full max-w-2xl">
                <CodeBlockCode
                  code={toolExecutionError}
                  language="text"
                  className="text-xs bg-zinc-100 dark:bg-zinc-800 p-3 rounded-md border"
                />
              </div>
            )}
          </div>
        ) : slides.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 px-6 bg-gradient-to-b from-white to-zinc-50 dark:from-zinc-950 dark:to-zinc-900">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6 bg-gradient-to-b from-blue-100 to-blue-50 shadow-inner dark:from-blue-800/40 dark:to-blue-900/60">
              <Presentation className="h-10 w-10 text-blue-400 dark:text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2 text-zinc-900 dark:text-zinc-100">No slides found</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center max-w-md">
              This presentation doesn't have any slides yet.
            </p>
          </div>
        ) : (
          <ScrollArea className="h-full">
            <div className="space-y-4 p-4">
              {slides.map((slide) => (
                <PresentationSlideCard
                  key={slide.number}
                  slide={slide}
                  project={project}
                  onFullScreenClick={(slideNumber) => {
                    if (openPresentation && project?.sandbox?.sandbox_url && extractedPresentationName) {
                      openPresentation(
                        extractedPresentationName,
                        project.sandbox.sandbox_url,
                        project.sandbox.id,
                        slideNumber,
                      );
                    }
                  }}
                  className={currentSlideNumber === slide.number ? 'ring-2 ring-blue-500/20 shadow-md' : ''}
                  refreshTimestamp={metadata?.updated_at ? new Date(metadata.updated_at).getTime() : undefined}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>

      <div className="px-4 py-2 h-9 bg-muted/20 border-t border-border/40 flex justify-between items-center">
        <div className="text-xs text-muted-foreground">
          {slides.length > 0 && visibleSlide && (
            <span className="font-mono">
              {visibleSlide}/{slides.length}
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">{formatTimestamp(toolTimestamp)}</div>
      </div>

      <FullScreenPresentationViewer
        isOpen={viewerState.isOpen}
        onClose={closePresentation}
        presentationName={viewerState.presentationName}
        safePresentationName={
          viewerState.presentationName ? sanitizeFilename(viewerState.presentationName) : undefined
        }
        sandboxUrl={viewerState.sandboxUrl}
        sandboxId={viewerState.sandboxId}
        initialSlide={viewerState.initialSlide}
      />
    </Card>
  );
}
