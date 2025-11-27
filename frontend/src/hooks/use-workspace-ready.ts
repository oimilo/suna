import { useState, useEffect, useCallback, useRef } from 'react';
import { backendApi } from '@/lib/api-client';
import { Project } from '@/lib/api/threads';

export type WorkspaceStatus = 'idle' | 'loading' | 'ready' | 'error';

interface UseWorkspaceReadyOptions {
  /** Auto-start workspace when project has a sandbox */
  autoStart?: boolean;
  /** Callback when workspace becomes ready */
  onReady?: () => void;
  /** Callback on error */
  onError?: (error: string) => void;
}

interface UseWorkspaceReadyReturn {
  /** Current status of the workspace */
  status: WorkspaceStatus;
  /** Whether the workspace is ready to serve requests */
  isReady: boolean;
  /** Whether the workspace is currently loading/starting */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Manually trigger workspace activation */
  ensureActive: () => Promise<boolean>;
  /** Reset the status (e.g., when project changes) */
  reset: () => void;
}

/**
 * Hook to manage workspace (sandbox) readiness state.
 * Ensures the workspace is active before attempting to load previews.
 */
export function useWorkspaceReady(
  project: Project | null,
  options: UseWorkspaceReadyOptions = {}
): UseWorkspaceReadyReturn {
  const { autoStart = true, onReady, onError } = options;
  
  const [status, setStatus] = useState<WorkspaceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  
  const isEnsuringRef = useRef(false);
  const lastProjectIdRef = useRef<string | null>(null);
  const lastSandboxIdRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
    isEnsuringRef.current = false;
  }, []);

  const ensureActive = useCallback(async (): Promise<boolean> => {
    if (!project?.id || !project?.sandbox?.id) {
      return false;
    }

    // Prevent concurrent calls
    if (isEnsuringRef.current) {
      return false;
    }

    isEnsuringRef.current = true;
    setStatus('loading');
    setError(null);

    try {
      const response = await backendApi.post(
        `/project/${project.id}/sandbox/ensure-active`,
        {},
        { showErrors: false }
      );

      if (response.error) {
        const errorMsg = typeof response.error === 'string' 
          ? response.error 
          : 'Failed to start workspace';
        setError(errorMsg);
        setStatus('error');
        onError?.(errorMsg);
        isEnsuringRef.current = false;
        return false;
      }

      setStatus('ready');
      onReady?.();
      
      // Dispatch event for other components that might be listening
      window.dispatchEvent(new CustomEvent('workspace-ready', {
        detail: { 
          sandboxId: project.sandbox.id, 
          projectId: project.id 
        }
      }));

      isEnsuringRef.current = false;
      return true;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to start workspace';
      console.error('Error ensuring workspace is active:', err);
      setError(errorMsg);
      setStatus('error');
      onError?.(errorMsg);
      isEnsuringRef.current = false;
      return false;
    }
  }, [project?.id, project?.sandbox?.id, onReady, onError]);

  // Auto-start when project changes and has a sandbox
  useEffect(() => {
    if (!autoStart) return;
    
    const projectId = project?.id || null;
    const sandboxId = project?.sandbox?.id || null;
    
    // Check if project/sandbox changed
    const projectChanged = projectId !== lastProjectIdRef.current;
    const sandboxChanged = sandboxId !== lastSandboxIdRef.current;
    
    lastProjectIdRef.current = projectId;
    lastSandboxIdRef.current = sandboxId;
    
    // If project or sandbox changed, reset and potentially start
    if (projectChanged || sandboxChanged) {
      reset();
      
      // Only auto-start if we have both project and sandbox
      if (projectId && sandboxId) {
        // Small delay to allow other components to mount
        const timer = setTimeout(() => {
          ensureActive();
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }
  }, [project?.id, project?.sandbox?.id, autoStart, reset, ensureActive]);

  return {
    status,
    isReady: status === 'ready',
    isLoading: status === 'loading',
    error,
    ensureActive,
    reset,
  };
}

