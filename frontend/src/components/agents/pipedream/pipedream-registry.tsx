import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { X, Bot, Search, Sparkles, TrendingUp, Star, Filter } from 'lucide-react';
import { usePipedreamPopularApps } from '@/hooks/react-query/pipedream/use-pipedream';
import { usePipedreamProfiles } from '@/hooks/react-query/pipedream/use-pipedream-profiles';
import { useAgent } from '@/hooks/react-query/agents/use-agents';
import { PipedreamConnector } from './pipedream-connector';
import { ToolsManager } from '../mcp/tools-manager';
import { toast } from 'sonner';
import { useQueryClient, useQuery } from '@tanstack/react-query';
import { AgentSelector } from '../../thread/chat-input/agent-selector';
import type { PipedreamApp } from '@/hooks/react-query/pipedream/utils';
import { pipedreamApi } from '@/hooks/react-query/pipedream/utils';
import { AppCard } from './_components/app-card';
import {
  createConnectedAppsFromProfiles,
  getAgentPipedreamProfiles,
} from './utils';
import type { PipedreamRegistryProps, ConnectedApp } from './types';
import { usePathname } from 'next/navigation';

const AppCardSkeleton = () => (
  <div className="group relative overflow-hidden rounded-2xl border border-border bg-card transition-all">
    <div className="p-6">
      <div className="flex items-center gap-4 mb-4">
        <Skeleton className="h-12 w-12 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <div className="space-y-2 mb-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

const AppsGridSkeleton = ({ count = 8 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
    {Array.from({ length: count }).map((_, index) => (
      <AppCardSkeleton key={index} />
    ))}
  </div>
);

export const PipedreamRegistry: React.FC<PipedreamRegistryProps> = ({
  onToolsSelected,
  onAppSelected,
  mode = 'full',
  onClose,
  showAgentSelector = false,
  selectedAgentId,
  onAgentChange,
  versionData,
  versionId
}) => {
  const [search, setSearch] = useState('');
  const [showAllApps, setShowAllApps] = useState(false);
  const [showStreamlinedConnector, setShowStreamlinedConnector] = useState(false);
  const [selectedAppForConnection, setSelectedAppForConnection] = useState<PipedreamApp | null>(null);
  const [showToolsManager, setShowToolsManager] = useState(false);
  const [selectedToolsProfile, setSelectedToolsProfile] = useState<{
    profileId: string;
    appName: string;
    profileName: string;
  } | null>(null);
  const pathname = usePathname();
  const isHomePage = pathname.includes('dashboard');
  
  const [internalSelectedAgentId, setInternalSelectedAgentId] = useState<string | undefined>(selectedAgentId);

  const queryClient = useQueryClient();
  
  const { data: popularAppsData, isLoading: isLoadingPopular } = usePipedreamPopularApps();
  
  const shouldFetchAllApps = showAllApps || search.trim() !== '';
  const { data: allAppsData, isLoading: isLoadingAll, error, refetch } = useQuery({
    queryKey: ['pipedream', 'apps', undefined, search],
    queryFn: async () => {
      const result = await pipedreamApi.getApps(undefined, search);
      return result;
    },
    enabled: shouldFetchAllApps,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
  
  const { data: profiles } = usePipedreamProfiles();
  
  const currentAgentId = selectedAgentId ?? internalSelectedAgentId;
  const { data: agent } = useAgent(currentAgentId || '');

  React.useEffect(() => {
    setInternalSelectedAgentId(selectedAgentId);
  }, [selectedAgentId]);

  const handleAgentSelect = (agentId: string | undefined) => {
    if (onAgentChange) {
      onAgentChange(agentId);
    } else {
      setInternalSelectedAgentId(agentId);
    }
    if (agentId !== currentAgentId) {
      queryClient.invalidateQueries({ queryKey: ['agent'] });
      if (agentId) {
        queryClient.invalidateQueries({ queryKey: ['agent', agentId] });
      }
    }
  };

  const effectiveVersionData = useMemo(() => {
    if (versionData) return versionData;
    if (!agent) return undefined;
    
    if (agent.current_version) {
      return {
        configured_mcps: agent.current_version.configured_mcps || [],
        custom_mcps: agent.current_version.custom_mcps || [],
        system_prompt: agent.current_version.system_prompt || '',
        agentpress_tools: agent.current_version.agentpress_tools || {}
      };
    }
    
    return {
      configured_mcps: agent.configured_mcps || [],
      custom_mcps: agent.custom_mcps || [],
      system_prompt: agent.system_prompt || '',
      agentpress_tools: agent.agentpress_tools || {}
    };
  }, [versionData, agent]);

  const agentPipedreamProfiles = useMemo(() => {
    return getAgentPipedreamProfiles(agent, profiles, currentAgentId, effectiveVersionData);
  }, [agent, profiles, currentAgentId, effectiveVersionData]);

  const connectedProfiles = useMemo(() => {
    return profiles?.filter(p => p.is_connected) || [];
  }, [profiles]);

  const connectedApps: ConnectedApp[] = useMemo(() => {
    return createConnectedAppsFromProfiles(connectedProfiles, popularAppsData?.apps || []);
  }, [connectedProfiles, popularAppsData?.apps]);

  const handleSearch = (value: string) => {
    setSearch(value);
    if (value.trim() === '') {
      setShowAllApps(false);
    }
  };

  const handleConnectionComplete = (profileId: string, selectedTools: string[], appName: string, appSlug: string) => {
    if (onToolsSelected) {
      onToolsSelected(profileId, selectedTools, appName, appSlug);
      toast.success(`Added ${selectedTools.length} tools from ${appName}!`);
    }
  };

  const handleConnectApp = (app: PipedreamApp) => {
    setSelectedAppForConnection(app);
    setShowStreamlinedConnector(true);
    onClose?.();
  };

  const handleConfigureTools = (profile: any) => {
    if (!currentAgentId) {
      toast.error('Please select an agent first');
      return;
    }
    setSelectedToolsProfile({
      profileId: profile.profile_id,
      appName: profile.app_name,
      profileName: profile.profile_name
    });
    setShowToolsManager(true);
  };

  const handleClearSearch = () => {
    setSearch('');
    setShowAllApps(false);
  };

  // Determine which apps to show
  const displayApps = useMemo(() => {
    if (search.trim()) {
      return allAppsData?.apps || [];
    }
    if (showAllApps) {
      return allAppsData?.apps || [];
    }
    return popularAppsData?.apps || [];
  }, [search, showAllApps, popularAppsData?.apps, allAppsData?.apps]);

  const isLoading = search.trim() || showAllApps ? isLoadingAll : isLoadingPopular;

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <X className="h-12 w-12 mx-auto mb-2" />
            <p className="text-lg font-semibold">Failed to load integrations</p>
          </div>
          <Button onClick={() => refetch()} className="bg-primary hover:bg-primary/90">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="sticky top-0 z-10 flex-shrink-0 border-b border-black/6 dark:border-white/8 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                <Sparkles className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-lg font-semibold text-foreground">
                    {agent?.name ? `Integrações do ${agent.name}` : 'Novas Integrações do Agente'}
                  </h1>
                  <div className="px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                    2700+ Apps
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {agent?.name ? 'Conecte aplicativos para aprimorar as capacidades do seu agente' : 'Conecte seus aplicativos e serviços favoritos'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {showAgentSelector && (
                <AgentSelector
                  selectedAgentId={currentAgentId}
                  onAgentSelect={handleAgentSelect}
                  isSunaAgent={agent?.metadata?.is_suna_default}
                />
              )}
              <div className="relative w-80">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-60" />
                <input
                  placeholder="Buscar aplicativos..."
                  value={search}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-9 text-sm border border-black/6 dark:border-white/8 bg-black/[0.02] dark:bg-white/[0.03] rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent placeholder:text-muted-foreground/60"
                />
                {search && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSearch}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-black/5 dark:hover:bg-white/5"
                  >
                    <X className="h-3 w-3 opacity-60" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="p-6">
          <div className="max-w-7xl mx-auto space-y-8">
            {showAgentSelector && !currentAgentId && (
              <div className="text-center py-12 px-6 bg-gradient-to-br from-muted/30 to-muted/10 rounded-2xl border border-dashed border-border">
                <div className="mx-auto w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl flex items-center justify-center mb-4">
                  <Bot className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Select an Agent
                </h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                  Choose an agent from the dropdown above to view and manage its integrations
                </p>
              </div>
            )}
            {connectedApps.length > 0 && (!showAgentSelector || currentAgentId) && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <h2 className="text-sm font-medium text-foreground">
                    Seus Aplicativos
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
                  {connectedApps.map((app) => (
                    <AppCard 
                      key={`${app.name_slug}-${currentAgentId || 'default'}`} 
                      app={app}
                      mode={mode}
                      currentAgentId={currentAgentId}
                      agentName={agent?.name}
                      agentPipedreamProfiles={agentPipedreamProfiles}
                      onAppSelected={onAppSelected}
                      onConnectApp={handleConnectApp}
                      onConfigureTools={handleConfigureTools}
                      handleCategorySelect={() => {}}
                    />
                  ))}
                </div>
              </div>
            )}
            {(!showAgentSelector || currentAgentId) && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <h2 className="text-sm font-medium text-foreground">
                      {search.trim() ? 'Resultados da Busca' : showAllApps ? 'Todos os Aplicativos' : 'Aplicativos Populares'}
                    </h2>
                  </div>
                </div>
                {isLoading ? (
                  <AppsGridSkeleton count={8} />
                ) : displayApps.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 auto-rows-min">
                    {displayApps.map((app) => (
                      <AppCard 
                        key={`${app.name_slug}-${currentAgentId || 'default'}`} 
                        app={app}
                        mode={mode}
                        currentAgentId={currentAgentId}
                        agentName={agent?.name}
                        agentPipedreamProfiles={agentPipedreamProfiles}
                        onAppSelected={onAppSelected}
                        onConnectApp={handleConnectApp}
                        onConfigureTools={handleConfigureTools}
                        handleCategorySelect={() => {}}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center flex flex-col items-center justify-center py-12">
                    <div className="text-6xl mb-4">🔍</div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Nenhum aplicativo encontrado
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      {search.trim() 
                        ? `Nenhum aplicativo corresponde a "${search}". Tente um termo de busca diferente.`
                        : 'Nenhum aplicativo disponível no momento.'
                      }
                    </p>
                    {search.trim() && (
                      <Button
                        onClick={handleClearSearch}
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        <Filter className="h-4 w-4" />
                        Limpar Busca
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Modals */}
      {selectedAppForConnection && (
        <PipedreamConnector
          app={selectedAppForConnection}
          open={showStreamlinedConnector}
          onOpenChange={setShowStreamlinedConnector}
          onComplete={handleConnectionComplete}
          mode={mode === 'profile-only' ? 'profile-only' : 'full'}
          agentId={currentAgentId}
          saveMode={isHomePage ? 'direct' : 'callback'}
          existingProfileIds={
            agentPipedreamProfiles
              .filter(profile => profile.app_slug === selectedAppForConnection.name_slug)
              .map(profile => profile.profile_id)
          }
        />
      )}
      
      {selectedToolsProfile && currentAgentId && (
        <ToolsManager
          mode="pipedream"
          agentId={currentAgentId}
          profileId={selectedToolsProfile.profileId}
          appName={selectedToolsProfile.appName}
          profileName={selectedToolsProfile.profileName}
          open={showToolsManager}
          onOpenChange={(open) => {
            setShowToolsManager(open);
            if (!open) {
              setSelectedToolsProfile(null);
            }
          }}
          onToolsUpdate={(enabledTools) => {
            queryClient.invalidateQueries({ queryKey: ['agent', currentAgentId] });
          }}
          versionData={effectiveVersionData}
          // Don't pass versionId for existing integrations - we want current configuration
          versionId={undefined}
        />
      )}
    </div>
  );
}; 