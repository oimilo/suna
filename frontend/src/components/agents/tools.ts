export const DEFAULT_AGENTPRESS_TOOLS: Record<string, { enabled: boolean; description: string; icon: string; color: string }> = {
    'sb_shell_tool': { enabled: true, description: 'Executa comandos shell em sessões tmux para operações de terminal, ferramentas CLI e gerenciamento de sistema', icon: '💻', color: 'bg-slate-100 dark:bg-slate-800' },
    'sb_files_tool': { enabled: true, description: 'Cria, lê, atualiza e exclui arquivos no espaço de trabalho com gerenciamento completo de arquivos', icon: '📁', color: 'bg-blue-100 dark:bg-blue-800/50' },
    'sb_browser_tool': { enabled: true, description: 'Automação de navegador para navegação web, cliques, preenchimento de formulários e interação com páginas', icon: '🌐', color: 'bg-indigo-100 dark:bg-indigo-800/50' },
    'sb_deploy_tool': { enabled: true, description: 'Implanta aplicações e serviços com capacidades automatizadas de deploy', icon: '🚀', color: 'bg-green-100 dark:bg-green-800/50' },
    'sb_expose_tool': { enabled: true, description: 'Expõe serviços e gerencia portas para acessibilidade de aplicações', icon: '🔌', color: 'bg-orange-100 dark:bg-orange-800/20' },
    'web_search_tool': { enabled: true, description: 'Pesquisa na web usando API Tavily e extrai dados de páginas com Firecrawl para pesquisa', icon: '🔍', color: 'bg-yellow-100 dark:bg-yellow-800/50' },
    'sb_vision_tool': { enabled: true, description: 'Capacidades de visão e processamento de imagem para análise de conteúdo visual', icon: '👁️', color: 'bg-pink-100 dark:bg-pink-800/50' },
    'data_providers_tool': { enabled: true, description: 'Acesso a provedores de dados e APIs externas (requer chave RapidAPI)', icon: '🔗', color: 'bg-cyan-100 dark:bg-cyan-800/50' },
};

export const getToolDisplayName = (toolName: string): string => {
    const displayNames: Record<string, string> = {
      'sb_shell_tool': 'Terminal',
      'sb_files_tool': 'Gerenciador de Arquivos',
      'sb_browser_tool': 'Automação de Navegador',
      'sb_deploy_tool': 'Ferramenta de Deploy',
      'sb_expose_tool': 'Exposição de Portas',
      'web_search_tool': 'Pesquisa na Web',
      'sb_vision_tool': 'Processamento de Imagem',
      'data_providers_tool': 'Provedores de Dados',
    };
    
    return displayNames[toolName] || toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };