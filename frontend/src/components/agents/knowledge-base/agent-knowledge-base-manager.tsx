'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Clock, 
  AlertCircle,
  FileText,
  Globe,
  Search,
  Loader2,
  Bot,
  Upload,
  GitBranch,
  Archive,
  CheckCircle,
  XCircle,
  RefreshCw,
  File as FileIcon,
  BookOpen,
  PenTool,
  X
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  useAgentKnowledgeBaseEntries,
  useCreateAgentKnowledgeBaseEntry,
  useUpdateKnowledgeBaseEntry,
  useDeleteKnowledgeBaseEntry,
  useUploadAgentFiles,
  useAgentProcessingJobs,
} from '@/hooks/react-query/knowledge-base/use-knowledge-base-queries';
import { cn, truncateString } from '@/lib/utils';
import { CreateKnowledgeBaseEntryRequest, KnowledgeBaseEntry, UpdateKnowledgeBaseEntryRequest } from '@/hooks/react-query/knowledge-base/types';
import { toast } from 'sonner';
import JSZip from 'jszip';

import { 
  SiJavascript, 
  SiTypescript, 
  SiPython, 
  SiReact, 
  SiHtml5, 
  SiCss3, 
  SiJson,
  SiMarkdown,
  SiYaml,
  SiXml
} from 'react-icons/si';
import { 
  FaFilePdf, 
  FaFileWord, 
  FaFileExcel, 
  FaFileImage, 
  FaFileArchive, 
  FaFileCode,
  FaFileAlt,
  FaFile
} from 'react-icons/fa';

interface AgentKnowledgeBaseManagerProps {
  agentId: string;
  agentName: string;
}

interface EditDialogData {
  entry?: KnowledgeBaseEntry;
  isOpen: boolean;
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'extracting';
  error?: string;
  isFromZip?: boolean;
  zipParentId?: string;
  originalPath?: string;
}

const USAGE_CONTEXT_OPTIONS = [
  { 
    value: 'always', 
    label: 'Sempre Ativo', 
    icon: Globe,
    description: 'O conhecimento estará sempre disponível para o agente',
    color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
  },
  {
    value: 'on_request',
    label: 'Sob Demanda',
    icon: Search,
    description: 'O agente busca o conhecimento quando necessário',
    color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
  },
  {
    value: 'contextual',
    label: 'Contextual',
    icon: Bot,
    description: 'Ativado automaticamente com base no contexto da conversa',
    color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
  }
] as const;

const getFileTypeIcon = (filename: string, mimeType?: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'js':
      return SiJavascript;
    case 'ts':
      return SiTypescript;
    case 'jsx':
    case 'tsx':
      return SiReact;
    case 'py':
      return SiPython;
    case 'html':
      return SiHtml5;
    case 'css':
      return SiCss3;
    case 'json':
      return SiJson;
    case 'md':
      return SiMarkdown;
    case 'yaml':
    case 'yml':
      return SiYaml;
    case 'xml':
      return SiXml;
    case 'pdf':
      return FaFilePdf;
    case 'doc':
    case 'docx':
      return FaFileWord;
    case 'xls':
    case 'xlsx':
    case 'csv':
      return FaFileExcel;
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'ico':
      return FaFileImage;
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return FaFileArchive;
    default:
      if (['java', 'cpp', 'c', 'cs', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala'].includes(extension || '')) {
        return FaFileCode;
      }
      if (['txt', 'rtf', 'log'].includes(extension || '')) {
        return FaFileAlt;
      }
      return FaFile;
  }
};

const getFileIconColor = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'js':
      return 'text-yellow-500';
    case 'ts':
    case 'tsx':
      return 'text-blue-500';
    case 'jsx':
      return 'text-cyan-500';
    case 'py':
      return 'text-green-600';
    case 'html':
      return 'text-orange-600';
    case 'css':
      return 'text-blue-600';
    case 'json':
      return 'text-yellow-600';
    case 'md':
      return 'text-gray-700 dark:text-gray-300';
    case 'yaml':
    case 'yml':
      return 'text-red-500';
    case 'xml':
      return 'text-orange-500';
    case 'pdf':
      return 'text-red-600';
    case 'doc':
    case 'docx':
      return 'text-blue-700';
    case 'xls':
    case 'xlsx':
    case 'csv':
      return 'text-green-700';
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'ico':
      return 'text-purple-500';
    case 'zip':
    case 'rar':
    case '7z':
    case 'tar':
    case 'gz':
      return 'text-yellow-700';
    default:
      return 'text-gray-500';
  }
};

