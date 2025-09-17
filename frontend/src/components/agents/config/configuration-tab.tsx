import React from 'react';
import { Settings, Wrench, Server, BookOpen, Workflow, Zap } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ExpandableMarkdownEditor } from '@/components/ui/expandable-markdown-editor';
import { AgentToolsConfiguration } from '../agent-tools-configuration';
import { AgentMCPConfiguration } from '../agent-mcp-configuration';
import { AgentKnowledgeBaseManager } from '../knowledge-base/agent-knowledge-base-manager';
import { AgentWorkflowsConfiguration } from '../workflows/agent-workflows-configuration';
import { AgentTriggersConfiguration } from '../triggers/agent-triggers-configuration';
import { toast } from 'sonner';
import { BRANDING } from '@/lib/branding';
import { BrandLogo } from '../../sidebar/brand-logo';

interface ConfigurationTabProps {
  agentId: string;
  displayData: {
    name: string;
    description: string;
    system_prompt: string;
    agentpress_tools: any;
    configured_mcps: any[];
    custom_mcps: any[];
    is_default: boolean;
    avatar: string;
    avatar_color: string;
  };
  versionData?: {
    version_id: string;
    configured_mcps: any[];
    custom_mcps: any[];
    system_prompt: string;
    agentpress_tools: any;
  };
  isViewingOldVersion: boolean;
  onFieldChange: (field: string, value: any) => void;
  onMCPChange: (updates: { configured_mcps: any[]; custom_mcps: any[] }) => void;
  initialAccordion?: string;
  agentMetadata?: {
    is_suna_default?: boolean;
    centrally_managed?: boolean;
    restrictions?: {
      system_prompt_editable?: boolean;
      tools_editable?: boolean;
      name_editable?: boolean;
      description_editable?: boolean;
      mcps_editable?: boolean;
    };
  };
}

