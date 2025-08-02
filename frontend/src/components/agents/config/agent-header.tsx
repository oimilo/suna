import React from 'react';
import { PanelLeft, Sparkles, Settings } from 'lucide-react';
import { EditableText } from '@/components/ui/editable';
import { StylePicker } from '../style-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BRANDING } from '@/lib/branding';
import { BrandLogo } from '@/components/sidebar/brand-logo';
import { usePtTranslations } from '@/hooks/use-pt-translations';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  isPinned?: boolean;
  setIsPinned?: (pinned: boolean) => void;
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
  isPinned,
  setIsPinned,
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
      <div className="flex items-center justify-between">
        {/* Sidepanel button */}
        {setIsPinned && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsPinned(!isPinned)}
                className="h-8 w-8"
              >
                <PanelLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isPinned ? 'Desacoplar' : 'Acoplar'}
            </TooltipContent>
          </Tooltip>
        )}
        
        {/* Tabs for switching modes */}
        {activeTab && onTabChange && (
          <Tabs value={activeTab} onValueChange={onTabChange} className="mx-auto">
            <TabsList className="h-8 bg-muted/50">
              <TabsTrigger value="agent-builder" className="text-xs data-[state=active]:bg-background">
                <Sparkles className="h-3 w-3 mr-1" />
                Prompt para Construir
              </TabsTrigger>
              <TabsTrigger value="configuration" className="text-xs data-[state=active]:bg-background">
                <Settings className="h-3 w-3 mr-1" />
                Config Manual
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        
        {/* Spacer to balance the layout */}
        <div className="w-8" />
      </div>
    </div>
  );
} 