import type { ElementType } from 'react';
import {
  FileText,
  Terminal,
  ExternalLink,
  FileEdit,
  Search,
  Globe,
  Code,
  MessageSquare,
  Folder,
  FileX,
  CloudUpload,
  Wrench,
  Cog,
  Network,
  FileSearch,
  FilePlus,
  PlugIcon,
  BookOpen,
  MessageCircleQuestion,
  CheckCircle2,
} from 'lucide-react';

// Flag to control whether tool result messages are rendered
export const SHOULD_RENDER_TOOL_RESULTS = false;

// Helper function to safely parse JSON strings from content/metadata
export function safeJsonParse<T>(
  jsonString: string | undefined | null,
  fallback: T,
): T {
  if (!jsonString) {
    return fallback;
  }
  
  try {
    // First attempt: Parse as normal JSON
    const parsed = JSON.parse(jsonString);
    
    // Check if the result is a string that looks like JSON (double-escaped case)
    if (typeof parsed === 'string' && 
        (parsed.startsWith('{') || parsed.startsWith('['))) {
      try {
        // Second attempt: Parse the string result as JSON (handles double-escaped)
        return JSON.parse(parsed) as T;
      } catch (innerError) {
        // If inner parse fails, return the first parse result
        return parsed as unknown as T;
      }
    }
    
    return parsed as T;
  } catch (outerError) {
    // If the input is already an object/array (shouldn't happen but just in case)
    if (typeof jsonString === 'object') {
      return jsonString as T;
    }
    
    // Try one more time in case it's a plain string that should be returned as-is
    if (typeof jsonString === 'string') {
      // Check if it's a string representation of a simple value
      if (jsonString === 'true') return true as unknown as T;
      if (jsonString === 'false') return false as unknown as T;
      if (jsonString === 'null') return null as unknown as T;
      if (!isNaN(Number(jsonString))) return Number(jsonString) as unknown as T;
      
      // Return as string if it doesn't look like JSON
      if (!jsonString.startsWith('{') && !jsonString.startsWith('[')) {
        return jsonString as unknown as T;
      }
    }
    
    // console.warn('Failed to parse JSON string:', jsonString, outerError); // Optional: log errors
    return fallback;
  }
}

// Helper function to get an icon based on tool name
export const getToolIcon = (toolName: string): ElementType => {
  switch (toolName?.toLowerCase()) {
    case 'web-browser-takeover':
    case 'browser-navigate-to':
    case 'browser-click-element':
    case 'browser-input-text':
    case 'browser-scroll-down':
    case 'browser-scroll-up':
    case 'browser-click-coordinates':
    case 'browser-send-keys':
    case 'browser-switch-tab':
    case 'browser-go-back':
    case 'browser-close-tab':
    case 'browser-drag-drop':
    case 'browser-get-dropdown-options':
    case 'browser-select-dropdown-option':
    case 'browser-scroll-to-text':
    case 'browser-wait':
      return Globe;

    // File operations
    case 'create-file':
      return FileEdit;
    case 'str-replace':
      return FileSearch;
    case 'full-file-rewrite':
      return FilePlus;
    case 'read-file':
      return FileText;
    case 'edit-file':
      return FileEdit;

    // Shell commands
    case 'execute-command':
      return Terminal;
    case 'check-command-output':
      return Terminal;
    case 'terminate-command':
      return Terminal;

    // Web operations
    case 'web-search':
      return Search;
    case 'crawl-webpage':
      return Globe;
    case 'scrape-webpage':
        return Globe;

    // API and data operations
    case 'call-data-provider':
      return ExternalLink;
    case 'get-data-provider-endpoints':
      return Network;
    case 'execute-data-provider-call':
      return Network;

    // Code operations
    case 'delete-file':
      return FileX;

    // Deployment
    case 'deploy-site':
      return CloudUpload;

    // Tools and utilities
    case 'execute-code':
      return Code;

    // User interaction
    case 'ask':
      return MessageCircleQuestion;

    // Task completion
    case 'complete':
      return CheckCircle2;

    // MCP tools
    case 'call-mcp-tool':
      return PlugIcon;

    // Default case
    default:
      if (toolName?.startsWith('mcp_')) {
        const parts = toolName.split('_');
        if (parts.length >= 3) {
          const serverName = parts[1];
          const toolNamePart = parts.slice(2).join('_');
          
          // Map specific MCP tools to appropriate icons
          if (toolNamePart.includes('search') || toolNamePart.includes('web')) {
            return Search;
          } else if (toolNamePart.includes('research') || toolNamePart.includes('paper')) {
            return BookOpen;
          } else if (serverName === 'exa') {
            return Search; // Exa is primarily a search service
          }
        }
        return PlugIcon; // Default icon for MCP tools
      }
      
      // Add logging for debugging unhandled tool types
      console.log(
        `[PAGE] Using default icon for unknown tool type: ${toolName}`,
      );
      return Wrench; // Default icon for tools
  }
};

