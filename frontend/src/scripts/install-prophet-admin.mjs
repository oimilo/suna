// Script para instalar Prophet na conta admin@oimilo.com que não tem
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
  const ACCOUNT_ID = '99ce4e26-4d0f-4c53-a025-a57a69572932'; // bonitoemail@gmail.com
  
  console.log('🚀 Instalando Prophet para bonitoemail@gmail.com (marketing?)...\n');

  try {
    // Verificar se já tem Prophet
    const { data: existingProphet } = await supabase
      .from('agents')
      .select('agent_id, name')
      .eq('account_id', ACCOUNT_ID)
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
        account_id: ACCOUNT_ID,
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
      console.error('Detalhes:', agentError);
      return;
    }

    console.log(`✅ Prophet instalado com sucesso!`);
    console.log(`   Agent ID: ${newAgent.agent_id}`);
    console.log(`   Account ID: ${ACCOUNT_ID}`);
    console.log(`   Nome: admin@oimilo.com`);

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();