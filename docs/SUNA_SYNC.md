# Suna Sync

Escopo: alinhar Prophet ao layout atual do Suna, sem melhorias próprias.

Checklist (somente upstream):
- [ ] mcp_tool_wrapper.py (overwrite)
- [ ] mcp_search_tool.py (add se faltar)
- [ ] credential_profile_tool.py (overwrite)
- [ ] tool_discovery_tool.py (add)

Procedimento:
1) git checkout upstream/main -- backend/agent/tools/mcp_tool_wrapper.py
2) git checkout upstream/main -- backend/agent/tools/agent_builder_tools/mcp_search_tool.py
3) git checkout upstream/main -- backend/agent/tools/agent_builder_tools/credential_profile_tool.py
4) git checkout upstream/main -- backend/agent/tools/tool_discovery_tool.py

Rollbacks: usar tag prod-setup-2025-10-14 ou git revert.
