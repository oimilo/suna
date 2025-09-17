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
    <Card className="py-0 gap-0">
      <CardHeader className="px-6 py-4">
        <CardTitle>Suas Equipes</CardTitle>
        <CardDescription>
          Equipes que você pertence ou é dono
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <ManageTeamsClient teams={teams} />
      </CardContent>
    </Card>
  );
}
