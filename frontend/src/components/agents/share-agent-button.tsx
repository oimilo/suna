'use client';

import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface ShareAgentButtonProps {
  agentId: string;
  className?: string;
}

export function ShareAgentButton({ agentId, className }: ShareAgentButtonProps) {
  const { toast } = useToast();

  const handleShare = () => {
    const shareUrl = `${window.location.origin}/share/agent/${agentId}`;
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({
        title: 'Link copiado!',
        description: 'O link de compartilhamento foi copiado para a área de transferência.',
      });
    }).catch(() => {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o link. Tente novamente.',
        variant: 'destructive',
      });
    });
  };

  return (
    <Button
      onClick={handleShare}
      variant="outline"
      size="sm"
      className={className}
    >
      <Share2 className="h-4 w-4 mr-2" />
      Compartilhar
    </Button>
  );
}