import type { ApiMessageType } from '@/components/thread/types';
import { extractFilePathsFromToolContent } from './tool-views/utils';

export interface ToolCallInput {
  assistantCall: {
    content?: string;
    name?: string;
    timestamp?: string;
  };
  toolResult?: {
    content?: string;
    isSuccess?: boolean;
    timestamp?: string;
  };
  messages?: ApiMessageType[];
}

export const FILE_PATTERNS = {
  web: ['index.html', 'home.html', 'main.html', 'app.html'],
  game: ['game.html', 'play.html', 'index.html', 'main.js'],
  python: ['main.py', 'app.py', 'server.py', 'bot.py', 'script.py'],
  node: ['index.js', 'app.js', 'server.js', 'main.js', 'index.ts'],
  dashboard: ['dashboard.html', 'admin.html', 'panel.html', 'index.html'],
  api: ['webhook.js', 'api.py', 'handler.js', 'function.js'],
  presentation: ['metadata.json'],
  landing: ['landing.html', 'landing_page.html', 'landing-page.html', 'homepage.html'],
} as const;

export const MAIN_FILE_NAME_SET = new Set(
  Object.values(FILE_PATTERNS)
    .flat()
    .map(name => name.toLowerCase()),
);

export const AUXILIARY_FILE_NAMES = [
  'style.css',
  'styles.css',
  'config.js',
  'config.json',
  'package.json',
  'requirements.txt',
  '.env',
  '.gitignore',
  'readme.md',
  'dockerfile',
  'docker-compose.yml',
  'tsconfig.json',
  'webpack.config.js',
  'babel.config.js',
];

export const AUXILIARY_FILE_NAME_SET = new Set(
  AUXILIARY_FILE_NAMES.map(name => name.toLowerCase()),
);

export const MAIN_FILE_TOOL_NAMES = new Set([
  'create-file',
  'full-file-rewrite',
  'edit-file',
  'str-replace-editor',
  'str-replace',
  'create-slide',
  'validate-slide',
]);

export const MAIN_FILE_KEYWORDS = ['index', 'main', 'landing', 'home', 'app', 'dashboard', 'page', 'start'];

export const NEGATIVE_FILE_KEYWORDS = ['test', 'spec', 'mock', 'draft', 'backup', 'placeholder'];

export const EXTENSION_PRIORITIES: Record<string, number> = {
  html: 140,
  htm: 130,
  tsx: 120,
  jsx: 115,
  ts: 105,
  js: 100,
  py: 95,
  ipynb: 90,
  mdx: 75,
  md: 70,
  php: 70,
  java: 65,
  rs: 60,
  go: 60,
  rb: 60,
  swift: 60,
  kt: 60,
  vue: 110,
  svelte: 110,
  css: 55,
  scss: 55,
  json: 45,
};

export const MAIN_FILE_SCORE_THRESHOLD = 90;

export const DEBUG_MAIN_FILE = process.env.NODE_ENV !== 'production';

export const logMainFileDebug = (...args: unknown[]) => {
  if (DEBUG_MAIN_FILE) {
    console.debug('[workspace:main-file]', ...args);
  }
};

export type MainFileCandidate = {
  index: number;
  totalCalls: number;
  fileName: string;
  filePath: string | null;
  toolName: string;
};

export const normalizeToolName = (name: string): string => name.replace(/_/g, '-').toLowerCase();

export const isPresentationMainFileName = (fileName: string): boolean =>
  /^slide_\d+\.html$/i.test(fileName) || fileName.toLowerCase() === 'metadata.json';

