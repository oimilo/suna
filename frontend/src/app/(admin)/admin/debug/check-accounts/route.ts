import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  try {
    // 1. Verificar accounts no schema public
    const { data: publicAccounts, error: publicError } = await supabase
      .from('accounts')  // Sem especificar schema = public
      .select('*')
      .limit(10)
    
    // 2. Verificar accounts no schema basejump
    const { data: basejumpAccounts, error: basejumpError } = await supabase
      .schema('basejump')
      .from('accounts')
      .select('*')
      .limit(10)
    
    // 3. Verificar os usuários específicos
    const targetUserIds = [
      '29e38efa-512a-47c0-9130-0ca0cedeb533', // start@prophet.build
      'd63efb0e-a5f9-40d4-b07f-2fce1322b86e', // cavallari
      'f581c772-e0ef-4ed9-890a-ecebef03cc93'  // vinicius
    ]
    
    const publicTargetAccounts = publicAccounts?.filter(a => targetUserIds.includes(a.id))
    const basejumpTargetAccounts = basejumpAccounts?.filter(a => targetUserIds.includes(a.id))
    
    return NextResponse.json({
      public_schema: {
        accessible: !publicError,
        error: publicError?.message,
        total: publicAccounts?.length || 0,
        sample: publicAccounts?.[0],
        target_users: publicTargetAccounts
      },
      basejump_schema: {
        accessible: !basejumpError,
        error: basejumpError?.message,
        total: basejumpAccounts?.length || 0,
        sample: basejumpAccounts?.[0],
        target_users: basejumpTargetAccounts
      },
      conclusion: {
        public_has_accounts: !!publicAccounts && publicAccounts.length > 0,
        basejump_has_accounts: !!basejumpAccounts && basejumpAccounts.length > 0,
        target_users_in_public: publicTargetAccounts?.length || 0,
        target_users_in_basejump: basejumpTargetAccounts?.length || 0
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      message: 'Erro ao verificar contas'
    }, { status: 500 })
  }
}