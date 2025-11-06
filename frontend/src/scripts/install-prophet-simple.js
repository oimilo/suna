// Script simplificado para instalar o agente Prophet
// Execute com: cd frontend && npm install @supabase/supabase-js dotenv && node src/scripts/install-prophet-simple.js

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis do env.local
dotenv.config({ path: join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_ANON_KEY não encontradas');
  process.exit(1);
}

console.log('🔗 Conectando ao Supabase...');
console.log(`   URL: ${supabaseUrl}`);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkProphetAgents() {
  try {
    console.log('\n📊 Verificando agentes Prophet existentes...\n');

    // Buscar todos os agentes Prophet
    const { data: prophetAgents, error } = await supabase
      .from('agents')
      .select('agent_id, account_id, name, created_at, metadata')
      .eq('name', 'Prophet')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erro ao buscar agentes:', error);
      return;
    }

    if (!prophetAgents || prophetAgents.length === 0) {
      console.log('⚠️  Nenhum agente Prophet encontrado no sistema!');
      console.log('\n💡 Para instalar o Prophet, você precisa:');
      console.log('   1. Fazer login como admin no backend');
      console.log('   2. Executar o comando de instalação via API admin');
      console.log('   3. Ou usar o script Python no servidor\n');
      return;
    }

    console.log(`✅ Encontrados ${prophetAgents.length} agentes Prophet:\n`);
    
    prophetAgents.forEach(agent => {
      const isProphetDefault = agent.metadata?.is_suna_default || false;
      console.log(`   • Account: ${agent.account_id}`);
      console.log(`     ID: ${agent.agent_id}`);
      console.log(`     Prophet Default: ${isProphetDefault ? 'Sim' : 'Não'}`);
      console.log(`     Criado em: ${new Date(agent.created_at).toLocaleDateString('pt-BR')}\n`);
    });

    // Verificar contas sem Prophet
    const { data: allAccounts } = await supabase
      .from('accounts')
      .select('account_id, account_name')
      .eq('personal_account', true);

    const accountsWithProphet = new Set(prophetAgents.map(a => a.account_id));
    const accountsWithoutProphet = allAccounts?.filter(a => !accountsWithProphet.has(a.account_id)) || [];

    if (accountsWithoutProphet.length > 0) {
      console.log(`\n⚠️  ${accountsWithoutProphet.length} contas sem agente Prophet:`);
      accountsWithoutProphet.forEach(account => {
        console.log(`   • ${account.account_name || 'Sem nome'} (${account.account_id})`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar verificação
checkProphetAgents();