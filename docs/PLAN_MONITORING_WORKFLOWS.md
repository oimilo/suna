## Plano assertivo: Workflows de Monitoramento (CSV, Trello, etc.)

Objetivo: ter monitoramentos confiáveis (snapshot + diff + notificação) usando steps determinísticos e MCP por alias, sem over engineering.

### Escopo
- Step genérico `fetch_and_diff` para múltiplas fontes
- Condição `check_changes`
- Notificação via alias (gmail_send_email/slack_post_message)
- Warmup curto do MCP + logs claros
- Template padrão de workflow para criação pelo agente
- Agendamento por trigger (cron)

### Checklist de implementação (atualizado)
- [x] Implementar `fetch_and_diff` no `WorkflowExecutor`
  - [x] Drivers: `csv_url`, `http_json`, `mcp_tool`
  - [x] Normalização: lista de registros estáveis (dict ordenado)
  - [x] Parâmetros: `record_key` (inclui `[*]`), `include_fields`, `sort_by`, `source_key`
  - [x] Snapshot em Redis: chave `wf:{workflow_id}:src:{source_key}:hash` e `:data`
  - [x] Saída: `{ has_changes, summary:{added,removed,updated}, changed_keys, sample_changes }`
- [x] Condição `check_changes` usa `results["Fetch & Diff"].has_changes === true`
- [~] Notificação via alias (gmail/slack)
  - [x] Alias (gmail_send_email) integrado
  - [x] Warmup MCP curto (não bloqueante) + melhoria de resolução de alias
  - [ ] Envio "real" consistente (depende do MCP/credenciais no ambiente)
- [x] Template padrão de workflow (para Agent Builder)
- [x] Atualizar workflow "Monitor Planilha Google Sheets" para o novo formato
- [x] Teste E2E com CSV (sem mudança → sem e-mail; com mudança → notificação)
  - Status: validado. Detecção de mudanças e gate da condição funcionando.
- [ ] Suporte Trello (via `mcp_tool` + `extract.path`)
- [ ] Agendar trigger (cron) e validar execução periódica
- [x] Observabilidade mínima (mensagens de status por step; logs de snapshot/diff/notificação)

### Especificação do step `fetch_and_diff`

Configuração (exemplos):

CSV (Google Sheets export):
```json
{
  "tool_name": "fetch_and_diff",
  "args": {
    "source": {
      "type": "csv_url",
      "url": "{planilha_url}",
      "csv": { "delimiter": ",", "encoding": "utf-8" }
    },
    "record_key": ["id"],
    "include_fields": ["id","name","status","updated_at"],
    "sort_by": ["id"],
    "source_key": "sheets:planilha-monitor"
  }
}
```

HTTP JSON:
```json
{
  "tool_name": "fetch_and_diff",
  "args": {
    "source": {
      "type": "http_json",
      "url": "https://api.example.com/items",
      "headers": { "Authorization": "Bearer {token}" },
      "extract": { "path": "data.items" }
    },
    "record_key": ["id"],
    "include_fields": ["id","status","updated_at"],
    "source_key": "http:items"
  }
}
```

MCP (ex.: Trello):
```json
{
  "tool_name": "fetch_and_diff",
  "args": {
    "source": {
      "type": "mcp_tool",
      "method": "mcp_pipedream_trello_list_cards",
      "args": { "board_id": "..." },
      "extract": { "path": "cards" }
    },
    "record_key": ["id"],
    "include_fields": ["id","name","idList","dateLastActivity"],
    "source_key": "trello:board-123"
  }
}
```

Saída esperada:
```json
{
  "has_changes": true,
  "summary": { "added": 2, "removed": 0, "updated": 3 },
  "changed_keys": ["42","77"],
  "sample_changes": [{ "id": "42", "from": {"status":"todo"}, "to": {"status":"doing"} }]
}
```

