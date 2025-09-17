import React from 'react';
import { Bot, Search, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  hasAgents: boolean;
  onCreateAgent: () => void;
  onClearFilters: () => void;
}

export const EmptyState = ({ hasAgents, onCreateAgent, onClearFilters }: EmptyStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="flex flex-col items-center text-center max-w-md space-y-6">
        <div className="rounded-full bg-muted p-6">
          {!hasAgents ? (
            <Bot className="h-12 w-12 text-muted-foreground" />
          ) : (
            <Search className="h-12 w-12 text-muted-foreground" />
          )}
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-foreground">
            {!hasAgents ? 'Nenhum agente ainda' : 'Nenhum agente encontrado'}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {!hasAgents ? (
              'Crie seu primeiro agente para começar a automatizar tarefas com instruções e ferramentas personalizadas. Configure recursos personalizados do AgentPress para ajustar o agente de acordo com suas necessidades.'
            ) : (
              'Nenhum agente corresponde aos seus critérios de pesquisa e filtro atuais. Tente ajustar seus filtros ou termos de pesquisa.'
            )}
          </p>
        </div>
        {!hasAgents ? (
          <Button 
            size="lg" 
            onClick={onCreateAgent}
            className="mt-4"
          >
            <Plus className="h-5 w-5" />
            Criar seu primeiro agente
          </Button>
        ) : (
          <Button 
            variant="outline"
            onClick={onClearFilters}
            className="mt-4"
          >
            Limpar filtros
          </Button>
        )}
      </div>
    </div>
  );
}