'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { useTranslations } from '@/hooks/use-translations';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertCircle, 
  Settings,
  User,
  Plus,
  Search,
  X,
  Link,
  Trash2,
  Edit,
  Loader2,
  CheckCircle2,
  XCircle,
  RefreshCw,
} from 'lucide-react';
import { usePipedreamProfiles, useCreatePipedreamProfile, useUpdatePipedreamProfile, useDeletePipedreamProfile, useConnectPipedreamProfile } from '@/hooks/react-query/pipedream/use-pipedream-profiles';
import { usePipedreamApps, usePipedreamAppIcon } from '@/hooks/react-query/pipedream/use-pipedream';
import { PipedreamRegistry } from '@/components/agents/pipedream/pipedream-registry';
import { PipedreamConnector } from '@/components/agents/pipedream/pipedream-connector';
import { PipedreamAccountStatus } from '@/components/agents/pipedream/pipedream-account-status';
import { useQueryClient } from '@tanstack/react-query';
import { pipedreamKeys } from '@/hooks/react-query/pipedream/keys';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { correctAppName } from '@/lib/utils/app-names';
import { toast } from 'sonner';
import type { PipedreamProfile, CreateProfileRequest } from '@/components/agents/pipedream/pipedream-types';
import type { PipedreamApp } from '@/hooks/react-query/pipedream/utils';

interface PipedreamConnectionsSectionProps {
  onConnectNewApp?: (app: { app_slug: string; app_name: string }) => void;
}

interface AppTableProps {
  appSlug: string;
  appName: string;
  profiles: PipedreamProfile[];
  appImage?: string;
  onConnect: (app: PipedreamApp) => void;
  onProfileUpdate: (profile: PipedreamProfile, updates: any) => void;
  onProfileDelete: (profile: PipedreamProfile) => void;
  onProfileConnect: (profile: PipedreamProfile) => void;
  isUpdating?: string;
  isConnecting?: string;
  allAppsData?: any;
}

