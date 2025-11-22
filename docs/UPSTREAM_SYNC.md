# Upstream Sync Playbook

Guia rápido para manter o fork (`oimilo/suna`) alinhado com o repositório oficial (`kortix-ai/suna`). Registre aqui o último commit do upstream que já está integrado para que os próximos sincronismos saibam exatamente de onde continuar.

## Baseline atual

| Data (UTC-3) | Commit upstream | Mensagem |
|--------------|-----------------|----------|
| 2025-11-22   | `5ea542275`     | `Merge pull request #2121 from escapade-mckv/yearly-plans` |

Tudo até o commit acima já foi incorporado no `origin/main`. As diferenças restantes vêm de customizações locais (branding, parser, etc.) e dos commits novos do upstream posteriores à data registrada.

> **Como atualizar esta tabela:** após concluir um sync, substitua a linha por `HEAD` do `upstream/main` que acabou de ser integrado.

## Passo a passo para sincronizar

1. **Buscar o upstream**
   ```bash
   git fetch upstream
   ```

2. **Conferir commits novos desde o baseline**
   ```bash
   # Use o hash anotado acima
   git log --oneline ed70428cc..upstream/main
   ```
   Para um recorte diário:
   ```bash
   git log --pretty=format:"%h %ad %s" --date=iso-local \
     --since="2025-11-22 00:00" --until="2025-11-22 23:59" upstream/main
   ```

3. **Ver diferenças agregadas**
   ```bash
   git diff --stat origin/main upstream/main
   ```
   Para focar só nos commits novos, compare com o baseline:
   ```bash
   git diff --stat ed70428cc upstream/main
   ```

4. **Escolher estratégia**
   - *Cherry-pick* para hotfixes isolados.
   - *Merge* (ou rebase) quando o conjunto é grande e não conflita.

5. **Aplicar e testar**
   - Crie uma branch (`sync/upstream-YYYYMMDD`).
   - Aplique commits selecionados.
   - Rode testes relevantes (lint, backend, frontend).

6. **Atualizar este arquivo**
   - Após mergear no `origin/main`, registre o novo hash do `upstream/main` que ficou coberto.

## Dicas úteis

- Use `git log origin/main..upstream/main` para ver apenas o que falta aplicar.
- Se precisar comparar apenas os ajustes locais, inverta o diff: `git diff --stat upstream/main origin/main`.
- Antes de sincronizar grandes mudanças de billing ou UX, leia o PR original para entender contextos (ex.: `yearly-plans`, `in-app-purchases`).
- Sempre cite a data/hora dos commits importantes na conversa para facilitar auditoria futura.

Manter este arquivo atualizado evita dúvidas sobre “até onde já sincronizamos” e acelera futuros merges com o upstream.

## Customizações locais que devemos preservar

- **Proxy Daytona**: ajustes em `frontend/src/lib/utils/daytona.ts` e correlatos para reconstruir URLs de preview (inclui encoding segmentado e path derivado automaticamente).
- **Parser XML**: fallback para `<function_calls>` incompletos em `backend/core/agentpress/xml_tool_parser.py`, garantindo que `create_file` não quebre quando o streaming corta `</invoke>`.
- **Branding/UI**: alterações visuais da versão Prophet (logos, landing/hero, cores) e landing page custom (`frontend/src/...` + assets em `public/`).
- **Landing Page estática**: `landing_page.html` precisa continuar servindo via nossas rotas (mantemos favicon personalizado e assets).

Ao aplicar diffs do upstream, revise esses arquivos primeiro para evitar sobrescrever personalizações do produto Prophet.

