import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  try {
    // 1. Testar inserir uma assinatura de teste
    const testData = {
      id: 'test_sub_' + Date.now(),
      account_id: '29e38efa-512a-47c0-9130-0ca0cedeb533', // start@prophet.build
      customer_id: 'cus_test_' + Date.now(),
      status: 'active',
      price_id: 'price_test',
      quantity: 1,
      cancel_at_period_end: false,
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      created: new Date().toISOString(),
      metadata: { test: true }
    }
    
    const { data: insertResult, error: insertError } = await supabase
      .from('billing_subscriptions')
      .insert(testData)
      .select()
    
    // 2. Verificar se a inserção funcionou
    const { data: checkResult, error: checkError } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('id', testData.id)
      .single()
    
    // 3. Contar total de assinaturas
    const { data: allSubs, error: allError } = await supabase
      .from('billing_subscriptions')
      .select('id, account_id, status, created')
      .order('created', { ascending: false })
      .limit(20)
    
    // 4. Deletar teste se criou
    if (checkResult) {
      await supabase
        .from('billing_subscriptions')
        .delete()
        .eq('id', testData.id)
    }
    
    return NextResponse.json({
      test_insert: {
        attempted: true,
        test_id: testData.id,
        insert_error: insertError?.message,
        insert_result: insertResult,
        check_error: checkError?.message,
        check_result: checkResult,
        was_created: !!checkResult
      },
      total_subscriptions: allSubs?.length || 0,
      recent_subscriptions: allSubs?.slice(0, 10).map(s => ({
        id: s.id,
        account_id: s.account_id,
        status: s.status,
        created: s.created
      })),
      all_error: allError?.message
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      message: 'Erro ao testar inserções'
    }, { status: 500 })
  }
}