

# Plano: Redesign Tipografico Clean

## Objetivo
Transformar a tipografia do aplicativo de um estilo brutalista/esportivo para um visual moderno, clean e mais fino, mantendo a identidade visual escura e minimalista.

## Mudancas Propostas

### 1. Substituicao da Fonte Display

**Antes:** Bebas Neue (condensada, pesada, muito esportiva)

**Depois:** Plus Jakarta Sans ou DM Sans (moderna, geometrica, elegante)

Ambas sao fontes sans-serif modernas com:
- Multiplos pesos (de 200 a 800)
- Excelente legibilidade em telas
- Estetica contemporanea usada em apps como Linear, Vercel, Nubank

### 2. Hierarquia Tipografica Refinada

| Elemento | Atual | Proposto |
|----------|-------|----------|
| Headers principais | Bebas Neue, text-xl, tracking-wider | Plus Jakarta, text-lg, font-semibold |
| Titulos de secao | font-semibold | font-medium |
| Rating OVR | text-5xl font-display | text-4xl font-bold |
| Labels de atributos | font-semibold | font-medium |
| Textos de botoes | uppercase + tracking-wider | Title case, sem tracking |
| Subtitulos | font-semibold | font-normal ou font-medium |

### 3. Arquivos a Modificar

**Arquivos de Configuracao (2)**
- `src/index.css` - Trocar import da fonte e variaveis CSS
- `tailwind.config.ts` - Atualizar fontFamily

**Componentes de UI (6)**
- `src/components/ui/button.tsx` - Remover uppercase e tracking de variantes sport
- `src/components/ui/card.tsx` - Ajustar pesos
- `src/components/SectionCard.tsx` - Reduzir peso do titulo
- `src/components/PlayerCard.tsx` - Refinar tipografia do card FIFA
- `src/components/OverallStats.tsx` - Ajustar tamanhos
- `src/components/MvpShowcase.tsx` - Reduzir peso

**Paginas Principais (8)**
- `src/pages/Index.tsx` - Logo loading
- `src/pages/Login.tsx` - Botoes e labels
- `src/pages/Home.tsx` - Header e stats
- `src/pages/Profile.tsx` - Titulos de secao
- `src/pages/PeladaDetails.tsx` - Nome da pelada e tabs
- `src/pages/TeamDraw.tsx` - Titulos de times
- `src/pages/Setup.tsx` - Titulo e opcoes
- `src/pages/MatchLive.tsx` - Timer e placares

**Componentes Secundarios (estimativa: 10-15)**
- Diversos componentes que usam `font-display`, `font-semibold`, `font-bold`

### 4. Detalhes Tecnicos

**Alteracao em index.css:**
```css
/* Antes */
@import url('...Bebas+Neue&family=Inter...');
--font-display: 'Bebas Neue', sans-serif;

/* Depois */
@import url('...Plus+Jakarta+Sans:wght@400;500;600;700...');
--font-display: 'Plus Jakarta Sans', sans-serif;
```

**Alteracao em tailwind.config.ts:**
```typescript
fontFamily: {
  display: ['Plus Jakarta Sans', 'sans-serif'],
  body: ['Plus Jakarta Sans', 'sans-serif'], // unificar
}
```

**Padrao de reducao de peso:**
- `font-bold` (700) vira `font-semibold` (600) ou `font-medium` (500)
- `font-semibold` (600) vira `font-medium` (500)
- Remover `tracking-wider` de titulos

### 5. Ordem de Implementacao

1. Atualizar fontes nos arquivos de configuracao
2. Ajustar componentes de UI base (button, card)
3. Refinar PlayerCard (elemento visual principal)
4. Atualizar paginas uma por uma
5. Revisar componentes secundarios
6. Testar em diferentes telas

### 6. Resultado Esperado

- Visual mais sofisticado e moderno
- Leitura mais confortavel
- Consistencia tipografica em todo o app
- Manutencao da hierarquia visual
- Estetica similar a apps premium como Nubank, Strava, Linear

