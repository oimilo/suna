import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  try {
    // Verificar estrutura da tabela billing_customers no público
    const { data: publicColumns, error: pubError } = await supabase
      .rpc('get_table_columns', {
        schema_name: 'public',
        table_name: 'billing_customers'
      })
    
    // Verificar estrutura da tabela billing_customers no basejump
    const { data: basejumpColumns, error: baseError } = await supabase
      .rpc('get_table_columns', {
        schema_name: 'basejump',
        table_name: 'billing_customers'
      })
    
    // Tentar buscar um registro para ver os campos disponíveis
    const { data: publicSample, error: publicSampleError } = await supabase
      .from('billing_customers')
      .select('*')
      .limit(1)
    
    const { data: basejumpSample, error: basejumpSampleError } = await supabase
      .schema('basejump')
      .from('billing_customers')
      .select('*')
      .limit(1)
    
    return NextResponse.json({
      public_schema: {
        columns_rpc: publicColumns,
        rpc_error: pubError?.message,
        sample_record: publicSample,
        sample_error: publicSampleError?.message,
        sample_fields: publicSample?.[0] ? Object.keys(publicSample[0]) : []
      },
      basejump_schema: {
        columns_rpc: basejumpColumns,
        rpc_error: baseError?.message,
        sample_record: basejumpSample,
        sample_error: basejumpSampleError?.message,
        sample_fields: basejumpSample?.[0] ? Object.keys(basejumpSample[0]) : []
      }
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message
    }, { status: 500 })
  }
}