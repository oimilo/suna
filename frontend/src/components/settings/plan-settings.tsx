'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GetAccountResponse } from '@usebasejump/shared';
import Link from 'next/link';
import { CreditCard } from 'lucide-react';

interface PlanSettingsProps {
  account: GetAccountResponse;
}

export default function PlanSettings({ account }: PlanSettingsProps) {
  // Por enquanto não temos integração real com billing, então vamos mostrar um estado simplificado
  
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Plano Gratuito</CardTitle>
            <Badge>Ativo</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Você está usando o Prophet gratuitamente. Aproveite para explorar todas as funcionalidades!
          </p>
          
          <div className="pt-4">
            <Button variant="outline" className="w-full" asChild>
              <Link href="/settings/billing">
                <CreditCard className="h-4 w-4 mr-2" />
                Gerenciar faturamento
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Future Plans Info */}
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground text-center">
            Em breve teremos planos pagos com mais recursos e limites maiores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}