// Helper function to extract a primary parameter from XML/arguments
export const extractPrimaryParam = (
  toolName: string,
  content: string | undefined,
): string | null => {
  if (!content) return null;

  try {
    // Handle browser tools with a prefix check
    if (toolName?.toLowerCase().startsWith('browser-')) {
      // Try to extract URL for navigation
      const urlMatch = content.match(/url=(?:"|')([^"|']+)(?:"|')/);
      if (urlMatch) return urlMatch[1];

      // For other browser operations, extract the goal or action
      const goalMatch = content.match(/goal=(?:"|')([^"|']+)(?:"|')/);
      if (goalMatch) {
        const goal = goalMatch[1];
        return goal.length > 30 ? goal.substring(0, 27) + '...' : goal;
      }

      return null;
    }

    // Special handling for XML content - extract file_path from the actual attributes
    if (content.startsWith('<') && content.includes('>')) {
      const xmlAttrs = content.match(/<[^>]+\s+([^>]+)>/);
      if (xmlAttrs && xmlAttrs[1]) {
        const attrs = xmlAttrs[1].trim();
        const filePathMatch = attrs.match(/file_path=["']([^"']+)["']/);
        if (filePathMatch) {
          return filePathMatch[1].split('/').pop() || filePathMatch[1];
        }

        // Try to get command for execute-command
        if (toolName?.toLowerCase() === 'execute-command') {
          const commandMatch = attrs.match(/(?:command|cmd)=["']([^"']+)["']/);
          if (commandMatch) {
            const cmd = commandMatch[1];
            return cmd.length > 30 ? cmd.substring(0, 27) + '...' : cmd;
          }
        }
      }
    }

    // Simple regex for common parameters - adjust as needed
    let match: RegExpMatchArray | null = null;

    switch (toolName?.toLowerCase()) {
      // File operations
      case 'create-file':
      case 'full-file-rewrite':
      case 'read-file':
      case 'delete-file':
      case 'str-replace':
        // Try to match file_path attribute
        match = content.match(/file_path=(?:"|')([^"|']+)(?:"|')/);
        // Return just the filename part
        return match ? match[1].split('/').pop() || match[1] : null;
      case 'edit-file':
        // Try to match target_file attribute for edit-file
        match = content.match(/target_file=(?:"|')([^"|']+)(?:"|')/);
        // Return just the filename part
        return match ? match[1].split('/').pop() || match[1] : null;

      // Shell commands
      case 'execute-command':
        // Extract command content
        match = content.match(/command=(?:"|')([^"|']+)(?:"|')/);
        if (match) {
          const cmd = match[1];
          return cmd.length > 30 ? cmd.substring(0, 27) + '...' : cmd;
        }
        return null;

      // Web search
      case 'web-search':
        match = content.match(/query=(?:"|')([^"|']+)(?:"|')/);
        return match
          ? match[1].length > 30
            ? match[1].substring(0, 27) + '...'
            : match[1]
          : null;

      // Data provider operations
      case 'call-data-provider':
        match = content.match(/service_name=(?:"|')([^"|']+)(?:"|')/);
        const route = content.match(/route=(?:"|')([^"|']+)(?:"|')/);
        return match && route
          ? `${match[1]}/${route[1]}`
          : match
            ? match[1]
            : null;

      // Deployment
      case 'deploy-site':
        match = content.match(/site_name=(?:"|')([^"|']+)(?:"|')/);
        return match ? match[1] : null;
    }

    return null;
  } catch (e) {
    console.warn('Error parsing tool parameters:', e);
    return null;
  }
};

