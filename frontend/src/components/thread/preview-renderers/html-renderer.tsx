'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Code, Monitor, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Project } from '@/lib/api';

interface HtmlRendererProps {
    content: string;
    previewUrl: string;
    className?: string;
    project?: Project;
}

/**
 * HTML renderer that supports both preview (iframe) and code view modes
 */
export function HtmlRenderer({
    content,
    previewUrl,
    className,
    project
}: HtmlRendererProps) {
    const [viewMode, setViewMode] = useState<'preview' | 'code'>('preview');
    const [iframeError, setIframeError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Create a blob URL for HTML content if needed
    const blobHtmlUrl = useMemo(() => {
        if (content && !project?.sandbox?.sandbox_url) {
            const blob = new Blob([content], { type: 'text/html' });
            return URL.createObjectURL(blob);
        }
        return undefined;
    }, [content, project?.sandbox?.sandbox_url]);

    // Get filename from the previewUrl
    const fileName = useMemo(() => {
        try {
            // If it's an API URL, extract the filename from the path parameter
            if (previewUrl.includes('/api/sandboxes/')) {
                const url = new URL(previewUrl);
                const path = url.searchParams.get('path');
                if (path) {
                    return path.split('/').pop() || '';
                }
            }

            // Otherwise just get the last part of the URL
            return previewUrl.split('/').pop() || '';
        } catch (e) {
            console.error('Error extracting filename:', e);
            return '';
        }
    }, [previewUrl]);

    // Construct HTML file preview URL using our preview proxy
    const htmlPreviewUrl = useMemo(() => {
        // Note: Project type uses 'id' not 'project_id'
        const projectId = (project as any)?.project_id || (project as any)?.id;
        
        console.log('[HtmlRenderer] Computing preview URL:', {
            hasProject: !!project,
            projectId: projectId,
            projectKeys: project ? Object.keys(project) : [],
            fileName,
            previewUrl,
            blobHtmlUrl
        });
        if (projectId && fileName) {
            // Clean the filename path
            const cleanFileName = fileName.replace(/^\/workspace\//, '').replace(/^\//, '');
            const proxyUrl = `/api/preview/${projectId}/${cleanFileName}`;
            console.log('[HtmlRenderer] Using proxy URL:', proxyUrl);
            return proxyUrl;
        }
        
        // Fallback to blob URL if no project
        console.log('[HtmlRenderer] Falling back to:', blobHtmlUrl || previewUrl);
        return blobHtmlUrl || previewUrl;
    }, [project, fileName, blobHtmlUrl, previewUrl]);

    // Auto-retry logic for 502 errors
    useEffect(() => {
        if (iframeError && retryCount < 3) {
            const timer = setTimeout(() => {
                console.log('[HtmlRenderer] Retrying after error, attempt:', retryCount + 1);
                setIframeError(false);
                setRetryCount(prev => prev + 1);
                if (iframeRef.current) {
                    // Force reload by setting src again
                    iframeRef.current.src = htmlPreviewUrl;
                }
            }, 3000); // Retry after 3 seconds
            return () => clearTimeout(timer);
        }
    }, [iframeError, retryCount, htmlPreviewUrl]);

    // Handle iframe load error
    const handleIframeError = () => {
        console.log('[HtmlRenderer] Iframe error detected');
        setIframeError(true);
    };

    // Handle iframe load success
    const handleIframeLoad = () => {
        // Check if it's actually a 502 error by checking the iframe content
        try {
            const iframeDoc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document;
            if (iframeDoc?.body?.innerText?.includes('502')) {
                console.log('[HtmlRenderer] 502 error detected in iframe content');
                setIframeError(true);
            } else {
                // Successfully loaded
                setIframeError(false);
                setRetryCount(0);
            }
        } catch (e) {
            // Cross-origin, can't check content, assume it's ok
            console.log('[HtmlRenderer] Cross-origin iframe, assuming success');
        }
    };

    // Manual retry
    const handleManualRetry = () => {
        setIframeError(false);
        setRetryCount(0);
        if (iframeRef.current) {
            iframeRef.current.src = htmlPreviewUrl;
        }
    };

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
                    <div className="w-full h-full">
                        {iframeError && retryCount < 3 ? (
                            // Show subtle loading state while retrying
                            <div className="w-full h-full flex items-center justify-center">
                                <Loader2 className="h-5 w-5 text-muted-foreground animate-spin opacity-50" />
                            </div>
                        ) : iframeError && retryCount >= 3 ? (
                            // Show error state after max retries
                            <div className="w-full h-full flex flex-col items-center justify-center bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 rounded-lg">
                                <div className="flex flex-col items-center gap-4 p-8">
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                                        <ExternalLink className="h-6 w-6 text-red-600 dark:text-red-400" />
                                    </div>
                                    <div className="text-center space-y-2">
                                        <h3 className="text-sm font-medium text-foreground">
                                            Não foi possível carregar o preview
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            O sandbox pode estar demorando mais que o esperado para iniciar.
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleManualRetry}
                                        className="mt-2"
                                    >
                                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                                        Tentar Novamente
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <iframe
                                ref={iframeRef}
                                src={htmlPreviewUrl}
                                title="HTML Preview"
                                className="w-full h-full border-0"
                                sandbox="allow-same-origin allow-scripts"
                                style={{ background: 'white' }}
                                onError={handleIframeError}
                                onLoad={handleIframeLoad}
                            />
                        )}
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