export const computeMainFileScore = ({
  index,
  totalCalls,
  fileName,
  filePath,
  toolName,
}: MainFileCandidate): number => {
  let score = 0;
  const contributions: Array<{ reason: string; value: number }> = [];
  const recordContribution = (value: number, reason: string) => {
    if (value === 0) return;
    score += value;
    if (DEBUG_MAIN_FILE) {
      contributions.push({ reason, value });
    }
  };

  const lowerName = fileName.toLowerCase();
  const extension = lowerName.split('.').pop() ?? '';

  recordContribution(EXTENSION_PRIORITIES[extension] ?? 20, `extension:${extension || 'unknown'}`);

  if (MAIN_FILE_NAME_SET.has(lowerName)) {
    recordContribution(80, 'known-main-file-name');
  }

  if (isPresentationMainFileName(fileName)) {
    recordContribution(160, 'presentation-main-file');
  }

  MAIN_FILE_KEYWORDS.forEach(keyword => {
    if (lowerName.includes(keyword)) {
      recordContribution(25, `keyword:${keyword}`);
    }
  });

  NEGATIVE_FILE_KEYWORDS.forEach(keyword => {
    if (lowerName.includes(keyword)) {
      recordContribution(-50, `negative-keyword:${keyword}`);
    }
  });

  if (AUXILIARY_FILE_NAME_SET.has(lowerName)) {
    recordContribution(-80, 'auxiliary-file');
  }

  const sanitizedPath = filePath ?? '';
  const pathSegments = sanitizedPath
    .split('/')
    .filter(segment => segment.length > 0);

  if (pathSegments.length > 0) {
    const depthPenalty = Math.max(0, pathSegments.length - 1);
    const depthBonus = Math.max(0, 40 - depthPenalty * 12);
    recordContribution(depthBonus, `path-depth:${pathSegments.length}`);

    if (/^public\//.test(sanitizedPath)) {
      recordContribution(10, 'public-directory');
    }

    if (/(^|\/)(tests?|__tests__|spec|__pycache__|migrations?|archive)(\/|$)/i.test(sanitizedPath)) {
      recordContribution(-70, 'test-or-non-deliverable-directory');
    }
  } else {
    recordContribution(30, 'root-directory');
  }

  switch (toolName) {
    case 'create-file':
      recordContribution(40, 'tool:create-file');
      break;
    case 'full-file-rewrite':
      recordContribution(35, 'tool:full-file-rewrite');
      break;
    case 'edit-file':
      recordContribution(20, 'tool:edit-file');
      break;
    case 'str-replace':
    case 'str-replace-editor':
      recordContribution(10, 'tool:str-replace');
      break;
    case 'create-slide':
      recordContribution(30, 'tool:create-slide');
      break;
    case 'validate-slide':
      recordContribution(15, 'tool:validate-slide');
      break;
    default:
      break;
  }

  const normalizedIndex = totalCalls > 1 ? index / (totalCalls - 1) : 1;
  const recencyBonus = Math.max(0, Math.min(30, normalizedIndex * 30));
  recordContribution(recencyBonus, 'recency');

  if (DEBUG_MAIN_FILE) {
    logMainFileDebug('score-breakdown', {
      toolName,
      fileName,
      filePath,
      index,
      totalCalls,
      score,
      contributions,
    });
  }

  return score;
};

export const extractFileNameFromContent = (rawContent: any): string | null => {
  if (!rawContent) {
    return null;
  }

  let content = '';

  if (typeof rawContent === 'string') {
    try {
      const parsed = JSON.parse(rawContent);
      if (parsed.content) {
        content = typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content);
      } else {
        content = rawContent;
      }
    } catch {
      content = rawContent;
    }
  } else if (typeof rawContent === 'object') {
    if (rawContent.content) {
      content = typeof rawContent.content === 'string' ? rawContent.content : JSON.stringify(rawContent.content);
    } else {
      content = JSON.stringify(rawContent);
    }
  }

  const patterns = [
    /<parameter name="file_path">([^<]+)<\/parameter>/,
    /<parameter name="target_file">([^<]+)<\/parameter>/,
    /<parameter name="file-path">([^<]+)<\/parameter>/,
    /<parameter name="target-file">([^<]+)<\/parameter>/,
    /file_path["\s:=]+["']([^"']+)["']/,
    /target_file["\s:=]+["']([^"']+)["']/,
    /file-path["\s:=]+["']([^"']+)["']/,
    /target-file["\s:=]+["']([^"']+)["']/,
    /"file_path"\s*:\s*"([^"]+)"/,
    /"target_file"\s*:\s*"([^"]+)"/,
    /"file-path"\s*:\s*"([^"]+)"/,
    /"target-file"\s*:\s*"([^"]+)"/,
  ];

  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      const fullPath = match[1];
      const fileName = fullPath.split('/').pop() || fullPath.split('\\').pop() || fullPath;
      return fileName;
    }
  }

  return null;
};

