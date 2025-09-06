import React from 'react';
import {
  Users,
  CheckCircle,
  AlertTriangle,
  User,
  Link2,
  Link2Off,
  Calendar,
  Clock,
  Wrench,
  Crown
} from 'lucide-react';
import { ToolViewProps } from '../types';
import { getToolTitle } from '../utils';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from "@/components/ui/scroll-area";
import { LoadingState } from '../shared/LoadingState';
import { Separator } from "@/components/ui/separator";
import { extractGetCredentialProfilesData } from './_utils';

export function GetCredentialProfilesToolView({
  name = 'get-credential-profiles',
  assistantContent,
  toolContent,
  assistantTimestamp,
  toolTimestamp,
  isSuccess = true,
  isStreaming = false,
}: ToolViewProps) {

  const {
    app_slug,
    message,
    profiles,
    total_count,
    actualIsSuccess,
    actualToolTimestamp,
    actualAssistantTimestamp
  } = extractGetCredentialProfilesData(
    assistantContent,
    toolContent,
    isSuccess,
    toolTimestamp,
    assistantTimestamp
  );

  const toolTitle = getToolTitle(name);

  const getConnectionStatus = (isConnected: boolean) => {
    return {
      icon: isConnected ? Link2 : Link2Off,
      color: isConnected 
        ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
        : 'bg-red-100 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
      text: isConnected ? 'Connected' : 'Not Connected'
    };
  };

  const getActiveStatus = (isActive: boolean) => {
    return {
      color: isActive 
        ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
        : 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-900/20 dark:text-gray-300 dark:border-gray-800',
      text: isActive ? 'Active' : 'Inactive'
    };
  };

  return (
    <Card className="gap-0 flex border shadow-none border-t border-b-0 border-x-0 p-0 rounded-none flex-col overflow-hidden bg-card">
      <CardHeader className="px-4 py-3 bg-black/[0.01] dark:bg-white/[0.01] backdrop-blur-sm border-b border-black/6 dark:border-white/8">
        <div className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground opacity-60" />
            <div>
              <CardTitle className="text-sm font-medium text-foreground">
                {toolTitle}
              </CardTitle>
              {app_slug && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  App: {app_slug}
                </p>
              )}
            </div>
          </div>

          {!isStreaming && (
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-medium",
                actualIsSuccess
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800"
                  : "bg-red-50 text-red-700 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800"
              )}
            >
              {actualIsSuccess ? (
                <CheckCircle className="h-3 w-3" />
              ) : (
                <AlertTriangle className="h-3 w-3" />
              )}
              {total_count} {total_count === 1 ? 'profile' : 'profiles'}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="p-0 h-full flex-1 overflow-hidden relative">
        {isStreaming ? (
          <LoadingState
            icon={Users}
            iconColor="text-blue-500 dark:text-blue-400"
            bgColor="bg-gradient-to-b from-blue-100 to-blue-50 shadow-inner dark:from-blue-800/40 dark:to-blue-900/60 dark:shadow-blue-950/20"
            title="Loading credential profiles"
            filePath={app_slug ? `"${app_slug}"` : undefined}
            showProgress={true}
          />
        ) : profiles.length > 0 ? (
          <ScrollArea className="h-full w-full">
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                {profiles.map((profile, index) => (
                  <div
                    key={index}
                    className="border rounded-xl p-4 space-y-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-muted/50 border flex items-center justify-center relative">
                          <User className="w-6 h-6 text-muted-foreground" />
                          {profile.is_default && (
                            <div className="absolute -top-1 -right-1">
                              <div className="bg-yellow-500 rounded-full p-1">
                                <Crown className="w-3 h-3 text-white" />
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">
                              {profile.display_name}
                            </h3>
                            {profile.is_default && (
                              <Badge 
                                variant="secondary" 
                                className="text-xs border border-yellow-300 dark:border-yellow-800 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300"
                              >
                                <Crown className="w-2.5 h-2.5" />
                                Default
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            {profile.app_name}
                          </p>
                          {profile.profile_name !== profile.display_name && (
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
                              {profile.profile_name}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {(() => {
                          const connectionStatus = getConnectionStatus(profile.is_connected);
                          const activeStatus = getActiveStatus(profile.is_active);
                          const ConnectionIcon = connectionStatus.icon;
                          
                          return (
                            <>
                              <Badge
                                variant="outline"
                                className={cn("text-xs font-medium", connectionStatus.color)}
                              >
                                <ConnectionIcon className="w-3 h-3" />
                                {connectionStatus.text}
                              </Badge>
                              <Badge
                                variant="outline"
                                className={cn("text-xs font-medium", activeStatus.color)}
                              >
                                {activeStatus.text}
                              </Badge>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-8 px-6">
            <div className="text-center w-full max-w-xs">
              <div className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <Users className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                No profiles found
              </h3>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {app_slug ? `No credential profiles found for "${app_slug}"` : 'No credential profiles available'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 