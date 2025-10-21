'use client';

import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, ShieldCheck, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useComposioCategories, useComposioToolkits } from '@/hooks/react-query/composio/use-composio';
import { backendApi } from '@/lib/api-client';
import { ComposioAppCard } from '@/components/agents/composio/composio-app-card';
import { ComposioConnector } from '@/components/agents/composio/composio-connector';
import type { ComposioToolkit } from '@/hooks/react-query/composio/utils';

const COMMON_TOOLKITS = [
  'github',
  'gmail',
  'slack',
  'notion',
  'trello',
  'asana',
  'linear',
  'jira',
  'discord',
  'telegram',
  'twitter',
  'google-drive',
  'dropbox',
  'salesforce',
  'hubspot',
];

export default function ComposioDiagnosticsPage() {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [selectedToolkit, setSelectedToolkit] = useState<ComposioToolkit | null>(null);

  const { data: categoriesData } = useComposioCategories();
  const { data: toolkitsData, isLoading, refetch } = useComposioToolkits(search.trim(), selectedCategory);

  const toolkits = toolkitsData?.toolkits ?? [];

  const handleOpenConnector = (toolkit: ComposioToolkit) => {
    setSelectedToolkit(toolkit);
  };

  const handleConnectorComplete = (profileId: string, appName: string, appSlug: string) => {
    setSelectedToolkit(null);
    toast.success(`${appName} connected successfully (profile ${profileId}).`);
    void refetch();
  };

  const handleCheckHealth = async () => {
    try {
      const response = await backendApi.get('/composio/health');
      if (response.success) {
        toast.success('Composio service is healthy.');
      } else {
        toast.error(response.error?.message ?? 'Service reported an error.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to reach Composio health endpoint.');
    }
  };

  const filteredCommonToolkits = useMemo(() => {
    const lowerSearch = search.toLowerCase();
    return COMMON_TOOLKITS.filter((slug) => slug.includes(lowerSearch));
  }, [search]);

  return (
    <div className="container mx-auto max-w-6xl py-8 space-y-8">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-semibold">Composio Discovery &amp; Diagnostics</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
            Explore available integrations, connect new toolkits, and validate that Composio is ready to power
            automations. Use the search below to find a toolkit and launch the guided connector.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleCheckHealth} variant="outline" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Check service health
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-lg">
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by toolkit name or slug..."
                className="h-11"
              />
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <Button
                size="sm"
                variant={selectedCategory === undefined ? 'default' : 'outline'}
                onClick={() => setSelectedCategory(undefined)}
              >
                All categories
              </Button>
              {categoriesData?.categories?.map((category) => (
                <Button
                  key={category.id}
                  size="sm"
                  variant={selectedCategory === category.id ? 'default' : 'outline'}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </Button>
              ))}
            </div>
          </div>
          {filteredCommonToolkits.length > 0 && (
            <div className="text-xs text-muted-foreground">
              Quick picks:{' '}
              {filteredCommonToolkits.map((slug, index) => (
                <React.Fragment key={slug}>
                  <button
                    type="button"
                    className="underline underline-offset-2 hover:text-foreground"
                    onClick={() => setSearch(slug)}
                  >
                    {slug}
                  </button>
                  {index < filteredCommonToolkits.length - 1 && ', '}
                </React.Fragment>
              ))}
            </div>
          )}
        </CardHeader>
        <Separator />
        <CardContent className="p-0">
          <ScrollArea className="h-[520px]">
            <div className="grid gap-4 p-6 md:grid-cols-2">
              {isLoading ? (
                <div className="col-span-2 flex items-center justify-center py-24 text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading toolkits...
                </div>
              ) : toolkits.length === 0 ? (
                <div className="col-span-2 flex flex-col items-center justify-center gap-2 py-16">
                  <RefreshCcw className="h-6 w-6 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">No toolkits found for the current filters.</p>
                </div>
              ) : (
                toolkits.map((toolkit) => (
                  <ComposioAppCard
                    key={toolkit.slug}
                    app={toolkit}
                    onConnectApp={() => handleOpenConnector(toolkit)}
                  />
                ))
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {selectedToolkit && (
        <ComposioConnector
          app={selectedToolkit}
          open={!!selectedToolkit}
          onOpenChange={(open) => {
            if (!open) setSelectedToolkit(null);
          }}
          onComplete={(profileId, appName, appSlug) => handleConnectorComplete(profileId, appName, appSlug)}
          mode="profile-only"
        />
      )}
    </div>
  );
}
