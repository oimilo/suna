'use client';

import React from 'react';
import { Bot, ShoppingBag, Plus } from 'lucide-react';
import { FancyTabs, TabConfig } from '@/components/ui/fancy-tabs';
import { Button } from '@/components/ui/button';

interface TabsNavigationProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  onCreateAgent?: () => void;
}

const agentTabs: TabConfig[] = [
  {
    value: 'marketplace',
    icon: ShoppingBag,
    label: 'Explorar',
    shortLabel: 'Explorar',
  },
  {
    value: 'my-agents',
    icon: Bot,
    label: 'Meus Agentes',
  },
]; 

export const TabsNavigation = ({ activeTab, onTabChange, onCreateAgent }: TabsNavigationProps) => {
  return (
    <div className="flex items-center justify-center relative">
      <FancyTabs
        tabs={agentTabs}
        activeTab={activeTab}
        onTabChange={onTabChange}
      />
      {onCreateAgent && (
        <div className="absolute right-0">
          <Button
            onClick={onCreateAgent}
            className="h-10 px-5 bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black rounded-lg transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="font-medium">Criar Agente</span>
          </Button>
        </div>
      )}
    </div>
  );
}