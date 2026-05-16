import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Settings, Trash2, XCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PeladaSettingsDialogProps {
  peladaId: string;
  peladaName: string;
  matchId?: string;
  matchDate?: string;
}

const PeladaSettingsDialog = ({
  peladaId,
  peladaName,
  matchId,
  matchDate,
}: PeladaSettingsDialogProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelMatchDialogOpen, setCancelMatchDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDeletePelada = async () => {
    setLoading(true);

    // Delete pelada (cascade will delete members and matches)
    const { error } = await supabase
      .from('peladas')
      .delete()
      .eq('id', peladaId);

    setLoading(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel excluir a pelada',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Pelada excluida' });
    await queryClient.invalidateQueries({ queryKey: ['peladas'] });
    navigate('/games');
  };

  const handleCancelMatch = async () => {
    if (!matchId) return;
    setLoading(true);

    const { error } = await supabase
      .from('matches')
      .update({ status: 'encerrada', ended_at: new Date().toISOString() })
      .eq('id', matchId);

    setLoading(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel cancelar a partida',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Partida cancelada' });
    setOpen(false);
    setCancelMatchDialogOpen(false);
    window.location.reload();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <Settings className="h-5 w-5" />
          </button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Configuracoes</DialogTitle>
            <DialogDescription>
              Gerenciar pelada e partidas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-4">
            {matchId && (
              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => setCancelMatchDialogOpen(true)}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Cancelar partida de {matchDate}
              </Button>
            )}

            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir pelada
            </Button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Pelada Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pelada</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir "{peladaName}"? Esta acao nao pode ser desfeita.
              Todas as partidas e dados serao perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePelada}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Match Confirmation */}
      <AlertDialog open={cancelMatchDialogOpen} onOpenChange={setCancelMatchDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancelar partida</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja cancelar a partida de {matchDate}?
              Os jogadores serao notificados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Voltar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelMatch}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancelar partida'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default PeladaSettingsDialog;
