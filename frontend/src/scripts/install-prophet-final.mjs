// Script final para instalar Prophet em TODAS as contas
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

async function installProphetForAccount(accountId, accountName) {
  try {
    // Verificar se já tem Prophet
    const { data: existingAgents } = await supabase
      .from('agents')
      .select('agent_id, name')
      .eq('account_id', accountId);

    const hasProphet = existingAgents?.some(a => 
      a.name === 'Prophet' || a.name?.toLowerCase().includes('prophet')
    );

    if (hasProphet) {
      console.log(`   ✓ ${accountName} já possui Prophet`);
      return { success: true, existed: true };
    }

    // Criar o agente
    const { data: newAgent, error } = await supabase
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

    if (error) {
      console.error(`   ❌ ${accountName}: ${error.message}`);
      return { success: false, error: error.message };
    }

    console.log(`   ✅ ${accountName}: Prophet instalado!`);
    return { success: true, agentId: newAgent.agent_id };

  } catch (error) {
    console.error(`   ❌ ${accountName}: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🚀 Instalação final do Prophet para TODAS as contas\n');

  try {
    // 1. Buscar TODAS as contas (pessoais e não pessoais)
    const { data: allAccounts, error } = await supabase
      .from('accounts')
      .select('id, name, personal_account')
      .order('created_at', { ascending: false });

    if (error) throw error;

    console.log(`📊 Total de contas encontradas: ${allAccounts.length}\n`);

    // 2. Separar por tipo
    const personalAccounts = allAccounts.filter(a => a.personal_account);
    const teamAccounts = allAccounts.filter(a => !a.personal_account);

    // 3. Instalar em contas pessoais primeiro
    console.log(`👤 Instalando em ${personalAccounts.length} contas pessoais:\n`);
    
    let stats = {
      success: 0,
      existed: 0,
      failed: 0
    };

    for (const account of personalAccounts) {
      const result = await installProphetForAccount(
        account.id, 
        account.name || 'Conta sem nome'
      );
      
      if (result.success) {
        if (result.existed) {
          stats.existed++;
        } else {
          stats.success++;
        }
      } else {
        stats.failed++;
      }
    }

    // 4. Perguntar sobre contas de equipe
    if (teamAccounts.length > 0) {
      console.log(`\n🏢 ${teamAccounts.length} contas de equipe encontradas.`);
      console.log('   (Prophet não será instalado automaticamente em contas de equipe)\n');
    }

    // 5. Resumo final
    console.log('\n📊 Resumo da instalação:');
    console.log(`   ✅ Novos Prophets instalados: ${stats.success}`);
    console.log(`   ✓  Já existentes: ${stats.existed}`);
    console.log(`   ❌ Falhas: ${stats.failed}`);
    console.log(`   📊 Total processado: ${personalAccounts.length}`);

    if (stats.success > 0) {
      console.log('\n🎉 Instalação concluída com sucesso!');
    }

    // 6. Verificar situação final
    console.log('\n🔍 Verificando situação final...');
    
    const { data: finalCheck } = await supabase
      .from('agents')
      .select('account_id')
      .or('name.eq.Prophet,metadata->>is_suna_default.eq.true');

    const accountsWithProphet = new Set(finalCheck?.map(a => a.account_id) || []);
    const accountsWithoutProphet = personalAccounts.filter(a => !accountsWithProphet.has(a.id));

    if (accountsWithoutProphet.length === 0) {
      console.log('\n✅ TODAS as contas pessoais agora têm o agente Prophet!');
    } else {
      console.log(`\n⚠️  Ainda existem ${accountsWithoutProphet.length} contas sem Prophet.`);
      console.log('   Pode ser necessário verificar manualmente.');
    }

  } catch (error) {
    console.error('❌ Erro fatal:', error);
  }
}

main();