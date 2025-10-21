'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';
import { useFeatureFlag } from '@/lib/feature-flags';
import { PageHeader } from '@/components/ui/page-header';
import { ComposioConnectionsSection } from '@/components/agents/composio/composio-connections-section';

export default function AppProfilesPage() {
  const { enabled: customAgentsEnabled, loading: flagLoading } = useFeatureFlag('custom_agents');
  const router = useRouter();

  useEffect(() => {
    if (!flagLoading && !customAgentsEnabled) {
      router.replace('/dashboard');
    }
  }, [flagLoading, customAgentsEnabled, router]);

  if (flagLoading) {
    return (
      <div className="container mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-14 bg-muted rounded-2xl" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 bg-muted rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!customAgentsEnabled) {
    return null;
  }

  return (
    <div className="container mx-auto max-w-6xl px-6 py-8">
      <div className="space-y-8">
        <PageHeader icon={Zap}>
          <span className="text-primary">App Credentials</span>
        </PageHeader>
        <ComposioConnectionsSection />
      </div>
    </div>
  );
}
