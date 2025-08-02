// Script para configurar o trigger de criação automática do Prophet
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
  console.log('🚀 Configurando criação automática do Prophet...\n');

  try {
    // 1. Executar a função para instalar Prophet em todos os usuários existentes
    console.log('📦 Instalando Prophet para usuários existentes...\n');
    
    const { data: results, error } = await supabase
      .rpc('install_prophet_for_all_users');

    if (error) {
      console.error('❌ Erro ao executar função:', error);
      console.log('\n⚠️  A função pode não existir ainda. Execute a migration primeiro!');
      console.log('   Use o Supabase Dashboard ou CLI para executar:');
      console.log('   backend/supabase/migrations/20250802000000_auto_create_prophet_agent.sql\n');
      return;
    }

    // Mostrar resultados
    if (results && results.length > 0) {
      console.log('📊 Resultados da instalação:\n');
      
      const successful = results.filter(r => r.status === 'success');
      const failed = results.filter(r => r.status !== 'success');
      
      if (successful.length > 0) {
        console.log(`✅ Instalado com sucesso: ${successful.length} contas`);
        successful.forEach(r => {
          console.log(`   • ${r.account_name || 'Sem nome'} (${r.account_id})`);
        });
      }
      
      if (failed.length > 0) {
        console.log(`\n❌ Falhas: ${failed.length} contas`);
        failed.forEach(r => {
          console.log(`   • ${r.account_name || 'Sem nome'}: ${r.status}`);
        });
      }
    } else {
      console.log('✅ Todos os usuários já possuem o agente Prophet!');
    }

    console.log('\n🎉 Configuração concluída!');
    console.log('   • Novos usuários receberão o Prophet automaticamente');
    console.log('   • Usuários existentes foram atualizados');

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();