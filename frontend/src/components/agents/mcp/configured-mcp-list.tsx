import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, X, Sparkles, Key, AlertTriangle } from 'lucide-react';
import { MCPConfiguration } from './types';
import { useCredentialProfilesForMcp } from '@/hooks/react-query/mcp/use-credential-profiles';
import { usePipedreamAppIcon } from '@/hooks/react-query/pipedream/use-pipedream';
import { Skeleton } from '@/components/ui/skeleton';

interface ConfiguredMcpListProps {
  configuredMCPs: MCPConfiguration[];
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onConfigureTools?: (index: number) => void;
}

const extractAppSlug = (mcp: MCPConfiguration): string | null => {
  if (mcp.customType === 'pipedream') {
    const qualifiedMatch = mcp.qualifiedName.match(/^pipedream_([^_]+)_/);
    if (qualifiedMatch) {
      return qualifiedMatch[1];
    }
    if (mcp.config?.headers?.['x-pd-app-slug']) {
      return mcp.config.headers['x-pd-app-slug'];
    }
  }
  return null;
};

const MCPLogo: React.FC<{ mcp: MCPConfiguration }> = ({ mcp }) => {
  const appSlug = extractAppSlug(mcp);
  const { data: iconData } = usePipedreamAppIcon(appSlug || '', {
    enabled: !!appSlug
  });

  const logoUrl = iconData?.icon_url;

  return (
    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0 overflow-hidden">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={mcp.name}
          className="w-full h-full object-cover rounded"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
            target.nextElementSibling?.classList.remove('hidden');
          }}
        />
      ) : null}
      <div className={logoUrl ? "hidden" : "block"}>
        <Skeleton className="h-6 w-6" />
      </div>
    </div>
  );
};

const MCPConfigurationItem: React.FC<{
  mcp: MCPConfiguration;
  index: number;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  onConfigureTools?: (index: number) => void;
}> = ({ mcp, index, onEdit, onRemove, onConfigureTools }) => {
  const { data: profiles = [] } = useCredentialProfilesForMcp(mcp.qualifiedName);
  const profileId = mcp.selectedProfileId || mcp.config?.profile_id;
  const selectedProfile = profiles.find(p => p.profile_id === profileId);
  
  const hasCredentialProfile = !!profileId && !!selectedProfile;

  return (
    <div className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <MCPLogo mcp={mcp} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <div className="font-medium text-sm truncate">{mcp.name}</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{mcp.enabledTools?.length || 0} ferramentas ativas</span>
              {hasCredentialProfile && (
                <div className="flex items-center gap-1">
                  <Key className="h-3 w-3 text-green-600" />
                  <span className="text-green-600 font-medium truncate max-w-24">
                    {selectedProfile.profile_name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {onConfigureTools && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onConfigureTools(index)}
              title="Configure tools"
            >
              <Settings className="h-4 w-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onRemove(index)}
            title="Remove integration"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export const ConfiguredMcpList: React.FC<ConfiguredMcpListProps> = ({
  configuredMCPs,
  onEdit,
  onRemove,
  onConfigureTools,
}) => {
  if (configuredMCPs.length === 0) return null;

  return (
    <div className="space-y-2">
      {configuredMCPs.map((mcp, index) => (
        <MCPConfigurationItem
          key={mcp.qualifiedName || `custom-${index}`}
          mcp={mcp}
          index={index}
          onEdit={onEdit}
          onRemove={onRemove}
          onConfigureTools={onConfigureTools}
        />
      ))}
    </div>
  );
};