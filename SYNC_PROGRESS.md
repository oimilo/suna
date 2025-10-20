# Suna Frontend Sync Plan

## Objetivo
- Alinhar o frontend do Prophet com o código mais recente do repositório Suna original, sem quebrar funcionalidades existentes nem o layout atual do Prophet.
- Incorporar as melhorias introduzidas pelo Suna (novos componentes, TipTap, integrações etc.) e reduzir o atrito para futuras atualizações a partir do upstream.

## O que já foi feito
- Rodado `npm run build` / `npm run lint` para mapear avisos e dependências problemáticas.
- Corrigidos os principais avisos de hooks e dependências em páginas/admin (`admin`, `agents`, `settings`, `share`, `legal`) e em utilitários chaves (`use-cached-file`, `useAgentStream`).
- Padronização de chamadas que precisavam de `useMemo`/`useCallback` e troca pontual de `<img>` por `next/image`.
- Revisado `PresentationViewer`, pricing section e fluxos de caching para evitar loops e garantir cleanup adequado.
- Montado inventário das diferenças de dependências e de arquivos vs. `TMP/suna-original`.
- Limpeza completa dos avisos remanescentes do `npm run lint`, incluindo módulos de thread/chat (player moderno, seletor de agentes, tool call side panel, loaders) e handlers de upload/zip.
- Dependências do `frontend/package.json` alinhadas ao upstream (Tiptap, dnd-kit, PostHog, etc.) e `npm install` executado para atualizar o lockfile.
- Stores e utilitários necessários para o editor de documentos portados (`use-editor-store`, `use-document-modal-store`, `model-store`, `document-export`).
- Componentes TipTap do docs agent e tool views relacionados copiados do upstream, incluindo modal especializado e barras de ferramentas.
- Ajustes iniciais em utilitários compartilhados (file viewer, knowledge base uploads, voice recorder, presentation viewer) para compatibilizar com novos módulos.
- Saneado o `AgentKnowledgeBaseManager` com a versão do Suna: restauração dos handlers de upload/zip, auto-refresh dos jobs e fluxo de criação/edição sem duplicações.
- Removidos os avisos de hooks do `PresentationViewer`, com `useCallback`/`useMemo` adequados e build `npm run build` concluindo sem erros.

## Pendências imediatas
- Validar visualmente telas impactadas pelas otimizações (Presentation viewer, pricing).
- Revisar build/UX após ajustes para garantir que não surgiram regressões (thread playback, compartilhamento, file viewer).
- Integrar o editor/visualizador de documentos TipTap ao fluxo existente (uso real do modal, rotas e modais) e validar interação.
- Completar o fluxo de clone de repositórios e os controles da aba “repo” no `AgentKnowledgeBaseManager` para paridade com o upstream.
- Finalizar o polimento do `VoiceRecorder` e `PresentationViewer` após rearranjos (confirmar que o `useEffect` auto-stop e `scrollToCurrentSlide` estão na ordem correta).

## Próximos passos planejados
1. Finalizar integração do Docs Agent (modais, exports, rotas e chamadas da ferramenta) e validar via UI.
2. Portar integrações Composio e demais melhorias de agents.
3. Testes manuais e ajustes de UI após cada bloco portado (agent builder, billing, docs) para garantir paridade visual antes de avançar.
