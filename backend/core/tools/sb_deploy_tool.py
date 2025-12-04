"""
Cloudflare Pages Deploy Tool

Deploys static websites from sandbox to Cloudflare Pages for permanent hosting.
Resurrected from commit 538389797 and adapted to new tool system.
"""

import shlex

from core.agentpress.tool import ToolResult, openapi_schema, tool_metadata
from core.sandbox.tool_base import SandboxToolsBase
from core.agentpress.thread_manager import ThreadManager
from core.utils.config import config
from core.utils.logger import logger
from core.utils.ssl_checker import wait_for_ssl_ready


@tool_metadata(
    display_name="Website Deploy",
    description="Deploy static websites to Cloudflare Pages for permanent hosting",
    icon="Globe",
    color="bg-orange-100 dark:bg-orange-800/50",
    weight=130,
    visible=True
)
class SandboxDeployTool(SandboxToolsBase):
    """Tool for deploying static websites from a sandbox to Cloudflare Pages."""

    def __init__(self, project_id: str, thread_manager: ThreadManager):
        super().__init__(project_id, thread_manager)

    @openapi_schema({
        "type": "function",
        "function": {
            "name": "deploy_website",
            "description": "Deploy a static website (HTML+CSS+JS) from a directory in the sandbox to Cloudflare Pages for permanent hosting. Use this when the user needs a permanent URL that won't expire (unlike sandbox preview URLs). The website will be deployed to a .pages.dev domain.",
            "parameters": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string",
                        "description": "Name for the deployment. Will be used in the URL. Use lowercase letters, numbers, and hyphens only. Example: 'my-portfolio' becomes 'my-portfolio-abc123.pages.dev'"
                    },
                    "directory_path": {
                        "type": "string",
                        "description": "Path to the directory containing the static website files to deploy, relative to /workspace. Examples: 'build', 'dist', 'public', or '.' for root"
                    }
                },
                "required": ["name", "directory_path"]
            }
        }
    })
    async def deploy_website(self, name: str, directory_path: str) -> ToolResult:
        """
        Deploy a static website from the sandbox to Cloudflare Pages.
        
        Args:
            name: Name for the deployment (used in URL)
            directory_path: Path to the directory to deploy, relative to /workspace
            
        Returns:
            ToolResult with deployment URL or error message
        """
        try:
            # Check if Cloudflare API token is configured
            cloudflare_token = config.CLOUDFLARE_API_TOKEN
            if not cloudflare_token:
                return self.fail_response(
                    "Cloudflare Pages deployment is not configured. "
                    "The CLOUDFLARE_API_TOKEN environment variable is not set. "
                    "Please contact the administrator to enable this feature, "
                    "or use the expose_port tool for temporary preview URLs."
                )

            # Ensure sandbox is initialized
            await self._ensure_sandbox()
            
            # Clean and validate the directory path
            directory_path = self.clean_path(directory_path)
            full_path = f"{self.workspace_path}/{directory_path}"
            
            # Verify the directory exists
            try:
                dir_info = await self.sandbox.fs.get_file_info(full_path)
                if not dir_info.is_dir:
                    return self.fail_response(f"'{directory_path}' is not a directory. Please provide a path to a directory containing your website files.")
            except Exception as e:
                return self.fail_response(f"Directory '{directory_path}' does not exist. Please create the directory with your website files first.")
            
            # Check if directory has files
            try:
                files = await self.sandbox.fs.list_dir(full_path)
                if not files:
                    return self.fail_response(f"Directory '{directory_path}' is empty. Please add your website files (at least index.html) before deploying.")
            except Exception as e:
                logger.warning(f"Could not list directory contents: {e}")
            
            # Sanitize the project name
            import re
            sanitized_name = re.sub(r'[^a-z0-9-]', '-', name.lower())
            sanitized_name = re.sub(r'-+', '-', sanitized_name).strip('-')
            if not sanitized_name:
                sanitized_name = "website"
            
            # Create unique project name using sandbox ID prefix
            project_name = f"{self.sandbox_id[:8]}-{sanitized_name}"
            
            logger.info(
                "Starting Cloudflare Pages deployment",
                project_name=project_name,
                directory=directory_path,
                sandbox_id=self.sandbox_id
            )
            
            # Deploy to Cloudflare Pages using wrangler
            # First try to deploy (creates project if it doesn't exist in newer wrangler versions)
            # If that fails, explicitly create the project first
            # Use shlex.quote() to prevent shell injection attacks
            safe_workspace = shlex.quote(self.workspace_path)
            safe_token = shlex.quote(cloudflare_token)
            safe_path = shlex.quote(full_path)
            safe_project = shlex.quote(project_name)
            
            deploy_cmd = f'''cd {safe_workspace} && \\
                export CLOUDFLARE_API_TOKEN={safe_token} && \\
                (npx wrangler@latest pages deploy {safe_path} --project-name {safe_project} 2>&1 || \\
                (npx wrangler@latest pages project create {safe_project} --production-branch production 2>&1 && \\
                npx wrangler@latest pages deploy {safe_path} --project-name {safe_project} 2>&1))'''

            # Execute the deployment command with longer timeout
            response = await self.sandbox.process.exec(
                f"/bin/sh -c {shlex.quote(deploy_cmd)}",
                timeout=300  # 5 minutes timeout for deployment
            )
            
            logger.info(
                "Cloudflare deployment command completed",
                exit_code=response.exit_code,
                output_length=len(response.result) if response.result else 0
            )
            
            if response.exit_code == 0:
                # Try to extract the URL from the output
                output = response.result or ""
                
                # Look for the deployment URL in various formats
                import re
                url_patterns = [
                    r'https://[a-z0-9-]+\.pages\.dev',
                    r'https://[a-z0-9-]+\.[a-z0-9-]+\.pages\.dev',
                ]
                
                deployed_url = None
                for pattern in url_patterns:
                    match = re.search(pattern, output)
                    if match:
                        deployed_url = match.group(0)
                        break
                
                if not deployed_url:
                    # Construct expected URL
                    deployed_url = f"https://{project_name}.pages.dev"
                
                success_msg = f"""✅ **Website deployed successfully!**

🌐 **Live URL:** {deployed_url}

📋 **Details:**
- Project: `{project_name}`
- Source: `{directory_path}`

💡 **Note:** This URL is permanent and won't expire. You can update the site by running deploy again with the same name."""

                logger.info(
                    "Cloudflare deployment successful",
                    project_name=project_name,
                    url=deployed_url
                )
                
                # Aguarda SSL estar provisionado antes de retornar (evita ERR_SSL_VERSION_OR_CIPHER_MISMATCH)
                await wait_for_ssl_ready(deployed_url)
                
                return self.success_response({
                    "message": success_msg,
                    "url": deployed_url,
                    "project_name": project_name,
                    "directory": directory_path
                })
            else:
                error_output = response.result or "Unknown error"
                
                # Check for common errors and provide helpful messages
                if "not authenticated" in error_output.lower() or "invalid token" in error_output.lower():
                    error_msg = "Authentication failed. The Cloudflare API token may be invalid or expired."
                elif "already exists" in error_output.lower():
                    error_msg = f"A project with name '{project_name}' already exists. Try a different name."
                elif "rate limit" in error_output.lower():
                    error_msg = "Cloudflare rate limit exceeded. Please try again in a few minutes."
                else:
                    error_msg = f"Deployment failed: {error_output[:500]}"
                
                logger.error(
                    "Cloudflare deployment failed",
                    project_name=project_name,
                    exit_code=response.exit_code,
                    error=error_output[:500]
                )
                
                return self.fail_response(error_msg)
                
        except Exception as e:
            logger.error(
                "Error during website deployment",
                error=str(e),
                sandbox_id=self.sandbox_id
            )
            return self.fail_response(f"Error deploying website: {str(e)}")
