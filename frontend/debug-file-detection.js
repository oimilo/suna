// Script de debug para testar detecção de arquivos principais
console.log('=== DEBUG DE DETECÇÃO DE ARQUIVOS PRINCIPAIS ===\n');

// Padrões de arquivos principais (copiado do componente)
const FILE_PATTERNS = {
  web: ['index.html', 'home.html', 'main.html', 'app.html'],
  game: ['game.html', 'play.html', 'index.html', 'main.js'],
  python: ['main.py', 'app.py', 'server.py', 'bot.py', 'script.py'],
  node: ['index.js', 'app.js', 'server.js', 'main.js', 'index.ts'],
  dashboard: ['dashboard.html', 'admin.html', 'panel.html', 'index.html'],
  api: ['webhook.js', 'api.py', 'handler.js', 'function.js']
};

// Função extractFileName (copiada do componente)
const extractFileName = (content) => {
  if (!content) {
    console.log('  [EXTRACT] Conteúdo vazio ou null');
    return null;
  }
  
  console.log('  [EXTRACT] Conteúdo recebido (primeiros 200 chars):', content.substring(0, 200));
  
  // Tenta extrair o nome do arquivo de diferentes formatos
  const patterns = [
    /<parameter name="file_path">([^<]+)<\/parameter>/,
    /<parameter name="target_file">([^<]+)<\/parameter>/,
    /file_path["\s:=]+["']([^"']+)["']/,
    /target_file["\s:=]+["']([^"']+)["']/,
    /"file_path"\s*:\s*"([^"]+)"/,
    /"target_file"\s*:\s*"([^"]+)"/
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    console.log(`  [EXTRACT] Tentando padrão ${i + 1}: ${pattern}`);
    const match = content.match(pattern);
    if (match && match[1]) {
      const fullPath = match[1];
      const fileName = fullPath.split('/').pop() || fullPath.split('\\').pop() || fullPath;
      console.log(`  [EXTRACT] ✓ Match encontrado! Caminho: "${fullPath}", Arquivo: "${fileName}"`);
      return fileName;
    }
  }
  
  console.log('  [EXTRACT] ✗ Nenhum padrão encontrou match');
  return null;
};

// Função isDeliveryMoment simplificada
const isDeliveryMoment = (toolCall) => {
  const name = toolCall.assistantCall?.name;
  console.log(`\n[DELIVERY] Verificando tool: ${name}`);
  
  if (!name) {
    console.log('[DELIVERY] Nome vazio');
    return false;
  }

  if (name === 'create_file' || name === 'full_file_rewrite') {
    const rawContent = toolCall.assistantCall?.content;
    const content = typeof rawContent === 'string' 
      ? rawContent 
      : rawContent ? JSON.stringify(rawContent) : '';
    
    const fileName = extractFileName(content);
    
    if (!fileName) {
      console.log('[DELIVERY] Não foi possível extrair nome do arquivo');
      return false;
    }
    
    console.log(`[DELIVERY] Arquivo extraído: "${fileName}"`);
    
    // Lista de arquivos auxiliares
    const auxiliaryFiles = [
      'style.css', 'styles.css', 'config.js', 'config.json', 
      'package.json', 'requirements.txt', '.env', '.gitignore',
      'README.md', 'Dockerfile', 'docker-compose.yml',
      'tsconfig.json', 'webpack.config.js', 'babel.config.js'
    ];
    
    const isAuxiliary = auxiliaryFiles.some(aux => 
      fileName === aux || 
      fileName.includes('test.') || 
      fileName.includes('spec.') || 
      fileName.includes('_test.') || 
      fileName.includes('.test.')
    );
    
    if (isAuxiliary) {
      console.log(`[DELIVERY] ✗ Arquivo auxiliar detectado: ${fileName}`);
      return false;
    }
    
    const mainFilePatterns = Object.values(FILE_PATTERNS).flat();
    const isMainFile = mainFilePatterns.includes(fileName);
    
    console.log(`[DELIVERY] É arquivo principal? ${isMainFile}`);
    console.log(`[DELIVERY] Padrões principais:`, mainFilePatterns);
    
    return isMainFile;
  }
  
  return false;
};

// CASOS DE TESTE - Diferentes formatos possíveis
console.log('\n=== TESTANDO DIFERENTES FORMATOS DE TOOL CALLS ===\n');

