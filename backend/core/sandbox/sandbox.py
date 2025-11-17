from daytona_sdk import AsyncDaytona, DaytonaConfig, CreateSandboxFromSnapshotParams, AsyncSandbox, SessionExecuteRequest, Resources, SandboxState
from dotenv import load_dotenv
from core.utils.logger import logger
from core.utils.config import config
from core.utils.config import Configuration
import asyncio

load_dotenv()

# logger.debug("Initializing Daytona sandbox configuration")
daytona_config = DaytonaConfig(
    api_key=config.DAYTONA_API_KEY,
    api_url=config.DAYTONA_SERVER_URL, 
    target=config.DAYTONA_TARGET,
)

if daytona_config.api_key:
    logger.debug("Daytona sandbox configured successfully")
else:
    logger.warning("No Daytona API key found in environment variables")

if daytona_config.api_url:
    logger.debug(f"Daytona API URL set to: {daytona_config.api_url}")
else:
    logger.warning("No Daytona API URL found in environment variables")

if daytona_config.target:
    logger.debug(f"Daytona target set to: {daytona_config.target}")
else:
    logger.warning("No Daytona target found in environment variables")

daytona = AsyncDaytona(daytona_config)

async def get_or_start_sandbox(sandbox_id: str) -> AsyncSandbox:
    """Retrieve a sandbox by ID, check its state, and start it if needed."""
    
    logger.info(f"Getting or starting sandbox with ID: {sandbox_id}")

    try:
        sandbox = await daytona.get(sandbox_id)
        
        # Check if sandbox needs to be started
        if sandbox.state in [SandboxState.ARCHIVED, SandboxState.STOPPED, SandboxState.ARCHIVING]:
            logger.info(f"Sandbox is in {sandbox.state} state. Starting...")
            try:
                await daytona.start(sandbox)
                
                # Wait for sandbox to reach STARTED state
                for _ in range(30):
                    await asyncio.sleep(1)
                    sandbox = await daytona.get(sandbox_id)
                    if sandbox.state == SandboxState.STARTED:
                        break
                
                # Start supervisord in a session when restarting
                await start_supervisord_session(sandbox)
            except Exception as e:
                # Handle 409 Conflict errors - sandbox might already be starting
                error_str = str(e).lower()
                if "409" in error_str or "conflict" in error_str:
                    logger.warning(f"Received 409 Conflict when starting sandbox {sandbox_id}. Checking current state...")
                    
                    # Re-check sandbox state - it might already be STARTING or STARTED
                    try:
                        sandbox = await daytona.get(sandbox_id)
                        
                        # If already STARTED, we're good
                        if sandbox.state == SandboxState.STARTED:
                            logger.info(f"Sandbox {sandbox_id} is already STARTED after conflict. Continuing...")
                            await start_supervisord_session(sandbox)
                        # If STARTING, wait for it to complete
                        elif sandbox.state == SandboxState.STARTING:
                            logger.info(f"Sandbox {sandbox_id} is STARTING. Waiting for it to complete...")
                            for _ in range(30):
                                await asyncio.sleep(1)
                                sandbox = await daytona.get(sandbox_id)
                                if sandbox.state == SandboxState.STARTED:
                                    logger.info(f"Sandbox {sandbox_id} reached STARTED state")
                                    await start_supervisord_session(sandbox)
                                    break
                                elif sandbox.state in [SandboxState.ARCHIVED, SandboxState.STOPPED, SandboxState.ARCHIVING]:
                                    # Sandbox failed to start, raise original error
                                    logger.error(f"Sandbox {sandbox_id} failed to start after conflict")
                                    raise e
                        else:
                            # Unexpected state, raise original error
                            logger.error(f"Sandbox {sandbox_id} in unexpected state {sandbox.state} after conflict")
                            raise e
                    except Exception as check_error:
                        # If we can't check the state, raise original error
                        logger.error(f"Error checking sandbox state after conflict: {check_error}")
                        raise e
                else:
                    # Not a 409 error, propagate it
                    logger.error(f"Error starting sandbox: {e}")
                    raise e
        
        logger.info(f"Sandbox {sandbox_id} is ready")
        return sandbox
        
    except Exception as e:
        logger.error(f"Error retrieving or starting sandbox: {str(e)}")
        raise e

async def start_supervisord_session(sandbox: AsyncSandbox):
    """Start supervisord in a session."""
    session_id = "supervisord-session"
    try:
        await sandbox.process.create_session(session_id)
        await sandbox.process.execute_session_command(session_id, SessionExecuteRequest(
            command="exec /usr/bin/supervisord -n -c /etc/supervisor/conf.d/supervisord.conf",
            var_async=True
        ))
        logger.info("Supervisord started successfully")
    except Exception as e:
        # Don't fail if supervisord already running
        logger.warning(f"Could not start supervisord: {str(e)}")

async def create_sandbox(password: str, project_id: str = None) -> AsyncSandbox:
    """Create a new sandbox with all required services configured and running."""
    
    logger.info("Creating new Daytona sandbox environment")
    # logger.debug("Configuring sandbox with snapshot and environment variables")
    
    labels = None
    if project_id:
        # logger.debug(f"Using sandbox_id as label: {project_id}")
        labels = {'id': project_id}
        
    params = CreateSandboxFromSnapshotParams(
        snapshot=Configuration.SANDBOX_SNAPSHOT_NAME,
        public=True,
        labels=labels,
        env_vars={
            "CHROME_PERSISTENT_SESSION": "true",
            "RESOLUTION": "1048x768x24",
            "RESOLUTION_WIDTH": "1048",
            "RESOLUTION_HEIGHT": "768",
            "VNC_PASSWORD": password,
            "ANONYMIZED_TELEMETRY": "false",
            "CHROME_PATH": "",
            "CHROME_USER_DATA": "",
            "CHROME_DEBUGGING_PORT": "9222",
            "CHROME_DEBUGGING_HOST": "localhost",
            "CHROME_CDP": ""
        },
        # resources=Resources(
        #     cpu=2,
        #     memory=4,
        #     disk=5,
        # ),
        auto_stop_interval=15,
        auto_archive_interval=30,
    )
    
    # Create the sandbox
    sandbox = await daytona.create(params)
    logger.info(f"Sandbox created with ID: {sandbox.id}")
    
    # Start supervisord in a session for new sandbox
    await start_supervisord_session(sandbox)
    
    logger.info(f"Sandbox environment successfully initialized")
    return sandbox

async def delete_sandbox(sandbox_id: str) -> bool:
    """Delete a sandbox by its ID."""
    logger.info(f"Deleting sandbox with ID: {sandbox_id}")

    try:
        # Get the sandbox
        sandbox = await daytona.get(sandbox_id)
        
        # Delete the sandbox
        await daytona.delete(sandbox)
        
        logger.info(f"Successfully deleted sandbox {sandbox_id}")
        return True
    except Exception as e:
        logger.error(f"Error deleting sandbox {sandbox_id}: {str(e)}")
        raise e
