import { createClient } from '@/lib/supabase/server';
import AccountBillingStatus from '@/components/billing/account-billing-status';

const returnUrl = process.env.NEXT_PUBLIC_URL as string;

export default async function PersonalAccountBillingPage() {
  const supabaseClient = await createClient();
  const { data: personalAccount } = await supabaseClient.rpc(
    'get_personal_account',
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Cobrança</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Gerencie seu plano e informações de pagamento
        </p>
      </div>
      <AccountBillingStatus
        accountId={personalAccount.account_id}
        returnUrl={`${returnUrl}/settings/billing`}
      />
    </div>
  );
}
