

# Plano de Correção - Auditoria Completa EleveFut

## Problemas Encontrados

### 1. CORS incorreto na Edge Function `delete-account` (CRÍTICO)
A função importa `corsHeaders` de `@supabase/supabase-js@2.95.0/cors` mas cria o client com `@supabase/supabase-js@2.89.0`. Essas versões conflitantes podem causar falhas de import no Deno runtime. Além disso, o import do CORS via esm.sh usa uma versão diferente do client principal.

**Correção**: Unificar as versões e usar import consistente.

### 2. Edge Function `determine-game-results` usa API inexistente (CRÍTICO)
Na linha 64, chama `authClient.auth.getClaims(token)` que **não existe** no Supabase JS SDK. Isso causará erro 500 quando chamado via JWT de usuário.

**Correção**: Substituir por `authClient.auth.getUser()`.

### 3. Rota quebrada no Home.tsx (BUG)
Na linha 164, o botão "Criar Partida" navega para `/create-game`, que é uma rota legada que redireciona para `/games` (não para `/create-pelada`). O usuário nunca chega à tela de criação.

**Correção**: Alterar para `/create-pelada`.

### 4. `useSubscription` usa cast `as any` desnecessário (MENOR)
O hook faz `(supabase as any).from('user_subscriptions')` porque o tipo talvez não esteja atualizado. Porém, `user_subscriptions` **já existe** no types.ts gerado, então o `as any` é desnecessário e perde type-safety.

**Correção**: Remover o `as any`.

### 5. NextMatchCard faz queries em cascata (PERFORMANCE)
O componente faz 4 queries sequenciais (memberships → matches com join → count participants → user participation). Pode ser otimizado.

**Correção**: Combinar queries onde possível.

### 6. Trigger `on_profile_created_subscription` pode causar subscription duplicada
O trigger `handle_new_subscription` dispara no INSERT de `profiles`, não no INSERT de `auth.users`. Se um perfil for recriado (edge case), pode falhar com unique constraint em `user_subscriptions`. O trigger deveria usar `ON CONFLICT`.

**Correção**: Atualizar a function para usar `INSERT ... ON CONFLICT DO NOTHING`.

### 7. TrialBanner mostra "trial expirou" para usuários Pro pagos (BUG LÓGICO)
No `useSubscription`, `isPro` só é `true` se `trialActive` for `true`. Isso significa que quando alguém paga pelo Pro mas o trial expira, `isPro` fica `false` e `isFree` fica `true`. Não há distinção entre "Pro pago" e "Pro trial".

**Correção**: Adicionar lógica para Pro pago (sem depender do trial). Requer novo campo `subscription_status` ou ajuste na lógica.

### 8. Console warnings de `forwardRef` no CreatePelada (MENOR)
Warnings no console indicam que componentes Select do Radix UI recebem refs sem suporte. É cosmético, não funcional.

**Correção**: Baixa prioridade, atualização de lib resolveria.

---

## Resumo de Prioridades

| # | Problema | Severidade | Arquivo(s) |
|---|----------|-----------|------------|
| 1 | CORS/versão no `delete-account` | Alta | `supabase/functions/delete-account/index.ts` |
| 2 | API inexistente `getClaims` | Alta | `supabase/functions/determine-game-results/index.ts` |
| 3 | Rota `/create-game` quebrada | Média | `src/pages/Home.tsx` |
| 4 | Cast `as any` no useSubscription | Baixa | `src/hooks/useSubscription.ts` |
| 5 | Queries cascata NextMatchCard | Baixa | `src/components/NextMatchCard.tsx` |
| 6 | Trigger subscription duplicada | Média | Migration SQL |
| 7 | Lógica Pro pago vs trial | Alta | `src/hooks/useSubscription.ts` + migration |
| 8 | Console warnings forwardRef | Baixa | Sem ação necessária |

## Plano de Implementação

1. **Corrigir Edge Functions** (itens 1 e 2) - Unificar imports e corrigir `getClaims`
2. **Corrigir rota Home** (item 3) - Trocar `/create-game` por `/create-pelada`
3. **Corrigir lógica freemium** (item 7) - Adicionar campo `subscription_status` (valores: `trialing`, `active`, `expired`) via migration e ajustar `useSubscription`
4. **Corrigir trigger** (item 6) - Usar `ON CONFLICT DO NOTHING`
5. **Limpar tipo** (item 4) - Remover `as any`

