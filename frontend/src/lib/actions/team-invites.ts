'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function sendTeamInviteEmail(
  inviteeEmail: string,
  inviteeName: string | null,
  teamId: string
) {
  const supabase = await createClient();
  
  // Get current user info
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  
  // Get team info
  const { data: team } = await supabase
    .from('accounts')
    .select('name, slug')
    .eq('id', teamId)
    .single();
    
  if (!team) throw new Error('Team not found');
  
  // Create invitation in database
  const { data: invitation, error: inviteError } = await supabase
    .rpc('create_invitation', {
      account_id: teamId,
      account_role: 'member',
      invitation_type: 'one_time'
    });
    
  if (inviteError) throw inviteError;
  
  // Generate invite link
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const inviteLink = `${baseUrl}/invites/${invitation.token}`;
  
  // Send email via backend
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
  const adminApiKey = process.env.ADMIN_API_KEY || process.env.KORTIX_ADMIN_API_KEY;
  
  const response = await fetch(`${backendUrl}/api/send-team-invite-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Admin-Api-Key': adminApiKey!,
    },
    body: JSON.stringify({
      invitee_email: inviteeEmail,
      invitee_name: inviteeName,
      team_name: team.name,
      inviter_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Team member',
      invite_link: inviteLink
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to send invite email');
  }
  
  revalidatePath(`/${team.slug}/settings/members`);
  
  return { success: true, invitation };
}