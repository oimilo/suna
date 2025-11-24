# Plano: Managed Auth para toolkits Composio que exigem API Key/Bearer

## Objetivos
- Impedir que o agente peça tokens/chaves diretamente ao usuário no chat.
- Reaproveitar o fluxo oficial do Composio (auth configs + connected accounts), mas permitindo que o backend injete as credenciais necessárias.
- Manter as chaves protegidas (criptografadas) e auditáveis, com capacidade de rotação sem refazer perfis.
- Reduzir falhas como o `"invalid key"` observado no Trello e casos semelhantes.

## Premissas e requisitos
- Cada toolkit expõe em `auth_config_details` e `connected_account_initiation_fields` os campos obrigatórios (`api_key`, `token`, `subdomain`, etc.).
- Já possuímos `ENCRYPTION_KEY` no backend e tabela `user_mcp_credential_profiles`; poderemos criar uma tabela dedicada para secrets sem expor dados ao cliente.
- O agente só deve exibir link de autenticação quando o toolkit realmente precisa de input do usuário (ex.: OAuth).
- Precisamos suportar “chave única global” (ex.: Trello key da empresa) e, no futuro, “chave por conta” (caso cada usuário tenha uma).

## Arquitetura proposta

### 1. Armazenamento seguro de secrets
1. Criar tabela `managed_toolkit_credentials` (Supabase) com colunas:
   - `credential_id` (uuid), `account_id` (opcional, permite credenciais específicas por workspace), `toolkit_slug`, `auth_scheme`, `encrypted_payload` (JSON com campos exigidos), `metadata` (JSONB), timestamps, `is_active`.
2. Usar o mesmo mecanismo de criptografia simétrica (`ENCRYPTION_KEY` + Fernet) do `ComposioProfileService`.
3. Expor `ManagedToolkitCredentialService` com métodos:
   - `get_credentials(toolkit_slug, account_id=None)`.
   - `save_credentials(...)` (para painel interno / scripts).
   - `list_credentials()` para auditoria.

### 2. Camada de resolução de requisitos
1. Estender `ToolkitService.get_detailed_toolkit_info` (já traz `auth_config_details` e `connected_account_initiation_fields`) para derivar um `AuthRequirement` por esquema:
   ```python
   class AuthRequirement(BaseModel):
       auth_scheme: Literal["OAUTH2", "API_KEY", "BEARER", "BASIC", ...]
       required_fields: List[str]
       optional_fields: List[str]
   ```
2. Criar helper `AuthRequirementResolver` capaz de:
   - Dizer se o toolkit possui `managed_auth` para o esquema desejado.
   - Listar campos necessários quando dependemos de custom auth.
   - Validar se o payload armazenado em `managed_toolkit_credentials` cobre todos os campos obrigatórios.

### 3. Injeção no fluxo `integrate_toolkit`
1. Antes de chamar `AuthConfigService.create_auth_config`, consultar `ManagedToolkitCredentialService`.
2. Se existir credencial válida:
   - Construir `custom_auth_config = {"auth_scheme": resolved_scheme, **stored_payload}`.
   - Forçar `use_custom_auth=True`.
   - Popular `initiation_fields` com os mesmos valores para que `connected_accounts.create` receba `state.val` completo (Ex.: `{"auth_scheme": "API_KEY", "api_key": "...", "token": "..."}`).
3. Se **não** existir credencial, manter o comportamento atual (Composio gerencia auth e retornamos link ao usuário).
4. Ajustar `ConnectedAccountService` para marcar `redirect_url=None` como “já conectado”; `ComposioProfileService` deve setar `is_connected=True` nesses casos para liberar `discover_mcp_tools_for_agent`.

### 4. Tratamento por toolkit
1. Criar `backend/core/composio_integration/toolkit_secret_registry.py` com convenções por slug:
   ```python
   TRELO = ToolkitSecretPolicy(
       toolkit_slug="trello",
       auth_scheme="API_KEY",
       fields=["api_key", "token"]
   )
   ```
2. O registry define campos e var names padrão (`env_var_overrides={"api_key": "TRELLO_API_KEY", ...}`) para ambientes locais ou scripts de seed. No ambiente de produção, priorizamos registros da tabela; se ausentes, caímos para env vars.
3. Isso facilita testes/fixtures e garante que futuros toolkits sigam o mesmo padrão.

### 5. Observabilidade e quedas controladas
- Logar qual caminho foi seguido: `managed_auth`, `custom_backend_auth`, `user_auth_link`.
- Adicionar métrica (Prometheus / logs) contabilizando falhas de `connected_accounts.create` por toolkit.
- Quando faltar secret: retornar mensagem clara ao agente do tipo `"Não há credenciais internas para Trello; peça para o admin configurá-las"` ao invés de pedir token ao usuário final.

## Impacto por componente
- `backend/supabase/migrations`: nova tabela `managed_toolkit_credentials` + políticas RLS.
- `core/composio_integration/managed_credentials_service.py` (novo).
- `ComposioIntegrationService.integrate_toolkit`: detectar e injetar credenciais + marcar perfis conectados.
- `AuthConfigService.create_auth_config`: já aceita `custom_auth_config`, mas precisa validação extra e correção de indentação na chamada `self.client.auth_configs.create(...)`.
- `ConnectedAccountService` e `ComposioProfileService`: tratar conexões sem redirect como “ativas”.
- `CredentialProfileTool`/`agent_creation_tool`: atualizar mensagens para refletir quando não há link (exibir “perfil pronto para uso”).

## Roadmap de implementação
1. **Infra de secrets**
   - Migration + service + seed CLI (permite registrar Trello key/token via backend CLI).
2. **Injeção autom.**
   - Registry + integração no `ComposioIntegrationService`.
   - Atualizar profile service para marcar `is_connected`.
3. **Validação/Rollback seguro**
   - Feature flag (`MANAGED_TOOLKIT_AUTH_ENABLED`) para ativar por ambiente.
   - Logs detalhados e fallback imediato para fluxo atual se falhar.
4. **Testes**
   - Unit tests para o resolver de requisitos e para a fusão de credenciais.
   - Teste end-to-end (simulado) garantindo que Trello recebe `api_key`/`token` não vazios.

## Próximos passos
1. Implementar migration e serviço de armazenamento.
2. Configurar secrets iniciais (Trello) em staging e validar fluxo end-to-end.
3. Estender para demais toolkits com auth semelhante (Zendesk subdomain+token, etc.) usando o mesmo registry.

