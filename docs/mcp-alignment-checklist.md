# MCP/Composio Alignment – Phase 3

- **Objetivo**: alinhar runtime atual ao comportamento do Suna original para MCP/Composio, garantindo que ferramentas Trello (ex.: `TRELLO_GET_MEMBERS_BY_ID_MEMBER`) apareçam no registry e executem sem quedas.

## 1. Paridade de Código
- Atualizar seguintes arquivos para a versão paritária do Suna:
  - `backend/core/tools/utils/dynamic_tool_builder.py`
  - `backend/core/tools/utils/custom_mcp_handler.py`
  - `backend/core/tools/utils/mcp_tool_executor.py`
  - `backend/core/mcp_module/mcp_service.py`
  - `backend/core/tools/agent_builder_tools/mcp_search_tool.py`
- Conferir que o wrapper registra aliases normalizados, trata `ToolExecutionResult`, e efetua fallback HTTP↔SSE.
- Revisar geração de logs após merge e validar que o `tool_registry` contém o alias completo (`TRELLO_GET_MEMBERS_BY_ID_MEMBER`).

## 2. Verificação e Migração de Schema
- Revisar tabela `user_mcp_credential_profiles` (Supabase): colunas obrigatórias já existentes (`mcp_qualified_name`, `config_hash`, timestamps, flags). Demais campos (`toolkit_slug`, `toolkit_name`, `mcp_url`, `connected_account_id`) ficam criptografados em `encrypted_config`.
- Validar se há necessidade de adicionar colunas auxiliares (caso queira acesso direto); preparar migration apenas se decidido.
- Confirmar que `agent_versions.config->tools.custom_mcp` armazena `config.profile_id` e `config.mcp_qualified_name` para cada entrada.

## 3. Backfill e Normalização de Dados
- Rodar script `backend/scripts/normalize_composio_configs.py` (ou consulta equivalente) em staging e produção.
- Garantir que `enabledTools` contenha os aliases corretos e que `mcp_qualified_name` siga o formato `composio.<slug>`.
- Limpar entradas órfãs nas configurações de agentes para evitar falhas nos registros dinâmicos.
- Status 2025-10-23: execução concluída em ambiente com Supabase configurado — `custom_composio_*` zerados e perfis normalizados para `composio.<slug>`; entradas `pipedream:*` permanecem por design.
- Próximo passo: executar `python3 backend/scripts/backfill_composio_enabled_tools.py` (staging → produção) para alinhar `enabled_tools` existentes com os nomes exatos devolvidos por `discover_user_mcp_servers`.

## 4. Ajustes em Andamento
- Normalizar `enabled_tools` no fluxo de configuração (backend/UI) para salvar exatamente os nomes descobertos (`tool.name`).
- Status: frontend converte para `tool.name` e backend (`configure_profile_for_agent`) agora normaliza/deduplica antes de persistir; resta aplicar backfill para dados antigos.
- Preparar/rodar o backfill (`python3 backend/scripts/backfill_composio_enabled_tools.py`) para corrigir `enabled_tools` já persistidos com variantes incompatíveis (ex.: `TRELLO_GET_*`).
- Somente após esses passos repetir os testes funcionais abaixo.

## 5. Testes Funcionais (pós-correção)
- Fluxo manual:
  1. `discover_user_mcp_servers` com perfil Trello autenticado.
  2. `configure_profile_for_agent` (com normalização ativa) habilitando ferramentas Trello.
  3. Executar `trello_get_boards`, `trello_get_members_by_id_member` e confirmar resposta.
- Observar logs; não deve aparecer `Tool function ... not found`.
- Validar que outras ferramentas (boards/cards) registram e executam.
- Status: aguarda conclusão dos ajustes acima e ambiente conectado ao Supabase/Composio.

## 5. Observabilidade e Regressão
- Configurar alerta para logs com `Tool function` ausente ou falhas de normalização.
- Documentar qualquer ajuste adicional necessário na autenticação Composio (ex.: estados de conta não verificados).
- Manter checklist atualizada até homologação concluir sem incidentes.
- Registrar, após cada rodada de testes, status do script de normalização (quantos perfis atualizados, warnings) para manter rastreabilidade.
