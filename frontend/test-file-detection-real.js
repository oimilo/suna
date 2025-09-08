// Script de teste com formato REAL dos dados observados nos logs
console.log('=== TESTE COM FORMATO REAL DOS DADOS ===\n');

// Função extractFileName melhorada (copiada do componente atualizado)
const extractFileName = (rawContent) => {
  console.log(`[EXTRACT] Tipo do conteúdo recebido: ${typeof rawContent}`);
  
  if (!rawContent) {
    console.log('[EXTRACT] Conteúdo vazio ou null');
    return null;
  }
  
  // Extrai o conteúdo real se estiver em formato estruturado
  let content = '';
  
  if (typeof rawContent === 'string') {
    // Tenta fazer parse se for uma string JSON
    try {
      const parsed = JSON.parse(rawContent);
      // Se tiver um campo 'content', usa ele
      if (parsed.content) {
        content = typeof parsed.content === 'string' ? parsed.content : JSON.stringify(parsed.content);
        console.log('[EXTRACT] Extraindo content de objeto parseado');
      } else {
        content = rawContent;
      }
    } catch {
      // Não é JSON, usa como string mesmo
      content = rawContent;
    }
  } else if (typeof rawContent === 'object') {
    // Se já for objeto, procura o campo content
    if (rawContent.content) {
      content = typeof rawContent.content === 'string' ? rawContent.content : JSON.stringify(rawContent.content);
      console.log('[EXTRACT] Usando campo content do objeto');
    } else {
      content = JSON.stringify(rawContent);
    }
  }
  
  console.log(`[EXTRACT] Conteúdo processado (primeiros 200 chars): ${content.substring(0, 200)}`);
  
  // Tenta extrair o nome do arquivo de diferentes formatos
  const patterns = [
    /<parameter name="file_path">([^<]+)<\/parameter>/,
    /<parameter name="target_file">([^<]+)<\/parameter>/,
    /<parameter name="file-path">([^<]+)<\/parameter>/,  // Com hífen
    /<parameter name="target-file">([^<]+)<\/parameter>/, // Com hífen
    /file_path["\s:=]+["']([^"']+)["']/,
    /target_file["\s:=]+["']([^"']+)["']/,
    /file-path["\s:=]+["']([^"']+)["']/,  // Com hífen
    /target-file["\s:=]+["']([^"']+)["']/,  // Com hífen
    /"file_path"\s*:\s*"([^"]+)"/,
    /"target_file"\s*:\s*"([^"]+)"/,
    /"file-path"\s*:\s*"([^"]+)"/,  // Com hífen
    /"target-file"\s*:\s*"([^"]+)"/  // Com hífen
  ];
  
  for (let i = 0; i < patterns.length; i++) {
    const pattern = patterns[i];
    console.log(`[EXTRACT] Tentando padrão ${i + 1}: ${pattern}`);
    const match = content.match(pattern);
    if (match && match[1]) {
      const fullPath = match[1];
      const fileName = fullPath.split('/').pop() || fullPath.split('\\').pop() || fullPath;
      console.log(`[EXTRACT] ✓ Match encontrado! Caminho: "${fullPath}", Arquivo: "${fileName}"`);
      return fileName;
    }
  }
  
  console.log('[EXTRACT] ✗ Nenhum padrão encontrou match');
  return null;
};

console.log('\n=== CASOS DE TESTE BASEADOS NOS LOGS REAIS ===\n');

// Caso 1: Formato observado nos logs - objeto com role e content
const caso1 = {
  role: "assistant",
  content: "Vou criar uma landing page divertida que parece uma fanpage de cachorro famoso, com um toque carismático e fofo.\\n\\n<create-file>\\n<parameter name=\"file_path\">index.html</parameter>\\n<parameter name=\"content\"><!DOCTYPE html>..."
};

console.log('\n--- Teste 1: Formato real observado (objeto com role/content) ---');
const resultado1 = extractFileName(caso1);
console.log(`RESULTADO: ${resultado1 === 'index.html' ? '✅' : '❌'} ${resultado1}\n`);

// Caso 2: String JSON (como poderia vir do backend)
const caso2 = JSON.stringify(caso1);

console.log('\n--- Teste 2: String JSON do mesmo objeto ---');
const resultado2 = extractFileName(caso2);
console.log(`RESULTADO: ${resultado2 === 'index.html' ? '✅' : '❌'} ${resultado2}\n`);

// Caso 3: Apenas o conteúdo XML direto
const caso3 = '<create-file>\n<parameter name="file_path">main.py</parameter>\n<parameter name="content">print("hello")</parameter>\n</create-file>';

console.log('\n--- Teste 3: XML direto ---');
const resultado3 = extractFileName(caso3);
console.log(`RESULTADO: ${resultado3 === 'main.py' ? '✅' : '❌'} ${resultado3}\n`);

// Caso 4: Com parâmetros usando hífen
const caso4 = {
  content: '<create-file>\n<parameter name="file-path">app.js</parameter>\n<parameter name="content">console.log("app")</parameter>\n</create-file>'
};

console.log('\n--- Teste 4: Parâmetros com hífen ---');
const resultado4 = extractFileName(caso4);
console.log(`RESULTADO: ${resultado4 === 'app.js' ? '✅' : '❌'} ${resultado4}\n`);

// Caso 5: Caminho completo
const caso5 = {
  content: '<create-file>\n<parameter name="file_path">./public/index.html</parameter>\n<parameter name="content"><!DOCTYPE html>...</parameter>\n</create-file>'
};

console.log('\n--- Teste 5: Caminho completo ---');
const resultado5 = extractFileName(caso5);
console.log(`RESULTADO: ${resultado5 === 'index.html' ? '✅' : '❌'} ${resultado5}\n`);

// Caso 6: Formato JSON puro
const caso6 = {
  content: '{"file_path": "dashboard.html", "content": "<!DOCTYPE html>..."}'
};

console.log('\n--- Teste 6: Formato JSON puro ---');
const resultado6 = extractFileName(caso6);
console.log(`RESULTADO: ${resultado6 === 'dashboard.html' ? '✅' : '❌'} ${resultado6}\n`);

// Resumo
console.log('\n=== RESUMO DOS TESTES ===');
const resultados = [
  { nome: 'Objeto com role/content', esperado: 'index.html', obtido: resultado1 },
  { nome: 'String JSON', esperado: 'index.html', obtido: resultado2 },
  { nome: 'XML direto', esperado: 'main.py', obtido: resultado3 },
  { nome: 'Parâmetros com hífen', esperado: 'app.js', obtido: resultado4 },
  { nome: 'Caminho completo', esperado: 'index.html', obtido: resultado5 },
  { nome: 'Formato JSON puro', esperado: 'dashboard.html', obtido: resultado6 }
];

let sucessos = 0;
resultados.forEach(r => {
  const passou = r.esperado === r.obtido;
  if (passou) sucessos++;
  console.log(`${passou ? '✅' : '❌'} ${r.nome}: esperado "${r.esperado}", obtido "${r.obtido}"`);
});

console.log(`\nTaxa de sucesso: ${sucessos}/${resultados.length} (${Math.round(sucessos/resultados.length*100)}%)`);