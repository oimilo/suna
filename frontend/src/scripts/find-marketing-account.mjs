// Script para encontrar a conta marketing@oimilo.com
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Ler o arquivo .env.local
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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function main() {
  console.log('🔍 Procurando conta marketing@oimilo.com...\n');

  try {
    // 1. Listar TODAS as contas
    const { data: allAccounts, error } = await supabase
      .from('accounts')
      .select('id, name, personal_account, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`📊 Total de contas: ${allAccounts.length}\n`);
    console.log('📋 Lista de todas as contas:\n');

    allAccounts.forEach((account, index) => {
      console.log(`${index + 1}. ${account.name || 'Sem nome'}`);
      console.log(`   ID: ${account.id}`);
      console.log(`   Pessoal: ${account.personal_account ? 'Sim' : 'Não'}`);
      console.log(`   Criada em: ${new Date(account.created_at).toLocaleDateString('pt-BR')}\n`);
    });

    // 2. Procurar especificamente por "marketing" ou "oimilo"
    const marketingAccounts = allAccounts.filter(acc => 
      acc.name && (
        acc.name.toLowerCase().includes('marketing') ||
        acc.name.toLowerCase().includes('oimilo') ||
        acc.name.includes('@')
      )
    );

    if (marketingAccounts.length > 0) {
      console.log('\n🎯 Contas que podem ser marketing@oimilo.com:');
      marketingAccounts.forEach(acc => {
        console.log(`\n• ${acc.name}`);
        console.log(`  ID: ${acc.id}`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();