export const extractToolCallFileInfo = (
  toolCall: ToolCallInput,
): { fileName: string | null; filePath: string | null } => {
  const assistantFileName = extractFileNameFromContent(toolCall.assistantCall?.content);
  if (assistantFileName) {
    return { fileName: assistantFileName, filePath: null };
  }

  const resultContent = toolCall.toolResult?.content;
  if (resultContent && resultContent !== 'STREAMING') {
    const detectedPaths = extractFilePathsFromToolContent(resultContent);
    if (detectedPaths.length > 0) {
      const normalizedPath = detectedPaths[0];
      const derivedName =
        normalizedPath.split('/').pop() ||
        normalizedPath.split('\\').pop() ||
        normalizedPath;

      return {
        fileName: derivedName,
        filePath: normalizedPath,
      };
    }

    const fallbackName = extractFileNameFromContent(resultContent);
    if (fallbackName) {
      return { fileName: fallbackName, filePath: null };
    }
  }

  return { fileName: null, filePath: null };
};

export const isMainFileName = (fileName: string): boolean => {
  const normalized = fileName.toLowerCase();
  if (MAIN_FILE_NAME_SET.has(normalized) || isPresentationMainFileName(fileName)) {
    return true;
  }

  return MAIN_FILE_KEYWORDS.some(keyword => normalized.includes(keyword));
};

const isExcludedFileName = (fileName: string): boolean => {
  const normalized = fileName.toLowerCase();
  return (
    AUXILIARY_FILE_NAME_SET.has(normalized) ||
    normalized.includes('test.') ||
    normalized.includes('spec.') ||
    normalized.includes('_test.') ||
    normalized.includes('.test.')
  );
};

export const detectMainFileIndex = (calls: ToolCallInput[]): number => {
  const totalCalls = calls.length;
  if (!totalCalls) {
    return -1;
  }

  const candidates = calls
    .map((tc, idx) => ({ tc, idx }))
    .filter(({ tc, idx }) => {
      const name = tc.assistantCall?.name;
      if (!name) {
        logMainFileDebug('candidate-skip', {
          reason: 'missing-tool-name',
          index: idx,
        });
        return false;
      }
      const normalized = normalizeToolName(name);
      return MAIN_FILE_TOOL_NAMES.has(normalized);
    })
    .map(({ tc, idx }) => {
      const normalizedName = normalizeToolName(tc.assistantCall?.name ?? '');
      const { fileName, filePath } = extractToolCallFileInfo(tc);
      return { idx, normalizedName, fileName, filePath };
    })
    .filter(candidate => {
      if (!candidate.fileName) {
        logMainFileDebug('candidate-skip', {
          reason: 'missing-file-name',
          index: candidate.idx,
          toolName: candidate.normalizedName,
        });
        return false;
      }
      if (isExcludedFileName(candidate.fileName)) {
        logMainFileDebug('candidate-skip', {
          reason: 'auxiliary-or-test-file',
          index: candidate.idx,
          toolName: candidate.normalizedName,
          fileName: candidate.fileName,
        });
        return false;
      }
      return true;
    })
    .map(candidate => {
      const score = computeMainFileScore({
        index: candidate.idx,
        totalCalls,
        fileName: candidate.fileName as string,
        filePath: candidate.filePath ?? null,
        toolName: candidate.normalizedName,
      });
      const payload = { ...candidate, score };
      logMainFileDebug('candidate-evaluated', {
        index: candidate.idx,
        toolName: candidate.normalizedName,
        fileName: candidate.fileName,
        filePath: candidate.filePath,
        score,
      });
      return payload;
    })
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    logMainFileDebug('main-file-result', {
      decision: 'no-candidates',
    });
    return -1;
  }

  const bestCandidate = candidates[0];

  if (bestCandidate.score >= MAIN_FILE_SCORE_THRESHOLD) {
    logMainFileDebug('main-file-result', {
      decision: 'threshold-met',
      index: bestCandidate.idx,
      toolName: bestCandidate.normalizedName,
      fileName: bestCandidate.fileName,
      filePath: bestCandidate.filePath,
      score: bestCandidate.score,
    });
    return bestCandidate.idx;
  }

  const fallbackIndexHtml = candidates.find(candidate => candidate.fileName?.toLowerCase() === 'index.html');
  if (fallbackIndexHtml) {
    logMainFileDebug('main-file-result', {
      decision: 'fallback-index-html',
      index: fallbackIndexHtml.idx,
      toolName: fallbackIndexHtml.normalizedName,
      fileName: fallbackIndexHtml.fileName,
      filePath: fallbackIndexHtml.filePath,
      score: fallbackIndexHtml.score,
    });
    return fallbackIndexHtml.idx;
  }

  logMainFileDebug('main-file-result', {
    decision: 'threshold-not-met',
    index: bestCandidate.idx,
    toolName: bestCandidate.normalizedName,
    fileName: bestCandidate.fileName,
    filePath: bestCandidate.filePath,
    score: bestCandidate.score,
    threshold: MAIN_FILE_SCORE_THRESHOLD,
  });

  return -1;
};

