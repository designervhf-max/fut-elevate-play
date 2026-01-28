

# Plano de Implementacao: Funcionalidades Restantes

## Resumo

Este plano cobre a implementacao das funcionalidades identificadas como pendentes, continuando o redesign aprovado e adicionando novos recursos:

1. **PeladaDetails com Tabs e Hero Section** (do plano original)
2. **MatchLive com Cronometro** (do plano original)
3. **Lista de Espera Automatica** (nova funcionalidade)
4. **Controle Financeiro** (nova funcionalidade)
5. **Melhorias nas Notificacoes** (nova funcionalidade)

---

## 1. PeladaDetails com Tabs e Hero Section

### O que muda:
- Adicionar sistema de tabs horizontal (INFO / PARTIDA / RANKING)
- Adicionar BottomActionBar para acoes rapidas (Confirmar / Cancelar)
- Melhorar visual do header com informacoes mais destacadas

### Componentes:
- Usar o componente `Tabs` do shadcn/ui ja existente
- Reutilizar o `BottomActionBar` criado anteriormente
- Conteudo de cada tab:
  - **INFO**: Informacoes da pelada (dia, horario, local, tipo de jogo)
  - **PARTIDA**: Proxima partida, lista de jogadores, acoes de admin
  - **RANKING**: Ranking dos jogadores da pelada

---

## 2. MatchLive - Modo Partida ao Vivo

### O que faz:
- Cronometro com controles (iniciar, pausar, resetar)
- Lista de jogadores confirmados com contadores de gols/assists/defesas
- Botoes de acao rapida para cada jogador (incrementar stats)

### Fluxo:
1. Admin clica em "Iniciar Partida" no PeladaDetails
2. Status do match muda para `in_progress`
3. Redireciona para `/match/:matchId/live`
4. Cronometro inicia automaticamente
5. Admin pode pausar/resetar cronometro
6. Admin pode adicionar stats aos jogadores em tempo real
7. Ao encerrar, salva stats e muda status para `finished`

### Componentes a criar:
- `MatchTimer.tsx` - Cronometro visual com controles
- `pages/MatchLive.tsx` - Pagina completa do modo ao vivo

### Alteracoes no banco:
- Adicionar coluna `started_at` na tabela `matches` para persistir inicio do cronometro

---

## 3. Lista de Espera Automatica

### O que faz:
- Quando a partida atinge `max_players` confirmados, novos jogadores entram na lista de espera
- Se alguem cancelar, o primeiro da lista de espera e promovido automaticamente

### Implementacao:
- Adicionar novo status `Lista de Espera` ao enum `participant_status`
- Modificar logica de confirmacao:
  - Se `confirmedCount >= max_players`, status = 'Lista de Espera'
  - Senao, status = 'Confirmado'
- Criar trigger no banco para promover automaticamente quando alguem sair
- Exibir secao de lista de espera no `MatchParticipants`

### Alteracoes no banco:
- Adicionar `'Lista de Espera'` ao enum `participant_status`
- Criar funcao SQL para promocao automatica

---

## 4. Controle Financeiro

### O que faz:
- Definir preco por jogo na pelada (opcional)
- Marcar status de pagamento por jogador na partida
- Exibir resumo financeiro (total arrecadado, pendentes)

### Implementacao:
- Adicionar campo `price_per_game` na tabela `peladas`
- Adicionar campo `paid` (boolean) na tabela `match_participants`
- Exibir indicador de pagamento na lista de jogadores
- Permitir admin marcar como pago/nao pago
- Mostrar resumo financeiro no card da partida

### Alteracoes no banco:
- `peladas`: adicionar `price_per_game` (decimal, opcional)
- `match_participants`: adicionar `paid` (boolean, default false)

---

## 5. Melhorias nas Notificacoes

### O que faz:
- Timer visual mostrando tempo restante para confirmar
- Contador de "falta X dias para a partida"
- Melhorar botao de lembrete do WhatsApp

### Implementacao:
- Criar `MatchCountdown.tsx` - Exibe tempo ate a partida
- Adicionar badge visual no card da proxima partida (HOJE, AMANHA, EM X DIAS)
- Melhorar texto do lembrete WhatsApp para incluir mais informacoes

---

## Secao Tecnica

### Novos Componentes

```text
src/components/
  MatchTimer.tsx          # Cronometro para partida ao vivo
  MatchCountdown.tsx      # Contador de dias ate a partida
  PaymentBadge.tsx        # Indicador de pagamento (pago/pendente)

src/pages/
  MatchLive.tsx           # Pagina de partida ao vivo
```

### Alteracoes de Banco de Dados

```text
-- Migration 1: Adicionar started_at para cronometro
ALTER TABLE matches ADD COLUMN started_at timestamptz;

-- Migration 2: Adicionar lista de espera
ALTER TYPE participant_status ADD VALUE 'Lista de Espera';

-- Migration 3: Adicionar controle financeiro
ALTER TABLE peladas ADD COLUMN price_per_game decimal(10,2);
ALTER TABLE match_participants ADD COLUMN paid boolean DEFAULT false;
```

### Paginas/Componentes a Modificar

| Arquivo | Modificacao |
|---------|-------------|
| `PeladaDetails.tsx` | Adicionar tabs, BottomActionBar, botao iniciar partida |
| `UpcomingMatch.tsx` | Adicionar contador de dias, logica de lista de espera |
| `MatchParticipants.tsx` | Adicionar secao lista de espera, indicador de pagamento |
| `CreatePelada.tsx` | Adicionar campo de preco por jogo |
| `App.tsx` | Adicionar rota `/match/:matchId/live` |

### Prioridade de Implementacao

| Ordem | Feature | Complexidade |
|-------|---------|--------------|
| 1 | Tabs no PeladaDetails | Baixa |
| 2 | MatchLive + Timer | Media |
| 3 | Lista de Espera | Media |
| 4 | Controle Financeiro | Baixa |
| 5 | Melhorias Notificacoes | Baixa |

### Ordem de Execucao

1. Criar migrations para banco de dados
2. Refatorar PeladaDetails com tabs
3. Criar MatchTimer e pagina MatchLive
4. Implementar logica de lista de espera
5. Adicionar controle financeiro
6. Melhorar sistema de lembretes

