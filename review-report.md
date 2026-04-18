# Relatório de Revisão — EleveFut

> Revisão profunda cobrindo: Segurança, Qualidade de Código, Performance, Lógica de Negócio e Consistência TypeScript.
> Data: 2026-04-18

---

## Sumário Executivo

| Categoria | Críticos | Moderados | Corrigidos |
|-----------|----------|-----------|------------|
| Segurança | 2 | 3 | 1 |
| Lógica de Negócio | 3 | 4 | 5 |
| Qualidade de Código | 1 | 4 | 2 |
| Performance | 0 | 3 | 1 |
| **Total** | **6** | **14** | **9** |

---

## Problemas Críticos

### [SEG-01] Email hardcoded concede role `admin` automaticamente

**Arquivo:** `supabase/migrations/20260407204540_*.sql`, linha 45  
**Status:** Requer atenção manual

A função trigger `handle_new_subscription` contém o email `designervhf@gmail.com` literalmente no código SQL:

```sql
IF user_email = 'designervhf@gmail.com' THEN
  sub_role := 'admin';
```

**Causa:** Conveniência de desenvolvimento transformada em produção.  
**Risco:** O email do proprietário está exposto no histórico Git público/privado. Qualquer pessoa com acesso ao repositório sabe qual conta tem privilégio máximo. Além disso, o email não pode ser rotacionado sem um novo migration.

**Solução recomendada:** Criar um novo migration que substitua a lógica por uma tabela `admin_emails` (com RLS restrito) ou por uma variável de ambiente via `current_setting('app.admin_email', true)`. Exemplo:

```sql
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  user_email text;
  sub_role text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = NEW.id;
  -- Verificar tabela admin em vez de hardcode
  IF EXISTS (SELECT 1 FROM public.admin_emails WHERE email = user_email) THEN
    sub_role := 'admin';
  ELSE
    sub_role := 'pro';
  END IF;
  INSERT INTO public.user_subscriptions (user_id, role, trial_started_at, trial_ends_at)
  VALUES (NEW.id, sub_role, now(), now() + interval '15 days');
  RETURN NEW;
END;
$$;
```

---

### [SEG-02] Anon key hardcoded em migration de cron job

**Arquivo:** `supabase/migrations/20251218223941_*.sql`, linha 12  
**Status:** Requer atenção manual

O JWT do anon key está literalmente embutido no SQL do cron job:

```sql
headers := '{"Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6...'::jsonb
```

**Causa:** Falta de suporte a variáveis de ambiente em `pg_cron` nativo do Supabase.  
**Risco:** O token está exposto no histórico Git e em logs de banco de dados. Mesmo sendo o anon key (menor privilégio), é uma chave que pode ser usada para fazer chamadas à API pública.

**Solução:** Rotacionar o anon key no painel do Supabase se o repositório for público ou tiver colaboradores. Para futuros cron jobs, usar as Supabase Edge Functions invocadas por schedule (que herdam as variáveis de ambiente `SUPABASE_*` automaticamente), evitando ter credenciais no SQL.

---

### [LOGICA-01] Usuário pode fazer RSVP público em partida já encerrada

**Arquivo:** `supabase/functions/public-match-rsvp/index.ts`, linha 115  
**Status:** ✅ Corrigido

O endpoint POST de RSVP público verificava apenas `status !== 'scheduled'` e `open_for_confirmation`, mas não verificava se a data/hora da partida já havia passado. Um usuário poderia confirmar presença em uma pelada de semanas atrás se o organizador não tivesse encerrado manualmente.

**Correção aplicada:** Adicionada verificação de data antes do INSERT:

```typescript
const matchDateTime = new Date(`${match.match_date}T${match.match_time}`);
if (matchDateTime < new Date()) {
  return json({ error: "Essa partida já passou" }, 400);
}
```

---

### [LOGICA-02] Lógica do `isPro` permitia acesso com `subscription_status` inconsistente

**Arquivo:** `src/hooks/useSubscription.ts`, linha 58  
**Status:** ✅ Corrigido

A condição anterior era:
```typescript
const isPro = isAdmin || subscriptionStatus === 'active' || (role === 'pro' && trialActive);
```

O problema: `subscriptionStatus === 'active'` sozinho não garante que o role não é `'free'` (possível em edge case do bug de constraint duplicada). Além disso, a lógica não tornava explícito que usuários em trial expirado com status ainda 'trialing' são tratados corretamente.

**Correção aplicada:**
```typescript
const isPro =
  isAdmin ||
  (subscriptionStatus === 'active' && role !== 'free') ||
  (subscriptionStatus === 'trialing' && trialActive);
```

---

### [LOGICA-03] Ranking de MVP/Melhor Defensor incluía jogadores não confirmados

