'use client';

import { useState, useEffect } from 'react';

export function useSidebarSafe() {
  const [state, setState] = useState<'expanded' | 'collapsed'>('collapsed');
  const [open, setOpen] = useState(true);
  const [openMobile, setOpenMobile] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      const storedState = localStorage.getItem('sidebar:state');
      if (storedState === 'true') {
        setState('expanded');
      } else {
        setState('collapsed');
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return {
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile: false,
    toggleSidebar: () => {
      const newState = state === 'expanded' ? 'collapsed' : 'expanded';
      setState(newState);
      localStorage.setItem('sidebar:state', String(newState === 'expanded'));
    }
  };
}