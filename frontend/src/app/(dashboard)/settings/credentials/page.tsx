'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFeatureFlag } from '@/lib/feature-flags';
import { sunaApi } from '@/upstream/suna/api';

type ComposioProfileSummary = {
  profile_id: string;
  profile_name: string;
  display_name: string;
  toolkit_slug: string;
  toolkit_name: string;
  is_connected: boolean;
  is_default: boolean;
  created_at: string;
  has_mcp_url: boolean;
};

type ComposioToolkitGroup = {
  toolkit_slug: string;
  toolkit_name: string;
  icon_url?: string | null;
  profiles: ComposioProfileSummary[];
};

type ComposioCredentialsResponse = {
  success: boolean;
  toolkits: ComposioToolkitGroup[];
  total_profiles: number;
};

export default function AppProfilesPage() {
  const { enabled: customAgentsEnabled, loading: flagLoading } = useFeatureFlag("custom_agents");
  const router = useRouter();
  const [toolkits, setToolkits] = useState<ComposioToolkitGroup[] | null>(null);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  useEffect(() => {
    if (!flagLoading && !customAgentsEnabled) {
      router.replace("/dashboard");
    }
  }, [flagLoading, customAgentsEnabled, router]);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        setLoadingList(true);
        setErrorMsg(null);
        const res = await sunaApi.getComposioProfiles();
        if (res.success && res.data) {
          setToolkits((res.data as ComposioCredentialsResponse).toolkits || []);
        } else {
          setErrorMsg('Falha ao carregar credenciais.');
        }
      } catch (e: any) {
        setErrorMsg(e?.message || 'Erro ao carregar credenciais.');
      } finally {
        setLoadingList(false);
      }
    };
    if (!flagLoading && customAgentsEnabled) {
      fetchProfiles();
    }
  }, [flagLoading, customAgentsEnabled]);

  if (flagLoading) {
    return (
      <div className="container mx-auto max-w-4xl px-6 py-6">
        <div className="space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-muted rounded-3xl"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customAgentsEnabled) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-4xl px-6 py-6">
      <div className="space-y-6">
        <div className="text-center py-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Credenciais de Aplicativos
          </h1>
        </div>

        {loadingList ? (
          <div className="space-y-4">
            <div className="h-32 bg-muted rounded-3xl animate-pulse"></div>
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-24 bg-muted rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        ) : errorMsg ? (
          <div className="text-sm text-red-600 dark:text-red-400">
            {errorMsg}
          </div>
        ) : (
          <div className="space-y-6">
            {(toolkits || []).map((tk) => (
              <div key={tk.toolkit_slug} className="space-y-3">
                <div className="flex items-center gap-3">
                  {tk.icon_url ? (
                    <img src={tk.icon_url} alt={tk.toolkit_name} className="h-6 w-6 rounded" />
                  ) : (
                    <div className="h-6 w-6 rounded bg-muted" />
                  )}
                  <div className="text-base font-medium">
                    {tk.toolkit_name}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  {tk.profiles.length === 0 ? (
                    <div className="text-sm text-muted-foreground">Nenhum perfil conectado.</div>
                  ) : (
                    tk.profiles.map((p) => (
                      <div key={p.profile_id} className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="text-sm font-medium truncate">{p.display_name || p.profile_name}</div>
                          <div className="text-xs text-muted-foreground truncate">{p.profile_name}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          {p.is_default ? (
                            <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary">Padrão</span>
                          ) : null}
                          {p.is_connected ? (
                            <span className="text-xs px-2 py-1 rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">Conectado</span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">Pendente</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 