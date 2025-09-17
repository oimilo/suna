import { createClient } from '@/lib/supabase/server';
import UsageLogs from '@/components/billing/usage-logs';

export default async function UsageLogsPage() {
  const supabaseClient = await createClient();
  const { data: personalAccount } = await supabaseClient.rpc(
    'get_personal_account',
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Logs de Uso</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe seu consumo de créditos e histórico de uso
        </p>
      </div>
      <UsageLogs accountId={personalAccount.account_id} />
    </div>
  );
}
