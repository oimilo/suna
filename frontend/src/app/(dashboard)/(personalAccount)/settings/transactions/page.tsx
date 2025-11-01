import { CreditTransactions } from '@/components/billing/credit-transactions';

export default function TransactionsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Transações de créditos</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Acompanhe entradas, saídas e expiração de créditos da sua conta
        </p>
      </div>
      <CreditTransactions />
    </div>
  );
}

