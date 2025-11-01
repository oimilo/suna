'use client';

import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Infinity,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import {
  useTransactions,
  useTransactionsSummary,
  type CreditTransaction,
} from '@/hooks/react-query/billing/use-transactions';

const TYPE_FILTER_LABELS: Record<string, string> = {
  tier_grant: 'Créditos do plano',
  purchase: 'Compra',
  admin_grant: 'Ajuste manual',
  promotional: 'Promoção',
  usage: 'Uso',
  refund: 'Reembolso',
  adjustment: 'Ajuste',
  expired: 'Expirado',
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(value);

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

const TRANSACTION_BADGE_VARIANTS: Record<CreditTransaction['type'], 'secondary' | 'outline' | 'destructive' | 'default'> = {
  tier_grant: 'default',
  purchase: 'default',
  admin_grant: 'secondary',
  promotional: 'secondary',
  usage: 'outline',
  refund: 'secondary',
  adjustment: 'outline',
  expired: 'destructive',
};

export function CreditTransactions() {
  const [offset, setOffset] = useState(0);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState('');

  const limit = 50;

  const { data, isLoading, error, refetch, isFetching } = useTransactions(limit, offset, typeFilter);
  const { data: summary, isLoading: summaryLoading } = useTransactionsSummary(30);

  const filteredTransactions = data?.transactions?.filter((transaction) => {
    if (!search.trim()) return true;

    const haystack = [
      transaction.description,
      transaction.metadata ? JSON.stringify(transaction.metadata) : '',
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(search.trim().toLowerCase());
  });

  const handleNext = () => {
    if (data?.pagination?.has_more) {
      setOffset((prev) => prev + limit);
    }
  };

  const handlePrev = () => {
    setOffset((prev) => Math.max(0, prev - limit));
  };

  if (error) {
    return (
      <Card className="rounded-3xl border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Histórico de Créditos</CardTitle>
          <CardDescription>Não foi possível carregar suas transações.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error.message || 'Falha ao carregar dados.'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading && !data) {
    return (
      <Card className="rounded-3xl border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Histórico de Créditos</CardTitle>
          <CardDescription>Carregando suas transações...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const currentBalance = data?.current_balance;
  const transactions = filteredTransactions || [];

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl border border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle>Resumo de Créditos</CardTitle>
          <CardDescription>Visão geral do saldo atual</CardDescription>
        </CardHeader>
        <CardContent>
          {summaryLoading ? (
            <div className="grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full" />
              ))}
            </div>
          ) : currentBalance ? (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Saldo total</p>
                <p className="text-2xl font-semibold">
                  {formatCurrency(currentBalance.total)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Créditos que expiram</p>
                  <p className="text-lg font-medium text-amber-500">
                    {formatCurrency(currentBalance.expiring)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Infinity className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Créditos permanentes</p>
                  <p className="text-lg font-medium text-blue-500">
                    {formatCurrency(currentBalance.non_expiring)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma informação de saldo disponível.</p>
          )}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border border-border/60 shadow-sm">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Histórico de transações</CardTitle>
              <CardDescription>Entradas e saídas de créditos na sua conta</CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="gap-2"
            >
              {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshIcon />}
              Atualizar
            </Button>
          </div>
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Filtrar por tipo</Label>
              <Select
                value={typeFilter}
                onValueChange={(value) => {
                  setOffset(0);
                  setTypeFilter(value === 'all' ? undefined : value);
                }}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {Object.entries(TYPE_FILTER_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs uppercase text-muted-foreground">Pesquisar</Label>
              <Input
                placeholder="Busque por descrição ou metadados"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="h-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {transactions.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-center text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <p className="text-sm">Nenhuma transação encontrada com os filtros atuais.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="text-right">Saldo após</TableHead>
                    <TableHead className="text-right">Tipo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const isPositive = transaction.amount >= 0;

                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                          {formatTimestamp(transaction.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-foreground">
                              {transaction.description || 'Sem descrição'}
                            </span>
                            {transaction.metadata && (
                              <span className="text-xs text-muted-foreground">
                                {JSON.stringify(transaction.metadata)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-500'}
                          >
                            {isPositive ? '+' : '-'}
                            {formatCurrency(Math.abs(transaction.amount))}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {formatCurrency(transaction.balance_after)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={TRANSACTION_BADGE_VARIANTS[transaction.type]}>
                            {TYPE_FILTER_LABELS[transaction.type] ?? transaction.type}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex items-center justify-between border-t pt-4">
            <div className="text-xs text-muted-foreground">
              Página {offset / limit + 1}
              {data?.pagination?.total && (
                <span className="ml-1">
                  • {data.pagination.total} transações
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrev}
                disabled={offset === 0}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNext}
                disabled={!data?.pagination?.has_more}
                className="gap-2"
              >
                Próxima
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RefreshIcon() {
  return <RefreshCw className="h-4 w-4" />;
}

export default CreditTransactions;

