// Script para verificar a estrutura do Prophet existente
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
  try {
    // Buscar o Prophet existente para ver a estrutura
    const { data: prophet, error } = await supabase
      .from('agents')
      .select('*')
      .eq('agent_id', '87d056b0-4390-4be6-8bdc-d5caf2bd60b7')
      .single();

    if (error) throw error;

    console.log('🔍 Estrutura do Prophet existente:\n');
    console.log(JSON.stringify(prophet, null, 2));

    // Buscar também a versão
    if (prophet.current_version_id) {
      const { data: version } = await supabase
        .from('agent_versions')
        .select('*')
        .eq('version_id', prophet.current_version_id)
        .single();

      console.log('\n📋 Versão atual:\n');
      console.log(JSON.stringify(version, null, 2));
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

main();