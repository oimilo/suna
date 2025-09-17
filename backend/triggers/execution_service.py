import json
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Dict, Any, Tuple
import re

from services.supabase import DBConnection
from services import redis
from utils.logger import logger, structlog
from utils.config import config
from .trigger_service import TriggerEvent, TriggerResult
from .utils import format_workflow_for_llm


class WorkflowNotFoundError(Exception):
    """Exceção específica para workflows não encontrados"""
    def __init__(self, message: str, workflow_id: str = None, agent_id: str = None):
        super().__init__(message)
        self.workflow_id = workflow_id
        self.agent_id = agent_id


class ExecutionService:

    def __init__(self, db_connection: DBConnection):
        self._db = db_connection
        self._session_manager = SessionManager(db_connection)
        self._agent_executor = AgentExecutor(db_connection, self._session_manager)
        self._workflow_executor = WorkflowExecutor(db_connection, self._session_manager)
    
    async def execute_trigger_result(
        self,
        agent_id: str,
        trigger_result: TriggerResult,
        trigger_event: TriggerEvent
    ) -> Dict[str, Any]:
        try:
            logger.info(f"Executing trigger for agent {agent_id}: workflow={trigger_result.should_execute_workflow}, agent={trigger_result.should_execute_agent}")
            
            if trigger_result.should_execute_workflow:
                try:
                    return await self._workflow_executor.execute_workflow(
                        agent_id=agent_id,
                        workflow_id=trigger_result.workflow_id,
                        workflow_input=trigger_result.workflow_input or {},
                        trigger_result=trigger_result,
                        trigger_event=trigger_event
                    )
                except WorkflowNotFoundError as e:
                    # FALLBACK AUTOMÁTICO para execução de agente quando workflow não existe
                    logger.warning(f"Workflow not found, automatically falling back to agent execution", 
                                 workflow_id=getattr(e, 'workflow_id', trigger_result.workflow_id),
                                 agent_id=agent_id,
                                 trigger_id=trigger_event.trigger_id,
                                 error_message=str(e),
                                 fallback_type="workflow_to_agent")
                    
                    # Criar prompt inteligente baseado no contexto disponível
                    workflow_context = ""
                    if trigger_result.workflow_input:
                        workflow_context = f"Based on the workflow input data: {json.dumps(trigger_result.workflow_input)}"
                    
                    execution_variables_context = ""
                    if trigger_result.execution_variables:
                        execution_variables_context = f"Execution context: {json.dumps(trigger_result.execution_variables)}"
                    
                    # Prompt que preserva a intenção original da automação
                    fallback_prompt = f"""Execute the automation that was originally configured as a workflow but the workflow is no longer available.
                    
{workflow_context}
{execution_variables_context}

Please analyze the context and execute the appropriate actions based on the automation's original intent."""
                    
                    # Criar TriggerResult alternativo para agente
                    fallback_trigger_result = TriggerResult(
                        success=True,
                        should_execute_agent=True,
                        agent_prompt=fallback_prompt,
                        execution_variables=trigger_result.execution_variables or {}
                    )
                    
                    logger.info(f"Executing fallback agent with intelligent prompt", 
                               agent_id=agent_id,
                               trigger_id=trigger_event.trigger_id,
                               fallback_type="workflow_to_agent")
                    
                    return await self._agent_executor.execute_agent(
                        agent_id=agent_id,
                        trigger_result=fallback_trigger_result,
                        trigger_event=trigger_event
                    )
            else:
                return await self._agent_executor.execute_agent(
                    agent_id=agent_id,
                    trigger_result=trigger_result,
                    trigger_event=trigger_event
                )
                
        except Exception as e:
            logger.error(f"Failed to execute trigger result: {e}", 
                        agent_id=agent_id,
                        trigger_id=trigger_event.trigger_id,
                        error_type=type(e).__name__)
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to execute trigger"
            }