const getSourceIcon = (sourceType: string, filename?: string) => {
  switch (sourceType) {
    case 'file':
      return filename ? getFileTypeIcon(filename) : FileIcon;
    case 'git_repo':
      return GitBranch;
    case 'zip_extracted':
      return Archive;
    default:
      return FileText;
  }
};

const AgentKnowledgeBaseSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div className="relative w-full">
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-32 ml-4" />
    </div>

    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-4 w-64" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-4 w-16" />
              </div>
            </div>
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

export const AgentKnowledgeBaseManager = ({ agentId, agentName }: AgentKnowledgeBaseManagerProps) => {
  const [editDialog, setEditDialog] = useState<EditDialogData>({ isOpen: false });
  const [deleteEntryId, setDeleteEntryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [addDialogTab, setAddDialogTab] = useState<'manual' | 'files' | 'repo'>('manual');
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<CreateKnowledgeBaseEntryRequest>({
    name: '',
    description: '',
    content: '',
    usage_context: 'always',
  });

  const { data: knowledgeBase, isLoading, error, refetch } = useAgentKnowledgeBaseEntries(agentId);
  const { data: processingJobsData, refetch: refetchJobs } = useAgentProcessingJobs(agentId);
  const createMutation = useCreateAgentKnowledgeBaseEntry();
  const updateMutation = useUpdateKnowledgeBaseEntry();
  const deleteMutation = useDeleteKnowledgeBaseEntry();
  const uploadMutation = useUploadAgentFiles();

  useEffect(() => {
    if (!processingJobsData?.jobs?.length) {
      return;
    }

    const hasProcessingJobs = processingJobsData.jobs.some(job => job.status === 'processing');
    const hasRecentlyCompleted = processingJobsData.jobs.some(job => {
      if (job.status !== 'completed' || !job.completed_at) {
        return false;
      }
      return new Date(job.completed_at).getTime() > Date.now() - 10_000;
    });

    if (!hasProcessingJobs && !hasRecentlyCompleted) {
      return;
    }

    const interval = setInterval(() => {
      refetchJobs();
      refetch();
    }, hasProcessingJobs ? 2000 : 5000);

    return () => clearInterval(interval);
  }, [processingJobsData?.jobs, refetch, refetchJobs]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const extractZipFile = async (zipFile: File, zipId: string) => {
    try {
      setUploadedFiles(prev =>
        prev.map(f => (f.id === zipId ? { ...f, status: 'extracting' as const } : f)),
      );

      const zip = new JSZip();
      const zipContent = await zip.loadAsync(zipFile);
      const extractedFiles: UploadedFile[] = [];
      const rejectedFiles: string[] = [];
      const supportedExtensions = ['.txt', '.pdf', '.docx'];

      for (const [path, file] of Object.entries(zipContent.files)) {
        if (!file.dir && !path.startsWith('__MACOSX/') && !path.includes('/.')) {
          const fileName = path.split('/').pop() || path;
          const extensionIndex = fileName.lastIndexOf('.');
          const fileExtension = extensionIndex >= 0 ? fileName.toLowerCase().slice(extensionIndex) : '';

          if (!supportedExtensions.includes(fileExtension)) {
            rejectedFiles.push(fileName);
            continue;
          }

          try {
            const blob = await file.async('blob');
            const extractedFile = new File([blob], fileName);

            extractedFiles.push({
              file: extractedFile,
              id: Math.random().toString(36).slice(2, 11),
              status: 'pending',
              isFromZip: true,
              zipParentId: zipId,
              originalPath: path,
            });
          } catch (zipError) {
            console.warn(`Failed to extract ${path}:`, zipError);
          }
        }
      }

      setUploadedFiles(prev => [
        ...prev.map(f => (f.id === zipId ? { ...f, status: 'success' as const } : f)),
        ...extractedFiles,
      ]);

      let message = `Extraímos ${extractedFiles.length} arquivo${extractedFiles.length === 1 ? '' : 's'} de ${zipFile.name}`;
      if (rejectedFiles.length > 0) {
        message += `. Ignoramos ${rejectedFiles.length} arquivo${rejectedFiles.length === 1 ? '' : 's'} não suportado${rejectedFiles.length === 1 ? '' : 's'}: ${rejectedFiles
          .slice(0, 5)
          .join(', ')}${rejectedFiles.length > 5 ? '...' : ''}`;
      }
      toast.success(message);
    } catch (zipError) {
      console.error('Error extracting ZIP:', zipError);
      setUploadedFiles(prev =>
        prev.map(f =>
          f.id === zipId
            ? { ...f, status: 'error', error: 'Falha ao extrair o arquivo ZIP' }
            : f,
        ),
      );
      toast.error('Falha ao extrair o arquivo ZIP');
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    const supportedExtensions = ['.txt', '.pdf', '.docx'];
    const newFiles: UploadedFile[] = [];
    const rejectedFiles: string[] = [];

    for (const file of Array.from(files)) {
      const extensionIndex = file.name.lastIndexOf('.');
      const fileExtension = extensionIndex >= 0 ? file.name.toLowerCase().slice(extensionIndex) : '';

      if (!supportedExtensions.includes(fileExtension) && fileExtension !== '.zip') {
        rejectedFiles.push(file.name);
        continue;
      }

      const fileId = Math.random().toString(36).slice(2, 11);
      const queuedFile: UploadedFile = {
        file,
        id: fileId,
        status: 'pending',
      };

      newFiles.push(queuedFile);

      if (file.name.toLowerCase().endsWith('.zip')) {
        setTimeout(() => extractZipFile(file, fileId), 100);
      }
    }

    if (rejectedFiles.length > 0) {
      toast.error(`Formato não suportado: ${rejectedFiles.join(', ')}. Aceitamos apenas .txt, .pdf, .docx ou .zip.`);
    }

    if (newFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...newFiles]);
      setAddDialogTab('files');
      setAddDialogOpen(true);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const handleOpenAddDialog = (tab: 'manual' | 'files' | 'repo' = 'manual') => {
    setAddDialogTab(tab);
    setAddDialogOpen(true);
    setFormData({
      name: '',
      description: '',
      content: '',
      usage_context: 'always',
    });
    setUploadedFiles([]);
  };

  const handleOpenEditDialog = (entry: KnowledgeBaseEntry) => {
    setFormData({
      name: entry.name,
      description: entry.description || '',
      content: entry.content,
      usage_context: entry.usage_context,
    });
    setEditDialog({ entry, isOpen: true });
  };

  const handleCloseDialog = () => {
    setEditDialog({ isOpen: false });
    setAddDialogOpen(false);
    setAddDialogTab('manual');
    setFormData({
      name: '',
      description: '',
      content: '',
      usage_context: 'always',
    });
    setUploadedFiles([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.content.trim()) {
      toast.error('Preencha nome e conteúdo antes de salvar.');
      return;
    }

    try {
      if (editDialog.entry) {
        const updateData: UpdateKnowledgeBaseEntryRequest = {
          name: formData.name !== editDialog.entry.name ? formData.name : undefined,
          description: formData.description !== editDialog.entry.description ? formData.description : undefined,
          content: formData.content !== editDialog.entry.content ? formData.content : undefined,
          usage_context: formData.usage_context !== editDialog.entry.usage_context ? formData.usage_context : undefined,
        };

        const hasChanges = Object.values(updateData).some(value => value !== undefined);
        if (!hasChanges) {
          toast.info('Nenhuma alteração para salvar.');
          return;
        }

        await updateMutation.mutateAsync({
          entryId: editDialog.entry.entry_id,
          data: updateData,
        });
        toast.success('Conhecimento atualizado com sucesso.');
      } else {
        await createMutation.mutateAsync({ agentId, data: formData });
        toast.success('Conhecimento adicionado com sucesso.');
      }

      await Promise.all([refetch(), refetchJobs()]);
      handleCloseDialog();
    } catch (submitError) {
      console.error('Error saving agent knowledge base entry:', submitError);
      toast.error('Não foi possível salvar o conhecimento. Tente novamente.');
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await deleteMutation.mutateAsync(entryId);
      setDeleteEntryId(null);
      toast.success('Entrada removida.');
      await Promise.all([refetch(), refetchJobs()]);
    } catch (deleteError) {
      console.error('Error deleting agent knowledge base entry:', deleteError);
      toast.error('Erro ao remover entrada. Tente novamente.');
    }
  };

  const handleToggleActive = async (entry: KnowledgeBaseEntry) => {
    try {
      await updateMutation.mutateAsync({
        entryId: entry.entry_id,
        data: { is_active: !entry.is_active },
      });
      toast.success(`Entrada ${entry.is_active ? 'desativada' : 'ativada'} com sucesso.`);
      await refetch();
    } catch (toggleError) {
      console.error('Error toggling entry status:', toggleError);
      toast.error('Não foi possível atualizar o status da entrada.');
    }
  };

  const uploadFiles = async () => {
    const filesToUpload = uploadedFiles.filter(
      file =>
        file.status === 'pending' &&
        (file.isFromZip || !file.file.name.toLowerCase().endsWith('.zip')),
    );

    if (filesToUpload.length === 0) {
      return;
    }

    let allSuccessful = true;

    for (const queuedFile of filesToUpload) {
      try {
        setUploadedFiles(prev =>
          prev.map(f => (f.id === queuedFile.id ? { ...f, status: 'uploading' as const } : f)),
        );

        await uploadMutation.mutateAsync({ agentId, file: queuedFile.file });

        setUploadedFiles(prev =>
          prev.map(f => (f.id === queuedFile.id ? { ...f, status: 'success' as const } : f)),
        );
      } catch (uploadError) {
        allSuccessful = false;
        setUploadedFiles(prev =>
          prev.map(f =>
            f.id === queuedFile.id
              ? {
                  ...f,
                  status: 'error' as const,
                  error: uploadError instanceof Error ? uploadError.message : 'Falha no upload',
                }
              : f,
          ),
        );
        toast.error(`Falha ao enviar ${queuedFile.file.name}.`);
      }
    }

    if (allSuccessful) {
      refetchJobs();

      setTimeout(() => {
        toast.success(
          `Upload concluído: ${filesToUpload.length} arquivo${filesToUpload.length === 1 ? '' : 's'}. Os registros aparecerão após o processamento.`,
        );
        handleCloseDialog();

        setTimeout(() => {
          refetch();
          refetchJobs();
        }, 500);
      }, 1000);
    }
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const getUsageContextConfig = (context: string) => {
    return USAGE_CONTEXT_OPTIONS.find(option => option.value === context) || USAGE_CONTEXT_OPTIONS[0];
  };

  const getJobStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'failed':
        return XCircle;
      case 'processing':
        return RefreshCw;
      default:
        return Clock;
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'processing':
        return 'text-blue-600';
      default:
        return 'text-yellow-600';
    }
  };

  if (isLoading) {
    return <AgentKnowledgeBaseSkeleton />;
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
          <p className="text-sm text-red-600 dark:text-red-400">Failed to load agent knowledge base</p>
        </div>
      </div>
    );
  }

  const entries = knowledgeBase?.entries || [];
  const processingJobs = processingJobsData?.jobs || [];
  const filteredEntries = entries.filter(entry => 
    entry.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (entry.description && entry.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <TooltipProvider>
      <div 
        className="space-y-6"
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
      {dragActive && (
        <div className="fixed inset-0 bg-blue-500/20 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-8 shadow-lg border-2 border-dashed border-blue-500">
            <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-center">Drop files here to upload</p>
            <p className="text-sm text-muted-foreground text-center mt-2">
              Supports documents, images, code files, and ZIP archives
            </p>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-60" />
          <Input
            placeholder="Buscar entrada"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 pl-9 text-sm bg-black/[0.02] dark:bg-white/[0.03] border-black/6 dark:border-white/8 focus:bg-transparent"
          />
        </div>
        <Button 
          onClick={() => handleOpenAddDialog()} 
          size="sm"
          variant="default"
          className="h-9 px-3 gap-1.5 text-sm font-medium"
        >
          <Plus className="h-3.5 w-3.5" />
          Adicionar Conhecimento
        </Button>
      </div>
      {entries.length === 0 ? (
        <div className="text-center py-12 px-6 bg-muted/30 rounded-xl border-2 border-dashed border-border">
          <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4 border">
            <Bot className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-semibold mb-2">Nenhuma Entrada de Conhecimento do Agente</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Adicione entradas de conhecimento para fornecer ao <span className="font-medium">{agentName}</span> contexto especializado, 
            diretrizes e informações que ele deve sempre lembrar.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <Search className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">No entries match your search</p>
            </div>
          ) : (
            filteredEntries.map((entry) => {
              const contextConfig = getUsageContextConfig(entry.usage_context);
              const ContextIcon = contextConfig.icon;
              const SourceIcon = getSourceIcon(entry.source_type || 'manual', entry.source_metadata?.filename);
              
              return (
                <div
                  key={entry.entry_id}
                  className={cn(
                    "group p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200",
                    !entry.is_active && "opacity-60"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* Ícone */}
                    <div className="p-2 rounded-md bg-transparent opacity-60 shrink-0">
                      <SourceIcon className="h-4 w-4" />
                    </div>
                    
                    {/* Conteúdo */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-medium truncate">
                            {entry.name}
                          </h4>
                          {!entry.is_active && (
                            <div className="px-2 py-0.5 rounded text-xs font-medium bg-gray-500/10 text-gray-600 dark:text-gray-400 border border-gray-500/20">
                              Desativado
                            </div>
                          )}
                          {entry.source_type && entry.source_type !== 'manual' && (
                            <div className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                              {entry.source_type === 'git_repo' ? 'Git' : 
                               entry.source_type === 'zip_extracted' ? 'ZIP' : 'Arquivo'}
                            </div>
                          )}
                        </div>
                        
                        {/* Ações */}
                        <div className="flex items-center gap-1 ml-2 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Switch
                            checked={entry.is_active}
                            onCheckedChange={() => handleToggleActive(entry)}
                            className="scale-90 mr-1"
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEditDialog(entry)}
                                className="h-7 w-7 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                              >
                                <Edit2 className="h-3.5 w-3.5 opacity-60" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Editar</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setDeleteEntryId(entry.entry_id)}
                                className="h-7 w-7 p-0 hover:bg-red-500/10 text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                              >
                                <Trash2 className="h-3.5 w-3.5 opacity-60" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Excluir</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                      
                      {/* Descrição */}
                      {entry.description && (
                        <p className="text-xs text-muted-foreground truncate mb-2">
                          {entry.description}
                        </p>
                      )}
                      
                      {/* Conteúdo preview */}
                      <p className="text-xs text-muted-foreground/80 line-clamp-2 mb-3">
                        {entry.content}
                      </p>
                      
                      {/* Footer com badges e info */}
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-3">
                          {/* Badge de contexto */}
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded",
                            contextConfig.color
                          )}>
                            <ContextIcon className="h-3 w-3" />
                            <span className="font-medium">{contextConfig.label}</span>
                          </div>
                          
                          {/* Data */}
                          <div className="flex items-center gap-1 text-muted-foreground/60">
                            <Clock className="h-3 w-3" />
                            <span>{new Date(entry.created_at).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                        
                        {/* Tokens */}
                        {entry.content_tokens && (
                          <span className="text-muted-foreground/60">
                            ~{entry.content_tokens.toLocaleString()} tokens
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Processing Jobs */}
      {processingJobs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Processing Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {processingJobs.map((job) => {
              const StatusIcon = getJobStatusIcon(job.status);
              const statusColor = getJobStatusColor(job.status);
              
              return (
                <div key={job.job_id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={cn("h-4 w-4", statusColor, job.status === 'processing' && 'animate-spin')} />
                    <div>
                      <p className="text-sm font-medium">
                        {job.job_type === 'file_upload' ? 'File Upload' :
                         job.job_type === 'git_clone' ? 'Git Repository' : 'Processing'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {job.source_info.filename || job.source_info.git_url || 'Unknown source'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={job.status === 'completed' ? 'default' : 
                                 job.status === 'failed' ? 'destructive' : 'secondary'} className="text-xs">
                      {job.status}
                    </Badge>
                    {job.status === 'completed' && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {job.entries_created} entries created
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={(e) => handleFileUpload(e.target.files)}
        className="hidden"
        accept=".txt,.pdf,.docx,.zip"
      />
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/6 dark:border-white/8">
            <DialogTitle className="flex items-center gap-2.5 text-base font-medium">
              <div className="p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <span>Adicionar Conhecimento a {agentName}</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden flex flex-col">
            <Tabs value={addDialogTab} onValueChange={(value) => setAddDialogTab(value as any)} className="flex-1 flex flex-col">
              {/* Tab Switcher */}
              <div className="px-6 pt-4 pb-0">
                <div className="flex gap-4 border-b border-black/6 dark:border-white/8">
                  <button
                    type="button"
                    onClick={() => setAddDialogTab('manual')}
                    className={cn(
                      "flex items-center gap-2 px-1 pb-3 text-sm font-medium border-b-2 transition-all duration-200",
                      addDialogTab === 'manual' 
                        ? "border-primary text-foreground" 
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    <span>Escrever Conhecimento</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAddDialogTab('files')}
                    className={cn(
                      "flex items-center gap-2 px-1 pb-3 text-sm font-medium border-b-2 transition-all duration-200",
                      addDialogTab === 'files' 
                        ? "border-primary text-foreground" 
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Upload className="h-3.5 w-3.5" />
                    <span>Enviar Arquivos</span>
                    {uploadedFiles.length > 0 && (
                      <span className="px-1.5 py-0.5 text-xs rounded-full bg-primary/10 text-primary font-normal">
                        {uploadedFiles.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              <TabsContent value="manual" className="flex-1 overflow-y-auto px-6 pb-6">
                <form onSubmit={handleSubmit} className="pt-4 space-y-4">
                  {/* Nome */}
                  <div>
                    <Label htmlFor="name" className="text-sm font-normal text-foreground mb-2 block">
                      Nome *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="ex: Padrões de Código, Conhecimento de Domínio, Diretrizes de API"
                      required
                      className="h-10"
                    />
                  </div>

                  {/* Contexto de Uso */}
                  <div>
                    <Label htmlFor="usage_context" className="text-sm font-normal text-foreground mb-2 block">
                      Contexto de Uso
                    </Label>
                    <Select
                      value={formData.usage_context}
                      onValueChange={(value: 'always' | 'on_request' | 'contextual') => 
                        setFormData(prev => ({ ...prev, usage_context: value }))
                      }
                    >
                      <SelectTrigger className="h-10 w-full">
                        {(() => {
                          const selected = USAGE_CONTEXT_OPTIONS.find(o => o.value === formData.usage_context);
                          if (selected) {
                            const Icon = selected.icon;
                            return (
                              <div className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                                <span>{selected.label}</span>
                              </div>
                            );
                          }
                          return <span>Selecione...</span>;
                        })()}
                      </SelectTrigger>
                      <SelectContent>
                        {USAGE_CONTEXT_OPTIONS.map((option) => {
                          const Icon = option.icon;
                          return (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5" />
                                <span>{option.label}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      {USAGE_CONTEXT_OPTIONS.find(o => o.value === formData.usage_context)?.description}
                    </p>
                  </div>

                  {/* Descrição */}
                  <div>
                    <Label htmlFor="description" className="text-sm font-normal text-foreground mb-2 block">
                      Descrição
                    </Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Breve descrição deste conhecimento (opcional)"
                      className="h-10"
                    />
                  </div>

                  {/* Conteúdo */}
                  <div>
                    <Label htmlFor="content" className="text-sm font-normal text-foreground mb-2 block">
                      Conteúdo *
                    </Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder={`Digite o conhecimento especializado que ${agentName} deve saber...`}
                      className="min-h-[180px] resize-none"
                      required
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Aproximadamente {Math.ceil(formData.content.length / 4).toLocaleString()} tokens
                    </p>
                  </div>

                </form>
              </TabsContent>

              <TabsContent value="files" className="flex-1 overflow-y-auto">
                <div className="px-6 py-4">
                  {uploadedFiles.length === 0 && (
                    <div className="border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-lg p-12 text-center hover:border-gray-300 dark:hover:border-gray-700 transition-colors">
                      <Upload className="h-10 w-10 mx-auto text-gray-400 mb-4" />
                      <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 mb-1">
                        Enviar Arquivos
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Arraste e solte arquivos aqui ou clique para navegar
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">
                        Suporta: TXT, PDF, DOCX, ZIP
                      </p>
                      <Button 
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline"
                        className="h-9"
                      >
                        Escolher Arquivos
                      </Button>
                    </div>
                  )}
                  {uploadedFiles.length > 0 && (
                    <div className="space-y-6">
                      {uploadedFiles.filter(f => f.file.name.toLowerCase().endsWith('.zip') && !f.isFromZip).map((zipFile) => {
                        const extractedFiles = uploadedFiles.filter(f => f.zipParentId === zipFile.id);
                        return (
                          <div key={zipFile.id} className="space-y-3">
                            {extractedFiles.length > 0 && (
                              <div>
                                <p className="text-sm font-medium text-muted-foreground mb-3">
                                  Extracted Files ({extractedFiles.length}):
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                                  {extractedFiles.map((extractedFile) => {
                                    const ExtractedFileIcon = getFileTypeIcon(extractedFile.file.name);
                                    const iconColor = getFileIconColor(extractedFile.file.name);
                                    return (
                                      <div key={extractedFile.id} className="group relative p-2 pb-0 rounded-lg border bg-muted flex items-center">
                                        <div className="flex items-center text-center space-y-2">
                                          <ExtractedFileIcon className={cn("h-8 w-8", iconColor)} />
                                          <div className="w-full flex flex-col items-start ml-2">
                                            <p className="text-xs font-medium truncate" title={extractedFile.file.name}>
                                              {extractedFile.file.name}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                              {(extractedFile.file.size / 1024).toFixed(1)}KB
                                            </p>
                                          </div>
                                          <div className="absolute top-1 right-1">
                                            {extractedFile.status === 'uploading' && (
                                              <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                            )}
                                            {extractedFile.status === 'success' && (
                                              <CheckCircle className="h-3 w-3 text-green-600" />
                                            )}
                                            {extractedFile.status === 'error' && (
                                              <XCircle className="h-3 w-3 text-red-600" />
                                            )}
                                            {extractedFile.status === 'pending' && (
                                              <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeFile(extractedFile.id)}
                                                className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {uploadedFiles.filter(f => !f.isFromZip && !f.file.name.toLowerCase().endsWith('.zip')).length > 0 && (
                        <div className="space-y-3">
                          <p className="text-sm font-medium text-muted-foreground">
                            Individual Files ({uploadedFiles.filter(f => !f.isFromZip && !f.file.name.toLowerCase().endsWith('.zip')).length}):
                          </p>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {uploadedFiles.filter(f => !f.isFromZip && !f.file.name.toLowerCase().endsWith('.zip')).map((uploadedFile) => {
                              const FileTypeIcon = getFileTypeIcon(uploadedFile.file.name);
                              const iconColor = getFileIconColor(uploadedFile.file.name);
                              return (
                                <div key={uploadedFile.id} className="group relative p-2 pb-0 rounded-lg border bg-muted flex items-center">
                                  <div className="flex items-center text-center space-y-2">
                                    <FileTypeIcon className={cn("h-8 w-8", iconColor)} />
                                    <div className="w-full flex flex-col items-start ml-2">
                                      <p className="text-xs font-medium truncate" title={uploadedFile.file.name}>
                                        {truncateString(uploadedFile.file.name, 20)}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {(uploadedFile.file.size / 1024).toFixed(1)}KB
                                      </p>
                                    </div>
                                    <div className="absolute top-1 right-1">
                                      {uploadedFile.status === 'uploading' && (
                                        <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                                      )}
                                      {uploadedFile.status === 'success' && (
                                        <CheckCircle className="h-3 w-3 text-green-600" />
                                      )}
                                      {uploadedFile.status === 'error' && (
                                        <XCircle className="h-3 w-3 text-red-600" />
                                      )}
                                      {uploadedFile.status === 'pending' && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeFile(uploadedFile.id)}
                                          className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          {/* Footer com botões */}
          <div className="border-t border-black/6 dark:border-white/8 px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCloseDialog}
              >
                Cancelar
              </Button>
              {addDialogTab === 'manual' ? (
                <Button 
                  onClick={(e) => handleSubmit(e as any)}
                  disabled={!formData.name.trim() || !formData.content.trim() || createMutation.isPending}
                  className="gap-2"
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Adicionar Conhecimento
                    </>
                  )}
                </Button>
              ) : (
                <Button 
                  onClick={uploadFiles}
                  disabled={uploadMutation.isPending || uploadedFiles.filter(f => 
                    f.status === 'pending' && 
                    (f.isFromZip || !f.file.name.toLowerCase().endsWith('.zip'))
                  ).length === 0}
                  className="gap-2"
                >
                  {uploadMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Enviar Arquivos ({uploadedFiles.filter(f => 
                    f.status === 'pending' && 
                    (f.isFromZip || !f.file.name.toLowerCase().endsWith('.zip'))
                  ).length})
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={editDialog.isOpen} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 gap-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-black/6 dark:border-white/8">
            <DialogTitle className="flex items-center gap-2.5 text-base font-medium">
              <div className="p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                <Edit2 className="h-4 w-4 text-muted-foreground" />
              </div>
              <span>Editar Entrada de Conhecimento</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6">
            <form onSubmit={handleSubmit} className="py-4 space-y-4">
              <div>
                <Label htmlFor="edit-name" className="text-sm font-normal text-foreground mb-2 block">
                  Nome *
                </Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="ex: Padrões de Código, Conhecimento de Domínio, Diretrizes de API"
                  required
                  className="h-10"
                />
              </div>

              <div>
                <Label htmlFor="edit-usage_context" className="text-sm font-normal text-foreground mb-2 block">
                  Contexto de Uso
                </Label>
                <Select
                  value={formData.usage_context || 'always'}
                  onValueChange={(value: 'always' | 'on_request' | 'contextual') => {
                    setFormData(prev => ({ ...prev, usage_context: value }));
                  }}
                >
                  <SelectTrigger className="h-10 w-full">
                    {(() => {
                      const selected = USAGE_CONTEXT_OPTIONS.find(o => o.value === (formData.usage_context || 'always'));
                      if (selected) {
                        const Icon = selected.icon;
                        return (
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>{selected.label}</span>
                          </div>
                        );
                      }
                      return <span>Selecione...</span>;
                    })()}
                  </SelectTrigger>
                  <SelectContent className="z-[9999]">
                    <SelectItem value="always">
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5" />
                        <span>Sempre Ativo</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="on_request">
                      <div className="flex items-center gap-2">
                        <Search className="h-3.5 w-3.5" />
                        <span>Sob Demanda</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="contextual">
                      <div className="flex items-center gap-2">
                        <Bot className="h-3.5 w-3.5" />
                        <span>Contextual</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1.5">
                  {USAGE_CONTEXT_OPTIONS.find(o => o.value === formData.usage_context)?.description}
                </p>
              </div>

              <div>
                <Label htmlFor="edit-description" className="text-sm font-normal text-foreground mb-2 block">
                  Descrição
                </Label>
                <Input
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Breve descrição deste conhecimento (opcional)"
                  className="h-10"
                />
              </div>

              <div>
                <Label htmlFor="edit-content" className="text-sm font-normal text-foreground mb-2 block">
                  Conteúdo *
                </Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder={`Digite o conhecimento especializado que ${agentName} deve saber...`}
                  className="min-h-[200px] resize-y"
                  required
                />
                <div className="text-xs text-muted-foreground mt-1">
                  Aproximadamente {Math.ceil(formData.content.length / 4).toLocaleString()} tokens
                </div>
              </div>

            </form>
          </div>
          
          <div className="border-t border-black/6 dark:border-white/8 px-6 py-4">
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button 
                onClick={(e) => handleSubmit(e as any)}
                disabled={!formData.name.trim() || !formData.content.trim() || updateMutation.isPending}
                className="gap-2"
              >
                {updateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Edit2 className="h-4 w-4" />
                )}
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog open={!!deleteEntryId} onOpenChange={() => setDeleteEntryId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-destructive" />
              Excluir Entrada de Conhecimento
            </AlertDialogTitle>
            <AlertDialogDescription>
              Isso excluirá permanentemente esta entrada de conhecimento. {agentName} não terá mais acesso a essas informações.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteEntryId && handleDelete(deleteEntryId)}
              className="bg-destructive hover:bg-destructive/90"
            >
              Excluir Entrada
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </TooltipProvider>
  );
};
