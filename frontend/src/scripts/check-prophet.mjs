// Script para verificar agentes Prophet
// Execute com: cd frontend && node src/scripts/check-prophet.mjs

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ler o arquivo .env.local manualmente
const envPath = join(__dirname, '../../.env.local');
const envContent = readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis não encontradas no .env.local');
  process.exit(1);
}

console.log('🔗 Conectando ao Supabase...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  try {
    // 1. Listar contas
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('personal_account', true)
      .order('created_at', { ascending: false });

    if (accountsError) throw accountsError;

    console.log(`📊 Total de contas pessoais: ${accounts.length}\n`);

    // 2. Verificar agentes Prophet
    const { data: prophets, error: prophetsError } = await supabase
      .from('agents')
      .select('agent_id, account_id, name, metadata')
      .or('name.eq.Prophet,metadata->>is_suna_default.eq.true');

    if (prophetsError) throw prophetsError;

    console.log(`🔮 Agentes Prophet encontrados: ${prophets.length}\n`);

    // 3. Identificar contas sem Prophet
    const accountsWithProphet = new Set(prophets.map(p => p.account_id));
    const accountsWithoutProphet = accounts.filter(a => !accountsWithProphet.has(a.id));

    if (accountsWithoutProphet.length > 0) {
      console.log(`⚠️  ${accountsWithoutProphet.length} contas SEM agente Prophet:\n`);
      accountsWithoutProphet.forEach((account, index) => {
        console.log(`${index + 1}. ${account.name || 'Sem nome'}`);
        console.log(`   ID: ${account.id}\n`);
      });

      console.log('\n💡 Para instalar o Prophet nessas contas:');
      console.log('   1. Use o painel admin do backend');
      console.log('   2. Ou execute o script Python no servidor');
      console.log('   3. Ou use a API admin com as credenciais corretas\n');
    } else {
      console.log('✅ Todas as contas possuem agente Prophet!\n');
    }

    // 4. Mostrar detalhes dos Prophets existentes
    if (prophets.length > 0) {
      console.log('📋 Detalhes dos agentes Prophet:\n');
      prophets.forEach(prophet => {
        const account = accounts.find(a => a.id === prophet.account_id);
        console.log(`• ${account?.name || 'Conta desconhecida'}`);
        console.log(`  Agent ID: ${prophet.agent_id}`);
        console.log(`  Suna Default: ${prophet.metadata?.is_suna_default ? '✅' : '❌'}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

main();