### Template de workflow de monitoramento (padrão)
```json
[
  { "name": "Contexto", "type": "instruction", "order": 1,
    "config": { "instruction": "Monitore a fonte e notifique mudanças." } },
  { "name": "Fetch & Diff", "type": "tool", "order": 2,
    "config": { "tool_name": "fetch_and_diff", "args": { /* ver exemplos acima */ } } },
  { "name": "Se mudou", "type": "condition", "order": 3,
    "conditions": { "check_changes": true },
    "children": [
      { "name": "Notificar", "type": "tool", "order": 4,
        "config": { "tool_name": "gmail_send_email", "args": { "to": "{email_destino}", "subject": "Mudanças detectadas", "body": "Resumo: {results}" } } }
    ] }
]
```

### Warmup do MCP (curto)
- Inicializar MCP no início da execução (timeout pequeno e não bloqueante)
- Se não carregar a tempo, registrar em log e seguir (notificação pode cair em simulated)

### Observabilidade
- Persistir mensagens `workflow_status` por step
- Logar: snapshot salvo, diff detectado, tipo de notificação (real/simulated)

### Status atual (13/09/2025)
- Implementação do step `fetch_and_diff` concluída e integrada ao workflow de planilha
- Ajustes de robustez aplicados: resolução recursiva de placeholders, fallback de URL via `input.planilha_url`, follow_redirects para CSV do Google, guards para `.strip()` com `None`, import do Redis via wrapper, warmup MCP não bloqueante
- Workflow "Monitor Planilha Google Sheets" atualizado e validado (mudança gera notificação; sem mudança, não notifica)
- Envio ainda em "simulated" em produção; depende do MCP Gmail estar 100% ativo com credenciais/app_slug/external_user_id resolvidos

### Captura dinâmica de tools (visão geral)
- O executor resolve aliases de tool (ex.: `gmail_send_email`, `slack_post_message`) para métodos MCP em tempo de execução
- Estratégia de resolução: candidatos por servidor/app_slug + fallback genérico `mcp_pipedream_{alias}` + varredura de schemas + `call_mcp_tool` com alias
- Requisitos: MCP habilitado na versão do agente e alias presente em `enabledTools` (credenciais válidas)

### Próximos passos sugeridos
1) Garantir credenciais MCP Gmail ativas no ambiente (app_slug, external_user_id) → envio "real"
2) (Opcional) Adicionar Slack como segunda integração (habilitar MCP e alias `slack_post_message`)
3) Agendar trigger (cron) para execução periódica e observar comportamento por 24–48h
4) Expandir `fetch_and_diff` para perfis adicionais (ex.: paginação em HTTP JSON) conforme necessidade

### Roteiro para e‑mail real (MCP Gmail) — 100%
- [ ] Versão ativa do agente
  - [ ] Conter MCP Gmail em `configured_mcps`/`custom_mcps`
  - [ ] `enabledTools` inclui `gmail_send_email`
  - [ ] `config.app_slug` definido (ex.: "gmail")
  - [ ] `config.external_user_id` presente (ou `profile_id` que resolva para ele)
- [ ] Captura de credenciais no runtime
  - [x] Se vier apenas `profile_id`, resolver `external_user_id` via `credential_profiles` quando possível
  - [x] Warmup MCP curto e não bloqueante (5s)
- [ ] Resolução dinâmica de tool (alias → método MCP)
  - [x] Candidatos: `mcp_{serverSlug}_{alias}` e `mcp_pipedream_{alias}`
  - [x] Varredura de schemas; fallback `call_mcp_tool(alias)`
- [ ] Sanidade rápida (produção)
  - [ ] GET `/api/triggers/internal/debug/mcp-tools?mode=config` → deve listar `gmail_send_email`
  - [ ] POST `/api/triggers/internal/mcp/diagnose-gmail-send` → `success=true`
  - [ ] Executar workflow → passo de e‑mail sem "simulated"
- [ ] Critério de aceite
  - [ ] Run com mudança na planilha envia e‑mail real (sem simulated)
  - [ ] Run sem mudança não envia


### Testes e validação
- Rodar 2x seguidas sem mudar a fonte → `has_changes=false`, sem notificação
- Editar a fonte → `has_changes=true` e notificar
- Repetir com Trello (mcp_tool)


