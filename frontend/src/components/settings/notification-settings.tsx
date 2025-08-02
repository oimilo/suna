'use client';

import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { toast } from 'sonner';

interface NotificationSetting {
  id: string;
  label: string;
  description: string;
  enabled: boolean;
}

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSetting[]>([
    {
      id: 'email-notifications',
      label: 'Notificações por email',
      description: 'Receber notificações importantes no seu email',
      enabled: true,
    },
    {
      id: 'browser-notifications',
      label: 'Notificações do navegador',
      description: 'Receber notificações no seu navegador quando estiver online',
      enabled: false,
    }
  ]);

  const handleToggle = (id: string) => {
    setSettings(prev => 
      prev.map(setting => 
        setting.id === id ? { ...setting, enabled: !setting.enabled } : setting
      )
    );
  };

  const handleSave = () => {
    toast.success('Preferências de notificação salvas!');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Configure como você deseja receber notificações do Prophet.
        </p>
        
        {settings.map((setting) => (
          <div key={setting.id} className="flex items-center justify-between py-3">
            <div className="space-y-0.5">
              <Label htmlFor={setting.id}>{setting.label}</Label>
              <p className="text-sm text-muted-foreground">
                {setting.description}
              </p>
            </div>
            <Switch
              id={setting.id}
              checked={setting.enabled}
              onCheckedChange={() => handleToggle(setting.id)}
            />
          </div>
        ))}
      </div>

      <Button onClick={handleSave}>
        Salvar preferências
      </Button>
    </div>
  );
}