interface StreamingAutoOpenContext {
  index?: number;
  totalCalls?: number;
}

export const shouldAutoOpenForStreaming = (
  toolName: string,
  formattedContent: string | undefined,
  context: StreamingAutoOpenContext = {},
): {
  shouldOpen: boolean;
  fileName?: string;
  filePath?: string | null;
  score?: number;
  reason: string;
} => {
  const normalizedName = normalizeToolName(toolName);
  if (!MAIN_FILE_TOOL_NAMES.has(normalizedName)) {
    return { shouldOpen: false, reason: 'non-main-tool' };
  }

  const pseudoCall: ToolCallInput = {
    assistantCall: {
      name: toolName,
      content: formattedContent,
    },
    toolResult: undefined,
  };

  const { fileName, filePath } = extractToolCallFileInfo(pseudoCall);

  if (!fileName) {
    return { shouldOpen: false, reason: 'missing-file-name' };
  }

  if (isExcludedFileName(fileName)) {
    return { shouldOpen: false, reason: 'auxiliary-or-test-file', fileName, filePath };
  }

  const index = context.index ?? 0;
  const totalCalls = context.totalCalls ?? Math.max(index + 1, 1);

  const score = computeMainFileScore({
    index,
    totalCalls,
    fileName,
    filePath: filePath ?? null,
    toolName: normalizedName,
  });

  const passesScore = score >= MAIN_FILE_SCORE_THRESHOLD;
  const nameMatch = isMainFileName(fileName);
  const baseShouldOpen = passesScore || nameMatch;

  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  const prioritizedExtensions = new Set(['html', 'htm', 'tsx', 'jsx', 'mdx']);
  const extensionBoost =
    !baseShouldOpen && prioritizedExtensions.has(extension) &&
    (normalizedName === 'create-file' || normalizedName === 'full-file-rewrite');

  const shouldOpen = baseShouldOpen || extensionBoost;

  logMainFileDebug('streaming-auto-open-check', {
    toolName: normalizedName,
    fileName,
    filePath,
    score,
    passesScore,
    nameMatch,
    extensionBoost,
    shouldOpen,
  });

  return {
    shouldOpen,
    fileName,
    filePath,
    score,
    reason: shouldOpen
      ? (passesScore
        ? 'score-threshold'
        : nameMatch
          ? 'name-keyword'
          : 'priority-extension')
      : 'score-too-low',
  };
};


