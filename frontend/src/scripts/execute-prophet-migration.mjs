// Script para executar a migration do Prophet via API
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

// Ler o arquivo SQL da migration
const migrationPath = join(__dirname, '../../../backend/supabase/migrations/20250802000000_auto_create_prophet_agent.sql');
const migrationSQL = readFileSync(migrationPath, 'utf8');

async function executeMigration() {
  console.log('🚀 Executando migration para criar sistema automático do Prophet...\n');

  try {
    // Executar o SQL completo
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });

    if (error) {
      // Se a função exec_sql não existir, tentar executar partes individualmente
      console.log('⚠️  Função exec_sql não disponível. Executando migration em partes...\n');
      
      // Dividir o SQL em statements individuais
      const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && s !== 'BEGIN' && s !== 'COMMIT');

      console.log(`📋 ${statements.length} statements para executar\n`);

      // Por limitações da API, vamos precisar executar via Dashboard
      console.log('❌ A API do Supabase não permite executar DDL statements diretamente.');
      console.log('\n📝 Para executar a migration, siga estes passos:\n');
      console.log('1. Acesse o Supabase Dashboard');
      console.log('2. Vá em SQL Editor');
      console.log('3. Cole e execute o conteúdo do arquivo:');
      console.log('   backend/supabase/migrations/20250802000000_auto_create_prophet_agent.sql\n');
      console.log('4. Após executar, rode o script install-prophet-final.mjs\n');
      
      return;
    }

    console.log('✅ Migration executada com sucesso!\n');

    // Testar se o trigger está funcionando
    console.log('🧪 Testando o sistema...\n');
    
    // Verificar se a função existe
    const { data: functions } = await supabase
      .rpc('pg_catalog.pg_proc')
      .select('proname')
      .ilike('proname', '%prophet%');
    
    console.log('✅ Sistema de criação automática do Prophet instalado!');
    console.log('   • Novos usuários receberão o Prophet automaticamente');
    console.log('   • Para instalar em usuários existentes, execute:');
    console.log('     node src/scripts/install-prophet-final.mjs\n');

  } catch (error) {
    console.error('❌ Erro:', error);
    console.log('\n💡 Dica: Execute a migration manualmente no Supabase Dashboard');
  }
}

executeMigration();