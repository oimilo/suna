'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Shield, Mail, Key } from 'lucide-react';
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
      {/* Password Reset */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Senha
          </CardTitle>
          <CardDescription>
            Gerencie a segurança da sua conta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Redefinir senha</Label>
            <p className="text-sm text-muted-foreground">
              Enviaremos um link para seu email para criar uma nova senha.
            </p>
          </div>
          
          <Button 
            onClick={handlePasswordReset}
            disabled={isLoading}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Mail className="h-4 w-4 mr-2" />
            {isLoading ? 'Enviando...' : 'Enviar email de redefinição'}
          </Button>
        </CardContent>
      </Card>

      {/* Login Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sessões ativas
          </CardTitle>
          <CardDescription>
            Dispositivos onde sua conta está conectada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="font-medium text-sm">Sessão atual</p>
                <p className="text-xs text-muted-foreground">Este dispositivo</p>
              </div>
              <Badge>Ativa</Badge>
            </div>
            
            <p className="text-sm text-muted-foreground text-center py-4">
              Apenas este dispositivo está conectado
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}