class SessionManager:
    def __init__(self, db_connection: DBConnection):
        self._db = db_connection
    
    async def create_agent_session(
        self,
        agent_id: str,
        agent_config: Dict[str, Any],
        trigger_event: TriggerEvent,
        existing_project_id: str | None = None
    ) -> Tuple[str, str]:
        client = await self._db.client
        
        project_id = existing_project_id or str(uuid.uuid4())
        thread_id = str(uuid.uuid4())
        account_id = agent_config.get('account_id')
        
        placeholder_name = f"Trigger: {agent_config.get('name', 'Agent')} - {trigger_event.trigger_id[:8]}"

        if not existing_project_id:
            await client.table('projects').insert({
                "project_id": project_id,
                "account_id": account_id,
                "name": placeholder_name,
                "created_at": datetime.now(timezone.utc).isoformat()
            }).execute()
            await self._create_sandbox_for_project(project_id)
        else:
            # Validate ownership and ensure sandbox exists
            proj = await client.table('projects').select('*').eq('project_id', project_id).single().execute()
            if not proj.data:
                # If project vanished, recreate it
                await client.table('projects').insert({
                    "project_id": project_id,
                    "account_id": account_id,
                    "name": placeholder_name,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }).execute()
                await self._create_sandbox_for_project(project_id)
            else:
                if proj.data.get('account_id') != account_id:
                    raise ValueError("Project account mismatch for trigger execution")
                # Ensure sandbox exists
                if not isinstance(proj.data.get('sandbox'), dict) or not proj.data['sandbox']:
                    await self._create_sandbox_for_project(project_id)
        
        await client.table('threads').insert({
            "thread_id": thread_id,
            "project_id": project_id,
            "account_id": account_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        logger.info(f"Created agent session: project={project_id}, thread={thread_id}")
        return thread_id, project_id
    
    async def create_workflow_session(
        self,
        account_id: str,
        workflow_id: str,
        workflow_name: str
    ) -> Tuple[str, str]:
        client = await self._db.client
        
        project_id = str(uuid.uuid4())
        thread_id = str(uuid.uuid4())
        
        await client.table('projects').insert({
            "project_id": project_id,
            "account_id": account_id,
            "name": f"Workflow: {workflow_name}",
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        
        await self._create_sandbox_for_project(project_id)
        
        await client.table('threads').insert({
            "thread_id": thread_id,
            "project_id": project_id,
            "account_id": account_id,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "metadata": {
                "workflow_execution": True,
                "workflow_id": workflow_id,
                "workflow_name": workflow_name
            }
        }).execute()
        
        logger.info(f"Created workflow session: project={project_id}, thread={thread_id}")
        return thread_id, project_id
    
    async def _create_sandbox_for_project(self, project_id: str) -> None:
        client = await self._db.client
        
        try:
            from sandbox.sandbox import create_sandbox, delete_sandbox
            
            sandbox_pass = str(uuid.uuid4())
            sandbox = await create_sandbox(sandbox_pass, project_id)
            sandbox_id = sandbox.id
            
            vnc_link = await sandbox.get_preview_link(6080)
            website_link = await sandbox.get_preview_link(8080)
            vnc_url = self._extract_url(vnc_link)
            website_url = self._extract_url(website_link)
            token = self._extract_token(vnc_link)
            
            update_result = await client.table('projects').update({
                'sandbox': {
                    'id': sandbox_id,
                    'pass': sandbox_pass,
                    'vnc_preview': vnc_url,
                    'sandbox_url': website_url,
                    'token': token
                }
            }).eq('project_id', project_id).execute()
            
            if not update_result.data:
                await delete_sandbox(sandbox_id)
                raise Exception("Database update failed")
                
        except Exception as e:
            await client.table('projects').delete().eq('project_id', project_id).execute()
            raise Exception(f"Failed to create sandbox: {str(e)}")
    
    def _extract_url(self, link) -> str:
        if hasattr(link, 'url'):
            return link.url
        return str(link).split("url='")[1].split("'")[0]
    
    def _extract_token(self, link) -> str:
        if hasattr(link, 'token'):
            return link.token
        if "token='" in str(link):
            return str(link).split("token='")[1].split("'")[0]
        return None


class AgentExecutor:

    def __init__(self, db_connection: DBConnection, session_manager: SessionManager):
        self._db = db_connection
        self._session_manager = session_manager
    
    async def execute_agent(
        self,
        agent_id: str,
        trigger_result: TriggerResult,
        trigger_event: TriggerEvent
    ) -> Dict[str, Any]:
        logger.info(f"AgentExecutor.execute_agent called for agent_id={agent_id}")
        try:
            agent_config = await self._get_agent_config(agent_id)
            if not agent_config:
                logger.error(f"Agent {agent_id} not found")
                raise ValueError(f"Agent {agent_id} not found")
            logger.info(f"Agent config retrieved for {agent_id}")
            
            thread_id, project_id = await self._session_manager.create_agent_session(
                agent_id, agent_config, trigger_event, existing_project_id=trigger_result.project_id
            )
            
            # Build execution variables, ensuring allowed_tools is propagated and explicit
            exec_vars = dict(trigger_result.execution_variables or {})
            if getattr(trigger_result, 'execution_recipe', None):
                exec_vars["execution_recipe"] = trigger_result.execution_recipe
            if getattr(trigger_result, 'allowed_tools', None):
                exec_vars["allowed_tools"] = trigger_result.allowed_tools
            if getattr(trigger_result, 'setup_readme', None):
                exec_vars["setup_readme"] = trigger_result.setup_readme

            await self._create_initial_message(
                thread_id, trigger_result.agent_prompt, exec_vars
            )
            
            # Inject allowed_tools/setup_readme into agent_config for runtime tool filtering and workspace hints
            enhanced_config = agent_config.copy()
            try:
                if isinstance(trigger_result.execution_variables, dict):
                    if 'allowed_tools' in trigger_result.execution_variables:
                        enhanced_config['allowed_tools'] = trigger_result.execution_variables.get('allowed_tools')
                    if 'setup_readme' in trigger_result.execution_variables:
                        enhanced_config['setup_readme'] = trigger_result.execution_variables.get('setup_readme')
            except Exception:
                pass

            # Prefer list_available_tools and scoped tools during trigger executions
            enhanced_config['prefer_list_available_tools'] = True

            agent_run_id = await self._start_agent_execution(
                thread_id, project_id, enhanced_config, trigger_result.execution_variables
            )
            
            return {
                "success": True,
                "thread_id": thread_id,
                "agent_run_id": agent_run_id,
                "message": "Agent execution started successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to execute agent {agent_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to start agent execution"
            }
    
    async def _get_agent_config(self, agent_id: str) -> Dict[str, Any]:
        from agent.versioning.domain.entities import AgentId
        from agent.versioning.infrastructure.dependencies import set_db_connection, get_container
        
        set_db_connection(self._db)
        
        try:
            client = await self._db.client
            agent_result = await client.table('agents').select('account_id, name').eq('agent_id', agent_id).execute()
            if not agent_result.data:
                return None
            
            agent_data = agent_result.data[0]
            
            container = get_container()
            version_service = await container.get_version_service()
            agent_id_obj = AgentId.from_string(agent_id)
            
            active_version = await version_service.version_repo.find_active_version(agent_id_obj)
            if not active_version:
                return {
                    'agent_id': agent_id,
                    'account_id': agent_data.get('account_id'),
                    'name': agent_data.get('name', 'Unknown Agent'),
                    'system_prompt': 'You are a helpful AI assistant.',
                    'configured_mcps': [],
                    'custom_mcps': [],
                    'agentpress_tools': {},
                }
            
            config = {
                'agent_id': agent_id,
                'account_id': agent_data.get('account_id'),
                'name': agent_data.get('name', 'Unknown Agent'),
                'system_prompt': active_version.system_prompt.value,
                'configured_mcps': [
                    {
                        'name': mcp.name,
                        'type': mcp.type,
                        'config': mcp.config,
                        'enabledTools': mcp.enabled_tools
                    }
                    for mcp in active_version.configured_mcps
                ],
                'custom_mcps': [
                    {
                        'name': mcp.name,
                        'type': mcp.type,
                        'config': mcp.config,
                        'enabledTools': mcp.enabled_tools
                    }
                    for mcp in active_version.custom_mcps
                ],
                'agentpress_tools': active_version.tool_configuration.tools,
                'current_version_id': str(active_version.version_id),
                'version_name': active_version.version_name
            }
            
            logger.info(f"Agent config loaded - MCPs: {len(config['configured_mcps'])} configured, {len(config['custom_mcps'])} custom")
            for custom_mcp in config['custom_mcps']:
                logger.info(f"  Custom MCP: {custom_mcp['name']} - Type: {custom_mcp['type']}")
            
            return config
            
        except Exception as e:
            logger.warning(f"Failed to get agent config using versioning system: {e}")
            return None
    
    async def _create_initial_message(
        self, 
        thread_id: str, 
        prompt: str, 
        trigger_data: Dict[str, Any]
    ) -> None:
        logger.info(f"Creating initial message for thread {thread_id} with prompt: {prompt[:100]}...")
        client = await self._db.client
        
        # Render placeholders {var} in the prompt using trigger_data variables
        def _render_placeholders(text: str, variables: Dict[str, Any]) -> str:
            try:
                if not isinstance(text, str) or not variables:
                    return text
                pattern = re.compile(r"\{([a-zA-Z0-9_]+)\}")

                def repl(match: re.Match[str]) -> str:
                    key = match.group(1)
                    if key in variables:
                        try:
                            val = variables[key]
                            return str(val)
                        except Exception:
                            return match.group(0)
                    return match.group(0)

                return pattern.sub(repl, text)
            except Exception:
                return text

        # Structured initial message for executor (DO FIRST + ALLOWED TOOLS + RECIPE + RULES)
        try:
            task_objective = _render_placeholders(prompt, trigger_data or {}) or "Execute the automation task."
        except Exception:
            task_objective = prompt or "Execute the automation task."

        # Allowed tools list
        allowed_list = []
        try:
            maybe_allowed = (trigger_data or {}).get('allowed_tools') or []
            if isinstance(maybe_allowed, list):
                allowed_list = [str(x) for x in maybe_allowed]
        except Exception:
            allowed_list = []

        # Recipe JSON (minified), if present
        recipe_text = ""
        try:
            recipe = (trigger_data or {}).get('execution_recipe')
            if recipe:
                import json as _json
                recipe_text = _json.dumps(recipe, separators=(',', ':'))
        except Exception:
            recipe_text = ""

        # DO THIS FIRST checklist
        do_first_lines = []
        do_first_lines.append("1) Se existir README.md no workspace, LEIA e EXECUTE exatamente o que ele instruir (não recrie arquivos ou scripts).")
        do_first_lines.append("2) Caso não haja README.md aplicável, chame imediatamente list_available_tools e verifique as ferramentas habilitadas.")
        if allowed_list:
            do_first_lines.append(f"3) Use SOMENTE estas ferramentas nesta execução: {', '.join(allowed_list)}.")
        else:
            do_first_lines.append("3) Use apenas ferramentas habilitadas para este agente nesta execução.")
        do_first_lines.append("4) Se a ferramenta necessária ou credencial estiver ausente, PARE e reporte 'missing tool/credential' — não tente workarounds.")
        # Generic credential selection flow for any MCP integration (provider:tool)
        do_first_lines.append(
            "5) Ao usar ferramentas qualificadas no formato 'provider:tool' (por ex.: provider:send_email), resolva a conta assim:"
        )
        do_first_lines.append(
            "   - 5.1) Descubra o provider a partir do prefixo antes de ':' e chame get_credential_profiles com esse provider"
        )
        do_first_lines.append(
            "   - 5.2) Se houver vários perfis conectados, prefira o marcado/configurado para este agente; caso contrário, escolha o primeiro com status=connected"
        )
        do_first_lines.append(
            "   - 5.3) Valide com check_profile_connection(profile_id) e garanta configure_profile_for_agent(profile_id) (idempotente)"
        )
        do_first_lines.append(
            "   - 5.4) Ao chamar a ferramenta do provider, se ela aceitar 'profile_id' nos argumentos, inclua-o explicitamente"
        )

        rules_lines = [
            "- Nunca use list_mcp_tools; SEMPRE use list_available_tools para descobrir ferramentas.",
            "- Ao inspecionar arquivos, não modifique: prefira 'execute_command: cat <file>' ou 'ls -la'.",
            "- Nunca crie arquivos de teste/placeholder (ex.: test_readme.txt).",
            "- Nunca peça chaves API nem oriente edição de arquivos com segredos; use perfis de credencial. Se faltar integração/credencial, pare e reporte.",
            "- Execute de forma determinística. Evite explorar alternativas quando houver RECIPE ou README."
        ]

        parts = []
        parts.append(f"TASK OBJECTIVE:\n{task_objective}")
        parts.append("\nDO THIS FIRST:")
        parts.append("\n" + "\n".join([f"- {line}" for line in do_first_lines]))
        if allowed_list:
            parts.append(f"\nALLOWED TOOLS (nomes exatos nesta execução): {', '.join(allowed_list)}")
        if recipe_text:
            parts.append(f"\nEXECUTION RECIPE (siga exatamente): {recipe_text}")
        parts.append("\nREGRAS:")
        parts.append("\n" + "\n".join(rules_lines))

        rendered_prompt = "\n".join(parts)
        message_payload = {"role": "user", "content": rendered_prompt}
        
        await client.table('messages').insert({
            "message_id": str(uuid.uuid4()),
            "thread_id": thread_id,
            "type": "user",
            "is_llm_message": True,
            "content": json.dumps(message_payload),
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
        logger.info(f"Initial message created successfully for thread {thread_id}")
    
    async def _start_agent_execution(
        self,
        thread_id: str,
        project_id: str,
        agent_config: Dict[str, Any],
        trigger_variables: Dict[str, Any]
    ) -> str:
        client = await self._db.client
        model_name = "anthropic/claude-sonnet-4-20250514"
        account_id = agent_config.get('account_id')
        
        agent_run = await client.table('agent_runs').insert({
            "thread_id": thread_id,
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "agent_id": agent_config.get('agent_id'),
            "agent_version_id": agent_config.get('current_version_id'),
            "account_id": account_id,
            "metadata": {
                "model_name": model_name,
                "enable_thinking": False,
                "reasoning_effort": "low",
                "enable_context_manager": True,
                "trigger_execution": True,
                "trigger_variables": trigger_variables
            }
        }).execute()
        
        agent_run_id = agent_run.data[0]['id']
        
        await self._register_agent_run(agent_run_id)
        
        # Start agent execution via asyncio in background (no Edge Function)
        logger.info(f"Starting agent execution via asyncio: agent_run_id={agent_run_id}, thread_id={thread_id}")
        try:
            from run_agent_background_simple import run_agent_async
            task = asyncio.create_task(run_agent_async(
                agent_id=agent_config.get('agent_id'),
                agent_run_id=agent_run_id,
                user_id=account_id,
                thread_id=thread_id,
                project_id=project_id,
                account_id=account_id,
                db_ref=self._db,
                instance_id_ref=getattr(config, 'INSTANCE_ID', 'trigger_executor'),
                prompt=None,
                model_name=model_name,
                reasoning_effort='low',
                enable_thinking=False,
                agent_config=agent_config,
                agent_version_id=agent_config.get('current_version_id')
            ))
            if not hasattr(self, '_background_tasks'):
                self._background_tasks = set()
            self._background_tasks.add(task)
            task.add_done_callback(self._background_tasks.discard)
        except Exception as e:
            logger.error(f"Failed to start agent execution: {e}")
            await client.table('agent_runs').update({
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }).eq("id", agent_run_id).execute()
            raise
        
        logger.info(f"Agent execution task created successfully: {agent_run_id}")
        return agent_run_id
    
    async def _register_agent_run(self, agent_run_id: str) -> None:
        try:
            instance_key = f"active_run:trigger_executor:{agent_run_id}"
            await redis.set(instance_key, "running", ex=redis.REDIS_KEY_TTL)
        except Exception as e:
            logger.warning(f"Failed to register agent run in Redis: {e}")


class WorkflowExecutor:
    def __init__(self, db_connection: DBConnection, session_manager: SessionManager):
        self._db = db_connection
        self._session_manager = session_manager
    
    async def execute_workflow(
        self,
        agent_id: str,
        workflow_id: str,
        workflow_input: Dict[str, Any],
        trigger_result: TriggerResult,
        trigger_event: TriggerEvent
    ) -> Dict[str, Any]:
        try:
            workflow_config, steps_json = await self._get_workflow_data(workflow_id, agent_id)
            agent_config, account_id = await self._get_agent_data(agent_id)
            
            enhanced_agent_config = await self._enhance_agent_config_for_workflow(
                agent_config, workflow_config, steps_json, workflow_input
            )
            
            thread_id, project_id = await self._session_manager.create_workflow_session(
                account_id, workflow_id, workflow_config['name']
            )
            
            await self._validate_workflow_execution(account_id)
            
            await self._create_workflow_message(thread_id, workflow_config, workflow_input)
            
            # Decide execution strategy: deterministic steps vs. agent-style
            use_steps_executor = False
            try:
                for step in (steps_json or []):
                    if isinstance(step, dict) and step.get('type') in ['tool', 'condition', 'instruction']:
                        use_steps_executor = True
                        break
            except Exception:
                use_steps_executor = False

            if use_steps_executor:
                agent_run_id = await self._start_workflow_steps_execution(
                    thread_id, project_id, enhanced_agent_config, workflow_id, workflow_input
                )
            else:
                agent_run_id = await self._start_workflow_agent_execution(
                    thread_id, project_id, enhanced_agent_config, workflow_id, workflow_input
                )
            
            return {
                "success": True,
                "thread_id": thread_id,
                "agent_run_id": agent_run_id,
                "message": "Workflow execution started successfully"
            }
            
        except Exception as e:
            logger.error(f"Failed to execute workflow {workflow_id}: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to start workflow execution"
            }
    
    async def _get_workflow_data(self, workflow_id: str, agent_id: str) -> Tuple[Dict[str, Any], list]:
        client = await self._db.client
        
        logger.info(f"Validating workflow reference", 
                   workflow_id=workflow_id, 
                   agent_id=agent_id, 
                   operation="workflow_validation")
        
        workflow_result = await client.table('agent_workflows').select('*').eq('id', workflow_id).eq('agent_id', agent_id).execute()
        
        if not workflow_result.data:
            # LOGGING DETALHADO do problema de referência quebrada
            logger.error(f"Workflow validation failed - workflow not found", 
                        workflow_id=workflow_id,
                        agent_id=agent_id,
                        error_type="workflow_not_found",
                        operation="workflow_validation")
            
            # Lançar exceção específica que será tratada pelo ExecutionService
            raise WorkflowNotFoundError(
                f"Workflow {workflow_id} not found for agent {agent_id}",
                workflow_id=workflow_id,
                agent_id=agent_id
            )
        
        workflow_config = workflow_result.data[0]
        
        # Validar se workflow está ativo
        if workflow_config['status'] != 'active':
            logger.error(f"Workflow validation failed - workflow not active", 
                        workflow_id=workflow_id,
                        agent_id=agent_id,
                        workflow_status=workflow_config['status'],
                        error_type="workflow_not_active",
                        operation="workflow_validation")
            
            raise WorkflowNotFoundError(
                f"Workflow {workflow_id} is not active (status: {workflow_config['status']})",
                workflow_id=workflow_id,
                agent_id=agent_id
            )
        
        logger.info(f"Workflow validation successful", 
                   workflow_id=workflow_id, 
                   agent_id=agent_id,
                   workflow_name=workflow_config.get('name', 'Unknown'),
                   operation="workflow_validation")
        
        steps_json = workflow_config.get('steps', [])
        return workflow_config, steps_json
    
    async def _get_agent_data(self, agent_id: str) -> Tuple[Dict[str, Any], str]:
        from agent.versioning.domain.entities import AgentId
        from agent.versioning.infrastructure.dependencies import set_db_connection, get_container
        
        set_db_connection(self._db)
        
        try:
            client = await self._db.client
            agent_result = await client.table('agents').select('account_id, name').eq('agent_id', agent_id).execute()
            if not agent_result.data:
                raise ValueError(f"Agent {agent_id} not found")
            
            agent_data = agent_result.data[0]
            account_id = agent_data['account_id']
            
            container = get_container()
            version_service = await container.get_version_service()
            agent_id_obj = AgentId.from_string(agent_id)
            
            active_version = await version_service.version_repo.find_active_version(agent_id_obj)
            if not active_version:
                raise ValueError(f"No active version found for agent {agent_id}")
            
            # Defensive: garantir system_prompt string não vazia
            try:
                _sys_prompt = getattr(active_version.system_prompt, 'value', None)
                if not _sys_prompt or not str(_sys_prompt).strip():
                    _sys_prompt = 'You are a helpful AI assistant.'
            except Exception:
                _sys_prompt = 'You are a helpful AI assistant.'

            agent_config = {
                'agent_id': agent_id,
                'name': agent_data.get('name', 'Unknown Agent'),
                'system_prompt': _sys_prompt,
                'configured_mcps': [
                    {
                        'name': mcp.name,
                        'type': mcp.type,
                        'config': mcp.config,
                        'enabledTools': mcp.enabled_tools
                    }
                    for mcp in active_version.configured_mcps
                ],
                'custom_mcps': [
                    {
                        'name': mcp.name,
                        'type': mcp.type,
                        'config': mcp.config,
                        'enabledTools': mcp.enabled_tools
                    }
                    for mcp in active_version.custom_mcps
                ],
                'agentpress_tools': active_version.tool_configuration.tools if isinstance(active_version.tool_configuration.tools, dict) else {},
                'current_version_id': str(active_version.version_id),
                'version_name': active_version.version_name
            }
            
            return agent_config, account_id
            
        except Exception as e:
            raise ValueError(f"Failed to get agent configuration: {str(e)}")
    
    async def _enhance_agent_config_for_workflow(
        self,
        agent_config: Dict[str, Any],
        workflow_config: Dict[str, Any],
        steps_json: list,
        workflow_input: Dict[str, Any]
    ) -> Dict[str, Any]:
        available_tools = self._get_available_tools(agent_config)
        workflow_prompt = format_workflow_for_llm(
            workflow_config=workflow_config,
            steps=steps_json,
            input_data=workflow_input,
            available_tools=available_tools
        )
        
        enhanced_config = agent_config.copy()
        enhanced_config['system_prompt'] = f"""{agent_config.get('system_prompt', 'You are a helpful AI assistant.')}

--- WORKFLOW EXECUTION MODE ---
{workflow_prompt}"""
        
        # Ensure account_id is present (required for billing and MCP initialization)
        if 'account_id' not in enhanced_config:
            client = await self._db.client
            agent_result = await client.table('agents').select('account_id').eq('agent_id', agent_config.get('agent_id')).execute()
            if agent_result.data:
                enhanced_config['account_id'] = agent_result.data[0]['account_id']
                logger.info(f"Added account_id to enhanced config: {enhanced_config['account_id']}")
        
        logger.info(f"Enhanced agent config for workflow execution",
                   has_mcps=bool(enhanced_config.get('configured_mcps') or enhanced_config.get('custom_mcps')),
                   configured_mcps_count=len(enhanced_config.get('configured_mcps', [])),
                   custom_mcps_count=len(enhanced_config.get('custom_mcps', [])),
                   has_account_id=bool(enhanced_config.get('account_id')))

        # Warmup MCP (non-blocking, short timeout) to reduce simulated sends
        try:
            async def _warmup():
                try:
                    # initialize tools quickly; ignore errors
                    await asyncio.wait_for(self._workflow_executor._initialize_tools(enhanced_config, thread_id="warmup", project_id="warmup", user_id=enhanced_config.get('account_id','')), timeout=5.0)
                except Exception:
                    pass
            # schedule without blocking
            asyncio.create_task(_warmup())
        except Exception:
            pass
        
        return enhanced_config
    
    def _get_available_tools(self, agent_config: Dict[str, Any]) -> list:
        available_tools = []
        agentpress_tools = agent_config.get('agentpress_tools', {})
        
        # Log for debugging
        logger.debug(f"agentpress_tools type: {type(agentpress_tools)}, value: {agentpress_tools}")
        
        # Ensure agentpress_tools is a dictionary
        if not isinstance(agentpress_tools, dict):
            logger.warning(f"agentpress_tools is not a dict, it's {type(agentpress_tools)}: {agentpress_tools}")
            agentpress_tools = {}
        
        tool_mapping = {
            'sb_shell_tool': ['execute_command'],
            'sb_files_tool': ['create_file', 'str_replace', 'full_file_rewrite', 'delete_file'],
            'sb_browser_tool': ['browser_navigate_to', 'browser_take_screenshot'],
            'sb_vision_tool': ['see_image'],
            'sb_deploy_tool': ['deploy'],
            'sb_expose_tool': ['expose_port'],
            'web_search_tool': ['web_search'],
            'data_providers_tool': ['get_data_provider_endpoints', 'execute_data_provider_call']
        }
        
        for tool_key, tool_names in tool_mapping.items():
            tool_config = agentpress_tools.get(tool_key, {})
            # Check if tool_config is a dict before calling .get()
            if isinstance(tool_config, dict) and tool_config.get('enabled', False):
                available_tools.extend(tool_names)
            elif tool_config is True:  # Handle case where tool is just a boolean
                available_tools.extend(tool_names)
        
        all_mcps = []
        if agent_config.get('configured_mcps'):
            all_mcps.extend(agent_config['configured_mcps'])
        if agent_config.get('custom_mcps'):
            all_mcps.extend(agent_config['custom_mcps'])
        
        for mcp in all_mcps:
            enabled_tools_list = mcp.get('enabledTools', [])
            available_tools.extend(enabled_tools_list)
        
        return available_tools
    
    async def _validate_workflow_execution(self, account_id: str) -> None:
        from services.billing import check_billing_status, can_use_model
        
        logger.debug(f"Validating workflow execution for account: {account_id}")
        
        client = await self._db.client
        model_name = config.MODEL_TO_USE or "claude-sonnet-4-20250514"
        
        # can_use_model returns (bool, str, list) - async function
        logger.debug(f"Checking model access for model: {model_name}")
        model_access_result = await can_use_model(client, account_id, model_name)
        logger.debug(f"Model access result type: {type(model_access_result)}, value: {model_access_result}")
        can_use, model_message, allowed_models = model_access_result
        if not can_use:
            raise Exception(f"Model access denied: {model_message}")
            
        # check_billing_status returns (bool, str, dict)
        logger.debug(f"Checking billing status for account: {account_id}")
        billing_result = await check_billing_status(client, account_id)
        logger.debug(f"Billing result type: {type(billing_result)}, value: {billing_result}")
        can_run, billing_message, subscription_info = billing_result
        if not can_run:
            raise Exception(f"Billing check failed: {billing_message}")
    
    async def _create_workflow_message(
        self,
        thread_id: str,
        workflow_config: Dict[str, Any],
        workflow_input: Dict[str, Any]
    ) -> None:
        client = await self._db.client
        
        message_content = f"Execute workflow: {workflow_config['name']}\n\nInput: {json.dumps(workflow_input) if workflow_input else 'None'}"
        
        await client.table('messages').insert({
            "message_id": str(uuid.uuid4()),
            "thread_id": thread_id,
            "type": "user",
            "is_llm_message": True,
            "content": json.dumps({"role": "user", "content": message_content}),
            "created_at": datetime.now(timezone.utc).isoformat()
        }).execute()
    
    async def _start_workflow_agent_execution(
        self,
        thread_id: str,
        project_id: str,
        agent_config: Dict[str, Any],
        workflow_id: str = None,
        workflow_input: Dict[str, Any] = None
    ) -> str:
        client = await self._db.client
        model_name = config.MODEL_TO_USE or "claude-sonnet-4-20250514"
        
        # Get account_id from thread
        thread_result = await client.table('threads').select('account_id').eq('thread_id', thread_id).execute()
        if not thread_result.data:
            raise ValueError(f"Thread {thread_id} not found")
        account_id = thread_result.data[0]['account_id']
        
        agent_run = await client.table('agent_runs').insert({
            "thread_id": thread_id,
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "agent_id": agent_config.get('agent_id'),
            "agent_version_id": agent_config.get('current_version_id'),
            "account_id": account_id
        }).execute()
        
        agent_run_id = agent_run.data[0]['id']
        
        await self._register_workflow_run(agent_run_id)
        
        # Extract workflow_id and workflow_input from agent_config if not provided
        if not workflow_id:
            workflow_id = agent_config.get('workflow_id')
        if not workflow_input:
            workflow_input = agent_config.get('workflow_input', {})
        
        # IMPORTANTE: Executar workflow como agente normal com system_prompt modificado
        # (seguindo o padrão do Suna original - não usar WorkflowExecutor separado)
        logger.info(f"Starting workflow as agent execution: agent_run_id={agent_run_id}")
        logger.info(f"MCPs configured: {len(agent_config.get('configured_mcps', []))} configured, {len(agent_config.get('custom_mcps', []))} custom")
        
        try:
            # Import the standard agent execution function
            from run_agent_background_simple import run_agent_async
            
            # Create async task for agent execution (with workflow-enhanced system_prompt)
            task = asyncio.create_task(run_agent_async(
                agent_id=agent_config.get('agent_id'),
                agent_run_id=agent_run_id,
                user_id=account_id,
                thread_id=thread_id,
                project_id=project_id,
                account_id=account_id,
                db_ref=self._db,
                instance_id_ref=getattr(config, 'INSTANCE_ID', 'workflow_executor'),
                prompt=None,  # Using system_prompt from agent_config
                model_name=model_name,
                reasoning_effort='medium',
                enable_thinking=False,
                agent_config=agent_config,  # This contains the workflow-enhanced system_prompt
                agent_version_id=agent_config.get('current_version_id')
            ))
            
            # Store task reference to prevent garbage collection
            if not hasattr(self, '_background_tasks'):
                self._background_tasks = set()
            self._background_tasks.add(task)
            task.add_done_callback(self._background_tasks.discard)
            
            logger.info(f"Workflow (as agent) execution task created successfully: {agent_run_id}")
                
        except Exception as e:
            logger.error(f"Failed to start workflow execution: {e}, error_type={type(e).__name__}")
            await client.table('agent_runs').update({
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }).eq("id", agent_run_id).execute()
            raise
        
        logger.info(f"Started workflow agent execution via asyncio: {agent_run_id}")
        return agent_run_id
    
    async def _start_workflow_steps_execution(
        self,
        thread_id: str,
        project_id: str,
        agent_config: Dict[str, Any],
        workflow_id: str,
        workflow_input: Dict[str, Any]
    ) -> str:
        client = await self._db.client
        model_name = config.MODEL_TO_USE or "claude-sonnet-4-20250514"

        # Get account_id from thread
        thread_result = await client.table('threads').select('account_id').eq('thread_id', thread_id).execute()
        if not thread_result.data:
            raise ValueError(f"Thread {thread_id} not found")
        account_id = thread_result.data[0]['account_id']

        # Create agent_run row
        agent_run = await client.table('agent_runs').insert({
            "thread_id": thread_id,
            "status": "running",
            "started_at": datetime.now(timezone.utc).isoformat(),
            "agent_id": agent_config.get('agent_id'),
            "agent_version_id": agent_config.get('current_version_id'),
            "account_id": account_id
        }).execute()

        agent_run_id = agent_run.data[0]['id']

        await self._register_workflow_run(agent_run_id)

        # Run the core workflow executor directly in background
        logger.info(f"Starting deterministic workflow steps execution via asyncio: agent_run_id={agent_run_id}")
        try:
            from run_agent_workflow_direct import run_workflow_direct

            task = asyncio.create_task(run_workflow_direct(
                agent_run_id=agent_run_id,
                thread_id=thread_id,
                project_id=project_id,
                model_name=model_name,
                agent_config=agent_config,
                workflow_id=workflow_id,
                workflow_input=workflow_input,
                instance_id=getattr(config, 'INSTANCE_ID', 'workflow_executor')
            ))

            if not hasattr(self, '_background_tasks'):
                self._background_tasks = set()
            self._background_tasks.add(task)
            task.add_done_callback(self._background_tasks.discard)
        except Exception as e:
            logger.error(f"Failed to start steps workflow execution: {e}, error_type={type(e).__name__}")
            await client.table('agent_runs').update({
                "status": "failed",
                "completed_at": datetime.now(timezone.utc).isoformat(),
                "error": str(e)
            }).eq("id", agent_run_id).execute()
            raise

        logger.info(f"Workflow steps execution task created successfully: {agent_run_id}")
        return agent_run_id

    async def _register_workflow_run(self, agent_run_id: str) -> None:
        try:
            instance_id = getattr(config, 'INSTANCE_ID', 'default')
            instance_key = f"active_run:{instance_id}:{agent_run_id}"
            await redis.set(instance_key, "running", ex=redis.REDIS_KEY_TTL)
        except Exception as e:
            logger.warning(f"Failed to register workflow run in Redis: {e}")


def get_execution_service(db_connection: DBConnection) -> ExecutionService:
    return ExecutionService(db_connection) 