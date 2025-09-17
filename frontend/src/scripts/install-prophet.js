// Script para instalar o agente Prophet para todos os usuários
// Execute com: node install-prophet.js

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Carregar variáveis do env.local
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function installProphetForAllUsers() {
  try {
    console.log('🚀 Iniciando instalação do agente Prophet para todos os usuários...\n');

    // 1. Buscar todos os usuários (contas pessoais)
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('account_id, account_name')
      .eq('personal_account', true);

    if (accountsError) throw accountsError;

    console.log(`📊 Encontradas ${accounts.length} contas pessoais\n`);

    // 2. Para cada usuário, verificar se já tem o agente Prophet
    let installed = 0;
    let skipped = 0;
    let failed = 0;

    for (const account of accounts) {
      try {
        // Verificar se já tem um agente Prophet
        const { data: existingAgent } = await supabase
          .from('agents')
          .select('agent_id, name')
          .eq('account_id', account.account_id)
          .eq('metadata->>is_suna_default', 'true')
          .single();

        if (existingAgent) {
          console.log(`✓ ${account.account_name}: Já possui Prophet (${existingAgent.agent_id})`);
          skipped++;
          continue;
        }

        // Criar o agente Prophet
        const { data: newAgent, error: createError } = await supabase
          .from('agents')
          .insert({
            account_id: account.account_id,
            name: 'Prophet',
            description: 'Your AI-powered development assistant',
            system_prompt: `You are Prophet, an AI assistant created by Suna to help with software development tasks.

You have access to powerful tools for:
- Reading and writing files
- Running terminal commands
- Searching through code
- Web browsing and research
- And much more

Be helpful, accurate, and efficient in your responses.`,
            avatar: '🔮',
            avatar_color: '#8B5CF6',
            is_default: true,
            metadata: {
              is_suna_default: true,
              centrally_managed: true,
              management_version: '1.0.0'
            },
            agentpress_tools: {
              "read_file": { "enabled": true },
              "write_file": { "enabled": true },
              "create_directory": { "enabled": true },
              "list_directory": { "enabled": true },
              "run_terminal_command": { "enabled": true },
              "search_files": { "enabled": true },
              "see_image": { "enabled": true },
              "ask_human": { "enabled": true },
              "complete": { "enabled": true }
            },
            configured_mcps: [],
            custom_mcps: []
          })
          .select()
          .single();

        if (createError) throw createError;

        // Criar versão inicial
        const { error: versionError } = await supabase
          .from('agent_versions')
          .insert({
            agent_id: newAgent.agent_id,
            version_number: 1,
            system_prompt: newAgent.system_prompt,
            agentpress_tools: newAgent.agentpress_tools,
            configured_mcps: [],
            custom_mcps: [],
            is_active: true,
            changelog: 'Initial version'
          });

        if (versionError) throw versionError;

        console.log(`✅ ${account.account_name}: Prophet instalado com sucesso!`);
        installed++;

      } catch (error) {
        console.error(`❌ ${account.account_name}: Erro ao instalar - ${error.message}`);
        failed++;
      }
    }

    console.log('\n📊 Resumo da instalação:');
    console.log(`   ✅ Instalados: ${installed}`);
    console.log(`   ⏭️  Já existentes: ${skipped}`);
    console.log(`   ❌ Falhas: ${failed}`);
    console.log(`   📊 Total: ${accounts.length}`);

  } catch (error) {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
  }
}

// Executar
installProphetForAllUsers();