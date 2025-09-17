import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Plus, Settings, Zap, Bot, ChevronDown, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppCardProps } from '../types';
import { usePipedreamProfiles } from '@/hooks/react-query/pipedream/use-pipedream-profiles';
import { usePipedreamAppIcon } from '@/hooks/react-query/pipedream/use-pipedream';
import { usePipedreamAppTools } from '@/hooks/react-query/pipedream/use-pipedream';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

export const AppCard: React.FC<AppCardProps> = ({ 
  app, 
  compact = false, 
  mode = 'full',
  currentAgentId,
  agentName,
  agentPipedreamProfiles = [],
  onAppSelected,
  onConnectApp,
  onConfigureTools,
  handleCategorySelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: appToolsData, isLoading: isToolsLoading } = usePipedreamAppTools(app.name_slug, { enabled: isDialogOpen });
  const tools = appToolsData?.tools ?? [];

  const { data: profiles } = usePipedreamProfiles();
  const { data: iconData } = usePipedreamAppIcon(app.name_slug, {
    enabled: !app.img_src
  });

  const connectedProfiles = useMemo(() => {
    return profiles?.filter(p => p.app_slug === app.name_slug && p.is_connected) || [];
  }, [profiles, app.name_slug]);

  const agentProfiles = useMemo(() => {
    return agentPipedreamProfiles?.filter(p => p.app_slug === app.name_slug) || [];
  }, [agentPipedreamProfiles, app.name_slug]);

  const totalToolsCount = useMemo(() => {
    return agentProfiles.reduce((sum, profile) => {
      return sum + (profile.toolsCount ?? profile.enabledTools?.length ?? 0);
    }, 0);
  }, [agentProfiles]);

  const handleCategoryClick = (e: React.MouseEvent, category: string) => {
    e.stopPropagation();
    handleCategorySelect?.(category);
  };

  const handleConnectClick = () => {
    // Open the preview dialog instead of directly connecting
    setIsDialogOpen(true);
  };

  const handleActualConnect = () => {
    // Close the dialog and proceed with actual connection
    setIsDialogOpen(false);
    
    if (mode === 'simple' && onAppSelected) {
      onAppSelected({ app_slug: app.name_slug, app_name: app.name });
    } else if (onConnectApp) {
      onConnectApp(app);
    }
  };

  const handleConfigureClick = (profile: any) => {
    if (onConfigureTools) {
      onConfigureTools(profile);
    }
  };

  const isConnected = connectedProfiles.length > 0;
  const hasAgentTools = agentProfiles.length > 0;

  return (
    <>
      <div 
        className={cn(
          "group p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200",
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-transparent opacity-60 shrink-0 relative">
            {(app.img_src || iconData?.icon_url) ? (
              <img
                src={app.img_src || iconData?.icon_url || ''}
                alt={app.name}
                className="h-5 w-5 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : (
              <div className="h-5 w-5 rounded flex items-center justify-center bg-black/5 dark:bg-white/5 hidden">
                <span className="text-xs font-semibold text-muted-foreground">
                  {app.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className={cn(
              "text-xs font-semibold text-muted-foreground",
              (app.img_src || iconData?.icon_url) ? "hidden" : "block"
            )}>
              {app.name.charAt(0).toUpperCase()}
            </span>
            {isConnected && (
              <div className="absolute -top-2 -right-2 h-3 w-3 bg-emerald-500 rounded-full border-2 border-background" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium truncate mb-1">
              {app.name}
            </h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {app.description}
            </p>
          </div>
        </div>

        {hasAgentTools && (
          <div className="mt-3">
            <div className="rounded-lg bg-emerald-500/10 p-2 border border-emerald-500/20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost" className="h-auto w-full justify-between p-0 hover:bg-transparent">
                    <div className="flex items-center gap-2">
                      <Bot className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      <div className="text-left">
                        <div className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          {agentProfiles.length} {agentProfiles.length === 1 ? 'Perfil' : 'Perfis'}
                        </div>
                        <div className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                          {totalToolsCount} ferramentas configuradas
                        </div>
                      </div>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-full min-w-[200px]">
                  {agentProfiles.map((profile) => (
                    <DropdownMenuItem 
                      key={profile.profile_id} 
                      onClick={() => handleConfigureClick(profile)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Settings className="h-4 w-4" />
                          <span className="font-medium">{profile.profile_name}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {profile.toolsCount ?? profile.enabledTools?.length ?? 0} tools
                        </Badge>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        )}
        
        <div className="mt-3">
          <Button
            size="sm"
            onClick={handleConnectClick}
            variant={isConnected && !hasAgentTools ? "outline" : "default"}
            className={cn("w-full font-medium transition-all duration-200")}
          >
            {mode === 'simple' ? (
              <>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Conectar
              </>
            ) : mode === 'profile-only' ? (
              <>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                {isConnected ? 'Adicionar Perfil' : 'Conectar'}
              </>
            ) : (
              <>
                {isConnected ? (
                  <>
                    <Zap className="h-3.5 w-3.5 mr-1.5" />
                    Adicionar Ferramentas
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Conectar
                  </>
                )}
              </>
            )}
          </Button>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="overflow-hidden max-w-4xl p-0 h-[600px]">
          <DialogTitle className='sr-only'>{app.name} Tools</DialogTitle>
          <div className="grid grid-cols-2 h-full">
            <div className="p-8 border-r bg-gradient-to-br from-background to-muted/20">
              <div className="flex flex-col h-full">
                <div className="text-start mb-4">
                  <div className="mx-auto mb-6 relative">
                    <div className="h-20 w-20 rounded-3xl border bg-muted flex items-center justify-center overflow-hidden">
                      {(app.img_src || iconData?.icon_url) ? (
                        <img
                          src={app.img_src || iconData?.icon_url}
                          alt={`${app.name} icon`}
                          className="h-12 w-12 object-cover rounded-lg"
                        />
                      ) : (
                        <span className="font-bold text-2xl text-primary">
                          {app.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">{app.name}</h2>
                  <Badge variant="outline" className="mb-4 bg-muted">
                    {tools.length} {tools.length === 1 ? 'Tool' : 'Tools'} Available
                  </Badge>
                </div>
                <div className="mb-8 flex-1">
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {app.description}
                  </p>
                </div>
                {isConnected && (
                  <div className="mb-6">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-300">
                        Connected ({connectedProfiles.length} profile{connectedProfiles.length !== 1 ? 's' : ''})
                      </span>
                    </div>
                  </div>
                )}
                <div className="space-y-3">
                  <Button
                    size="lg"
                    onClick={handleActualConnect}
                    className="w-full font-medium"
                  >
                    {mode === 'simple' ? (
                      <>
                        <Plus className="h-4 w-4" />
                        Connect
                      </>
                    ) : mode === 'profile-only' ? (
                      <>
                        <Plus className="h-4 w-4" />
                        {isConnected ? 'Add Profile' : 'Connect'}
                      </>
                    ) : (
                      <>
                        {isConnected ? (
                          <>
                            <Zap className="h-4 w-4" />
                            Add Tools
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            Connect
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex flex-col h-full">
              <div className="p-4 border-b bg-muted/30">
                <h3 className="text-lg font-semibold text-foreground">Available Tools</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {tools.length} tool{tools.length !== 1 ? 's' : ''} ready to integrate
                </p>
              </div>
              <ScrollArea className="flex-1 max-h-[500px]">
                <div className="p-4">
                  {isToolsLoading ? (
                    <div className="flex flex-col gap-2 items-center justify-center">
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                      <Skeleton className="h-12 w-full rounded-lg" />
                    </div>
                  ) : tools.length > 0 ? (
                    <div className="space-y-2">
                      {tools.map((tool) => (
                        <div 
                          key={tool.name} 
                          className="group p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200"
                        >
                          <div className='flex items-center gap-2'>
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                              <Zap className="h-4 w-4 text-primary" />
                            </div>
                            <div className='flex flex-col items-start'>
                              <p className="text-sm font-medium text-foreground">
                                {tool.name}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2 font-normal">
                                {tool.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                          <Settings className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No tools available</p>
                        <p className="text-xs text-muted-foreground mt-1">Check back later for updates</p>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};