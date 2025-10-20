import { LucideIcon, FilePen, Replace, Trash2, FileCode, FileSpreadsheet, File } from 'lucide-react';

export type FileOperation = 'create' | 'rewrite' | 'delete' | 'edit';

export interface OperationConfig {
  icon: LucideIcon;
  color: string;
  successMessage: string;
  progressMessage: string;
  bgColor: string;
  gradientBg: string;
  borderColor: string;
  badgeColor: string;
  hoverColor: string;
}

export const getLanguageFromFileName = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  const extensionMap: Record<string, string> = {
    // Web languages
    html: 'html',
    htm: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'scss',
    less: 'less',
    js: 'javascript',
    jsx: 'jsx',
    ts: 'typescript',
    tsx: 'tsx',
    json: 'json',
    jsonc: 'json',

    // Build and config files
    xml: 'xml',
    yml: 'yaml',
    yaml: 'yaml',
    toml: 'toml',
    ini: 'ini',
    env: 'bash',
    gitignore: 'bash',
    dockerignore: 'bash',

    // Scripting languages
    py: 'python',
    rb: 'ruby',
    php: 'php',
    go: 'go',
    java: 'java',
    kt: 'kotlin',
    c: 'c',
    cpp: 'cpp',
    h: 'c',
    hpp: 'cpp',
    cs: 'csharp',
    swift: 'swift',
    rs: 'rust',

    // Shell scripts
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    ps1: 'powershell',
    bat: 'batch',
    cmd: 'batch',

    // Markup languages (excluding markdown which has its own renderer)
    svg: 'svg',
    tex: 'latex',

    // Data formats
    graphql: 'graphql',
    gql: 'graphql',
  };

  return extensionMap[extension] || 'text';
};

export const getOperationType = (name?: string, assistantContent?: any): FileOperation => {
  if (name) {
    if (name.includes('create')) return 'create';
    if (name.includes('rewrite')) return 'rewrite';
    if (name.includes('delete')) return 'delete';
    if (name.includes('edit')) return 'edit';
  }

  if (!assistantContent) return 'create';

  // Assuming normalizeContentToString is imported from existing utils
  const contentStr = typeof assistantContent === 'string' ? assistantContent : JSON.stringify(assistantContent);
  if (!contentStr) return 'create';

  if (contentStr.includes('<create-file>')) return 'create';
  if (contentStr.includes('<full-file-rewrite>')) return 'rewrite';
  if (contentStr.includes('<edit-file>')) return 'edit';
  if (
    contentStr.includes('delete-file') ||
    contentStr.includes('<delete>')
  )
    return 'delete';

  if (contentStr.toLowerCase().includes('create file')) return 'create';
  if (contentStr.toLowerCase().includes('rewrite file'))
    return 'rewrite';
  if (contentStr.toLowerCase().includes('edit file')) return 'edit';
  if (contentStr.toLowerCase().includes('delete file')) return 'delete';

  return 'create';
};

export const getOperationConfigs = (): Record<FileOperation, OperationConfig> => {
  return {
  create: {
    icon: FilePen,
      color: 'text-green-600',
    successMessage: 'Arquivo criado com sucesso',
    progressMessage: 'Criando arquivo...',
      bgColor: 'bg-green-50',
      gradientBg: 'from-green-50 to-green-100',
      borderColor: 'border-green-200',
      badgeColor: 'bg-green-100 text-green-700 border-green-200',
      hoverColor: 'hover:bg-green-100',
    },
    edit: {
      icon: Replace,
      color: 'text-blue-600',
      successMessage: 'Arquivo editado com sucesso',
      progressMessage: 'Editando arquivo...',
      bgColor: 'bg-blue-50',
      gradientBg: 'from-blue-50 to-blue-100',
      borderColor: 'border-blue-200',
      badgeColor: 'bg-blue-100 text-blue-700 border-blue-200',
      hoverColor: 'hover:bg-blue-100',
  },
  rewrite: {
    icon: Replace,
      color: 'text-amber-600',
    successMessage: 'Arquivo reescrito com sucesso',
    progressMessage: 'Reescrevendo arquivo...',
      bgColor: 'bg-amber-50',
      gradientBg: 'from-amber-50 to-amber-100',
      borderColor: 'border-amber-200',
      badgeColor: 'bg-amber-100 text-amber-700 border-amber-200',
      hoverColor: 'hover:bg-amber-100',
  },
  delete: {
    icon: Trash2,
      color: 'text-red-600',
    successMessage: 'Arquivo deletado com sucesso',
    progressMessage: 'Deletando arquivo...',
      bgColor: 'bg-red-50',
      gradientBg: 'from-red-50 to-red-100',
      borderColor: 'border-red-200',
      badgeColor: 'bg-red-100 text-red-700 border-red-200',
      hoverColor: 'hover:bg-red-100',
  },
  };
};

