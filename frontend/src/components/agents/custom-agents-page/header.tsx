'use client';

import React from 'react';
import { Bot } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export const AgentsPageHeader = () => {
  return (
    <PageHeader icon={Bot}>
      <div className="space-y-4">
        <div className="text-4xl font-semibold tracking-tight">
          <span className="text-primary">Agentes IA</span> = <span className="text-primary">Funcionários IA</span>
        </div>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Explore e crie seus próprios agentes personalizados que combinam{' '}
          <span className="text-foreground font-medium">integrações</span>,{' '}
          <span className="text-foreground font-medium">instruções</span>,{' '}
          <span className="text-foreground font-medium">conhecimento</span>,{' '}
          <span className="text-foreground font-medium">gatilhos</span> e{' '}
          <span className="text-foreground font-medium">fluxos de trabalho</span>.
        </p>
      </div>
    </PageHeader>
  );
};
