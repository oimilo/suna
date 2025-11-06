import { extractToolData, extractSearchQuery, extractSearchResults } from '../utils';

export interface WebSearchData {
  query: string | null;
  results: Array<{ title: string; url: string; snippet?: string }>;
  answer: string | null;
  images: string[];
  success?: boolean;
  timestamp?: string;
}

const parseContent = (content: any): any => {
  if (typeof content === 'string') {
    try {
      return JSON.parse(content);
    } catch (e) {
      return content; 
    }
  }
  return content;
};

const extractFromNewFormat = (content: any): WebSearchData => {
  const parsedContent = parseContent(content);
  
  if (!parsedContent || typeof parsedContent !== 'object') {
    return { query: null, results: [], answer: null, images: [], success: undefined, timestamp: undefined };
  }

  if ('tool_execution' in parsedContent && typeof parsedContent.tool_execution === 'object') {
    const toolExecution = parsedContent.tool_execution;
    const args = toolExecution.arguments || {};
    
    let parsedOutput = toolExecution.result?.output;
    if (typeof parsedOutput === 'string') {
      try {
        parsedOutput = JSON.parse(parsedOutput);
      } catch (e) {
      }
    }
    parsedOutput = parsedOutput || {};

    const extractedData = {
      query: args.query || parsedOutput?.query || null,
      results: parsedOutput?.results?.map((result: any) => ({
        title: result.title || '',
        url: result.url || '',
        snippet: result.content || result.snippet || ''
      })) || [],
      answer: parsedOutput?.answer || null,
      images: parsedOutput?.images || [],
      success: toolExecution.result?.success,
      timestamp: toolExecution.execution_details?.timestamp
    };
    return extractedData;
  }

  if ('role' in parsedContent && 'content' in parsedContent) {
    return extractFromNewFormat(parsedContent.content);
  }

  return { query: null, results: [], answer: null, images: [], success: undefined, timestamp: undefined };
};


const extractFromLegacyFormat = (content: any): Omit<WebSearchData, 'success' | 'timestamp'> => {
  const toolData = extractToolData(content);
  
  if (toolData.toolResult) {
    const args = toolData.arguments || {};
    return {
      query: toolData.query || args.query || null,
      results: [], 
      answer: null,
      images: []
    };
  }

  const legacyQuery = extractSearchQuery(content);
  
  return {
    query: legacyQuery,
    results: [],
    answer: null,
    images: []
  };
};

export function extractWebSearchData(
  assistantContent: any,
  toolContent: any,
  isSuccess: boolean,
  toolTimestamp?: string,
  assistantTimestamp?: string
): {
  query: string | null;
  searchResults: Array<{ title: string; url: string; snippet?: string }>;
  answer: string | null;
  images: string[];
  actualIsSuccess: boolean;
  actualToolTimestamp?: string;
  actualAssistantTimestamp?: string;
} {
  let query: string | null = null;
  let searchResults: Array<{ title: string; url: string; snippet?: string }> = [];
  let answer: string | null = null;
  let images: string[] = [];
  let actualIsSuccess = isSuccess;
  let actualToolTimestamp = toolTimestamp;
  let actualAssistantTimestamp = assistantTimestamp;

  const toNullableString = (value: unknown): string | null => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch (error) {
      try {
        return String(value);
      } catch (stringError) {
        return null;
      }
    }
  };

  const sanitizeResult = (result: any) => {
    if (!result || typeof result !== 'object') {
      return {
        title: '',
        url: '',
        snippet: undefined,
      };
    }

    return {
      title: toNullableString(result.title) ?? '',
      url: toNullableString(result.url) ?? '',
      snippet: toNullableString(result.content ?? result.snippet ?? undefined) ?? undefined,
    };
  };

  const assistantNewFormat = extractFromNewFormat(assistantContent);
  const toolNewFormat = extractFromNewFormat(toolContent);

  if (assistantNewFormat.query || assistantNewFormat.results.length > 0) {
    query = toNullableString(assistantNewFormat.query);
    searchResults = assistantNewFormat.results.map(sanitizeResult);
    answer = toNullableString(assistantNewFormat.answer);
    images = Array.isArray(assistantNewFormat.images)
      ? assistantNewFormat.images.filter((image: unknown) => typeof image === 'string' && image.trim().length > 0)
      : [];
    if (assistantNewFormat.success !== undefined) {
      actualIsSuccess = assistantNewFormat.success;
    }
    if (assistantNewFormat.timestamp) {
      actualAssistantTimestamp = assistantNewFormat.timestamp;
    }
  } else if (toolNewFormat.query || toolNewFormat.results.length > 0) {
    query = toNullableString(toolNewFormat.query);
    searchResults = toolNewFormat.results.map(sanitizeResult);
    answer = toNullableString(toolNewFormat.answer);
    images = Array.isArray(toolNewFormat.images)
      ? toolNewFormat.images.filter((image: unknown) => typeof image === 'string' && image.trim().length > 0)
      : [];
    if (toolNewFormat.success !== undefined) {
      actualIsSuccess = toolNewFormat.success;
    }
    if (toolNewFormat.timestamp) {
      actualToolTimestamp = toolNewFormat.timestamp;
    }
  } else {
    const assistantLegacy = extractFromLegacyFormat(assistantContent);
    const toolLegacy = extractFromLegacyFormat(toolContent);

    query = toNullableString(assistantLegacy.query || toolLegacy.query);
    
    const legacyResults = extractSearchResults(toolContent);
    searchResults = legacyResults.map(sanitizeResult);
    
    if (toolContent) {
      try {
        let parsedContent;
        if (typeof toolContent === 'string') {
          parsedContent = JSON.parse(toolContent);
        } else if (typeof toolContent === 'object' && toolContent !== null) {
          parsedContent = toolContent;
        } else {
          parsedContent = {};
        }

        if (parsedContent.answer) {
          answer = toNullableString(parsedContent.answer);
        }
        if (parsedContent.images && Array.isArray(parsedContent.images)) {
          images = parsedContent.images.filter((image: unknown) => typeof image === 'string' && image.trim().length > 0);
        }
      } catch (e) {
      }
    }
  }

  if (!query) {
    query = toNullableString(
      extractSearchQuery(assistantContent) || extractSearchQuery(toolContent),
    );
  }
  
  if (searchResults.length === 0) {
    const fallbackResults = extractSearchResults(toolContent);
    searchResults = fallbackResults.map(sanitizeResult);
  }

  return {
    query,
    searchResults,
    answer,
    images,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp
  };
} 