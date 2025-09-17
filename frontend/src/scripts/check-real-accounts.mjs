// Script para verificar as contas reais e a estrutura correta
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
  console.log('🔍 Verificando estrutura de contas...\n');

  try {
    // 1. Tentar basejump.accounts
    console.log('📊 Tentando basejump.accounts...');
    const { data: basejumpAccounts, error: basejumpError } = await supabase
      .from('basejump.accounts')
      .select('id, name, personal_account, primary_owner_user_id')
      .limit(10);

    if (!basejumpError && basejumpAccounts) {
      console.log(`✅ Encontradas ${basejumpAccounts.length} contas em basejump.accounts\n`);
      basejumpAccounts.forEach(acc => {
        console.log(`• ${acc.name || 'Sem nome'}`);
        console.log(`  ID: ${acc.id}`);
        console.log(`  Pessoal: ${acc.personal_account}`);
        console.log(`  Owner: ${acc.primary_owner_user_id}\n`);
      });
    } else {
      console.log('❌ Erro em basejump.accounts:', basejumpError?.message);
    }

    // 2. Verificar public.accounts (view)
    console.log('\n📊 Verificando public.accounts (view)...');
    const { data: publicAccounts, error: publicError } = await supabase
      .from('accounts')
      .select('*')
      .limit(5);

    if (!publicError && publicAccounts) {
      console.log(`✅ View public.accounts tem ${publicAccounts.length} registros`);
      console.log('Colunas disponíveis:', Object.keys(publicAccounts[0] || {}));
    } else {
      console.log('❌ Erro:', publicError?.message);
    }

    // 3. Verificar agentes
    console.log('\n📊 Verificando agentes com join correto...');
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select(`
        agent_id,
        account_id,
        name,
        basejump.accounts!inner(
          id,
          name
        )
      `)
      .eq('name', 'Prophet')
      .limit(5);

    if (!agentsError && agents) {
      console.log(`✅ Agentes Prophet encontrados: ${agents.length}`);
      agents.forEach(agent => {
        console.log(`\n• Agent: ${agent.name}`);
        console.log(`  ID: ${agent.agent_id}`);
        console.log(`  Account ID: ${agent.account_id}`);
      });
    } else {
      console.log('❌ Erro ao buscar agentes:', agentsError?.message);
    }

    // 4. Verificar usuários auth
    console.log('\n📊 Verificando usuários auth.users...');
    const { data: users, error: usersError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .limit(10);

    if (!usersError && users) {
      console.log(`✅ Usuários encontrados: ${users.length}`);
      users.forEach(user => {
        console.log(`\n• ${user.email}`);
        console.log(`  User ID: ${user.id}`);
        console.log(`  Criado em: ${new Date(user.created_at).toLocaleDateString('pt-BR')}`);
      });

      // Mapear usuários para contas
      console.log('\n🔗 Mapeando usuários para contas basejump...');
      for (const user of users) {
        const { data: account } = await supabase
          .from('basejump.accounts')
          .select('id, name')
          .eq('primary_owner_user_id', user.id)
          .single();

        if (account) {
          console.log(`\n✅ ${user.email} → Account: ${account.id}`);
        } else {
          console.log(`\n❌ ${user.email} → Sem conta basejump`);
        }
      }
    } else {
      console.log('❌ Erro ao buscar usuários:', usersError?.message);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();