const AppTable: React.FC<AppTableProps> = ({ 
  appSlug, 
  appName, 
  profiles, 
  appImage, 
  onConnect,
  onProfileUpdate,
  onProfileDelete,
  onProfileConnect,
  isUpdating,
  isConnecting,
  allAppsData
}) => {
  const { t } = useTranslations();
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState<PipedreamProfile | null>(null);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const { data: iconData } = usePipedreamAppIcon(appSlug, {
    enabled: !appImage
  });

  const createProfile = useCreatePipedreamProfile();
  const connectProfile = useConnectPipedreamProfile();

  const registryApp = useMemo(() => {
    return allAppsData?.apps?.find((app: PipedreamApp) => 
      app.name_slug === appSlug || 
      app.name.toLowerCase() === appName.toLowerCase()
    );
  }, [allAppsData, appSlug, appName]);

  const correctedAppName = correctAppName(appName);
  
  const mockPipedreamApp: PipedreamApp = useMemo(() => ({
    id: appSlug,
    name: correctedAppName,
    name_slug: appSlug,
    auth_type: "oauth",
    description: `Connect to ${correctedAppName}`,
    img_src: registryApp?.img_src || "",
    custom_fields_json: registryApp?.custom_fields_json || "[]",
    categories: registryApp?.categories || [],
    featured_weight: 0,
    connect: {
      allowed_domains: registryApp?.connect?.allowed_domains || null,
      base_proxy_target_url: registryApp?.connect?.base_proxy_target_url || "",
      proxy_enabled: registryApp?.connect?.proxy_enabled || false,
    },
  }), [appSlug, correctedAppName, registryApp]);

  const handleQuickCreate = async () => {
    if (!newProfileName.trim()) {
      toast.error('Please enter a profile name');
      return;
    }

    setIsCreating(true);
    try {
      const request: CreateProfileRequest = {
        profile_name: newProfileName.trim(),
        app_slug: appSlug,
        app_name: appName,
        is_default: profiles.length === 0,
      };

      const newProfile = await createProfile.mutateAsync(request);
      
      // Auto-connect the new profile
      await connectProfile.mutateAsync({
        profileId: newProfile.profile_id,
        app: appSlug,
        profileName: newProfile.profile_name,
      });

      setNewProfileName('');
      setShowQuickCreate(false);
      toast.success('Profile created and connected!');
    } catch (error) {
      console.error('Error creating profile:', error);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = (profile: PipedreamProfile) => {
    setEditingProfile(profile.profile_id);
    setEditName(profile.profile_name);
  };

  const handleSaveEdit = (profile: PipedreamProfile) => {
    if (!editName.trim()) return;
    
    onProfileUpdate(profile, { profile_name: editName.trim() });
    setEditingProfile(null);
    setEditName('');
  };

  const handleCancelEdit = () => {
    setEditingProfile(null);
    setEditName('');
  };


  return (
    <div className="rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 hover:bg-black/[0.03] dark:hover:bg-white/[0.04] transition-all duration-200 overflow-hidden">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-md bg-transparent opacity-60 shrink-0">
            {(appImage || iconData?.icon_url) ? (
              <img
                src={appImage || iconData?.icon_url || ''}
                alt={appName}
                className="h-5 w-5 object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.nextElementSibling?.classList.remove('hidden');
                }}
              />
            ) : null}
            <span className={cn(
              "text-sm font-semibold text-muted-foreground",
              (appImage || iconData?.icon_url) ? "hidden" : "flex items-center justify-center h-5 w-5"
            )}>
              {correctedAppName.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h3 className="text-sm font-medium">{correctedAppName}</h3>
            <p className="text-xs text-muted-foreground">
              {profiles.length} {profiles.length === 1 ? 'perfil' : 'perfis'} • {profiles.filter(p => p.is_connected).length} {profiles.filter(p => p.is_connected).length === 1 ? 'conectado' : 'conectados'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {showQuickCreate ? (
            <div className="flex items-center gap-2">
              <Input
                placeholder="Profile name"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleQuickCreate();
                  if (e.key === 'Escape') {
                    setShowQuickCreate(false);
                    setNewProfileName('');
                  }
                }}
                className="h-8 text-sm w-32"
                autoFocus
              />
              <Button
                size="sm"
                onClick={handleQuickCreate}
                disabled={isCreating}
                className="h-8 px-2"
              >
                {isCreating ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3 w-3" />
                )}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setShowQuickCreate(false);
                  setNewProfileName('');
                }}
                className="h-8 px-2"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <>
              <Button
                size="sm"
                onClick={() => onConnect(mockPipedreamApp)}
                className="h-8 px-3 bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black rounded-md transition-all duration-200"
              >
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                <span className="text-xs font-medium">Novo Perfil</span>
              </Button>
            </>
          )}
        </div>
      </div>
      
      <div className="border-t border-black/6 dark:border-white/8">
        {profiles.map((profile, index) => (
          <div key={profile.profile_id} className={cn(
            "px-4 py-3 hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors duration-200",
            index !== profiles.length - 1 && "border-b border-black/6 dark:border-white/8"
          )}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  {editingProfile === profile.profile_id ? (
                    <div className="flex items-center gap-2 w-full max-w-xs">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(profile);
                          if (e.key === 'Escape') handleCancelEdit();
                        }}
                        className="h-8 text-sm"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        onClick={() => handleSaveEdit(profile)}
                        disabled={isUpdating === profile.profile_id}
                        className="h-8 px-2"
                      >
                        {isUpdating === profile.profile_id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleCancelEdit}
                        className="h-8 px-2"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="font-medium text-sm truncate">{profile.profile_name}</span>
                      {profile.is_default && (
                        <Badge variant="outline" className="text-xs h-5 px-2">
                          Padrão
                        </Badge>
                      )}
                    </>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {profile.is_connected ? (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">Conectado</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <span className="text-xs font-medium text-red-600 dark:text-red-400">Desconectado</span>
                    </div>
                  )}
                  {!profile.is_active && (
                    <Badge variant="secondary" className="text-xs h-5 px-2">
                      Inativo
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2 ml-4">
                {!profile.is_connected && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onProfileConnect(profile)}
                    disabled={isConnecting === profile.profile_id}
                    className="h-8 px-3 hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground"
                  >
                    {isConnecting === profile.profile_id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : (
                      <Link className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    <span className="text-xs font-medium">Conectar</span>
                  </Button>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 w-8 p-0 hover:bg-black/5 dark:hover:bg-white/5 rounded transition-colors"
                    >
                      <Settings className="h-3.5 w-3.5 opacity-60" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(profile)}>
                      <Edit className="h-3.5 w-3.5 mr-2" />
                      Editar Nome
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onProfileUpdate(profile, { is_default: !profile.is_default })}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                      {profile.is_default ? 'Remover Padrão' : 'Definir como Padrão'}
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onProfileUpdate(profile, { is_active: !profile.is_active })}
                    >
                      {profile.is_active ? (
                        <>
                          <XCircle className="h-3.5 w-3.5 mr-2" />
                          Desativar
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2" />
                          Ativar
                        </>
                      )}
                    </DropdownMenuItem>
                    {profile.is_connected && (
                      <DropdownMenuItem onClick={() => onProfileConnect(profile)}>
                        <RefreshCw className="h-3.5 w-3.5 mr-2" />
                        Reconectar
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => setShowDeleteDialog(profile)}
                      className="text-destructive hover:bg-red-500/10 focus:bg-red-500/10"
                    >
                      <Trash2 className="h-3.5 w-3.5 mr-2 text-destructive" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>

      <AlertDialog open={!!showDeleteDialog} onOpenChange={(open) => !open && setShowDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('credentials.deleteProfile')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('credentials.deleteProfileConfirmation', { profileName: showDeleteDialog?.profile_name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('credentials.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (showDeleteDialog) {
                  onProfileDelete(showDeleteDialog);
                  setShowDeleteDialog(null);
                }
              }}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {t('credentials.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export const PipedreamConnectionsSection: React.FC<PipedreamConnectionsSectionProps> = ({
  onConnectNewApp
}) => {
  const { t } = useTranslations();
  const [showAppBrowser, setShowAppBrowser] = useState(false);
  const [showConnector, setShowConnector] = useState(false);
  const [selectedApp, setSelectedApp] = useState<PipedreamApp | null>(null);
  
  // Debug logging
  React.useEffect(() => {
    console.log('State changed: selectedApp:', selectedApp, 'showConnector:', showConnector);
  }, [selectedApp, showConnector]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);

  const queryClient = useQueryClient();
  const { data: profiles, isLoading, error } = usePipedreamProfiles();
  const { data: allAppsData } = usePipedreamApps(undefined, '');
  const updateProfile = useUpdatePipedreamProfile();
  const deleteProfile = useDeletePipedreamProfile();
  const connectProfile = useConnectPipedreamProfile();

  const handleAppSelect = (app: { app_slug: string; app_name: string }) => {
    setShowAppBrowser(false);
    if (onConnectNewApp) {
      onConnectNewApp(app);
    }
  };

  const handleConnect = (app: PipedreamApp) => {
    console.log('handleConnect called with app:', app);
    setSelectedApp(app);
    setShowConnector(true);
    console.log('Set showConnector to true');
  };

  const handleConnectionComplete = () => {
    setShowConnector(false);
    setSelectedApp(null);
    toast.success(`Conectado com sucesso!`);
    queryClient.invalidateQueries({ queryKey: pipedreamKeys.profiles.all() });
  };

  const handleProfileUpdate = async (profile: PipedreamProfile, updates: any) => {
    setIsUpdating(profile.profile_id);
    try {
      await updateProfile.mutateAsync({
        profileId: profile.profile_id,
        request: updates,
      });
      toast.success(t('credentials.profileUpdatedSuccessfully'));
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsUpdating(null);
    }
  };

  const handleProfileDelete = async (profile: PipedreamProfile) => {
    try {
      await deleteProfile.mutateAsync(profile.profile_id);
      toast.success(t('credentials.profileDeletedSuccessfully'));
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  const handleProfileConnect = async (profile: PipedreamProfile) => {
    setIsConnecting(profile.profile_id);
    try {
      await connectProfile.mutateAsync({
        profileId: profile.profile_id,
        app: profile.app_slug,
        profileName: profile.profile_name,
      });
      toast.success(t('credentials.profileConnectedSuccessfully'));
    } catch (error) {
      console.error('Error connecting profile:', error);
    } finally {
      setIsConnecting(null);
    }
  };

  const profilesByApp = profiles?.reduce((acc, profile) => {
    const key = profile.app_slug;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(profile);
    return acc;
  }, {} as Record<string, PipedreamProfile[]>) || {};

  const filteredProfilesByApp = useMemo(() => {
    if (!searchQuery.trim()) {
      return profilesByApp;
    }

    const query = searchQuery.toLowerCase();
    const filtered: Record<string, PipedreamProfile[]> = {};

    Object.entries(profilesByApp).forEach(([appSlug, appProfiles]) => {
      const appName = appProfiles[0]?.app_name.toLowerCase() || '';
      const matchingProfiles = appProfiles.filter(profile => 
        profile.profile_name.toLowerCase().includes(query) ||
        profile.app_name.toLowerCase().includes(query)
      );

      if (appName.includes(query) || matchingProfiles.length > 0) {
        filtered[appSlug] = appName.includes(query) ? appProfiles : matchingProfiles;
      }
    });

    return filtered;
  }, [profilesByApp, searchQuery]);

  const totalProfiles = profiles?.length || 0;
  const connectedProfiles = profiles?.filter(p => p.is_connected).length || 0;
  const uniqueApps = Object.keys(profilesByApp).length;
  const filteredAppsCount = Object.keys(filteredProfilesByApp).length;
  const filteredProfilesCount = Object.values(filteredProfilesByApp).flat().length;

  if (isLoading) {
    return (
      <div className="space-y-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <div className="rounded-md border">
              <div className="p-4 space-y-3">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t('credentials.failedToLoadCredentialProfiles')}
        </AlertDescription>
      </Alert>
    );
  }

  if (totalProfiles === 0) {
    return (
      <>
        {/* Pipedream Account Status */}
        <div className="mb-4">
          <PipedreamAccountStatus />
        </div>
        
        <div className="rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border-2 border-dashed border-black/10 dark:border-white/10 px-8 pt-8 pb-10">
          <div className="space-y-6 text-center">
            <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-foreground">{t('credentials.noCredentialProfilesYet')}</h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {t('credentials.connectYourFavoriteApps')}
              </p>
            </div>
            <Button 
              onClick={() => setShowAppBrowser(true)}
            >
              <Plus className="h-4 w-4" />
              {t('credentials.connectApp')}
            </Button>
          </div>
        </div>
        <Dialog open={showAppBrowser} onOpenChange={setShowAppBrowser}>
          <DialogContent className="p-0 max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader className="sr-only">
              <DialogTitle>{t('credentials.browseApps')}</DialogTitle>
              <DialogDescription>
                {t('credentials.selectAppToCreateProfile')}
              </DialogDescription>
            </DialogHeader>
            <PipedreamRegistry
              mode='profile-only'
              showAgentSelector={false}
              onAppSelected={handleAppSelect}
            />
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pipedream Account Status - Only show if not connected */}
      <PipedreamAccountStatus />
      
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            {searchQuery 
              ? t('credentials.appsWithProfiles', { count: filteredAppsCount, profileCount: filteredProfilesCount }) + ' found'
              : t('credentials.appsWithProfilesConnected', { count: uniqueApps, profileCount: totalProfiles, connectedCount: connectedProfiles })
            }
          </p>
        </div>
        <Button
          onClick={() => setShowAppBrowser(true)}
          size="sm"
          className="h-9 px-4 bg-black dark:bg-white hover:bg-black/90 dark:hover:bg-white/90 text-white dark:text-black rounded-md transition-all duration-200"
        >
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          <span className="text-sm font-medium">Conectar Novo Aplicativo</span>
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground opacity-60" />
        <Input
          placeholder="Buscar aplicativos e perfis..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 pr-10 h-10 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border-black/6 dark:border-white/8 focus:border-black/10 dark:focus:border-white/12 transition-all"
        />
        {searchQuery && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery('')}
            className="absolute right-1.5 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0 hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="h-3.5 w-3.5 opacity-60" />
          </Button>
        )}
      </div>
      {Object.keys(filteredProfilesByApp).length === 0 ? (
        <div className="p-12 rounded-2xl bg-gradient-to-br from-gray-50/50 to-white/50 dark:from-gray-900/50 dark:to-gray-850/50 border border-gray-200/50 dark:border-gray-800/50 text-center">
          <div className="space-y-6">
            <div className="w-14 h-14 rounded-xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mx-auto">
              <Search className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Nenhum resultado encontrado</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tente buscar com outros termos
              </p>
            </div>
            <Button 
              onClick={() => setSearchQuery('')}
              variant="outline"
              size="sm"
              className="h-9 px-4 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg"
            >
              <X className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-sm font-medium">Limpar Busca</span>
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(filteredProfilesByApp)
            .sort(([, a], [, b]) => {
              const aConnected = a.filter(p => p.is_connected).length;
              const bConnected = b.filter(p => p.is_connected).length;
              if (aConnected !== bConnected) return bConnected - aConnected;
              return b.length - a.length;
            })
            .map(([appSlug, appProfiles]) => {
              const registryApp = allAppsData?.apps?.find((app: PipedreamApp) => 
                app.name_slug === appSlug || 
                app.name.toLowerCase() === appProfiles[0].app_name.toLowerCase()
              );
              
              return (
                <AppTable
                  key={appSlug}
                  appSlug={appSlug}
                  appName={correctAppName(appProfiles[0].app_name)}
                  profiles={appProfiles}
                  appImage={registryApp?.img_src}
                  onConnect={handleConnect}
                  onProfileUpdate={handleProfileUpdate}
                  onProfileDelete={handleProfileDelete}
                  onProfileConnect={handleProfileConnect}
                  isUpdating={isUpdating}
                  isConnecting={isConnecting}
                  allAppsData={allAppsData}
                />
              );
            })}
        </div>
      )}

      <Dialog open={showAppBrowser} onOpenChange={setShowAppBrowser}>
        <DialogContent className="p-0 max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>{t('credentials.browseApps')}</DialogTitle>
            <DialogDescription>
              {t('credentials.selectAppToCreateProfile')}
            </DialogDescription>
          </DialogHeader>
          <PipedreamRegistry
            mode='profile-only'
            showAgentSelector={false}
            onAppSelected={handleAppSelect}
          />
        </DialogContent>
      </Dialog>

      {selectedApp && (
        <PipedreamConnector
          app={selectedApp}
          open={showConnector}
          onOpenChange={setShowConnector}
          onComplete={handleConnectionComplete}
          mode="profile-only"
        />
      )}
    </div>
  );
}; 