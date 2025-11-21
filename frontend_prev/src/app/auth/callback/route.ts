import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('returnUrl') || searchParams.get('redirect') || '/dashboard'
  
  // Use configured URL instead of parsed origin to avoid 0.0.0.0 issues in self-hosted environments
  const baseUrl = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000'
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('❌ Auth callback error:', error, errorDescription)
    return NextResponse.redirect(`${baseUrl}/auth?error=${encodeURIComponent(error)}`)
  }

  if (code) {
    const supabase = await createClient()
    
    try {
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Error exchanging code for session:', error)
        return NextResponse.redirect(`${baseUrl}/auth?error=${encodeURIComponent(error.message)}`)
      }

      if (data.user) {
        const { data: accountData } = await supabase
          .schema('basejump')
          .from('accounts')
          .select('id')
          .eq('primary_owner_user_id', data.user.id)
          .eq('personal_account', true)
          .single();

        if (accountData) {
          const { data: creditAccount } = await supabase
            .from('credit_accounts')
            .select('tier, stripe_subscription_id')
            .eq('account_id', accountData.id)
            .single();

          // If no credit account or tier is 'none', ensure free tier automatically
          if (!creditAccount || creditAccount.tier === 'none' || !creditAccount.tier) {
            try {
              const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL;
              if (backendUrl && data.session?.access_token) {
                const response = await fetch(`${backendUrl}/setup/ensure-free-tier`, {
                  method: 'POST',
                  headers: {
                    'Authorization': `Bearer ${data.session.access_token}`,
                    'Content-Type': 'application/json',
                  },
                });
                
                if (response.ok) {
                  // Free tier was given, continue to dashboard
                  return NextResponse.redirect(`${baseUrl}${next}`)
                }
              }
            } catch (error) {
              console.error('Error ensuring free tier in callback:', error);
              // Continue anyway - middleware will handle it
            }
            
            // If API call failed or no backend URL, redirect to setting-up page
            return NextResponse.redirect(`${baseUrl}/setting-up`);
          }
        }
      }

      // URL to redirect to after sign in process completes
      return NextResponse.redirect(`${baseUrl}${next}`)
    } catch (error) {
      console.error('❌ Unexpected error in auth callback:', error)
      return NextResponse.redirect(`${baseUrl}/auth?error=unexpected_error`)
    }
  }
  return NextResponse.redirect(`${baseUrl}/auth`)
}
