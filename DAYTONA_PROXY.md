# 🚀 Daytona Preview Proxy - Documentação de Implementação

## 📋 Contexto do Problema
O Daytona exibe uma página de warning ao acessar preview URLs pela primeira vez. Isso acontece porque:
- URLs do formato `https://8080-sandbox-id.proxy.daytona.works/` mostram warning
- Não é possível adicionar headers customizados em iframes HTML
- O header `X-Daytona-Skip-Preview-Warning: true` precisa ser enviado para pular o warning

## ❌ O que NÃO Funciona
- Enviar API key como Bearer token no header
- Usar tokens salvos no banco (estão expirados/inválidos)
- Adicionar headers em iframes (limitação HTML)
- Acessar proxy.daytona.works com API key (só aceita OAuth2)

## ✅ Solução: Proxy Transparente no Backend

### Conceito
```
Antes: Browser → Daytona Proxy (warning) → Sandbox
Depois: Browser → Prophet API → Daytona SDK → Sandbox
```

## 📝 Checklist de Implementação

### Backend (`backend/agent/api.py`)

- [ ] **1. Criar endpoint de preview**
```python
@router.get("/api/preview/{project_id}/{path:path}")
async def preview_proxy(
    project_id: str,
    path: str,
    user_id: str = Depends(get_current_user_id_from_jwt),
    db: DBConnection = Depends(get_db)
):
```

- [ ] **2. Validar acesso ao projeto**
```python
# Verificar se usuário tem acesso
project = await db.client.table('projects').select('*').eq('project_id', project_id).eq('account_id', user_id).single().execute()
if not project.data:
    raise HTTPException(403, "Acesso negado")
```

- [ ] **3. Obter sandbox e garantir que está rodando**
```python
from sandbox.sandbox import get_or_start_sandbox

sandbox_id = project.data['sandbox']['id']
sandbox = await get_or_start_sandbox(sandbox_id)
```

- [ ] **4. Baixar arquivo do sandbox**
```python
# Limpar path e adicionar /workspace/
clean_path = path.replace('../', '').strip('/')
full_path = f"/workspace/{clean_path}"

# Baixar arquivo
try:
    file_content = await sandbox.fs.download_file(full_path)
except Exception as e:
    # Se for diretório ou não existir, tentar index.html
    if not path or path.endswith('/'):
        full_path = f"/workspace/{clean_path}/index.html"
        file_content = await sandbox.fs.download_file(full_path)
```

- [ ] **5. Determinar Content-Type**
```python
content_type = "text/html"
if path.endswith('.css'):
    content_type = "text/css"
elif path.endswith('.js'):
    content_type = "application/javascript"
elif path.endswith('.json'):
    content_type = "application/json"
elif path.endswith('.png'):
    content_type = "image/png"
elif path.endswith('.jpg') or path.endswith('.jpeg'):
    content_type = "image/jpeg"
elif path.endswith('.svg'):
    content_type = "image/svg+xml"
```

- [ ] **6. Retornar response**
```python
from fastapi.responses import Response

return Response(
    content=file_content,
    media_type=content_type,
    headers={
        "Cache-Control": "public, max-age=3600",
        "X-Frame-Options": "SAMEORIGIN"
    }
)
```

### Frontend (`frontend/src/lib/utils/url.ts`)

- [ ] **7. Modificar constructHtmlPreviewUrl**
```typescript
export function constructHtmlPreviewUrl(
  sandboxUrl: string | undefined,
  filePath: string | undefined,
): string | undefined {
  if (!sandboxUrl || !filePath) {
    return undefined;
  }

  // NOVO: Usar nosso proxy ao invés do Daytona direto
  // Extrair project_id da sandboxUrl ou receber como parâmetro
  const projectId = extractProjectId(sandboxUrl); // implementar
  
  // Remover /workspace/ prefix se presente
  const processedPath = filePath.replace(/^\/workspace\//, '');
  
  // Retornar URL do nosso backend
  return `/api/preview/${projectId}/${processedPath}`;
}
```

### Frontend (`frontend/src/components/thread/preview-renderers/html-renderer.tsx`)

- [ ] **8. Ajustar para passar project_id**
```typescript
// Modificar para usar o novo formato de URL
const htmlPreviewUrl = useMemo(() => {
  if (project?.project_id && fileName) {
    return `/api/preview/${project.project_id}/${fileName}`;
  }
  return blobHtmlUrl || previewUrl;
}, [project?.project_id, fileName, blobHtmlUrl, previewUrl]);
```

## 🧪 Testes

- [ ] **9. Teste com HTML**
  - Criar arquivo test.html no sandbox
  - Acessar via `/api/preview/{project_id}/test.html`
  - Verificar se não aparece warning

- [ ] **10. Teste com assets**
  - Testar CSS: `/api/preview/{project_id}/style.css`
  - Testar JS: `/api/preview/{project_id}/script.js`
  - Testar imagem: `/api/preview/{project_id}/image.png`

- [ ] **11. Teste de segurança**
  - Tentar acessar projeto de outro usuário
  - Verificar se retorna 403

## 🚨 Possíveis Problemas e Soluções

### Problema 1: Sandbox parado/arquivado
**Solução**: Usar `get_or_start_sandbox()` que já existe

### Problema 2: Arquivo não existe
**Solução**: Retornar 404 ou tentar index.html como fallback

### Problema 3: Paths relativos em HTML/CSS
**Solução**: Por enquanto ignorar, depois implementar rewrite de URLs

### Problema 4: Performance
**Solução**: Adicionar cache Redis em versão futura

## 📦 Dependências
- SDK do Daytona já instalado
- FastAPI Response para servir arquivos
- Função `get_or_start_sandbox` já existe

## 🔄 Rollback se Quebrar
```bash
git revert HEAD
```

## 📈 Melhorias Futuras
1. Cache em Redis com TTL de 5 minutos
2. Rewrite de URLs relativas no HTML
3. Suporte a WebSockets para hot reload
4. Compressão gzip para arquivos grandes

---
**Última atualização**: 04/09/2025
**Contexto**: Removendo warning do Daytona sem pagar Tier 3