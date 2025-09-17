'use client';

import React from 'react';
import EditTeamName from '@/components/basejump/edit-team-name';
import EditTeamSlug from '@/components/basejump/edit-team-slug';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';

type AccountParams = {
  accountSlug: string;
};

export default function TeamSettingsPage({
  params,
}: {
  params: Promise<AccountParams>;
}) {
  const unwrappedParams = React.use(params);
  const { accountSlug } = unwrappedParams;

  // Use an effect to load team account data
  const [teamAccount, setTeamAccount] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    async function loadData() {
      try {
        console.log('Loading account data for slug:', accountSlug);
        const supabaseClient = await createClient();
        const { data, error } = await supabaseClient.rpc('get_account_by_slug', {
          slug: accountSlug,
        });
        
        if (error) {
          console.error('RPC error:', error);
          setError(`Failed to load account data: ${error.message}`);
          setLoading(false);
          return;
        }
        
        console.log('Account data received:', data);
        setTeamAccount(data);
        setLoading(false);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('Failed to load account data');
        setLoading(false);
      }
    }

    loadData();
  }, [accountSlug]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
        <h3 className="text-red-800 dark:text-red-200 font-semibold">Error</h3>
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  if (!teamAccount) {
    return (
      <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
        <h3 className="text-yellow-800 dark:text-yellow-200 font-semibold">Account not found</h3>
        <p className="text-yellow-700 dark:text-yellow-300">
          The account with slug "{accountSlug}" could not be found or you don't have access to it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-card-title">Team Settings</h3>
        <p className="text-sm text-foreground/70">
          Manage your team account details.
        </p>
      </div>

      <Card className="border-subtle dark:border-white/10 bg-white dark:bg-background-secondary shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-card-title">Team Name</CardTitle>
          <CardDescription>Update your team name.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditTeamName account={teamAccount} />
        </CardContent>
      </Card>

      <Card className="border-subtle dark:border-white/10 bg-white dark:bg-background-secondary shadow-none">
        <CardHeader>
          <CardTitle className="text-base text-card-title">Team URL</CardTitle>
          <CardDescription>Update your team URL slug.</CardDescription>
        </CardHeader>
        <CardContent>
          <EditTeamSlug account={teamAccount} />
        </CardContent>
      </Card>
    </div>
  );
}
