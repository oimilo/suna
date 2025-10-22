'use client';

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { SearchBar } from './search-bar';
import { MarketplaceSectionHeader } from './marketplace-section-header';
import {
  UnifiedAgentCard,
  BaseAgentData,
} from '@/components/ui/unified-agent-card';
import type { MarketplaceTemplate } from '@/components/agents/installation/types';
import { BRANDING } from '@/lib/branding';
import { usePtTranslations } from '@/hooks/use-pt-translations';
import { Info, Users } from 'lucide-react';

interface MarketplaceTabProps {
  marketplaceSearchQuery: string;
  setMarketplaceSearchQuery: (value: string) => void;
  marketplaceFilter: 'all' | 'kortix' | 'community';
  setMarketplaceFilter: (value: 'all' | 'kortix' | 'community') => void;
  marketplaceLoading: boolean;
  allMarketplaceItems: MarketplaceTemplate[];
  kortixTeamItems: MarketplaceTemplate[];
  communityItems: MarketplaceTemplate[];
  installingItemId: string | null;
  onInstallClick: (item: MarketplaceTemplate, e?: React.MouseEvent) => void;
  getItemStyling: (item: MarketplaceTemplate) => { avatar: string; color: string };
}

export const MarketplaceTab = ({
  marketplaceSearchQuery,
  setMarketplaceSearchQuery,
  marketplaceFilter,
  setMarketplaceFilter,
  marketplaceLoading,
  allMarketplaceItems,
  kortixTeamItems,
  communityItems,
  installingItemId,
  onInstallClick,
  getItemStyling
}: MarketplaceTabProps) => {
  const { t } = usePtTranslations();
  
  return (
    <div className="space-y-6 flex flex-col min-h-full">
      {/* Community tip */}
      <div className="bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03]">
            <Users className="h-4 w-4 opacity-60" />
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium">Agentes da Comunidade</p>
            <p className="text-xs text-muted-foreground/80 leading-relaxed">
              Explore agentes criados e compartilhados pela comunidade. Cada agente mostra suas capacidades e integrações necessárias para funcionar.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <SearchBar
          placeholder={t('marketplace.searchPlaceholder')}
          value={marketplaceSearchQuery}
          onChange={setMarketplaceSearchQuery}
        />
        <Select value={marketplaceFilter} onValueChange={(value: 'all' | 'kortix' | 'community') => setMarketplaceFilter(value)}>
          <SelectTrigger className="w-[180px] h-12 rounded-xl">
            <SelectValue placeholder={t('marketplace.filterPlaceholder')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('marketplace.allAgents')}</SelectItem>
            <SelectItem value="kortix">{BRANDING.company} {t('marketplace.verified')}</SelectItem>
            <SelectItem value="community">{t('marketplace.community')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex-1">
            {marketplaceLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-sm">
                <Skeleton className="h-48" />
                <div className="p-6 space-y-3">
                  <Skeleton className="h-5 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 rounded" />
                    <Skeleton className="h-4 rounded w-3/4" />
                  </div>
                  <Skeleton className="h-10 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : allMarketplaceItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              {marketplaceSearchQuery 
                ? t('marketplace.noAgentsFound')
                : t('marketplace.noAgentsAvailable')}
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {marketplaceFilter === 'all' ? (
              <>
                {kortixTeamItems.length > 0 && (
                  <div className="space-y-6">
                    <MarketplaceSectionHeader
                      title={`${t('marketplace.verifiedByCompany')} ${BRANDING.company}`}
                      subtitle={t('marketplace.officialAgents')}
                    />
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {kortixTeamItems.map((item) => {
                        const styling = getItemStyling(item);
                        const baseData: BaseAgentData = {
                          id: item.id,
                          name: item.name,
                          description: item.description,
                          tags: item.tags,
                          created_at: item.created_at,
                          icon_background: styling.color,
                          creator_name: item.creator_name,
                          is_kortix_team: item.is_kortix_team,
                          download_count: item.download_count,
                          marketplace_published_at: item.marketplace_published_at,
                          template_id: item.template_id,
                          mcp_requirements: item.mcp_requirements,
                        };

                        return (
                          <UnifiedAgentCard
                            key={item.id}
                            variant="marketplace"
                            data={baseData}
                            state={{ isActioning: installingItemId === item.id }}
                            actions={{
                              onPrimaryAction: (data, e) => onInstallClick(item, e),
                              onClick: () => onInstallClick(item),
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
                {communityItems.length > 0 && (
                  <div className="space-y-6">
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                      {communityItems.map((item) => {
                        const styling = getItemStyling(item);
                        const baseData: BaseAgentData = {
                          id: item.id,
                          name: item.name,
                          description: item.description,
                          tags: item.tags,
                          created_at: item.created_at,
                          icon_background: styling.color,
                          creator_name: item.creator_name,
                          is_kortix_team: item.is_kortix_team,
                          download_count: item.download_count,
                          marketplace_published_at: item.marketplace_published_at,
                          template_id: item.template_id,
                          mcp_requirements: item.mcp_requirements,
                        };

                        return (
                          <UnifiedAgentCard
                            key={item.id}
                            variant="marketplace"
                            data={baseData}
                            state={{ isActioning: installingItemId === item.id }}
                            actions={{
                              onPrimaryAction: (data, e) => onInstallClick(item, e),
                              onClick: () => onInstallClick(item),
                            }}
                          />
                        );
                      })}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {allMarketplaceItems.map((item) => {
                  const styling = getItemStyling(item);
                  const baseData: BaseAgentData = {
                    id: item.id,
                    name: item.name,
                    description: item.description,
                    tags: item.tags,
                    created_at: item.created_at,
                    icon_background: styling.color,
                    creator_name: item.creator_name,
                    is_kortix_team: item.is_kortix_team,
                    download_count: item.download_count,
                    marketplace_published_at: item.marketplace_published_at,
                    template_id: item.template_id,
                    mcp_requirements: item.mcp_requirements,
                  };

                  return (
                    <UnifiedAgentCard
                      key={item.id}
                      variant="marketplace"
                      data={baseData}
                      state={{ isActioning: installingItemId === item.id }}
                      actions={{
                        onPrimaryAction: (data, e) => onInstallClick(item, e),
                        onClick: () => onInstallClick(item),
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}; 
