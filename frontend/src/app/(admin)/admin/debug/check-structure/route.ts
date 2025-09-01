import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  try {
    const results: any = {}
    
    // 1. Verificar billing_subscriptions no public schema
    const { data: publicSubs, error: pubError } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .limit(5)
    
    results.public_billing_subscriptions = {
      accessible: !pubError,
      error: pubError?.message,
      count: publicSubs?.length || 0,
      sample: publicSubs?.[0]
    }
    
    // 2. Verificar billing_subscriptions no basejump schema
    const { data: basejumpSubs, error: baseError } = await supabase
      .schema('basejump')
      .from('billing_subscriptions')
      .select('*')
      .limit(5)
    
    results.basejump_billing_subscriptions = {
      accessible: !baseError,
      error: baseError?.message,
      count: basejumpSubs?.length || 0,
      sample: basejumpSubs?.[0]
    }
    
    // 3. Verificar billing_customers
    const { data: customers, error: custError } = await supabase
      .schema('basejump')
      .from('billing_customers')
      .select('*')
      .limit(5)
    
    results.basejump_billing_customers = {
      accessible: !custError,
      error: custError?.message,
      count: customers?.length || 0,
      sample: customers?.[0]
    }
    
    // 4. Verificar billing_prices no public
    const { data: publicPrices, error: priceError } = await supabase
      .from('billing_prices')
      .select('*')
    
    results.public_billing_prices = {
      accessible: !priceError,
      error: priceError?.message,
      count: publicPrices?.length || 0,
      all_prices: publicPrices
    }
    
    // 5. Buscar TODAS as assinaturas ativas (ambos schemas)
    let allActiveSubscriptions = []
    
    // Tentar public primeiro
    const { data: activePubSubs } = await supabase
      .from('billing_subscriptions')
      .select('*, billing_prices(*)')
      .eq('status', 'active')
    
    if (activePubSubs) {
      allActiveSubscriptions = [...activePubSubs]
    }
    
    // Tentar basejump
    const { data: activeBaseSubs } = await supabase
      .schema('basejump')
      .from('billing_subscriptions')
      .select('*')
      .eq('status', 'active')
    
    if (activeBaseSubs) {
      allActiveSubscriptions = [...allActiveSubscriptions, ...activeBaseSubs]
    }
    
    results.all_active_subscriptions = {
      total: allActiveSubscriptions.length,
      subscriptions: allActiveSubscriptions
    }
    
    // 6. Buscar especificamente pelos IDs dos usuários mencionados
    const targetUserIds = [
      'a3fd65df-1aa5-4bf9-8cc2-10345dc83784', // claudio.ferreira
      'd63efb0e-a5f9-40d4-b07f-2fce1322b86e', // cavallari
      'f581c772-e0ef-4ed9-890a-ecebef03cc93'  // vinicius
    ]
    
    // Buscar em billing_customers do basejump
    const { data: targetCustomers } = await supabase
      .schema('basejump')
      .from('billing_customers')
      .select('*')
      .in('account_id', targetUserIds)
    
    results.target_users_customers = {
      found: targetCustomers?.length || 0,
      customers: targetCustomers
    }
    
    // Se encontrou customers, buscar suas subscriptions
    if (targetCustomers && targetCustomers.length > 0) {
      const customerIds = targetCustomers.map(c => c.id)
      
      const { data: targetSubs } = await supabase
        .schema('basejump')
        .from('billing_subscriptions')
        .select('*')
        .in('customer_id', customerIds)
      
      results.target_users_subscriptions = {
        found: targetSubs?.length || 0,
        subscriptions: targetSubs
      }
    }
    
    return NextResponse.json(results)
    
  } catch (error) {
    console.error('Check Structure Error:', error)
    return NextResponse.json({ 
      error: String(error),
      message: 'Erro ao verificar estrutura'
    }, { status: 500 })
  }
}