const testCases = [
  {
    name: 'Formato XML com index.html',
    toolCall: {
      assistantCall: {
        name: 'create_file',
        content: '<parameter name="file_path">index.html</parameter><parameter name="content"><!DOCTYPE html>...</parameter>'
      }
    }
  },
  {
    name: 'Formato XML com style.css',
    toolCall: {
      assistantCall: {
        name: 'create_file',
        content: '<parameter name="file_path">style.css</parameter><parameter name="content">body { margin: 0; }</parameter>'
      }
    }
  },
  {
    name: 'Formato JSON com index.html',
    toolCall: {
      assistantCall: {
        name: 'create_file',
        content: '{"file_path": "index.html", "content": "<!DOCTYPE html>..."}'
      }
    }
  },
  {
    name: 'Formato JSON com path completo',
    toolCall: {
      assistantCall: {
        name: 'create_file',
        content: '{"file_path": "public/index.html", "content": "<!DOCTYPE html>..."}'
      }
    }
  },
  {
    name: 'Formato com aspas simples',
    toolCall: {
      assistantCall: {
        name: 'create_file',
        content: "file_path='main.py'"
      }
    }
  },
  {
    name: 'Formato objeto JavaScript',
    toolCall: {
      assistantCall: {
        name: 'create_file',
        content: { file_path: 'app.js', content: 'console.log("hello")' }
      }
    }
  },
  {
    name: 'Tool com underscore (create_file)',
    toolCall: {
      assistantCall: {
        name: 'create_file',
        content: '<parameter name="file_path">index.html</parameter>'
      }
    }
  },
  {
    name: 'Tool com hífen (create-file)',
    toolCall: {
      assistantCall: {
        name: 'create-file',
        content: '<parameter name="file_path">index.html</parameter>'
      }
    }
  },
  {
    name: 'Arquivo Python principal',
    toolCall: {
      assistantCall: {
        name: 'create_file',
        content: '<parameter name="file_path">main.py</parameter>'
      }
    }
  },
  {
    name: 'Arquivo de teste (deve ser ignorado)',
    toolCall: {
      assistantCall: {
        name: 'create_file',
        content: '<parameter name="file_path">test.js</parameter>'
      }
    }
  }
];

// Executa todos os testes
testCases.forEach((testCase, index) => {
  console.log(`\n--- Teste ${index + 1}: ${testCase.name} ---`);
  const result = isDeliveryMoment(testCase.toolCall);
  console.log(`RESULTADO: ${result ? '✅ É entrega principal' : '❌ NÃO é entrega principal'}`);
});

// Teste da função detectMainFile
console.log('\n\n=== TESTANDO DETECÇÃO DE ARQUIVO PRINCIPAL ===\n');

const detectMainFile = (calls) => {
  console.log('[DETECT] Iniciando com', calls.length, 'tool calls');
  
  const fileCreations = calls
    .map((tc, idx) => ({ tc, idx }))
    .filter(({ tc }) => {
      const name = tc.assistantCall?.name;
      return name === 'create_file' || name === 'full_file_rewrite' || name === 'edit_file';
    });

  console.log('[DETECT] Encontradas', fileCreations.length, 'criações/edições de arquivo');
  
  if (fileCreations.length === 0) return -1;

  const getContentAsString = (content) => {
    if (typeof content === 'string') return content;
    if (content) return JSON.stringify(content);
    return '';
  };

  const mainFilePatterns = Object.values(FILE_PATTERNS).flat();
  
  for (const { tc, idx } of fileCreations) {
    const content = getContentAsString(tc.assistantCall?.content);
    const fileName = extractFileName(content);
    
    if (!fileName) {
      console.log(`[DETECT] Índice ${idx}: não foi possível extrair nome`);
      continue;
    }
    
    console.log(`[DETECT] Índice ${idx}: arquivo "${fileName}"`);
    
    if (mainFilePatterns.includes(fileName)) {
      console.log(`[DETECT] ✅ Arquivo principal encontrado: "${fileName}" no índice ${idx}`);
      return idx;
    }
  }
  
  console.log('[DETECT] Nenhum arquivo principal encontrado');
  return -1;
};

// Teste com múltiplos tool calls
const multipleToolCalls = [
  {
    assistantCall: {
      name: 'create_file',
      content: '<parameter name="file_path">style.css</parameter>'
    }
  },
  {
    assistantCall: {
      name: 'create_file',
      content: '<parameter name="file_path">script.js</parameter>'
    }
  },
  {
    assistantCall: {
      name: 'create_file',
      content: '<parameter name="file_path">index.html</parameter>'
    }
  }
];

const mainIndex = detectMainFile(multipleToolCalls);
console.log(`\nÍndice do arquivo principal: ${mainIndex}`);
console.log(mainIndex === 2 ? '✅ Correto! index.html está no índice 2' : '❌ Erro! Deveria ser índice 2');

console.log('\n=== FIM DO DEBUG ===');