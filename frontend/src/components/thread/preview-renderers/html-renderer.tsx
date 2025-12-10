'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, Monitor, ExternalLink, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { constructHtmlPreviewUrl } from '@/lib/utils/url';
import type { Project } from '@/lib/api/threads';

const MAX_RETRIES = 15;
const INITIAL_RETRY_DELAY = 1000; // 1 second
const MAX_RETRY_DELAY = 10000; // 10 seconds

interface HtmlRendererProps {
    content: string;
    previewUrl: string;
    className?: string;
    project?: Project;
}

/**
 * HTML renderer that supports both preview (iframe) and code view modes
 * Includes automatic retry logic for when sandbox is waking up
 */
export function HtmlRenderer({
    content,
    previewUrl,
    className,
    project
}: HtmlRendererProps) {
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
    const [isReady, setIsReady] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [retryCount, setRetryCount] = useState(0);
    const [hasGivenUp, setHasGivenUp] = useState(false);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isMountedRef = useRef(true);

    // Create a blob URL for HTML content if needed
    const blobHtmlUrl = useMemo(() => {
        if (content && !project?.sandbox?.sandbox_url) {
            const blob = new Blob([content], { type: 'text/html' });
            return URL.createObjectURL(blob);
        }
        return undefined;
    }, [content, project?.sandbox?.sandbox_url]);

    // Get full file path from the previewUrl
    const filePath = useMemo(() => {
        try {
            // If it's an API URL, extract the full path from the path parameter
            if (previewUrl.includes('/api/sandboxes/')) {
                const url = new URL(previewUrl);
                const path = url.searchParams.get('path');
                if (path) {
                    // Remove /workspace/ prefix if present
                    return path.replace(/^\/workspace\//, '');
                }
            }

            // Otherwise use the URL as is
            return previewUrl;
        } catch (e) {
            console.error('Error extracting file path:', e);
            return '';
        }
    }, [previewUrl]);

    // Construct HTML file preview URL using the full file path
    const htmlPreviewUrl = useMemo(() => {
        if (project?.sandbox?.sandbox_url && filePath) {
            return constructHtmlPreviewUrl(project.sandbox.sandbox_url, filePath);
        }
        return blobHtmlUrl || previewUrl;
    }, [project?.sandbox?.sandbox_url, filePath, blobHtmlUrl, previewUrl]);

    // Check if the preview URL is accessible
    const checkPreviewReady = useCallback(async () => {
        if (!htmlPreviewUrl || !isMountedRef.current) return;
        
        // Blob URLs are always ready
        if (htmlPreviewUrl.startsWith('blob:')) {
            setIsReady(true);
            setIsLoading(false);
            return;
        }

        try {
            // Use fetch with no-cors to check if the URL is accessible
            // We can't read the response, but a network error means it's not ready
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(htmlPreviewUrl, {
                method: 'HEAD',
                signal: controller.signal,
            });
            
            clearTimeout(timeoutId);

            if (!isMountedRef.current) return;

            if (response.ok) {
                setIsReady(true);
                setIsLoading(false);
                setRetryCount(0);
            } else if (response.status === 502 || response.status === 503 || response.status === 504) {
                // Sandbox not ready yet, retry
                scheduleRetry();
            } else {
                // Other error, give up
                setIsLoading(false);
                setHasGivenUp(true);
            }
        } catch (error) {
            if (!isMountedRef.current) return;
            
            // Network error or timeout, retry
            scheduleRetry();
        }
    }, [htmlPreviewUrl]);

    // Schedule a retry with exponential backoff
    const scheduleRetry = useCallback(() => {
        if (!isMountedRef.current) return;
        
        if (retryCount >= MAX_RETRIES) {
            setIsLoading(false);
            setHasGivenUp(true);
            return;
        }

        const delay = Math.min(
            INITIAL_RETRY_DELAY * Math.pow(1.5, retryCount),
            MAX_RETRY_DELAY
        );

        setRetryCount(prev => prev + 1);

        retryTimeoutRef.current = setTimeout(() => {
            if (isMountedRef.current) {
                checkPreviewReady();
            }
        }, delay);
    }, [retryCount, checkPreviewReady]);

    // Manual retry handler
    const handleManualRetry = useCallback(() => {
        setIsLoading(true);
        setHasGivenUp(false);
        setRetryCount(0);
        checkPreviewReady();
    }, [checkPreviewReady]);

    // Start checking when URL changes
    useEffect(() => {
        isMountedRef.current = true;
        setIsReady(false);
        setIsLoading(true);
        setHasGivenUp(false);
        setRetryCount(0);

        // Small delay before first check to let sandbox wake up
        const initialDelay = setTimeout(() => {
            if (isMountedRef.current) {
                checkPreviewReady();
            }
        }, 500);

        return () => {
            isMountedRef.current = false;
            clearTimeout(initialDelay);
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, [htmlPreviewUrl, checkPreviewReady]);

    // Clean up blob URL on unmount
    useEffect(() => {
        return () => {
            if (blobHtmlUrl) {
                URL.revokeObjectURL(blobHtmlUrl);
            }
        };
    }, [blobHtmlUrl]);

    return (
        <div className={cn('w-full h-full flex flex-col', className)}>
            {/* Content area */}
            <div className="flex-1 min-h-0 relative">
                {viewMode === 'preview' ? (
                    <div className="w-full h-full relative">
                        {/* Loading/Retry state */}
                        {isLoading && !isReady && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/80 z-10">
                                <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                <div className="text-sm text-muted-foreground">
                                    {retryCount > 0 
                                        ? `Starting workspace... (attempt ${retryCount}/${MAX_RETRIES})`
                                        : 'Loading preview...'}
                                </div>
                            </div>
                        )}

                        {/* Error state after giving up */}
                        {hasGivenUp && !isReady && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/80 z-10">
                                <AlertCircle className="h-10 w-10 text-destructive" />
                                <div className="text-sm text-muted-foreground text-center px-4">
                                    Could not load preview. The workspace may still be starting.
                                </div>
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={handleManualRetry}
                                    className="gap-2"
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    Try again
                                </Button>
                            </div>
                        )}

                        {/* Iframe - only show src when ready */}
                        <iframe
                            src={isReady ? htmlPreviewUrl : undefined}
                            title="HTML Preview"
                            className={cn(
                                "w-full h-full border-0 transition-opacity duration-300",
                                isReady ? "opacity-100" : "opacity-0"
                            )}
                            sandbox="allow-same-origin allow-scripts"
                            style={{ background: 'white' }}
                        />
                    </div>
                ) : (
                    <ScrollArea className="w-full h-full">
                        <pre className="p-4 overflow-auto">
                            <code className="text-sm">{content}</code>
                        </pre>
                    </ScrollArea>
                )}
            </div>
        </div>
    );
} 