export function ConfigurationTab({
  agentId,
  displayData,
  versionData,
  isViewingOldVersion,
  onFieldChange,
  onMCPChange,
  initialAccordion,
  agentMetadata,
}: ConfigurationTabProps) {
  const isSunaAgent = agentMetadata?.is_suna_default || false;
  
  const mapAccordion = (val?: string) => {
    if (val === 'instructions') return 'system';
    if (isSunaAgent && (val === 'system' || val === 'tools')) {
      return 'integrations';
    }
    if (['system', 'tools', 'integrations', 'knowledge', 'workflows', 'triggers'].includes(val || '')) {
      return val!;
    }
    return isSunaAgent ? 'integrations' : 'system';
  };
  
  const [openAccordion, setOpenAccordion] = React.useState<string>(mapAccordion(initialAccordion));
  React.useEffect(() => {
    if (initialAccordion) {
      setOpenAccordion(mapAccordion(initialAccordion));
    }
  }, [initialAccordion]);
  const restrictions = agentMetadata?.restrictions || {};
  
  const isSystemPromptEditable = !isViewingOldVersion && (restrictions.system_prompt_editable !== false);
  const areToolsEditable = !isViewingOldVersion && (restrictions.tools_editable !== false);
  const areMCPsEditable = !isViewingOldVersion && (restrictions.mcps_editable !== false);
  
  const handleSystemPromptChange = (value: string) => {
    if (!isSystemPromptEditable && isSunaAgent) {
      toast.error("Prompt do sistema não pode ser editado", {
        description: `O prompt do sistema do ${BRANDING.name} é gerenciado centralmente e não pode ser alterado.`,
      });
      return;
    }
    onFieldChange('system_prompt', value);
  };

  return (
    <div className="p-4">
      {isSunaAgent && (
        <div className="mb-4 p-4 bg-primary/10 border border-primary-200 rounded-xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-primary-600">
              <BrandLogo size={20} />
            </div>
            <span className="font-semibold text-primary-800">Agente Padrão {BRANDING.name}</span>
          </div>
          <p className="text-sm text-primary-700">
            Este é o agente padrão do {BRANDING.name} com prompt de sistema e ferramentas gerenciados centralmente. 
            Você pode personalizar integrações, base de conhecimento, fluxos de trabalho e gatilhos para personalizar sua experiência.
          </p>
        </div>
      )}
      
      <Accordion type="single" collapsible value={openAccordion} onValueChange={setOpenAccordion} className="space-y-2">
        {!isSunaAgent && (
          <AccordionItem 
            value="system" 
            className="rounded-xl hover:bg-muted/30 border transition-colors duration-200"
          >
            <AccordionTrigger className="hover:no-underline py-4 px-4 [&[data-state=open]]:pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-medium text-foreground">Prompt do Sistema</h4>
                  <p className="text-xs text-muted-foreground">Defina o comportamento e objetivos do agente</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <ExpandableMarkdownEditor
                value={displayData.system_prompt}
                onSave={handleSystemPromptChange}
                placeholder="Clique para definir instruções do sistema..."
                title="Instruções do Sistema"
                disabled={!isSystemPromptEditable}
              />
            </AccordionContent>
          </AccordionItem>
        )}
        {!isSunaAgent && (
          <AccordionItem 
            value="tools" 
            className="rounded-xl hover:bg-muted/30 border transition-colors duration-200"
          >
            <AccordionTrigger className="hover:no-underline py-4 px-4 [&[data-state=open]]:pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                  <Wrench className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-medium text-foreground">Ferramentas Padrão</h4>
                  <p className="text-xs text-muted-foreground">Configure as ferramentas padrão do agentpress</p>
                </div>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <AgentToolsConfiguration
                tools={displayData.agentpress_tools}
                onToolsChange={areToolsEditable ? (tools) => onFieldChange('agentpress_tools', tools) : () => {}}
                disabled={!areToolsEditable}
                isSunaAgent={isSunaAgent}
              />
            </AccordionContent>
          </AccordionItem>
        )}
        <AccordionItem 
          value="integrations" 
          className="rounded-xl hover:bg-muted/30 border transition-colors duration-200"
        >
          <AccordionTrigger className="hover:no-underline py-4 px-4 [&[data-state=open]]:pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                <Server className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-medium text-foreground">Integrações</h4>
                <p className="text-xs text-muted-foreground">Conecte serviços externos via MCPs</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <AgentMCPConfiguration
              configuredMCPs={displayData.configured_mcps}
              customMCPs={displayData.custom_mcps}
              onMCPChange={onMCPChange}
              agentId={agentId}
              versionData={{
                configured_mcps: displayData.configured_mcps,
                custom_mcps: displayData.custom_mcps,
                system_prompt: displayData.system_prompt,
                agentpress_tools: displayData.agentpress_tools
              }}
              saveMode="callback"
              versionId={versionData?.version_id}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem 
          value="knowledge" 
          className="rounded-xl hover:bg-muted/30 border transition-colors duration-200"
        >
          <AccordionTrigger className="hover:no-underline py-4 px-4 [&[data-state=open]]:pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-medium text-foreground">Base de Conhecimento</h4>
                <p className="text-xs text-muted-foreground">Envie e gerencie conhecimento para o agente</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <AgentKnowledgeBaseManager
              agentId={agentId}
              agentName={displayData.name || 'Agent'}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem 
          value="workflows" 
          className="rounded-xl hover:bg-muted/30 border transition-colors duration-200"
        >
          <AccordionTrigger className="hover:no-underline py-4 px-4 [&[data-state=open]]:pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                <Workflow className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-medium text-foreground">Fluxos de Trabalho</h4>
                <p className="text-xs text-muted-foreground">Automatize processos complexos</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <AgentWorkflowsConfiguration
              agentId={agentId}
              agentName={displayData.name || 'Agent'}
            />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem 
          value="triggers" 
          className="rounded-xl hover:bg-muted/30 border transition-colors duration-200"
        >
          <AccordionTrigger className="hover:no-underline py-4 px-4 [&[data-state=open]]:pb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                <Zap className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-left">
                <h4 className="text-sm font-medium text-foreground">Gatilhos</h4>
                <p className="text-xs text-muted-foreground">Configure execuções automáticas do agente</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <AgentTriggersConfiguration agentId={agentId} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
