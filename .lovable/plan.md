
# Plano de Implementacao: Funcionalidades Restantes

## Status: EM PROGRESSO ✅

### Concluído:
- [x] Migration de banco: started_at, Lista de Espera, price_per_game, paid
- [x] Trigger para promoção automática da lista de espera
- [x] Componente MatchTimer (cronômetro)
- [x] Componente MatchCountdown (badge de dias até a partida)
- [x] Componente PaymentBadge (indicador de pagamento)
- [x] Componente PeladaInfoTab (aba de informações)
- [x] Página MatchLive (partida ao vivo com timer e stats)
- [x] PeladaDetails com sistema de tabs (INFO/PARTIDA/RANKING)
- [x] BottomActionBar no PeladaDetails
- [x] Lógica de lista de espera no UpcomingMatch
- [x] Exibição de lista de espera no MatchParticipants
- [x] Campo price_per_game no CreatePelada
- [x] Rota /match/:matchId/live adicionada

### Pendente:
- [ ] Integrar PaymentBadge na lista de jogadores (exibir status de pagamento)
- [ ] Permitir admin marcar jogador como pago/não pago
- [ ] Resumo financeiro no card da partida
- [ ] Melhorar texto do lembrete WhatsApp com mais informações

---

## Resumo

Este plano cobre a implementacao das funcionalidades identificadas como pendentes:

1. **PeladaDetails com Tabs e Hero Section** ✅ CONCLUÍDO
2. **MatchLive com Cronometro** ✅ CONCLUÍDO  
3. **Lista de Espera Automatica** ✅ CONCLUÍDO
4. **Controle Financeiro** 🔄 PARCIALMENTE (falta UI de pagamento)
5. **Melhorias nas Notificacoes** 🔄 PARCIALMENTE (MatchCountdown criado)

---

## Componentes Criados

```text
src/components/
  MatchTimer.tsx          ✅ Cronometro para partida ao vivo
  MatchCountdown.tsx      ✅ Contador de dias ate a partida
  PaymentBadge.tsx        ✅ Indicador de pagamento (pago/pendente)
  PeladaInfoTab.tsx       ✅ Aba de informações da pelada

src/pages/
  MatchLive.tsx           ✅ Pagina de partida ao vivo
```

## Alterações de Banco de Dados Aplicadas

```sql
-- ✅ Concluído
ALTER TABLE matches ADD COLUMN started_at timestamptz;
ALTER TYPE participant_status ADD VALUE 'Lista de Espera';
ALTER TABLE peladas ADD COLUMN price_per_game decimal(10,2);
ALTER TABLE match_participants ADD COLUMN paid boolean DEFAULT false;

-- Trigger para promoção automática ✅
CREATE FUNCTION promote_from_waitlist() ...
CREATE TRIGGER trigger_promote_from_waitlist ...
```
