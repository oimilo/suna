'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ExternalLink, Info, Zap, Shield, Clock } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface PipedreamIntroDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  appName?: string;
}

export function PipedreamIntroDialog({
  open,
  onOpenChange,
  onContinue,
  appName
}: PipedreamIntroDialogProps) {
  const [understood, setUnderstood] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleContinue = () => {
    if (dontShowAgain) {
      localStorage.setItem('pipedream-intro-seen', 'true');
    }
    onContinue();
  };

  const benefits = [
    {
      icon: <Zap className="h-4 w-4 text-amber-500" />,
      title: 'Conexão Instantânea',
      description: 'Conecte com mais de 2000+ apps em segundos'
    },
    {
      icon: <Shield className="h-4 w-4 text-green-500" />,
      title: 'Seguro e Confiável',
      description: 'Seus dados são protegidos com criptografia'
    },
    {
      icon: <Clock className="h-4 w-4 text-blue-500" />,
      title: 'Sempre Atualizado',
      description: 'APIs mantidas e atualizadas automaticamente'
    }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img 
              src="https://pipedream.com/s.v0/app/icons/pipedream.svg" 
              alt="Pipedream" 
              className="h-5 w-5"
            />
            Conectar {appName ? `com ${appName}` : 'Integrações'} via Pipedream
          </DialogTitle>
          <DialogDescription>
            O Prophet usa o Pipedream para gerenciar conexões com aplicativos externos de forma segura.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Informação principal */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Importante:</strong> Você precisará de uma conta Pipedream (gratuita) para conectar integrações. 
              O Pipedream é um serviço confiável usado por milhares de desenvolvedores.
            </AlertDescription>
          </Alert>

          {/* Benefícios */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Por que usamos o Pipedream?</p>
            <div className="space-y-2">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex gap-3">
                  {benefit.icon}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{benefit.title}</p>
                    <p className="text-xs text-muted-foreground">{benefit.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Como funciona */}
          <div className="space-y-3">
            <p className="text-sm font-medium">Como funciona:</p>
            <ol className="space-y-2 text-sm text-muted-foreground">
              <li>1. Você será direcionado para o Pipedream</li>
              <li>2. Faça login ou crie uma conta gratuita</li>
              <li>3. Autorize a conexão com {appName || 'o aplicativo'}</li>
              <li>4. Volte para o Prophet e use a integração</li>
            </ol>
          </div>

          {/* Link para criar conta */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm mb-2">Não tem uma conta Pipedream?</p>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => window.open('https://pipedream.com/auth/signup', '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
              Criar Conta Gratuita
            </Button>
          </div>

          {/* Checkbox de entendimento */}
          <div className="flex items-start space-x-2 pt-2">
            <Checkbox
              id="understood"
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(!!checked)}
            />
            <label
              htmlFor="understood"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Entendi que preciso de uma conta Pipedream para continuar
            </label>
          </div>

          {/* Não mostrar novamente */}
          <div className="flex items-start space-x-2">
            <Checkbox
              id="dontShow"
              checked={dontShowAgain}
              onCheckedChange={(checked) => setDontShowAgain(!!checked)}
            />
            <label
              htmlFor="dontShow"
              className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Não mostrar esta mensagem novamente
            </label>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!understood}
            className={cn(!understood && "opacity-50")}
          >
            Continuar para Pipedream
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}