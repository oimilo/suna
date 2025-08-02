import React from 'react';
import { Sparkles, Settings, PanelLeft } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EditableText } from '@/components/ui/editable';
import { StylePicker } from '../style-picker';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { BRANDING } from '@/lib/branding';
import { BrandLogo } from '@/components/sidebar/brand-logo';
import { usePtTranslations } from '@/hooks/use-pt-translations';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

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
  activeTab: string;
  isViewingOldVersion: boolean;
  onFieldChange: (field: string, value: any) => void;
  onStyleChange: (emoji: string, color: string) => void;
  onTabChange: (value: string) => void;
  agentMetadata?: {
    is_suna_default?: boolean;
    restrictions?: {
      name_editable?: boolean;
    };
  };
  isPinned?: boolean;
  setIsPinned?: (pinned: boolean) => void;
}

export function AgentHeader({
  agentId,
  displayData,
  currentStyle,
  activeTab,
  isViewingOldVersion,
  onFieldChange,
  onStyleChange,
  onTabChange,
  agentMetadata,
  isPinned,
  setIsPinned,
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
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
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
        <div className="relative">
          {isSunaAgent ? (
            <div className="h-9 w-9 bg-background rounded-lg bg-muted border border flex items-center justify-center">
              <BrandLogo size={16} />
            </div>
          ) : (
            <StylePicker
              currentEmoji={currentStyle.avatar}
              currentColor={currentStyle.color}
              onStyleChange={onStyleChange}
              agentId={agentId}
            >
              <div 
                className="h-9 w-9 rounded-lg flex items-center justify-center shadow-sm ring-1 ring-black/5 hover:ring-black/10 transition-all duration-200 cursor-pointer"
                style={{ backgroundColor: currentStyle.color }}
              >
                <div className="text-lg font-medium">{currentStyle.avatar}</div>
              </div>
            </StylePicker>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <EditableText
            value={displayData.name}
            onSave={handleNameChange}
            className={cn(
              "text-lg font-semibold bg-transparent text-foreground placeholder:text-muted-foreground",
              !isNameEditable && isSunaAgent && "cursor-not-allowed opacity-75"
            )}
            placeholder="Nome do agente..."
            disabled={!isNameEditable}
          />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={onTabChange}>
        <TabsList className="grid grid-cols-2 bg-muted/50 h-9">
          <TabsTrigger 
            value="agent-builder"
            disabled={isViewingOldVersion}
            className={cn(
              "flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm",
              isViewingOldVersion && "opacity-50 cursor-not-allowed"
            )}
          >
            <Sparkles className="h-3 w-3" />
            {t('agents.promptToConfig')}
          </TabsTrigger>
          <TabsTrigger 
            value="configuration"
            className="flex items-center gap-2 text-sm data-[state=active]:bg-background data-[state=active]:shadow-sm"
          >
            <Settings className="h-3 w-3" />
            {t('agents.manualConfig')}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
} 