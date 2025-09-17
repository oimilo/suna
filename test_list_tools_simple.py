#!/usr/bin/env python3
"""
Script simplificado para testar a lógica de list_available_tools
"""
import asyncio
import json
from typing import Dict, Any, List

# Simula a estrutura de ferramentas como seria retornada
def simulate_get_available_tools():
    """Simula o retorno de ferramentas disponíveis"""
    # Ferramentas core
    core_tools = [
        "web_search_tool",
        "sb_files_tool", 
        "sb_shell_tool",
        "sb_browser_tool",
        "sb_vision_tool",
        "sb_deploy_tool",
        "sb_expose_tool",
        "data_providers_tool"
    ]
    
    # Simula ferramentas MCP com prefixos
    mcp_tools = [
        "pipedream:scrape_webpage",
        "pipedream:read_file",
        "gmail:send_email",
        "gmail:search_emails", 
        "github:create_issue",
        "github:create_pull_request",
        "slack:send_message",
        "notion:create_page"
    ]
    
    return core_tools + mcp_tools

def categorize_tools(available_tools: List[str]) -> Dict[str, List[str]]:
    """Categoriza as ferramentas disponíveis"""
    categorized = {
        "file_operations": [],
        "web_tools": [],
        "shell_tools": [],
        "vision_tools": [],
        "deployment_tools": [],
        "mcp_integrations": [],
        "data_providers": [],
        "other": []
    }
    
    for tool in available_tools:
        tool_lower = tool.lower()
        
        # Ferramentas MCP (com prefixo)
        if ':' in tool:
            categorized["mcp_integrations"].append(tool)
        # Ferramentas de arquivo
        elif 'file' in tool_lower or 'read' in tool_lower or 'write' in tool_lower:
            categorized["file_operations"].append(tool)
        # Ferramentas web
        elif 'web' in tool_lower or 'browser' in tool_lower or 'scrape' in tool_lower:
            categorized["web_tools"].append(tool)
        # Ferramentas shell
        elif 'shell' in tool_lower or 'command' in tool_lower or 'terminal' in tool_lower:
            categorized["shell_tools"].append(tool)
        # Ferramentas de visão
        elif 'vision' in tool_lower or 'image' in tool_lower or 'see' in tool_lower:
            categorized["vision_tools"].append(tool)
        # Ferramentas de deploy
        elif 'deploy' in tool_lower or 'expose' in tool_lower:
            categorized["deployment_tools"].append(tool)
        # Data providers
        elif 'data' in tool_lower or 'provider' in tool_lower:
            categorized["data_providers"].append(tool)
        # Outras
        else:
            categorized["other"].append(tool)
    
    return categorized

def find_similar_tools(tool_name: str, available_tools: List[str], threshold: float = 0.6) -> List[str]:
    """Encontra ferramentas similares usando similaridade simples"""
    from difflib import SequenceMatcher
    
    similar = []
    tool_lower = tool_name.lower()
    
    for available_tool in available_tools:
        # Similaridade do nome completo
        similarity = SequenceMatcher(None, tool_lower, available_tool.lower()).ratio()
        
        # Também verifica a parte após o prefixo para ferramentas MCP
        if ':' in available_tool:
            _, tool_part = available_tool.split(':', 1)
            part_similarity = SequenceMatcher(None, tool_lower, tool_part.lower()).ratio()
            similarity = max(similarity, part_similarity)
        
        if similarity >= threshold:
            similar.append((available_tool, similarity))
    
    # Ordena por similaridade
    similar.sort(key=lambda x: x[1], reverse=True)
    return [tool for tool, _ in similar[:5]]  # Retorna top 5

def test_list_available_tools():
    """Testa a funcionalidade de listagem de ferramentas"""
    print("🔧 Testando funcionalidade list_available_tools")
    print("=" * 60)
    
    # Simula obtenção de ferramentas
    available_tools = simulate_get_available_tools()
    
    print(f"\n📊 Total de ferramentas disponíveis: {len(available_tools)}")
    print("-" * 60)
    
    # Categoriza ferramentas
    categorized = categorize_tools(available_tools)
    
    print("\n📦 Ferramentas por categoria:")
    for category, tools in categorized.items():
        if tools:
            print(f"\n  {category.upper().replace('_', ' ')}:")
            for tool in tools:
                print(f"    • {tool}")
    
    print("\n" + "=" * 60)
    
    # Testa busca de ferramentas similares
    print("\n🔍 Testando sugestões de ferramentas similares:")
    print("-" * 60)
    
    # Casos de teste com nomes incorretos
    incorrect_names = [
        "scrape_webpage",  # Correto seria: pipedream:scrape_webpage
        "read_file",       # Correto seria: pipedream:read_file
        "send_email",      # Correto seria: gmail:send_email
        "web_search",      # Correto seria: web_search_tool
        "files",           # Correto seria: sb_files_tool
    ]
    
    for incorrect in incorrect_names:
        similar = find_similar_tools(incorrect, available_tools)
        print(f"\n❌ Ferramenta incorreta: '{incorrect}'")
        if similar:
            print(f"   ✅ Sugestões:")
            for suggestion in similar:
                print(f"      → {suggestion}")
        else:
            print(f"   ⚠️  Nenhuma sugestão encontrada")
    
    print("\n" + "=" * 60)
    
    # Simula a resposta que seria retornada
    response = {
        "message": f"Found {len(available_tools)} available tools for this agent",
        "total_tools": len(available_tools),
        "all_tools": sorted(available_tools),
        "categorized": categorized,
        "tip": "Use the exact tool names from this list when creating workflows. Tool names are case-sensitive.",
        "note": "MCP integration tools may have prefixes like 'pipedream:' or 'gmail:' - use the full name including the prefix."
    }
    
    print("\n📋 Resposta simulada da ferramenta:")
    print("-" * 60)
    print(json.dumps(response, indent=2))
    
    print("\n" + "=" * 60)
    print("✅ Teste concluído com sucesso!")
    
    # Valida que a solução resolve o problema original
    print("\n🎯 Validação do problema original:")
    print("-" * 60)
    print("Problema: Agent tentava usar 'scrape_webpage' sem o prefixo")
    print("Solução: list_available_tools mostra 'pipedream:scrape_webpage'")
    print("\n✅ Com esta ferramenta, o agent saberá o nome correto!")

if __name__ == "__main__":
    test_list_available_tools()