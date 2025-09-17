# Guia de Correção de Contas Suna + Basejump

## O Problema

O Suna foi projetado para usar `user_id` diretamente como `account_id` para contas pessoais. Porém, o Basejump por padrão cria IDs diferentes, causando problemas de foreign key e dados divididos entre múltiplas contas.

## A Solução

Modificamos o Basejump para criar contas pessoais onde `account_id = user_id`. Isso garante que:

1. Não há confusão entre IDs
2. O código do Suna funciona sem modificações
3. Queries são mais simples e eficientes
4. Não há problemas de foreign key

## Passos para Implementar

### 1. Para Instalação Nova

Se você está instalando o Suna do zero:

1. Execute as migrações do Supabase normalmente
2. O trigger do Basejump já está configurado corretamente no arquivo de migração
3. Novos usuários terão `account_id = user_id` automaticamente

### 2. Para Corrigir Instalação Existente

Se você já tem usuários com contas incorretas:

```sql
-- Execute o script reset_all_accounts.sql no Supabase SQL Editor
-- ATENÇÃO: Isso deletará todos os dados!
```

Ou use o script `fix_basejump_accounts.sql` para corrigir sem perder dados.

### 3. Verificar se Está Correto

Execute esta query para verificar:

```sql
SELECT 
    u.email,
    u.id as user_id,
    a.id as account_id,
    CASE WHEN u.id = a.id THEN '✓ OK' ELSE '✗ ERRO' END as status
FROM auth.users u
LEFT JOIN basejump.account_user au ON au.user_id = u.id
LEFT JOIN basejump.accounts a ON a.id = au.account_id
WHERE a.personal_account = true;
```

Todos devem mostrar "✓ OK".

## Como Funciona

1. **Trigger do Basejump**: Modificado para criar contas com `id = NEW.id` (user_id)
2. **Backend**: Sempre usa `user_id` como `account_id` (via `get_account_id_from_user_id`)
3. **Frontend**: Usa `user.id` diretamente para queries de `account_id`

## Benefícios

- ✅ Sem lookups complexos de account_id
- ✅ Sem problemas de foreign key
- ✅ Código mais simples e direto
- ✅ Performance melhor
- ✅ Compatível com design original do Suna

## Importante

**NÃO tente "corrigir" isso para usar IDs separados!** O Suna foi projetado para funcionar desta forma. Tentar separar os IDs só causará problemas.