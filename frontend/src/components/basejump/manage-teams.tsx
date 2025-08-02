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
    <Card>
      <CardHeader>
        <CardTitle>Suas Equipes</CardTitle>
        <CardDescription>
          Equipes que você pertence ou é dono
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ManageTeamsClient teams={teams} />
      </CardContent>
    </Card>
  );
}