export const getFileIcon = (fileName: string): LucideIcon => {
  if (fileName.endsWith('.md')) return FileCode;
  if (fileName.endsWith('.csv')) return FileSpreadsheet;
  if (fileName.endsWith('.html')) return FileCode;
  return File;
};

export const processFilePath = (filePath: string | null): string | null => {
  return filePath
    ? filePath.trim().replace(/\\n/g, '\n').split('\n')[0]
    : null;
};

export const getFileName = (processedFilePath: string | null): string => {
  return processedFilePath
    ? processedFilePath.split('/').pop() || processedFilePath
    : '';
};

export const getFileExtension = (fileName: string): string => {
  return fileName.split('.').pop()?.toLowerCase() || '';
};

export const isFileType = {
  markdown: (fileExtension: string): boolean => fileExtension === 'md',
  html: (fileExtension: string): boolean => fileExtension === 'html' || fileExtension === 'htm',
  csv: (fileExtension: string): boolean => fileExtension === 'csv',
  xlsx: (fileExtension: string): boolean => fileExtension === 'xlsx',
};

export const hasLanguageHighlighting = (language: string): boolean => {
  return language !== 'text';
};

export const splitContentIntoLines = (fileContent: string | null): string[] => {
  return fileContent
    ? fileContent.replace(/\\n/g, '\n').split('\n')
    : [];
};

// Minimal extractor for edit-file to unblock build
export const extractFileEditData = (
  assistantContent: any,
  toolContent: any,
  isSuccess: boolean,
  toolTimestamp?: string,
  assistantTimestamp?: string
) => {
  const toStr = (v: any) => (typeof v === 'string' ? v : JSON.stringify(v || ''));
  const merge = `${toStr(assistantContent)}\n${toStr(toolContent)}`;
  // Try to find file_path
  const filePathMatch = merge.match(/file_path=(?:"|')([^"']+)(?:"|')/);
  const file_path = filePathMatch ? filePathMatch[1] : null;
  // Try to find content
  const updatedMatch = merge.match(/updated_content=(?:"|')([\s\S]*?)(?:"|')/);
  const originalMatch = merge.match(/original_content=(?:"|')([\s\S]*?)(?:"|')/);
  const updatedContent = updatedMatch ? updatedMatch[1] : null;
  const originalContent = originalMatch ? originalMatch[1] : null;
  return {
    filePath: file_path,
    originalContent,
    updatedContent,
    actualIsSuccess: isSuccess,
    actualToolTimestamp: toolTimestamp,
    errorMessage: undefined as string | undefined,
  };
};

// Diff helpers (unified minimal versions)
export type DiffType = 'unchanged' | 'added' | 'removed';
export interface LineDiff { type: DiffType; oldLine: string | null; newLine: string | null; lineNumber: number }
export interface DiffStats { additions: number; deletions: number }

const parseNewlines = (text: string): string => text.replace(/\\n/g, '\n');

export const generateLineDiff = (oldText: string, newText: string): LineDiff[] => {
  const oldLines = parseNewlines(oldText || '').split('\n');
  const newLines = parseNewlines(newText || '').split('\n');
  const out: LineDiff[] = [];
  const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i++) {
    const o = i < oldLines.length ? oldLines[i] : null;
    const n = i < newLines.length ? newLines[i] : null;
    if (o === n) out.push({ type: 'unchanged', oldLine: o, newLine: n, lineNumber: i + 1 });
    else {
      if (o !== null) out.push({ type: 'removed', oldLine: o, newLine: null, lineNumber: i + 1 });
      if (n !== null) out.push({ type: 'added', oldLine: null, newLine: n, lineNumber: i + 1 });
    }
  }
  return out;
};

export const calculateDiffStats = (lineDiff: LineDiff[]): DiffStats => ({
  additions: lineDiff.filter(l => l.type === 'added').length,
  deletions: lineDiff.filter(l => l.type === 'removed').length,
});