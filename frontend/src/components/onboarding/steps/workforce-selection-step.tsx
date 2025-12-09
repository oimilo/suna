'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';
import { StepWrapper } from '../shared/step-wrapper';
import { UnifiedAgentCard, type BaseAgentData } from '@/components/ui/unified-agent-card';
import { userContext, updateUserContext } from '../shared/context';
import { useMarketplaceTemplates } from '@/hooks/secure-mcp/use-secure-mcp';
import type { MarketplaceTemplate } from '@/components/agents/installation/types';

export const WorkforceSelectionStep = () => {
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<string[]>([]);

  // Fetch Prophet Team templates from marketplace
  const { 
    data: marketplaceData, 
    isLoading, 
    error,
    refetch 
  } = useMarketplaceTemplates({
    is_kortix_team: true, // Only show Prophet/Kortix verified templates
    limit: 20,
    sort_by: 'download_count',
    sort_order: 'desc'
  });

  const templates = marketplaceData?.templates || [];

  // Update global context when selection changes
  useEffect(() => {
    const selectedTemplates = templates.filter(t => 
      selectedTemplateIds.includes(t.template_id)
    );
    
    // Map to MarketplaceTemplate format
    const mappedTemplates: MarketplaceTemplate[] = selectedTemplates.map(t => ({
      id: t.template_id,
      template_id: t.template_id,
      creator_id: t.creator_id,
      name: t.name,
      description: t.description || '',
      system_prompt: t.system_prompt,
      tags: t.tags || [],
      download_count: t.download_count || 0,
      creator_name: t.creator_name || '',
      created_at: t.created_at,
      marketplace_published_at: t.marketplace_published_at,
      icon_name: t.icon_name,
      icon_color: t.icon_color,
      icon_background: t.icon_background,
      is_kortix_team: t.is_kortix_team,
      model: t.metadata?.model,
      agentpress_tools: t.agentpress_tools,
      mcp_requirements: t.mcp_requirements,
      usage_examples: t.usage_examples,
      config: t.config,
    }));

    updateUserContext({ 
      selectedTemplates: mappedTemplates,
      // Keep legacy field in sync
      selectedAgents: selectedTemplateIds 
    });
  }, [selectedTemplateIds, templates]);

  const toggleTemplate = useCallback((templateId: string) => {
    setSelectedTemplateIds(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  }, []);

  // Convert template to BaseAgentData for UnifiedAgentCard
  const convertToBaseAgentData = (template: any): BaseAgentData => ({
    id: template.template_id,
    name: template.name,
    description: template.description,
    tags: template.tags || [],
    created_at: template.created_at,
    icon_name: template.icon_name,
    icon_color: template.icon_color,
    icon_background: template.icon_background,
    creator_id: template.creator_id,
    creator_name: template.creator_name,
    is_kortix_team: template.is_kortix_team || false,
    download_count: template.download_count || 0,
    marketplace_published_at: template.marketplace_published_at,
    mcp_requirements: template.mcp_requirements || [],
    agentpress_tools: template.agentpress_tools || {},
  });

  // Loading state
  if (isLoading) {
    return (
      <StepWrapper>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading available agents...</p>
        </div>
      </StepWrapper>
    );
  }

  // Error state
  if (error) {
    return (
      <StepWrapper>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <p className="text-destructive">Failed to load agents</p>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        </div>
      </StepWrapper>
    );
  }

  // Empty state - no templates available yet
  if (templates.length === 0) {
    return (
      <StepWrapper>
        <div className="flex flex-col items-center justify-center py-16 space-y-4">
          <Sparkles className="h-12 w-12 text-muted-foreground" />
          <h3 className="text-xl font-semibold">Specialized Agents Coming Soon</h3>
          <p className="text-muted-foreground text-center max-w-md">
            We&apos;re preparing amazing specialized agents for you. 
            In the meantime, you can skip this step and create your own agents!
          </p>
        </div>
      </StepWrapper>
    );
  }

  return (
    <StepWrapper>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-medium">
            Choose Your AI Workers
          </h2>
          <p className="text-muted-foreground mt-2">
            Select the specialized agents you want to add to your workspace
          </p>
        </motion.div>

        {/* Templates Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        >
          {templates.map((template, index) => (
            <UnifiedAgentCard
              key={template.template_id}
              variant="onboarding"
              data={convertToBaseAgentData(template)}
              actions={{
                onToggle: toggleTemplate,
              }}
              state={{
                isSelected: selectedTemplateIds.includes(template.template_id),
                isRecommended: template.is_kortix_team || false,
              }}
              delay={index * 0.05}
            />
          ))}
        </motion.div>

        {/* Selection summary */}
        {selectedTemplateIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-center"
          >
            <Badge variant="outline" className="px-4 py-2">
              {selectedTemplateIds.length} agent{selectedTemplateIds.length !== 1 ? 's' : ''} selected
            </Badge>
          </motion.div>
        )}
      </div>
    </StepWrapper>
  );
};