const TOOL_DISPLAY_NAMES = new Map([
  ['execute-command', 'Executando Comando'],
  ['check-command-output', 'Verificando Saída do Comando'],
  ['terminate-command', 'Terminando Comando'],
  ['list-commands', 'Listando Comandos'],
  
  ['create-file', 'Criando Arquivo'],
  ['delete-file', 'Deletando Arquivo'],
  ['full-file-rewrite', 'Reescrevendo Arquivo'],
  ['str-replace', 'Editando Texto'],
  ['str_replace', 'Editando Texto'],
  ['edit_file', 'Edição de Arquivo IA'],
  
  ['browser-click-element', 'Clicando no Elemento'],
  ['browser-close-tab', 'Fechando Aba'],
  ['browser-drag-drop', 'Arrastando Elemento'],
  ['browser-get-dropdown-options', 'Obtendo Opções'],
  ['browser-go-back', 'Voltando'],
  ['browser-input-text', 'Inserindo Texto'],
  ['browser-navigate-to', 'Navegando para Página'],
  ['browser-scroll-down', 'Rolando para Baixo'],
  ['browser-scroll-to-text', 'Rolando até o Texto'],
  ['browser-scroll-up', 'Rolando para Cima'],
  ['browser-select-dropdown-option', 'Selecionando Opção'],
  ['browser-click-coordinates', 'Clicando nas Coordenadas'],
  ['browser-send-keys', 'Pressionando Teclas'],
  ['browser-switch-tab', 'Mudando de Aba'],
  ['browser-wait', 'Aguardando'],

  ['execute-data-provider-call', 'Chamando provedor de dados'],
  ['execute_data-provider_call', 'Chamando provedor de dados'],
  ['get-data-provider-endpoints', 'Obtendo endpoints'],
  
  ['deploy', 'Fazendo Deploy'],
  ['ask', 'Aguardando Resposta'],
  ['complete', 'Tarefa Concluída'],
  ['crawl-webpage', 'Rastreando Website'],
  ['expose-port', 'Expondo Porta'],
  ['scrape-webpage', 'Extraindo Dados do Website'],
  ['web-search', 'Pesquisando na Web'],
  ['see-image', 'Visualizando Imagem'],
  
  ['call-mcp-tool', 'Ferramenta Externa'],

  ['update-agent', 'Atualizando Agente'],
  ['get-current-agent-config', 'Obtendo Config do Agente'],
  ['search-mcp-servers', 'Pesquisando Servidores MCP'],
  ['get-mcp-server-tools', 'Obtendo Ferramentas do Servidor MCP'],
  ['configure-mcp-server', 'Configurando Servidor MCP'],
  ['get-popular-mcp-servers', 'Obtendo Servidores MCP Populares'],
  ['test-mcp-server-connection', 'Testando Conexão do Servidor MCP'],


  //V2

  ['execute_command', 'Executando Comando'],
  ['check_command_output', 'Verificando Saída do Comando'],
  ['terminate_command', 'Terminando Comando'],
  ['list_commands', 'Listando Comandos'],
  
  ['create_file', 'Criando Arquivo'],
  ['delete_file', 'Deletando Arquivo'],
  ['full_file_rewrite', 'Reescrevendo Arquivo'],
  ['str_replace', 'Editando Texto'],
  ['edit_file', 'Edição de Arquivo IA'],
  
  ['browser_click_element', 'Clicando no Elemento'],
  ['browser_close_tab', 'Fechando Aba'],
  ['browser_drag_drop', 'Arrastando Elemento'],
  ['browser_get_dropdown_options', 'Obtendo Opções'],
  ['browser_go_back', 'Voltando'],
  ['browser_input_text', 'Inserindo Texto'],
  ['browser_navigate_to', 'Navegando para Página'],
  ['browser_scroll_down', 'Rolando para Baixo'],
  ['browser_scroll_to_text', 'Rolando até o Texto'],
  ['browser_scroll_up', 'Rolando para Cima'],
  ['browser_select_dropdown_option', 'Selecionando Opção'],
  ['browser_click_coordinates', 'Clicando nas Coordenadas'],
  ['browser_send_keys', 'Pressionando Teclas'],
  ['browser_switch_tab', 'Mudando de Aba'],
  ['browser_wait', 'Aguardando'],

  ['execute_data_provider_call', 'Chamando provedor de dados'],
  ['get_data_provider_endpoints', 'Obtendo endpoints'],
  
  ['deploy', 'Fazendo Deploy'],
  ['ask', 'Aguardando Resposta'],
  ['complete', 'Tarefa Concluída'],
  ['crawl_webpage', 'Rastreando Website'],
  ['expose_port', 'Expondo Porta'],
  ['scrape_webpage', 'Extraindo Dados do Website'],
  ['web_search', 'Pesquisando na Web'],
  ['see_image', 'Visualizando Imagem'],
  
  ['update_agent', 'Atualizando Agente'],
  ['get_current_agent_config', 'Obtendo Config do Agente'],
  ['search_mcp_servers', 'Pesquisando Servidores MCP'],
  ['get_mcp_server_tools', 'Obtendo Ferramentas do Servidor MCP'],
  ['configure_mcp_server', 'Configurando Servidor MCP'],
  ['get_popular_mcp_servers', 'Obtendo Servidores MCP Populares'],
  ['test_mcp_server_connection', 'Testando Conexão do Servidor MCP'],

  // Agent creation/integration (frontend display)
  ['search-mcp-servers-for-agent', 'Pesquisando Servidores MCP'],
  ['get-mcp-server-details', 'Detalhes do Servidor MCP'],
  ['create-credential-profile-for-agent', 'Criando Perfil de Credencial'],
  ['discover-mcp-tools-for-agent', 'Descobrindo Ferramentas MCP'],
  ['configure-agent-integration', 'Configurando Integração'],
  ['create-agent-scheduled-trigger', 'Criando Agendamento'],
  ['list-agent-scheduled-triggers', 'Listando Agendamentos'],
  ['toggle-agent-scheduled-trigger', 'Alternando Agendamento'],
  ['delete-agent-scheduled-trigger', 'Excluindo Agendamento'],
  ['update-agent-config', 'Atualizando Config do Agente'],
  ['create-new-agent', 'Criando Novo Agente'],
  // underscore aliases
  ['search_mcp_servers_for_agent', 'Pesquisando Servidores MCP'],
  ['get_mcp_server_details', 'Detalhes do Servidor MCP'],
  ['create_credential_profile_for_agent', 'Criando Perfil de Credencial'],
  ['discover_mcp_tools_for_agent', 'Descobrindo Ferramentas MCP'],
  ['configure_agent_integration', 'Configurando Integração'],
  ['create_agent_scheduled_trigger', 'Criando Agendamento'],
  ['list_agent_scheduled_triggers', 'Listando Agendamentos'],
  ['toggle_agent_scheduled_trigger', 'Alternando Agendamento'],
  ['delete_agent_scheduled_trigger', 'Excluindo Agendamento'],
  ['update_agent_config', 'Atualizando Config do Agente'],
  ['create_new_agent', 'Criando Novo Agente'],

]);