**Arquivo:** `src/components/PeladaRanking.tsx`, linha 65  
**Status:** ✅ Corrigido

O ranking buscava `match.mvp_id` e `match.best_defender_id` de todas as partidas finalizadas, mas não verificava se o jogador agraciado estava de fato `status = 'Confirmado'` naquela partida. Um jogador poderia receber título de MVP em uma partida em que não participou (se o organizador configurou incorretamente o MVP via outra rota).

**Correção aplicada:** Construção de mapa `confirmedByMatch` a partir das participações, com cruzamento antes de incrementar os contadores:

```typescript
const confirmedByMatch: Record<string, Set<string>> = {};
for (const p of participations) {
  if (!p.user_id) continue;
  if (!confirmedByMatch[p.match_id]) confirmedByMatch[p.match_id] = new Set();
  confirmedByMatch[p.match_id].add(p.user_id);
}
matches.forEach(m => {
  const confirmed = confirmedByMatch[m.id];
  if (m.mvp_id && confirmed?.has(m.mvp_id)) {
    mvpMap[m.mvp_id] = (mvpMap[m.mvp_id] || 0) + 1;
  }
  if (m.best_defender_id && confirmed?.has(m.best_defender_id)) {
    defenderMap[m.best_defender_id] = (defenderMap[m.best_defender_id] || 0) + 1;
  }
});
```

---

### [LOGICA-04] Votos de MVP podiam gerar erro confuso em submissão duplicada

**Arquivo:** `src/components/PlayerVoting.tsx`, linha 92  
**Status:** ✅ Corrigido

O banco tem `UNIQUE(match_id, voter_id)` nas tabelas de votos, mas o cliente não tratava o código de erro `23505` (unique_violation). Se o usuário clicasse "Confirmar Votos" duas vezes rapidamente, o segundo request falhava silenciosamente com a mensagem genérica "Não foi possível registrar seu voto" — enquanto o primeiro vote já tinha sido salvo com sucesso.

**Correção aplicada:** Detecção explícita do código `23505` para tratar duplicata como "já votou" ao invés de erro:

```typescript
if (mvpError.code === '23505') {
  setHasVoted(true);
  onVoteSubmitted();
  return;
}
```

---

## Problemas Moderados

### [SEG-03] Validação de estatísticas de partida apenas no cliente

**Arquivo:** `src/components/OrganizerStatsForm.tsx`  
**Status:** Requer atenção manual

Campos `goals` e `assists` têm `min={0}` e `max={20}` apenas via atributo HTML. Um usuário técnico pode fazer chamadas diretas à API do Supabase com valores arbitrários (ex: 999 gols). Não existe `CHECK` constraint no banco para esses campos.

**Solução:** Adicionar constraint na tabela `match_participants`:

```sql
ALTER TABLE match_participants
  ADD CONSTRAINT chk_goals_range CHECK (goals >= 0 AND goals <= 20),
  ADD CONSTRAINT chk_assists_range CHECK (assists >= 0 AND assists <= 20);
```

---

### [SEG-04] RLS em `mvp_votes` tem política aberta em migration antiga

**Arquivo:** `supabase/migrations/20251218215247_*.sql`, linha 25  
**Status:** Requer verificação manual

Migration inicial criou `"Anyone can view votes"` com `USING (true)`. Migrations posteriores adicionaram políticas mais restritivas. Verificar se a política original foi explicitamente dropada ou se coexiste, criando acesso público involuntário para leitura de votos.

**Ação:** Executar `SELECT policyname, cmd FROM pg_policies WHERE tablename = 'match_mvp_votes';` no SQL Editor do Supabase para confirmar políticas ativas.

---

### [SEG-05] RSVP público sem proteção contra automação

**Arquivo:** `supabase/functions/public-match-rsvp/index.ts`  
**Status:** Requer atenção manual

O endpoint aceita confirmações de presença sem autenticação, sem rate limit e sem CAPTCHA. Um bot pode encher a lista de qualquer partida com nomes fictícios.

**Solução:** Implementar rate limiting por IP via cabeçalhos `x-forwarded-for`, limitando a 1-2 confirmações por IP por partida:

```typescript
const ip = req.headers.get('x-forwarded-for') ?? 'unknown';
const { count } = await supabase
  .from('match_participants')
  .select('id', { count: 'exact', head: true })
  .eq('match_id', matchId)
  .eq('ip_address', ip);
if ((count ?? 0) >= 2) {
  return json({ error: 'Limite de confirmações atingido' }, 429);
}
```

---

### [LOGICA-05] OAuth Google pode deixar usuário em estado inconsistente

**Arquivo:** `src/integrations/lovable/index.ts`, `src/lib/checkUserSetup.ts`  
**Status:** Requer atenção manual

