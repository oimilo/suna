'use client';

import { useParams } from 'next/navigation';
import { useAgentVersionData } from '@/hooks/use-agent-version-data';
import { Loader2 } from 'lucide-react';
import { AgentPreview } from '@/components/agents/agent-preview';

export default function SharedAgentPage() {
  const params = useParams();
  const agentId = params.agentId as string;
  const { agent, isViewingOldVersion, isLoading, error } = useAgentVersionData({ agentId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Agente não encontrado</h2>
          <p className="text-muted-foreground">
            O agente que você está procurando não existe ou você não tem permissão para visualizá-lo.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">{agent.name}</h1>
          <p className="text-muted-foreground">{agent.description}</p>
        </div>
        
        <AgentPreview 
          agent={agent}
          isViewingOldVersion={isViewingOldVersion}
        />
      </div>
    </div>
  );
}