## Plano assertivo: Workflows de Monitoramento (CSV, Trello, etc.)

Objetivo: ter monitoramentos confiáveis (snapshot + diff + notificação) usando steps determinísticos e MCP por alias, sem over engineering.

### Escopo
- Step genérico `fetch_and_diff` para múltiplas fontes
- Condição `check_changes`
- Notificação via alias (gmail_send_email/slack_post_message)
- Warmup curto do MCP + logs claros
- Template padrão de workflow para criação pelo agente
- Agendamento por trigger (cron)

### Checklist de implementação
- [ ] Implementar `fetch_and_diff` no `WorkflowExecutor`
  - [ ] Drivers: `csv_url`, `http_json`, `mcp_tool`
  - [ ] Normalização: lista de registros estáveis (dict ordenado)
  - [ ] Parâmetros: `record_key`, `include_fields`, `sort_by`, `source_key`
  - [ ] Snapshot em Redis: chave `wf:{workflow_id}:src:{source_key}:hash` e `:data`
  - [ ] Saída: `{ has_changes, summary:{added,removed,updated}, changed_keys, sample_changes }`
- [ ] Condição `check_changes` usa `results["Fetch & Diff"].has_changes === true`
- [ ] Notificação via alias (gmail/slack)
  - [ ] Warmup MCP curto (não bloqueante) e logs quando cair em simulated
- [ ] Template padrão de workflow (para Agent Builder)
- [ ] Atualizar workflow "Monitor Planilha Google Sheets" para o novo formato
- [ ] Teste E2E com CSV (sem mudança → sem e-mail; com mudança → e-mail)
- [ ] Suporte Trello (via `mcp_tool` + `extract.path`)
- [ ] Agendar trigger (cron) e validar execução periódica
- [ ] Observabilidade mínima (mensagens de status por step; logs de snapshot/diff/notificação)

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

### Testes e validação
- Rodar 2x seguidas sem mudar a fonte → `has_changes=false`, sem notificação
- Editar a fonte → `has_changes=true` e notificar
- Repetir com Trello (mcp_tool)


