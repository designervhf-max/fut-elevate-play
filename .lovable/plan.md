
# Plano de Redesign Inspirado no Appito

## Resumo da Analise

Analisei as capturas de tela do app Appito e identifiquei varios elementos de UX/UI que podem melhorar o EleveFut sem copiar o design diretamente.

## Melhorias Identificadas

### 1. Pagina de Detalhes da Pelada (PeladaDetails)

**Problema atual:** Layout simples sem hero image ou destaque visual

**Inspiracao Appito:**
- Header com imagem de capa da pelada (hero section com overlay)
- Abas horizontais (INFO / JOGADORES / ESTATISTICAS) para melhor navegacao
- Floating action buttons na parte inferior (DENTRO/CONVIDAR)

**Proposta:**
- Adicionar suporte a imagem de capa da pelada
- Implementar sistema de tabs horizontal no topo
- Mover botoes de acao principais para bottom bar fixo
- Exibir organizador com avatar e badge

### 2. Lista de Jogadores (MatchParticipants)

**Problema atual:** Lista simples sem separacao por status

**Inspiracao Appito:**
- Secoes colapsaveis: "X Dentro", "X Lista de espera", "X Fora", "X Convidado"
- Indicador de pagamento ao lado de cada jogador
- Badge de posicao (VOL, GOL, etc.) no avatar
- Opcao "INSERIR QUEM NAO ESTA NO APP"

**Proposta:**
- Reorganizar lista em secoes expandiveis por status
- Adicionar badge de posicao sobre o avatar
- Melhorar indicador de ADMIN/organizador

### 3. Marcar Estatisticas (PlayerStatsForm)

**Problema atual:** Formulario simples com inputs

**Inspiracao Appito:**
- Card FIFA grande no centro com iniciais do jogador
- Botoes +/- grandes para incrementar/decrementar
- Icones coloridos por categoria (gols, assists, defesas)
- Botao "Nao veio" para marcar ausencia

**Proposta:**
- Redesenhar o form com card FIFA centralizado
- Usar botoes +/- circulares ao inves de input numerico
- Adicionar iconografia colorida padronizada
- Botao de "Nao veio" para facilitar marcacao de ausencias

### 4. Modo Partida ao Vivo

**Problema atual:** Nao existe

**Inspiracao Appito:**
- Cronometro grande no topo
- Lista de jogadores com stats em tempo real
- Botoes ZERAR e INICIAR para controle
- Botoes ENCERRAR E SAIR / SEPARAR TIMES

**Proposta:**
- Criar nova pagina "MatchLive" com cronometro integrado
- Tabela de jogadores com gols/assists/defesas editaveis
- Controles de cronometro (iniciar/pausar/zerar)
- Botoes de acao na parte inferior

### 5. Criar Pelada (CreatePelada)

**Problema atual:** Formulario funcional mas sem extras

**Inspiracao Appito:**
- Campos de preco (avulso e mensal)
- Slider para faixa de idade
- Opcoes de privacidade (Publico, Amigos, Apenas Convidados)
- Switches para configuracoes extras

**Proposta:**
- Adicionar campo de preco por jogo (opcional)
- Implementar seletor de privacidade com icones
- Adicionar switches de configuracao (aprovar jogadores, mostrar telefone)

### 6. Bottom Action Bar

**Problema atual:** Botoes de acao espalhados pela interface

**Inspiracao Appito:**
- Barra fixa na parte inferior com 2 botoes principais
- Cores vibrantes (lime green) para destaque
- Acao principal a direita, secundaria a esquerda

**Proposta:**
- Implementar ActionBar component reutilizavel
- Usar em PeladaDetails, MatchParticipants, TeamDraw

### 7. Estatisticas Pos-Jogo

**Problema atual:** Tabela simples

**Inspiracao Appito:**
- Countdown para fim das avaliacoes
- Colunas para GOLS, ASSIST, DEF, AVAL
- Toggle para marcar conclusao de avaliacao

**Proposta:**
- Adicionar timer visual mostrando tempo restante para votar
- Melhorar tabela de stats com colunas claras
- Indicador visual de quem ja foi avaliado

---

## Secao Tecnica

### Novos Componentes a Criar

```text
src/components/
  PeladaCoverImage.tsx    # Hero image com overlay
  TabsNavigation.tsx       # Tabs horizontal estilo Appito
  BottomActionBar.tsx      # Barra inferior com 2 botoes
  CollapsibleSection.tsx   # Secao expansivel para lista de jogadores
  StatCounter.tsx          # Botoes +/- para incrementar stats
  PositionBadge.tsx        # Badge de posicao sobre avatar
  MatchTimer.tsx           # Cronometro para partida ao vivo
  VotingCountdown.tsx      # Timer para fim das avaliacoes
```

### Alteracoes de Banco de Dados

```text
peladas:
  + cover_image_url: text (opcional)
  + price_per_game: decimal (opcional)
  + privacy_level: enum (public, friends, invite_only)
  + auto_approve_players: boolean

matches:
  + started_at: timestamptz (para cronometro)
```

### Paginas a Modificar

1. **PeladaDetails.tsx**
   - Adicionar hero section
   - Implementar tabs (INFO, JOGADORES, ESTATISTICAS)
   - Adicionar BottomActionBar

2. **MatchParticipants.tsx**
   - Reorganizar em secoes colapsaveis
   - Adicionar badges de posicao

3. **PlayerStatsForm.tsx**
   - Redesenhar com card FIFA central
   - Usar StatCounter +/- buttons

4. **CreatePelada.tsx**
   - Adicionar novos campos opcionais

5. **Nova: MatchLive.tsx**
   - Cronometro + lista de stats editaveis

### Prioridade de Implementacao

| Prioridade | Feature | Complexidade |
|------------|---------|--------------|
| Alta | BottomActionBar | Baixa |
| Alta | Tabs Navigation | Baixa |
| Alta | StatCounter (+/-) | Baixa |
| Media | Secoes Colapsaveis | Media |
| Media | Hero Image | Media |
| Media | PositionBadge | Baixa |
| Baixa | MatchLive + Timer | Alta |
| Baixa | Privacy settings | Media |

### Ordem de Execucao Sugerida

1. Criar componentes base (BottomActionBar, TabsNavigation, StatCounter)
2. Refatorar PeladaDetails com tabs e action bar
3. Refatorar PlayerStatsForm com visual melhorado
4. Refatorar MatchParticipants com secoes colapsaveis
5. Adicionar campos opcionais em CreatePelada
6. Implementar MatchLive (cronometro em tempo real)