Quando um usuário autentica via Google OAuth, o trigger `handle_new_user` cria o perfil — mas existe uma janela de tempo entre o callback OAuth e a consulta ao perfil em `checkUserSetup`. Se o banco estiver lento ou o trigger falhar silenciosamente, `getSetupRoute` encontra `null` como perfil e redireciona para `/setup`, mas a tela de setup pode falhar ao tentar atualizar um perfil que ainda não existe.

**Solução:** Adicionar retry com backoff em `checkUserSetup.ts`:

```typescript
async function fetchProfileWithRetry(userId: string, attempts = 3): Promise<Profile | null> {
  for (let i = 0; i < attempts; i++) {
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (data) return data;
    if (i < attempts - 1) await new Promise(r => setTimeout(r, 500 * (i + 1)));
  }
  return null;
}
```

---

### [LOGICA-06] Sorteio de times não avisa sobre jogadores excluídos

**Arquivo:** `src/pages/TeamDraw.tsx`, linha 122  
**Status:** ✅ Corrigido

Quando há mais jogadores confirmados do que o total configurado (`playersPerTeam * 2`), os extras eram silenciosamente ignorados — o organizador não sabia que jogadores foram deixados de fora.

**Correção aplicada:** Toast de aviso quando `confirmed.length > totalPlayers`:

```typescript
if (confirmed.length > totalPlayers) {
  const excluded = confirmed.length - totalPlayers;
  toast({
    title: 'Aviso',
    description: `${excluded} jogador(es) não será(ão) incluído(s) no sorteio por exceder o total configurado.`,
  });
}
```

---

### [LOGICA-07] Sort do sorteio não tem tiebreaker estável

**Arquivo:** `src/pages/TeamDraw.tsx`, linha 125  
**Status:** ✅ Corrigido

Dois jogadores com o mesmo `overall_rating` podiam ser ordenados de forma diferente entre execuções (comportamento indefinido em `Array.sort` com comparador que retorna 0). Isso causava sorteios inconsistentes.

**Correção aplicada:** Tiebreaker estável via `id.localeCompare`:

```typescript
const sorted = [...availablePlayers].sort((a, b) => {
  const diff = getPlayerRating(b) - getPlayerRating(a);
  if (diff !== 0) return diff;
  return a.id.localeCompare(b.id);
});
```

---

### [LOGICA-08] Compartilhamento WhatsApp expunha ratings individuais

**Arquivo:** `src/pages/TeamDraw.tsx`, linha 176  
**Status:** ✅ Corrigido

O texto compartilhado no WhatsApp incluía o `overall_rating` de cada jogador entre parênteses: `• João Silva (72)`. Ratings são dados internos do sistema — expô-los publicamente pode gerar conflitos entre jogadores.

**Correção aplicada:** Removidos os ratings do texto compartilhado, mantendo apenas nomes e equipes.

---

### [QUALIDADE-01] Erros silenciosos em `CreatePelada` deixavam estado inconsistente

**Arquivo:** `src/pages/CreatePelada.tsx`, linhas 129–170  
**Status:** ✅ Corrigido

Falhas ao adicionar o criador como membro (`pelada_members`) ou ao criar a primeira partida (`matches`) eram apenas logadas com `console.error`, sem feedback ao usuário. O resultado seria uma pelada criada mas sem o organizador como membro, causando estado incoerente.

**Correção aplicada:** Cada etapa agora exibe um toast de aviso e retorna cedo, evitando continuar com dados inconsistentes. Erros no INSERT de `match_participants` também são notificados.

---

### [QUALIDADE-02] `useToast` registrava novo listener a cada mudança de estado

**Arquivo:** `src/hooks/use-toast.ts`, linha 183  
**Status:** ✅ Corrigido

O `useEffect` tinha `[state]` como dependency array:
```typescript
React.useEffect(() => {
  listeners.push(setState);
  return () => { /* cleanup */ };
}, [state]); // ← bug
```

`setState` é uma referência estável (do `useState`), mas o effect rodava a cada mudança de estado porque `state` (o valor) mudava. O `push` adicionava uma nova entrada sem remover a anterior (o cleanup removia corretamente, mas a combinação gerava oscilações).

**Correção aplicada:** Dependency array alterado para `[]` — o effect deve rodar apenas na montagem.

---

### [PERF-01] Queries de perfis em `public-match-rsvp` e `TeamDraw` são N+1 patterns

**Arquivo:** `supabase/functions/public-match-rsvp/index.ts` (linhas 71–78), `src/pages/TeamDraw.tsx` (linhas 57–75)  
**Status:** Requer atenção manual

Ambos os locais fazem:
1. Query para buscar participantes
2. Segunda query separada para buscar profiles por IDs

Isso pode ser resolvido com joins nativos do Supabase, reduzindo para uma única roundtrip:

