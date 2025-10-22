'use client';

import React, { forwardRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Paperclip, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { fileQueryKeys } from '@/hooks/react-query/files/use-file-queries';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UploadedFile } from './chat-input';
import { normalizeFilenameToNFC } from '@/lib/utils/unicode';

const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL || '';

const handleLocalFiles = (
  files: File[],
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>,
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
) => {
  const filteredFiles = files.filter((file) => {
    if (file.size > 50 * 1024 * 1024) {
      toast.error(`File size exceeds 50MB limit: ${file.name}`);
      return false;
    }
    return true;
  });

  setPendingFiles((prevFiles) => [...prevFiles, ...filteredFiles]);

  const newUploadedFiles: UploadedFile[] = filteredFiles.map((file) => {
    // Normalize filename to NFC
    const normalizedName = normalizeFilenameToNFC(file.name);

    return {
      name: normalizedName,
      path: `/workspace/uploads/${normalizedName}`,
      size: file.size,
      type: file.type || 'application/octet-stream',
      localUrl: URL.createObjectURL(file)
    };
  });

  setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);
  filteredFiles.forEach((file) => {
    const normalizedName = normalizeFilenameToNFC(file.name);
    toast.success(`File attached: ${normalizedName}`);
  });
};

const uploadFiles = async (
  files: File[],
  sandboxId: string,
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
  messages: any[] = [], // Add messages parameter to check for existing files
  queryClient?: any, // Add queryClient parameter for cache invalidation
  setPendingFiles?: React.Dispatch<React.SetStateAction<File[]>>, // Allow clearing pending files after upload
) => {
  try {
    setIsUploading(true);

    const newUploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`File size exceeds 50MB limit: ${file.name}`);
        continue;
      }

      // Normalize filename to NFC
      const normalizedName = normalizeFilenameToNFC(file.name);
      // Always target /workspace/uploads on the sandbox
      const uploadPath = `/workspace/uploads/${normalizedName}`;

      // Check if this filename already exists in chat messages
      const isFileInChat = messages.some(message => {
        const content = typeof message.content === 'string' ? message.content : '';
        return content.includes(`[Uploaded File: ${uploadPath}]`);
      });

      const formData = new FormData();
      // If the filename was normalized, append with the normalized name in the field name
      // The server will use the path parameter for the actual filename
      formData.append('file', file, normalizedName);
      formData.append('path', uploadPath);

      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        throw new Error('No access token available');
      }

      const response = await fetch(`${API_URL}/sandboxes/${sandboxId}/files`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status === 402 ? 'Pagamento Necessário' : response.statusText}`);
      }

      // Read server response to capture the actual stored path and filename
      let serverJson: any = null;
      try {
        serverJson = await response.json();
      } catch {
        serverJson = null;
      }

      const returnedPath: string = (serverJson?.path as string) || uploadPath;
      const finalFilename: string = (serverJson?.final_filename as string) || normalizedName;

      // If file was already in chat and we have queryClient, invalidate its cache
      if (isFileInChat && queryClient) {
        console.log(`Invalidating cache for existing file: ${uploadPath}`);

        // Invalidate all content types for this file
        ['text', 'blob', 'json'].forEach(contentType => {
          const queryKey = fileQueryKeys.content(sandboxId, returnedPath, contentType);
          queryClient.removeQueries({ queryKey });
        });

        // Also invalidate directory listing
        const directoryPath = returnedPath.substring(0, returnedPath.lastIndexOf('/'));
        queryClient.invalidateQueries({
          queryKey: fileQueryKeys.directory(sandboxId, directoryPath),
        });
      }

      newUploadedFiles.push({
        name: finalFilename,
        path: returnedPath,
        size: file.size,
        type: file.type || 'application/octet-stream',
      });

      if (serverJson?.renamed && finalFilename !== normalizedName) {
        toast.success(`Arquivo enviado: ${finalFilename} (renomeado de ${normalizedName})`);
      } else {
        toast.success(`Arquivo enviado: ${finalFilename}`);
      }
    }

    setUploadedFiles((prev) => [...prev, ...newUploadedFiles]);

    if (setPendingFiles) {
      setPendingFiles([]);
    }
  } catch (error) {
    console.error('File upload failed:', error);
    toast.error(
      typeof error === 'string'
        ? error
        : error instanceof Error
          ? error.message
          : 'Failed to upload file',
    );
  } finally {
    setIsUploading(false);
  }
};

const handleFiles = async (
  files: File[],
  sandboxId: string | undefined,
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>,
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>,
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>,
  messages: any[] = [], // Add messages parameter
  queryClient?: any, // Add queryClient parameter
) => {
  if (sandboxId) {
    // If we have a sandboxId, upload files directly
    await uploadFiles(files, sandboxId, setUploadedFiles, setIsUploading, messages, queryClient, setPendingFiles);
  } else {
    // Otherwise, store files locally
    handleLocalFiles(files, setPendingFiles, setUploadedFiles);
  }
};

interface FileUploadHandlerProps {
  loading: boolean;
  disabled: boolean;
  isAgentRunning: boolean;
  isUploading: boolean;
  sandboxId?: string;
  setPendingFiles: React.Dispatch<React.SetStateAction<File[]>>;
  setUploadedFiles: React.Dispatch<React.SetStateAction<UploadedFile[]>>;
  setIsUploading: React.Dispatch<React.SetStateAction<boolean>>;
  messages?: any[]; // Add messages prop
  isLoggedIn?: boolean;
  isFocused?: boolean;
}

export const FileUploadHandler = forwardRef<
  HTMLInputElement,
  FileUploadHandlerProps
>(
  (
    {
      loading,
      disabled,
      isAgentRunning,
      isUploading,
      sandboxId,
      setPendingFiles,
      setUploadedFiles,
      setIsUploading,
      messages = [],
      isLoggedIn = true,
      isFocused = false,
    },
    ref,
  ) => {
    const queryClient = useQueryClient();
    // Clean up object URLs when component unmounts
    useEffect(() => {
      return () => {
        // Clean up any object URLs to avoid memory leaks
        setUploadedFiles((prev) => {
          prev.forEach((file) => {
            if (file.localUrl) {
              URL.revokeObjectURL(file.localUrl);
            }
          });
          return prev;
        });
      };
    }, [setUploadedFiles]);

    const handleFileUpload = () => {
      if (ref && 'current' in ref && ref.current) {
        ref.current.click();
      }
    };

    const processFileUpload = async (
      event: React.ChangeEvent<HTMLInputElement>,
    ) => {
      if (!event.target.files || event.target.files.length === 0) return;

      const files = Array.from(event.target.files);
      // Use the helper function instead of the static method
      handleFiles(
        files,
        sandboxId,
        setPendingFiles,
        setUploadedFiles,
        setIsUploading,
        messages,
        queryClient,
      );

      event.target.value = '';
    };

    return (
      <>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button
                  type="button"
                  onClick={handleFileUpload}
                  variant="outline"
                  size="sm"
                  className={`h-8 w-8 p-0 bg-transparent border rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent/50 flex items-center justify-center transition-all duration-300 ${!isFocused ? 'opacity-20 border-transparent' : 'opacity-100 border-border'}`}
                  disabled={
                    !isLoggedIn || loading || (disabled && !isAgentRunning) || isUploading
                  }
                >
                  {isUploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>{isLoggedIn ? 'Anexar arquivos' : 'Faça login para anexar arquivos'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <input
          type="file"
          ref={ref}
          className="hidden"
          onChange={processFileUpload}
          multiple
        />
      </>
    );
  },
);

FileUploadHandler.displayName = 'FileUploadHandler';
export { handleFiles, handleLocalFiles, uploadFiles };
