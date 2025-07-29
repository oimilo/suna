import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default async function AcceptInvitePage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = await createClient();
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    // Redirect to login with return URL
    redirect(`/auth?returnUrl=/invites/${params.token}`);
  }
  
  // Get invitation details
  const { data: inviteInfo, error: lookupError } = await supabase
    .rpc('lookup_invitation', { lookup_invitation_token: params.token });
    
  if (lookupError || !inviteInfo?.active) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-destructive">Convite Inválido</h1>
            <p className="text-muted-foreground">
              Este convite expirou ou não é mais válido.
            </p>
            <Button asChild>
              <Link href="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Accept the invitation
  const { data: acceptResult, error: acceptError } = await supabase
    .rpc('accept_invitation', { lookup_invitation_token: params.token });
    
  if (acceptError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold text-destructive">Erro ao Aceitar Convite</h1>
            <p className="text-muted-foreground">
              {acceptError.message}
            </p>
            <Button asChild>
              <Link href="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Redirect to the team page
  redirect(`/${acceptResult.slug}`);
}