```typescript
// Em vez de duas queries:
const { data: participants } = await supabase
  .from('match_participants')
  .select(`
    id, user_id, guest_name, status, team,
    profiles!user_id(id, name, position, avatar_url, overall_rating)
  `)
  .eq('match_id', matchId)
  .eq('status', 'Confirmado');
```

---

### [PERF-02] `MatchParticipants.tsx` faz queries sequenciais que poderiam ser paralelas

**Arquivo:** `src/pages/MatchParticipants.tsx`  
**Status:** Requer atenção manual

As queries de `match info` e `verificação de admin` são feitas em sequência, mas são independentes entre si. Usar `Promise.all` reduziria o tempo de carregamento:

```typescript
const [matchResult, adminResult] = await Promise.all([
  supabase.from('matches').select('...').eq('id', matchId).maybeSingle(),
  session
    ? supabase.from('pelada_members').select('role').eq('pelada_id', peladaId).eq('user_id', session.user.id).maybeSingle()
    : Promise.resolve({ data: null }),
]);
```

---

### [PERF-03] `PeladaRanking.tsx` não usa React Query — sem cache entre re-renders

**Arquivo:** `src/components/PeladaRanking.tsx`  
**Status:** Requer atenção manual

O componente usa `useEffect` + `useState` manual para buscar dados, sem cache. Toda vez que o componente é remontado (troca de aba, navegação), as queries rodam novamente. Migrar para `useQuery` do TanStack Query adicionaria cache com staleTime e deduplicação automática:

```typescript
const { data: rankings, isLoading } = useQuery({
  queryKey: ['pelada-ranking', peladaId],
  queryFn: () => fetchRankings(peladaId),
  staleTime: 1000 * 60 * 2, // 2 minutos
});
```

---

## O que foi corrigido (resumo)

| ID | Arquivo | Correção |
|----|---------|----------|
| SEG → LOGICA-01 | `src/hooks/useSubscription.ts` | Lógica `isPro` tornou-se explícita e resistente a estados inconsistentes |
| LOGICA-01 | `supabase/functions/public-match-rsvp/index.ts` | Bloqueio de RSVP em partidas já realizadas |
| LOGICA-03 | `src/components/PeladaRanking.tsx` | MVP/Defensor cruzado com confirmados por partida |
| LOGICA-04 | `src/components/PlayerVoting.tsx` | Tratamento de `23505` (unique_violation) em votos duplicados |
| LOGICA-06 | `src/pages/TeamDraw.tsx` | Toast de aviso para jogadores excluídos do sorteio |
| LOGICA-07 | `src/pages/TeamDraw.tsx` | Sort estável com tiebreaker por `id` |
| LOGICA-08 | `src/pages/TeamDraw.tsx` | Removidos ratings individuais do compartilhamento WhatsApp |
| QUALIDADE-01 | `src/pages/CreatePelada.tsx` | Feedback de erro em todas as etapas de criação de pelada |
| QUALIDADE-02 | `src/hooks/use-toast.ts` | Dependency array de `useEffect` corrigido para `[]` |

---

## O que precisa de atenção manual

| ID | Prioridade | Ação necessária |
|----|-----------|-----------------|
| SEG-01 | Alta | Criar novo migration substituindo email hardcoded por tabela `admin_emails` |
| SEG-02 | Alta | Rotacionar anon key se repositório for/foi público; migrar cron para Edge Functions |
| SEG-03 | Média | Adicionar `CHECK` constraints de range em `match_participants.goals` e `assists` |
| SEG-04 | Média | Verificar políticas ativas em `match_mvp_votes` via SQL Editor |
| SEG-05 | Média | Implementar rate limiting por IP no endpoint `public-match-rsvp` |
| LOGICA-05 | Média | Adicionar retry com backoff em `checkUserSetup.ts` para evitar race condition OAuth |
| PERF-01 | Baixa | Converter queries N+1 em joins nativos do Supabase |
| PERF-02 | Baixa | Paralelizar queries independentes em `MatchParticipants.tsx` |
| PERF-03 | Baixa | Migrar `PeladaRanking.tsx` de `useEffect` manual para `useQuery` |

---

## Consistência TypeScript

- `src/pages/MatchParticipants.tsx` usa `Record<string, any>` — substituir por tipo explícito derivado das tabelas do Supabase
- `src/pages/EditProfile.tsx` usa `as any` em pelo menos um cast — verificar e tipar corretamente
- A função `hasAccess(feature)` em `useSubscription.ts` sempre retorna `isPro` independente da feature passada — a assinatura sugere granularidade por feature que não existe; ou implementar ou simplificar a API

---

*Revisão realizada por Claude Code (claude-sonnet-4-6) em 2026-04-18.*
