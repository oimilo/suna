import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { createClient } from '@/lib/supabase/server';
import { ManageTeamsClient } from './manage-teams-client';

export default async function ManageTeams() {
  const supabaseClient = await createClient();

  const { data } = await supabaseClient.rpc('get_accounts');

  const teams: any[] = data?.filter(
    (team: any) => team.personal_account === false,
  );

  return (
    <Card className="border-subtle dark:border-white/10 bg-white dark:bg-background-secondary shadow-none rounded-xl">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-card-title">Suas Equipes</CardTitle>
        <CardDescription className="text-foreground/70">
          Equipes que você pertence ou é dono
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ManageTeamsClient teams={teams} />
      </CardContent>
    </Card>
  );
}
