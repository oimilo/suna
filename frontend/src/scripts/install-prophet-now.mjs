// Script para instalar o agente Prophet nas contas que faltam
// Execute com: node src/scripts/install-prophet-now.mjs

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

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Configuração do agente Prophet baseada no existente
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

async function installProphetForAccount(accountId, accountName) {
  try {
    console.log(`\n🔧 Instalando Prophet para: ${accountName}`);
    
    // 1. Criar o agente com a estrutura correta
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .insert({
        account_id: accountId,
        name: PROPHET_CONFIG.name,
        description: PROPHET_CONFIG.description,
        avatar: PROPHET_CONFIG.avatar,
        avatar_color: PROPHET_CONFIG.avatar_color,
        is_default: PROPHET_CONFIG.is_default,
        config: PROPHET_CONFIG.config,
        metadata: PROPHET_CONFIG.metadata,
        version_count: 1,
        tags: []
      })
      .select()
      .single();

    if (agentError) throw agentError;

    console.log(`   ✅ Agente criado: ${agent.agent_id}`);
    console.log(`   ✅ Prophet instalado com sucesso!`);
    return true;

  } catch (error) {
    console.error(`   ❌ Erro: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando instalação do agente Prophet...\n');

  try {
    // 1. Buscar contas sem Prophet
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id, name')
      .eq('personal_account', true);

    const { data: prophets } = await supabase
      .from('agents')
      .select('account_id')
      .or('name.eq.Prophet,metadata->>is_suna_default.eq.true');

    const accountsWithProphet = new Set(prophets.map(p => p.account_id));
    const accountsToInstall = accounts.filter(a => !accountsWithProphet.has(a.id));

    if (accountsToInstall.length === 0) {
      console.log('✅ Todas as contas já possuem o agente Prophet!');
      return;
    }

    console.log(`📊 ${accountsToInstall.length} contas precisam do Prophet:`);
    accountsToInstall.forEach((acc, i) => {
      console.log(`   ${i + 1}. ${acc.name || 'Sem nome'}`);
    });

    // 2. Instalar em cada conta
    let successCount = 0;
    let failCount = 0;

    for (const account of accountsToInstall) {
      const success = await installProphetForAccount(account.id, account.name || 'Sem nome');
      if (success) {
        successCount++;
      } else {
        failCount++;
      }
    }

    // 3. Resumo final
    console.log('\n📊 Resumo da instalação:');
    console.log(`   ✅ Sucesso: ${successCount}`);
    console.log(`   ❌ Falhas: ${failCount}`);
    console.log(`   📊 Total: ${accountsToInstall.length}`);

    if (successCount > 0) {
      console.log('\n🎉 Prophet instalado com sucesso!');
      console.log('   Os usuários agora podem usar o Prophet em seus projetos.');
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

// Executar
main();