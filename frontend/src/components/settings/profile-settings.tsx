'use client';

import { useState } from 'react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, Moon, Sun, Monitor } from 'lucide-react';
import { GetAccountResponse } from '@usebasejump/shared';
import { User } from '@supabase/supabase-js';
import { editPersonalAccountName } from '@/lib/actions/personal-account';
import { SubmitButton } from '@/components/ui/submit-button';
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { toast } from 'sonner';

interface ProfileSettingsProps {
  account: GetAccountResponse;
  user?: User;
}

export default function ProfileSettings({ account, user }: ProfileSettingsProps) {
  const { theme, setTheme } = useTheme();
  const [fontSize, setFontSize] = useState('medium');

  const themeOptions = [
    { value: 'light', label: 'Claro', icon: <Sun className="h-4 w-4" /> },
    { value: 'dark', label: 'Escuro', icon: <Moon className="h-4 w-4" /> },
    { value: 'system', label: 'Sistema', icon: <Monitor className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user?.user_metadata?.avatar_url} />
          <AvatarFallback>
            {account.name?.substring(0, 2).toUpperCase() || 'US'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h3 className="font-medium">{account.name || 'Usuário'}</h3>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" />
          Alterar foto
        </Button>
      </div>

      <Separator />

      {/* Profile Form */}
      <form className="space-y-6">
        <input type="hidden" name="accountId" value={account.account_id} />
        
        <div className="space-y-2">
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            name="name"
            defaultValue={account.name}
            placeholder="Seu nome"
          />
          <p className="text-xs text-muted-foreground">
            Como você quer ser chamado no Prophet
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={user?.email || ''}
            disabled
            className="bg-muted"
          />
          <p className="text-xs text-muted-foreground">
            Email usado para login e notificações
          </p>
        </div>

        <SubmitButton
          formAction={editPersonalAccountName}
          pendingText="Salvando..."
        >
          Salvar alterações
        </SubmitButton>
      </form>

      <Separator />

      {/* Appearance Settings */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Aparência</h3>
        
        {/* Theme Selection */}
        <div className="space-y-3">
          <Label>Tema</Label>
          <RadioGroup value={theme} onValueChange={setTheme} className="grid grid-cols-3 gap-4">
            {themeOptions.map((option) => (
              <Label
                key={option.value}
                htmlFor={option.value}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border-2 p-4 cursor-pointer transition-all",
                  "hover:bg-accent/10",
                  theme === option.value && "border-primary"
                )}
              >
                <RadioGroupItem
                  value={option.value}
                  id={option.value}
                  className="sr-only"
                />
                {option.icon}
                <span className="text-sm font-medium">{option.label}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Font Size */}
        <div className="space-y-3">
          <Label htmlFor="font-size">Tamanho da fonte</Label>
          <Select value={fontSize} onValueChange={setFontSize}>
            <SelectTrigger id="font-size">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeno</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}