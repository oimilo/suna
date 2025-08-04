'use client';

import React, { createContext, useContext } from 'react';

// Fake sidebar context for components outside the dashboard
const FakeSidebarContext = createContext({
  isPinned: false,
  setIsPinned: () => {},
  isOpen: false,
  setIsOpen: () => {},
});

export const FakeSidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <FakeSidebarContext.Provider 
      value={{
        isPinned: false,
        setIsPinned: () => {},
        isOpen: false,
        setIsOpen: () => {},
      }}
    >
      {children}
    </FakeSidebarContext.Provider>
  );
};

export const useFakeSidebarContext = () => useContext(FakeSidebarContext);