const MCP_SERVER_NAMES = new Map([
  ['exa', 'Exa Search'],
  ['github', 'GitHub'],
  ['notion', 'Notion'],
  ['slack', 'Slack'],
  ['filesystem', 'File System'],
  ['memory', 'Memory'],
]);

function formatMCPToolName(serverName: string, toolName: string): string {
  const serverMappings: Record<string, string> = {
    'exa': 'Exa Search',
    'github': 'GitHub',
    'notion': 'Notion', 
    'slack': 'Slack',
    'filesystem': 'File System',
    'memory': 'Memory',
    'anthropic': 'Anthropic',
    'openai': 'OpenAI',
    'composio': 'Composio',
    'langchain': 'LangChain',
    'llamaindex': 'LlamaIndex'
  };
  
  const formattedServerName = serverMappings[serverName.toLowerCase()] || 
    serverName.charAt(0).toUpperCase() + serverName.slice(1);
  
  let formattedToolName = toolName;
  
  if (toolName.includes('-')) {
    formattedToolName = toolName
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  else if (toolName.includes('_')) {
    formattedToolName = toolName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  else if (/[a-z][A-Z]/.test(toolName)) {
    formattedToolName = toolName
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  else {
    formattedToolName = toolName.charAt(0).toUpperCase() + toolName.slice(1);
  }
  
  return `${formattedServerName}: ${formattedToolName}`;
}

export function getUserFriendlyToolName(toolName: string): string {
  if (toolName.startsWith('mcp_')) {
    const parts = toolName.split('_');
    if (parts.length >= 3) {
      const serverName = parts[1];
      const toolNamePart = parts.slice(2).join('_');
      return formatMCPToolName(serverName, toolNamePart);
    }
  }
  if (toolName.includes('-') && !TOOL_DISPLAY_NAMES.has(toolName)) {
    const parts = toolName.split('-');
    if (parts.length >= 2) {
      const serverName = parts[0];
      const toolNamePart = parts.slice(1).join('-');
      return formatMCPToolName(serverName, toolNamePart);
    }
  }
  return TOOL_DISPLAY_NAMES.get(toolName) || toolName;
}
