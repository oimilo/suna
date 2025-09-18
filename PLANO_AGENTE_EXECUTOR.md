# Plano do Agente Executor – Diagnóstico e Próximos Passos

## Diferenças‑chave que explicam “não acha a tool” no executor vs thread normal
- **Normal**: sem filtro; todas as tools registradas (nativo + MCP).
- **Trigger**: pode ter filtro via `allowed_tools` e `prefer_list_available_tools`; se o filtro esconde `web_search` ou o nome qualificado (`provider:tool`), o agente cai em discovery errado.
- **Nome curto vs qualificado**: em threads normais, o modelo tende a chegar no nome qualificado; no trigger ele costuma emitir XML curto; já cobrimos com alias de execução e normalização dentro de `call_mcp_tool`.
- **Credenciais múltiplas**: em normal ele interage mais e “acerta” o perfil; no trigger havia ambiguidade. Já mitigamos com instrução no prompt do executor (listar/validar/vincular perfis); para garantir, prefira usar `profile_id`.

## O que checar agora (rápido)
1. No início do run do executor, logar as keys do registry efetivo e o valor de `agent_config.allowed_tools` (esperado conter `web_search`, `call_mcp_tool` e a tool qualificada). Se `web_search` não estiver, é filtro.
2. Na primeira tentativa de envio, confirmar no log que o alias mapeou `gmail_send_email` → `pipedream:gmail_send_email` (ou qual for) e que `call_mcp_tool` está presente.
3. Se houver vários perfis Gmail, ver se o agente chamou `get_credential_profiles` e `check_profile_connection` antes do envio; se não, adicionar um `README.md` com os passos (ele já prioriza README).

## Para reproduzir o sucesso do criador no executor
- No trigger, passe `allowed_tools`:
  ```json
  [
    "list_available_tools",
    "web_search",
    "get_credential_profiles",
    "check_profile_connection",
    "configure_profile_for_agent",
    "call_mcp_tool",
    "pipedream:gmail_send_email"
  ]
  ```
  (ajuste o provider conforme a sua integração)
- Garanta `project_id` do criador e um `README.md` com o passo‑a‑passo (o executor lê e segue).
- Use campo `text`/`html` na tool de email (não `body`).

---

## Decisão: reduzir restrições e focar no prompt/README
- Não forçar `prefer_list_available_tools` nas execuções do executor.
- Evitar `allowed_tools` no trigger (deixar vazio), a menos que seja realmente necessário; quando usar, incluir explicitamente `web_search`, `call_mcp_tool` e a tool qualificada.
- Reaproveitar sempre o mesmo `project_id` para compartilhamento de arquivos/README.
- Manter invariantes de robustez: `list_available_tools`/`call_mcp_tool` sempre disponíveis e alias/normalização de nomes curtos → qualificados.

## Alterações futuras propostas
1) Política de tool calls
- Ajustar `max_xml_tool_calls` para 2 na primeira resposta do executor (permitir `ls -la` + `list_available_tools`), mantendo 1 nas seguintes; ou política adaptativa (2 até completar DO FIRST, depois 1).

2) Regra de parada do loop
- Remover/alterar o guard “parar se a última mensagem for assistant”.

3) Observabilidade mínima
- Logar (uma linha, truncada) as keys do `tool_registry.tools` após init e após filtros, e o `allowed_tools` efetivo.
- Logar mapeamentos de alias: curto → qualificado; e normalização de `call_mcp_tool(tool_name=...)`.

4) Sanitização do prompt inicial
- Evitar vazamentos de placeholders (ex.: `HH:MM`, `HH`) no prompt do executor.

5) Diretriz de prompts
- Considerar suprimir a seção “MCP Tools Available” no system prompt das execuções por trigger (para reduzir viés de `list_mcp_tools`).

6) Garantias de discovery e execução
- Preservar sempre `list_available_tools`, `list_mcp_tools` (alias) e `call_mcp_tool` no runtime.
- Confirmar que `web_search` nunca é filtrado quando presente.
