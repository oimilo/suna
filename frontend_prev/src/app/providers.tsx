'use client';

import { createContext, useState, type ReactNode } from 'react';
import { dehydrate, QueryClient } from '@tanstack/react-query';

import { AuthProvider } from '@/components/AuthProvider';
import { ReactQueryProvider } from '@/providers/react-query-provider';
import { BillingProvider } from '@/contexts/BillingContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { DeleteOperationProvider } from '@/contexts/DeleteOperationContext';

export interface ParsedTag {
  tagName: string;
  attributes: Record<string, string>;
  content: string;
  isClosing: boolean;
  id: string;
  rawMatch?: string;
  timestamp?: number;
  resultTag?: ParsedTag;
  isToolCall?: boolean;
  isPaired?: boolean;
  status?: 'running' | 'completed' | 'error';
  vncPreview?: string;
}

export const ToolCallsContext = createContext<{
  toolCalls: ParsedTag[];
  setToolCalls: React.Dispatch<React.SetStateAction<ParsedTag[]>>;
}>({
  toolCalls: [],
  setToolCalls: () => undefined,
});

export function Providers({ children }: { children: ReactNode }) {
  const [toolCalls, setToolCalls] = useState<ParsedTag[]>([]);
  const queryClient = new QueryClient();
  const dehydratedState = dehydrate(queryClient);

  return (
    <AuthProvider>
      <ToolCallsContext.Provider value={{ toolCalls, setToolCalls }}>
        <ReactQueryProvider dehydratedState={dehydratedState}>
          <BillingProvider>
            <SubscriptionProvider>
              <DeleteOperationProvider>
                {children}
              </DeleteOperationProvider>
            </SubscriptionProvider>
          </BillingProvider>
        </ReactQueryProvider>
      </ToolCallsContext.Provider>
    </AuthProvider>
  );
}


