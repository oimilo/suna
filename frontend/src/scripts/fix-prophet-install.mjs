// Script para corrigir a instalação do Prophet
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

// Configuração do Prophet
const PROPHET_CONFIG = {
  name: 'Prophet',
  description: 'Prophet is your AI assistant with access to various tools and integrations to help you with tasks across domains.',
  avatar: '🔮',
  avatar_color: '#8B5CF6',
  is_default: true,
  config: {
    tools: {
      agentpress: {
        "sb_files_tool": true,
        "sb_shell_tool": true,
        "sb_deploy_tool": true,
        "sb_expose_tool": true,
        "sb_vision_tool": true,
        "sb_browser_tool": true,
        "web_search_tool": true,
        "sb_image_edit_tool": true,
        "data_providers_tool": true
      },
      mcp: [],
      custom_mcp: []
    },
    metadata: {
      avatar: "🔮",
      avatar_color: "#8B5CF6"
    },
    system_prompt: "You are Prophet, an AI assistant. Be helpful, accurate, and concise."
  },
  metadata: {
    is_suna_default: true,
    centrally_managed: true,
    installation_date: new Date().toISOString(),
    last_central_update: new Date().toISOString(),
    restrictions: {
      name_editable: false,
      tools_editable: false,
      mcps_editable: true,
      description_editable: true,
      system_prompt_editable: false
    }
  }
};

async function main() {
  console.log('🔍 Diagnosticando problema de instalação do Prophet...\n');

  try {
    // 1. Verificar contas reais
    console.log('📊 Verificando contas existentes...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, personal_account')
      .eq('personal_account', true);

    if (accountsError) {
      console.error('❌ Erro ao buscar contas:', accountsError);
      return;
    }

    console.log(`✅ ${accounts.length} contas pessoais encontradas\n`);

    // 2. Verificar agentes existentes
    console.log('🔮 Verificando agentes Prophet existentes...');
    const { data: allAgents, error: agentsError } = await supabase
      .from('agents')
      .select('agent_id, account_id, name');

    if (agentsError) {
      console.error('❌ Erro ao buscar agentes:', agentsError);
      return;
    }

    // Filtrar agentes Prophet
    const prophetAgents = allAgents.filter(a => 
      a.name === 'Prophet' || a.name?.toLowerCase().includes('prophet')
    );
    
    console.log(`✅ ${prophetAgents.length} agentes Prophet encontrados`);
    console.log(`📊 Total de agentes no sistema: ${allAgents.length}\n`);

    // 3. Mapear quais contas têm Prophet
    const accountsWithProphet = new Set(prophetAgents.map(a => a.account_id));
    const accountsWithoutProphet = accounts.filter(a => !accountsWithProphet.has(a.id));

    console.log('📋 Status das contas:\n');
    
    console.log('✅ Contas COM Prophet:');
    accounts.filter(a => accountsWithProphet.has(a.id)).forEach(acc => {
      console.log(`   • ${acc.name || 'Sem nome'} (${acc.id})`);
    });

    console.log('\n❌ Contas SEM Prophet:');
    accountsWithoutProphet.forEach(acc => {
      console.log(`   • ${acc.name || 'Sem nome'} (${acc.id})`);
    });

    // 4. Verificar se os IDs que falharam realmente existem
    console.log('\n🔍 Verificando IDs problemáticos...');
    const problematicIds = [
      'ff7c8bc9-377d-44fd-b3e7-aabeafc80e26',
      '99ce4e26-4d0f-4c53-a025-a57a69572932',
      'a9a13c54-e555-4110-a9c1-57c2dd6bf79a',
      '75c95fb8-1b9e-4654-9c95-ac5d01c77647'
    ];

    for (const id of problematicIds) {
      const exists = accounts.some(a => a.id === id);
      console.log(`   ID ${id}: ${exists ? '✅ Existe' : '❌ NÃO existe'}`);
    }

    // 5. Tentar encontrar o account_id correto baseado no nome
    console.log('\n🔍 Mapeando nomes para IDs corretos...');
    
    const nameMapping = {
      'admin@oimilo.com': accounts.find(a => a.name?.includes('admin@oimilo.com')),
      'bonitoemail@gmail.com': accounts.find(a => a.name?.includes('bonitoemail')),
      'Admin User': accounts.find(a => a.name === 'Admin User'),
      'Test User': accounts.find(a => a.name === 'Test User')
    };

    console.log('\n📋 Mapeamento encontrado:');
    Object.entries(nameMapping).forEach(([name, account]) => {
      if (account) {
        console.log(`   • ${name} → ${account.id}`);
      } else {
        console.log(`   • ${name} → NÃO ENCONTRADO`);
      }
    });

    // 6. Perguntar se deve tentar instalar manualmente
    if (accountsWithoutProphet.length > 0) {
      console.log('\n💡 Para instalar o Prophet nas contas faltantes:');
      console.log('   1. Use o painel admin do Supabase');
      console.log('   2. Execute a migration SQL fornecida');
      console.log('   3. Ou use a API admin do backend\n');
      
      // Mostrar SQL para instalação manual
      console.log('📝 SQL para instalação manual:\n');
      accountsWithoutProphet.forEach(acc => {
        console.log(`-- Para ${acc.name || acc.id}`);
        console.log(`INSERT INTO agents (account_id, name, description, avatar, avatar_color, is_default, config, metadata, version_count, tags)`);
        console.log(`VALUES ('${acc.id}', 'Prophet', '...', '🔮', '#8B5CF6', true, '${JSON.stringify(PROPHET_CONFIG.config)}'::jsonb, '${JSON.stringify(PROPHET_CONFIG.metadata)}'::jsonb, 1, '{}');\n`);
      });
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();