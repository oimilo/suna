'use client';

import React, { useState, useMemo } from 'react';
import { Filter, Globe, ChevronDown, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SearchBar } from './search-bar';
import { EmptyState } from '../empty-state';
import { AgentsGrid } from '../agents-grid';
import { LoadingState } from '../loading-state';
import { Pagination } from '../pagination';
import { AgentCard } from './agent-card';

type AgentFilter = 'all' | 'templates';

interface MyAgentsTabProps {
  agentsSearchQuery: string;
  setAgentsSearchQuery: (value: string) => void;
  agentsLoading: boolean;
  agents: any[];
  agentsPagination: any;
  viewMode: 'grid' | 'list';
  onCreateAgent: () => void;
  onEditAgent: (agentId: string) => void;
  onDeleteAgent: (agentId: string) => void;
  onToggleDefault: (agentId: string, currentDefault: boolean) => void;
  onClearFilters: () => void;
  deleteAgentMutation: any;
  setAgentsPage: (page: number) => void;

  myTemplates: any[];
  templatesLoading: boolean;
  templatesError: any;
  templatesActioningId: string | null;
  onPublish: (template: any) => void;
  onUnpublish: (templateId: string, templateName: string) => void;
  getTemplateStyling: (template: any) => { avatar: string; color: string };

  onPublishAgent?: (agent: any) => void;
  publishingAgentId?: string | null;
}

export const MyAgentsTab = ({
  agentsSearchQuery,
  setAgentsSearchQuery,
  agentsLoading,
  agents,
  agentsPagination,
  viewMode,
  onCreateAgent,
  onEditAgent,
  onDeleteAgent,
  onToggleDefault,
  onClearFilters,
  deleteAgentMutation,
  setAgentsPage,
  myTemplates,
  templatesLoading,
  templatesError,
  templatesActioningId,
  onPublish,
  onUnpublish,
  getTemplateStyling,
  onPublishAgent,
  publishingAgentId
}: MyAgentsTabProps) => {
  const { t } = useTranslations();
  const [agentFilter, setAgentFilter] = useState<AgentFilter>('all');

  const filterOptions = [
    { value: 'all', label: t('agents.allAgents'), icon: Users },
    { value: 'templates', label: t('agents.templates'), icon: Globe },
  ];


  const filteredAgents = useMemo(() => {
    if (agentFilter === 'templates') {
      return [];
    }
    return agents;
  }, [agents, agentFilter]);

  const templateAgentsCount = useMemo(() => {
    return myTemplates?.length || 0;
  }, [myTemplates]);

  const handleClearFilters = () => {
    setAgentFilter('all');
    onClearFilters();
  };

  const currentFilter = filterOptions.find(filter => filter.value === agentFilter);
  const CurrentFilterIcon = currentFilter?.icon || Users;

  const getCountForFilter = (filterValue: string) => {
    if (filterValue === 'templates') {
      return templateAgentsCount;
    }
    return agents.length;
  };

  const renderTemplates = () => {
    if (templatesLoading) {
      return <LoadingState viewMode={viewMode} />;
    }

    if (templatesError) {
      return (
        <div className="text-center py-16">
          <p className="text-destructive">{t('agents.failedToLoadTemplates')}</p>
        </div>
      );
    }

    if (!myTemplates || myTemplates.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/10 rounded-3xl flex items-center justify-center mb-6">
            <Globe className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-3">{t('agents.noPublishedTemplatesYet')}</h3>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            {t('agents.publishAgentsToMarketplace')}
          </p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {myTemplates.map((template) => {
          const isActioning = templatesActioningId === template.template_id;
          return (
            <AgentCard
              key={template.template_id}
              mode="template"
              data={template}
              styling={getTemplateStyling(template)}
              isActioning={isActioning}
              onPrimaryAction={
                template.is_public 
                  ? () => onUnpublish(template.template_id, template.name)
                  : () => onPublish(template)
              }
              onSecondaryAction={template.is_public ? () => {/* View in marketplace */} : undefined}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-6 flex flex-col min-h-full">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SearchBar
          placeholder={t('agents.searchYourAgents')}
          value={agentsSearchQuery}
          onChange={setAgentsSearchQuery}
        />
        
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 px-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06]">
                <CurrentFilterIcon className="h-4 w-4 mr-2 opacity-60" />
                <span className="text-sm">{currentFilter?.label}</span>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-black dark:bg-white text-white dark:text-black text-xs font-medium">
                  {getCountForFilter(agentFilter)}
                </span>
                <ChevronDown className="h-3.5 w-3.5 ml-1 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {filterOptions.map((filter) => {
                const Icon = filter.icon;
                const count = getCountForFilter(filter.value);
                return (
                  <DropdownMenuItem
                    key={filter.value}
                    onClick={() => setAgentFilter(filter.value as AgentFilter)}
                    className="cursor-pointer"
                  >
                    <Icon className="h-4 w-4 opacity-60" />
                    {filter.label}
                    <span className="ml-auto px-2 py-0.5 rounded text-xs text-muted-foreground">
                      {count}
                    </span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex-1">
        {agentFilter === 'templates' ? (
          renderTemplates()
        ) : (
          <>
            {agentsLoading ? (
              <LoadingState viewMode={viewMode} />
            ) : filteredAgents.length === 0 ? (
              <EmptyState
                hasAgents={(agentsPagination?.total || 0) > 0}
                onCreateAgent={onCreateAgent}
                onClearFilters={handleClearFilters}
              />
            ) : (
              <AgentsGrid
                agents={filteredAgents}
                onEditAgent={onEditAgent}
                onDeleteAgent={onDeleteAgent}
                onToggleDefault={onToggleDefault}
                deleteAgentMutation={deleteAgentMutation}
                onPublish={onPublishAgent}
                publishingId={publishingAgentId}
              />
            )}

            {agentsPagination && agentsPagination.pages > 1 && (
              <Pagination
                currentPage={agentsPagination.page}
                totalPages={agentsPagination.pages}
                onPageChange={setAgentsPage}
                isLoading={agentsLoading}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}; 