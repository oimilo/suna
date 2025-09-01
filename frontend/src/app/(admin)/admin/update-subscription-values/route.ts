import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

/**
 * Atualiza os valores dos planos nas subscriptions existentes
 */
export async function POST() {
  const supabase = createAdminClient()
  
  try {
    // Buscar todas as subscriptions que precisam de atualização
    const { data: subscriptions, error: subError } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('status', 'active')
      .is('price_id', null)
    
    if (subError) throw subError
    
    console.log(`Encontradas ${subscriptions?.length || 0} subscriptions para atualizar`)
    
    const results = []
    
    for (const sub of subscriptions || []) {
      try {
        // Determinar o plano baseado no metadata ou padrão para PRO
        const plan = sub.metadata?.plan || 'pro'
        
        // Valores padrão para cada plano (em centavos)
        const planValues = {
          'pro': 9700,      // R$ 97,00
          'pro_max': 29700, // R$ 297,00
          'custom': 9700    // Default para PRO
        }
        
        const amount = planValues[plan] || 9700
        
        // Atualizar o metadata com o valor correto
        const updatedMetadata = {
          ...sub.metadata,
          plan: plan,
          amount: amount,
          amount_display: `R$ ${(amount / 100).toFixed(2)}`,
          interval: 'month'
        }
        
        // Atualizar a subscription
        const { error: updateError } = await supabase
          .from('billing_subscriptions')
          .update({
            metadata: updatedMetadata,
            // Podemos deixar price_id como null já que não temos os IDs reais do Stripe
            updated_at: new Date().toISOString()
          })
          .eq('id', sub.id)
        
        if (updateError) throw updateError
        
        results.push({
          subscription_id: sub.id,
          account_id: sub.account_id,
          plan: plan,
          amount: amount / 100,
          success: true
        })
        
        console.log(`✅ Atualizado subscription ${sub.id} - Plano: ${plan}, Valor: R$ ${(amount / 100).toFixed(2)}`)
        
      } catch (error: any) {
        console.error(`❌ Erro ao atualizar subscription ${sub.id}:`, error)
        results.push({
          subscription_id: sub.id,
          account_id: sub.account_id,
          success: false,
          error: error.message
        })
      }
    }
    
    // Verificar o resultado
    const { data: updatedSubs } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('status', 'active')
    
    return NextResponse.json({
      message: "Valores atualizados!",
      results,
      total_updated: results.filter(r => r.success).length,
      total_active: updatedSubs?.length || 0
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      message: 'Erro ao atualizar valores'
    }, { status: 500 })
  }
}