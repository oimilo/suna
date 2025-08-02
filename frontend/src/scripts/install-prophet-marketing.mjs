// Script para instalar Prophet especificamente para marketing@oimilo.com
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
  console.log('🚀 Instalando Prophet para marketing@oimilo.com...\n');

  try {
    // 1. Buscar a conta pelo email
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('email', 'marketing@oimilo.com')
      .single();

    if (userError || !user) {
      // Tentar buscar pela tabela accounts
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('id, name')
        .ilike('name', '%marketing%');

      if (accountsError || !accounts || accounts.length === 0) {
        console.error('❌ Não foi possível encontrar a conta marketing@oimilo.com');
        console.log('\n📋 Contas disponíveis com "marketing" no nome:');
        console.log(accounts);
        return;
      }

      // Usar a primeira conta encontrada
      const account = accounts[0];
      console.log(`📧 Conta encontrada: ${account.name} (${account.id})`);
      
      // Verificar se já tem Prophet
      const { data: existingProphet } = await supabase
        .from('agents')
        .select('agent_id, name')
        .eq('account_id', account.id)
        .eq('name', 'Prophet')
        .single();

      if (existingProphet) {
        console.log(`✅ Esta conta já possui o agente Prophet (${existingProphet.agent_id})`);
        return;
      }

      // Instalar Prophet
      const { data: newAgent, error: agentError } = await supabase
        .from('agents')
        .insert({
          account_id: account.id,
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

      if (agentError) {
        console.error('❌ Erro ao criar agente:', agentError.message);
        return;
      }

      console.log(`✅ Prophet instalado com sucesso!`);
      console.log(`   Agent ID: ${newAgent.agent_id}`);
      console.log(`   Account: ${account.name}`);
      
    } else {
      // Encontrou pelo email, buscar account_id
      console.log(`📧 Usuário encontrado: ${user.email}`);
      
      const { data: account } = await supabase
        .from('accounts')
        .select('id, name')
        .eq('user_id', user.id)
        .eq('personal_account', true)
        .single();

      if (!account) {
        console.error('❌ Não foi possível encontrar a conta pessoal do usuário');
        return;
      }

      console.log(`📋 Conta: ${account.name} (${account.id})`);

      // Verificar se já tem Prophet
      const { data: existingProphet } = await supabase
        .from('agents')
        .select('agent_id, name')
        .eq('account_id', account.id)
        .eq('name', 'Prophet')
        .single();

      if (existingProphet) {
        console.log(`✅ Esta conta já possui o agente Prophet (${existingProphet.agent_id})`);
        return;
      }

      // Instalar Prophet
      const { data: newAgent, error: agentError } = await supabase
        .from('agents')
        .insert({
          account_id: account.id,
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

      if (agentError) {
        console.error('❌ Erro ao criar agente:', agentError.message);
        return;
      }

      console.log(`✅ Prophet instalado com sucesso!`);
      console.log(`   Agent ID: ${newAgent.agent_id}`);
      console.log(`   Account: ${account.name}`);
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();