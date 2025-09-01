import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const execute = searchParams.get('execute') === 'true'
  
  const supabase = createAdminClient()
  
  try {
    // Usuários que precisam de contas
    const targetEmails = [
      'start@prophet.build',
      'cavallari@neurociente.com.br',
      'vinicius@agenciadebolso.com'
    ]
    
    // Buscar usuários
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const targetUsers = authUsers?.users?.filter(u => 
      targetEmails.includes(u.email || '')
    ) || []
    
    // Verificar contas existentes no schema basejump
    const { data: existingAccounts } = await supabase
      .schema('basejump')
      .from('accounts')
      .select('*')
    
    const results = []
    
    for (const user of targetUsers) {
      // Verificar se já tem conta
      const hasAccount = existingAccounts?.some(a => a.id === user.id)
      
      if (!hasAccount && execute) {
        // Criar conta pessoal para o usuário
        const accountData = {
          id: user.id, // Para contas pessoais, o ID é o mesmo do usuário
          name: user.email?.split('@')[0] || 'Personal',
          slug: user.email?.split('@')[0]?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'personal',
          personal_account: true,
          primary_owner_user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { data: createdAccount, error: createError } = await supabase
          .schema('basejump')
          .from('accounts')
          .insert(accountData)
          .select()
          .single()
        
        // Criar relação account_user
        if (createdAccount) {
          await supabase
            .schema('basejump')
            .from('account_user')
            .insert({
              account_id: user.id,
              user_id: user.id,
              account_role: 'owner'
            })
        }
        
        results.push({
          email: user.email,
          user_id: user.id,
          account_existed: false,
          account_created: !!createdAccount,
          error: createError?.message
        })
      } else {
        results.push({
          email: user.email,
          user_id: user.id,
          account_existed: hasAccount,
          account_created: false,
          would_create: !hasAccount && !execute
        })
      }
    }
    
    // Verificar contas após criação
    const { data: finalAccounts } = await supabase
      .schema('basejump')
      .from('accounts')
      .select('*')
    
    const userAccounts = targetUsers.map(u => {
      const account = finalAccounts?.find(a => a.id === u.id)
      return {
        email: u.email,
        user_id: u.id,
        has_account: !!account,
        account_name: account?.name,
        account_slug: account?.slug
      }
    })
    
    return NextResponse.json({
      executed: execute,
      results,
      final_status: userAccounts,
      total_accounts: finalAccounts?.length || 0,
      instructions: execute 
        ? "Contas criadas com sucesso! Agora pode sincronizar as assinaturas."
        : "Use ?execute=true para criar as contas"
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      message: 'Erro ao criar contas'
    }, { status: 500 })
  }
}