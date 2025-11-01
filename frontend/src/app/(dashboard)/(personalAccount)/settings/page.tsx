import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EditPersonalAccountName from '@/components/basejump/edit-personal-account-name';
import { createClient } from '@/lib/supabase/server';

export default async function PersonalAccountSettingsPage() {
  const supabaseClient = await createClient();
  const { data: personalAccount } = await supabaseClient.rpc('get_personal_account');

  if (!personalAccount) {
    return null;
  }

  return (
    <div className="max-w-3xl space-y-6">
      <Card className="border-none shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">Identidade da conta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Atualize o nome exibido para os membros da equipe e no faturamento.
          </p>
        </CardHeader>
        <CardContent>
          <EditPersonalAccountName account={personalAccount} />
        </CardContent>
      </Card>
    </div>
  );
}