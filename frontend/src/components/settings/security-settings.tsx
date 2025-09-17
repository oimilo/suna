'use client';

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Shield, Mail, Key, Monitor } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function SecuritySettings() {
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handlePasswordReset = async () => {
    try {
      setIsLoading(true);
      
      // Pega o email do usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user?.email) {
        toast.error('Email não encontrado');
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        throw error;
      }

      toast.success('Email enviado! Verifique sua caixa de entrada.');
    } catch (error: any) {
      console.error('Erro ao enviar email:', error);
      toast.error('Erro ao enviar email de redefinição');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Reset Section com Design Suna */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03]">
            <Key className="h-4 w-4 opacity-60" />
          </div>
          <div>
            <h3 className="text-base font-medium">Senha</h3>
            <p className="text-xs text-muted-foreground">
              Gerencie a segurança da sua conta
            </p>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 space-y-4">
          <div className="space-y-1.5">
            <p className="text-sm font-medium">Redefinir senha</p>
            <p className="text-xs text-muted-foreground">
              Enviaremos um link para seu email para criar uma nova senha.
            </p>
          </div>
          
          <Button 
            onClick={handlePasswordReset}
            disabled={isLoading}
            variant="outline"
            size="sm"
            className="border-black/6 dark:border-white/8 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
          >
            <Mail className="h-3.5 w-3.5 mr-2 opacity-60" />
            {isLoading ? 'Enviando...' : 'Enviar email de redefinição'}
          </Button>
          
          {/* Espaçamento extra no final do card */}
          <div className="h-2" />
        </div>
      </div>

      {/* Login Sessions Section com Design Suna */}
      <div className="space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.03]">
            <Shield className="h-4 w-4 opacity-60" />
          </div>
          <div>
            <h3 className="text-base font-medium">Sessões ativas</h3>
            <p className="text-xs text-muted-foreground">
              Dispositivos onde sua conta está conectada
            </p>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-md bg-transparent">
                <Monitor className="h-3.5 w-3.5 opacity-60" />
              </div>
              <div>
                <p className="text-sm font-medium">Sessão atual</p>
                <p className="text-xs text-muted-foreground">Este dispositivo</p>
              </div>
            </div>
            <Badge 
              variant="secondary" 
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-xs"
            >
              Ativa
            </Badge>
          </div>
          
          <p className="text-xs text-muted-foreground text-center pt-2 pb-4">
            Apenas este dispositivo está conectado
          </p>
        </div>
      </div>
    </div>
  );
}