import CreditTransactions from '@/components/billing/credit-transactions';

export default function TransactionsPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 pb-14">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Extrato de créditos</h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Monitore movimentações mensais, compras avulsas e ajustes manuais realizados na sua conta.
        </p>
      </div>
      <CreditTransactions />
    </div>
  );
}

