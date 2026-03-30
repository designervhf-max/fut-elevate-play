

# Plano: Redirecionar novos usuários Google para Setup/Calibração

## Problema

Há dois problemas no fluxo atual:

1. **`Index.tsx`**: O listener `onAuthStateChange` redireciona direto para `/home` sem verificar se o usuário completou o setup (`preferred_game_type`).
2. **`Login.tsx`**: Após login com e-mail, redireciona direto para `/home` sem verificar setup.
3. **`Home.tsx`**: Não verifica se o setup foi completado — exibe a home mesmo para usuários novos.

Quando um novo usuário entra via Google, o `handle_new_user` trigger cria o perfil com `preferred_game_type = NULL`, mas ninguém verifica isso antes de enviar para `/home`.

## Solução

Criar uma função utilitária de verificação de setup e aplicá-la em 3 pontos:

### 1. Criar helper `checkUserSetup` (novo arquivo ou inline)
Função que recebe `userId` e retorna a rota correta (`/setup`, `/calibration`, ou `/home`).

### 2. Atualizar `src/pages/Index.tsx`
- No `onAuthStateChange`, ao receber sessão, verificar `preferred_game_type` do perfil antes de navegar (igual ao `checkAuth` já faz no load inicial).

### 3. Atualizar `src/pages/Login.tsx`
- Após login com e-mail (no `handleLogin`), verificar `preferred_game_type` antes de navegar para `/home`.
- O fluxo do Google já redireciona para `/` (Index), que fará a verificação.

### 4. Atualizar `src/pages/Home.tsx`
- No `checkAuth`, após obter sessão, verificar se `preferred_game_type` existe. Se não, redirecionar para `/setup`.

## Detalhes técnicos

Lógica de redirecionamento:
```
se preferred_game_type == null → /setup
senão → /home
```

Arquivos a modificar:
- `src/pages/Index.tsx` — corrigir onAuthStateChange para verificar setup
- `src/pages/Login.tsx` — adicionar verificação após login por e-mail
- `src/pages/Home.tsx` — adicionar guard de setup no checkAuth

