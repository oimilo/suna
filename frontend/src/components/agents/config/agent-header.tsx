import React from 'react';
import { Sparkles, Settings } from 'lucide-react';
// import { EditableText } from '@/components/ui/editable';
// import { StylePicker } from '../style-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BRANDING } from '@/lib/branding';
// import { BrandLogo } from '@/components/sidebar/brand-logo';
import { usePtTranslations } from '@/hooks/use-pt-translations';
// import { Button } from '@/components/ui/button';
// import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AgentHeaderProps {
  agentId: string;
  displayData: {
    name: string;
    description?: string;
  };
  currentStyle: {
    avatar: string;
    color: string;
  };
  isViewingOldVersion: boolean;
  onFieldChange: (field: string, value: any) => void;
  onStyleChange: (emoji: string, color: string) => void;
  agentMetadata?: {
    is_suna_default?: boolean;
    restrictions?: {
      name_editable?: boolean;
    };
  };
  // isPinned?: boolean;
  // setIsPinned?: (pinned: boolean) => void;
  activeTab?: string;
  onTabChange?: (value: string) => void;
}

export function AgentHeader({
  agentId,
  displayData,
  currentStyle,
  isViewingOldVersion,
  onFieldChange,
  onStyleChange,
  agentMetadata,
  // isPinned,
  // setIsPinned,
  activeTab,
  onTabChange,
}: AgentHeaderProps) {
  const { t } = usePtTranslations();
  const isSunaAgent = agentMetadata?.is_suna_default || false;
  console.log('isSunaAgent', isSunaAgent);
  const restrictions = agentMetadata?.restrictions || {};
  const isNameEditable = !isViewingOldVersion && (restrictions.name_editable !== false);
  
  const handleNameChange = (value: string) => {
    if (!isNameEditable && isSunaAgent) {
      toast.error("Nome não pode ser editado", {
        description: `O nome do ${BRANDING.name} é gerenciado centralmente e não pode ser alterado.`,
      });
      return;
    }
    onFieldChange('name', value);
  };
  return (
    <div className="mb-4">
      {/* Tabs for switching modes */}
      {activeTab && onTabChange && (
        <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
          <TabsList className="h-9 bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 p-1 grid grid-cols-2">
            <TabsTrigger 
              value="agent-builder" 
              className="text-xs data-[state=active]:bg-background data-[state=active]:border data-[state=active]:border-black/6 dark:data-[state=active]:border-white/8 transition-all duration-200"
            >
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Prompt para Construir
            </TabsTrigger>
            <TabsTrigger 
              value="configuration" 
              className="text-xs data-[state=active]:bg-background data-[state=active]:border data-[state=active]:border-black/6 dark:data-[state=active]:border-white/8 transition-all duration-200"
            >
              <Settings className="h-3.5 w-3.5 mr-1.5" />
              Config Manual
            </TabsTrigger>
          </TabsList>
        </Tabs>
      )}
    </div>
  );
} 