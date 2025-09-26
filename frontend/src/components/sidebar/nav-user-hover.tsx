'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown, LogOut, Settings, CreditCard, Bot, Plug, Zap, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from 'next-themes';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export function NavUserHover() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!user) return null;

  const initials = user.email?.substring(0, 2).toUpperCase() || '??';

  const displayName = user.user_metadata?.name || user.email;

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          className={cn(
            "flex-1 justify-between h-10 px-2",
            isExpanded && "bg-accent"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{displayName}</span>
          </div>
          <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
        </Button>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="h-10 w-10 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground"
          title="Alternar tema"
          aria-label="Alternar tema"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </button>
      </div>

      {isExpanded && (
        <div className="py-1 space-y-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-9"
            onClick={() => router.push('/automations')}
          >
            <Zap className="mr-2 h-4 w-4" />
            Automações
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-9"
            onClick={() => router.push('/agents')}
          >
            <Bot className="mr-2 h-4 w-4" />
            Agentes
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-9"
            onClick={() => router.push('/settings/credentials')}
          >
            <Plug className="mr-2 h-4 w-4" />
            Credenciais
          </Button>

          <Separator className="my-1" />

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-9"
            onClick={() => router.push('/settings')}
          >
            <Settings className="mr-2 h-4 w-4" />
            Configurações
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-9"
            onClick={() => router.push('/settings/billing')}
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Faturamento
          </Button>

          <Separator className="my-1" />

          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-9 text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      )}
    </div>
  );
}