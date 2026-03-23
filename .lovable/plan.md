

# Plano: Corrigir pelada nao removida da tela apos exclusao

## Problema
Ao excluir uma pelada no `PeladaSettingsDialog`, o componente navega para `/games` mas nao invalida o cache do React Query. O `usePeladas` retorna dados antigos (cache de 2 minutos), entao a pelada excluida continua aparecendo.

## Solucao
Adicionar `queryClient.invalidateQueries({ queryKey: ['peladas'] })` no `PeladaSettingsDialog` apos a exclusao bem-sucedida, antes de navegar.

## Arquivo a modificar

**`src/components/PeladaSettingsDialog.tsx`**
- Importar `useQueryClient` do `@tanstack/react-query`
- Chamar `queryClient.invalidateQueries({ queryKey: ['peladas'] })` apos o delete com sucesso, antes do `navigate('/games')`

Isso garante que ao chegar na pagina `/games`, o React Query busca dados frescos do banco.

