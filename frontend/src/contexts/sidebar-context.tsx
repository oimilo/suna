'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface SidebarContextType {
  isPinned: boolean;
  setIsPinned: (pinned: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isPinned, setIsPinnedState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sidebar:pinned') === 'true';
    }
    return false;
  });

  const setIsPinned = (pinned: boolean) => {
    setIsPinnedState(pinned);
    localStorage.setItem('sidebar:pinned', String(pinned));
  };

  return (
    <SidebarContext.Provider value={{ isPinned, setIsPinned }}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarContext() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
}