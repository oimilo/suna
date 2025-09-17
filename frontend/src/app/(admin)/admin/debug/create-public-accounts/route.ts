import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const execute = searchParams.get('execute') === 'true'
  
  const supabase = createAdminClient()
  
  try {
    // Usuários alvo
    const targetUsers = [
      { id: '29e38efa-512a-47c0-9130-0ca0cedeb533', email: 'start@prophet.build' },
      { id: 'd63efb0e-a5f9-40d4-b07f-2fce1322b86e', email: 'cavallari@neurociente.com.br' },
      { id: 'f581c772-e0ef-4ed9-890a-ecebef03cc93', email: 'vinicius@agenciadebolso.com' }
    ]
    
    // Verificar se existem no schema público
    const { data: existingAccounts } = await supabase
      .from('accounts')
      .select('*')
      .in('id', targetUsers.map(u => u.id))
    
    const results = []
    
    for (const user of targetUsers) {
      const exists = existingAccounts?.some(a => a.id === user.id)
      
      if (!exists && execute) {
        // Copiar a estrutura das contas existentes
        const accountData = {
          id: user.id,
          name: user.email.split('@')[0],
          personal_account: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const { data: created, error } = await supabase
          .from('accounts')
          .insert(accountData)
          .select()
          .single()
        
        results.push({
          user_id: user.id,
          email: user.email,
          existed: false,
          created: !!created,
          error: error?.message
        })
      } else {
        results.push({
          user_id: user.id,
          email: user.email,
          existed: exists,
          created: false,
          would_create: !exists && !execute
        })
      }
    }
    
    // Verificar contas finais
    const { data: finalAccounts } = await supabase
      .from('accounts')
      .select('*')
      .in('id', targetUsers.map(u => u.id))
    
    return NextResponse.json({
      executed: execute,
      results,
      final_accounts: finalAccounts,
      instructions: execute 
        ? "Contas criadas no schema público! Agora pode sincronizar as assinaturas."
        : "Use ?execute=true para criar as contas no schema público"
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      message: 'Erro ao criar contas públicas'
    }, { status: 500 })
  }
}