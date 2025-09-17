'use client';

import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const SearchBar = ({ placeholder, value, onChange, className = '' }: SearchBarProps) => {
  return (
    <div className={`relative flex-1 max-w-md ${className}`}>
      <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground opacity-60" />
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 h-10 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border-black/6 dark:border-white/8 focus:border-black/10 dark:focus:border-white/12 transition-all"
      />
    </div>
  );
}; 