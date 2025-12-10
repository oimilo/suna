'use client';

import { Navbar } from '@/components/home/sections/navbar';
import { useEffect } from 'react';

export default function HomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    // Force dark mode on landing page
    const originalClass = document.documentElement.className;
    document.documentElement.classList.add('dark');
    
    // Cleanup function to restore original theme when leaving landing page
    return () => {
      document.documentElement.className = originalClass;
    };
  }, []);

  return (
    <div className="w-full relative dark">
      <Navbar />
      {children}
    </div>
  );
}
