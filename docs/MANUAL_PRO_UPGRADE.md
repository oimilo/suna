## Manual upgrade para plano Pro

> **TL;DR:** use `upgrade_user_plan.sql`. Basta trocar o bloco `config` e executar no Supabase com a service role.

### Passo a passo (exatamente o que fiz agora)

1. **Descobrir o `account_id`:** abra o modal de usuários no painel admin (`/admin/billing`), copie o UUID que aparece em “User ID”.
2. **Editar `upgrade_user_plan.sql`:**
   - Ajuste `account_id` com o UUID do usuário.
   - Defina `target_tier` (`'tier_6_50'` = Pro mensal, `'tier_2_20'` = Starter, etc.).
   - Coloque a quantidade de créditos no campo `credits_to_grant` (Pro mensal = 50 créditos = US$50).
   - Atualize `ledger_description` para deixar rastreável (ex.: `Manual upgrade for cavallari@...`).
3. **Executar o script:**
   - No Supabase SQL Editor (com a service key) cole o arquivo inteiro.
   - O script garante que exista linha em `credit_accounts`, atualiza `tier`, concede créditos e cria entrada em `credit_ledger`.
4. **Confirmar:**
   - Rode um `SELECT` em `credit_accounts` filtrando pelo `account_id` ou apenas abra novamente o modal admin para ver o Tier atualizado.

### Observações importantes

- Não precisamos mais dos scripts antigos (`grant_pro_vinicius.sql`, etc.). Eles só criavam assinaturas “fake”; o fluxo oficial é atualizar `credit_accounts` com este SQL.
- Se o usuário ainda não existe em `auth.users`, o script vai falhar. Peça para a pessoa fazer login ao menos uma vez e repita o processo.
- `next_credit_grant` fica definido +30 dias por padrão. Ajuste `grant_interval_days` se for dar período maior/menor.

### Extensões

- Para upgrades em lote, duplique o bloco `config` (usando um `UNION ALL`) e rode uma vez só.
- Se quiser reverter para o grátis, basta rodar novamente com `target_tier = 'free'` e `credits_to_grant = 0` (ou usar `credit_ledgers` para subtrair manualmente).

