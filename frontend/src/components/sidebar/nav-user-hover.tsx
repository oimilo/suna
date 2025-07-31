'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ChevronsUpDown, LogOut, Moon, Sun, Settings, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/components/AuthProvider';
import { useTheme } from 'next-themes';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export function NavUserHover() {
  const { user, signOut } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!user) return null;

  const initials = user.email?.substring(0, 2).toUpperCase() || '??';

  return (
    <div className="space-y-1">
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-between h-10 px-2",
          isExpanded && "bg-accent"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={user.user_metadata?.avatar_url} />
            <AvatarFallback className="text-xs">{initials}</AvatarFallback>
          </Avatar>
          <span className="text-sm truncate max-w-[140px]">{user.email}</span>
        </div>
        <ChevronsUpDown className="h-4 w-4 text-muted-foreground" />
      </Button>

      {isExpanded && (
        <div className="py-1 space-y-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start h-9"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? (
              <>
                <Sun className="mr-2 h-4 w-4" />
                Tema Claro
              </>
            ) : (
              <>
                <Moon className="mr-2 h-4 w-4" />
                Tema Escuro
              </>
            )}
          </Button>

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