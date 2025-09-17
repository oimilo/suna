import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  try {
    // Verificar se billing_customers existe em algum schema
    const { data: publicCustomers, error: pubError } = await supabase
      .from('billing_customers')
      .select('*')
      .limit(5)
    
    const { data: basejumpCustomers, error: baseError } = await supabase
      .schema('basejump')
      .from('billing_customers')
      .select('*')
      .limit(20)
    
    // IDs dos customers que precisamos
    const neededCustomerIds = [
      'cus_SsfVoAZWvFkukD', // start@prophet.build
      'cus_Ss6AWUuoQpkCWA', // cavallari
      'cus_SvyRn9X5JAgtLS'  // vinicius
    ]
    
    const foundInPublic = publicCustomers?.filter(c => neededCustomerIds.includes(c.id))
    const foundInBasejump = basejumpCustomers?.filter(c => neededCustomerIds.includes(c.id))
    
    return NextResponse.json({
      public_schema: {
        accessible: !pubError,
        error: pubError?.message,
        total: publicCustomers?.length || 0,
        needed_customers: foundInPublic
      },
      basejump_schema: {
        accessible: !baseError,
        error: baseError?.message,
        total: basejumpCustomers?.length || 0,
        all_customers: basejumpCustomers,
        needed_customers: foundInBasejump
      },
      needed_customer_ids: neededCustomerIds
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message
    }, { status: 500 })
  }
}