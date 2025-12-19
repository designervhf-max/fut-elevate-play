import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { User, Shield, Trash2, Loader2 } from 'lucide-react';

type Participant = {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  profile?: {
    id: string;
    name: string;
    avatar_url: string | null;
    position: string;
    overall_rating: number;
  };
};

interface ParticipantActionsDialogProps {
  participant: Participant | null;
  peladaId: string;
  isAdmin: boolean;
  onClose: () => void;
  onRefresh: () => Promise<void>;
}

const ParticipantActionsDialog = ({
  participant,
  peladaId,
  isAdmin,
  onClose,
  onRefresh,
}: ParticipantActionsDialogProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  if (!participant) return null;

  const name = participant.profile?.name || participant.guest_name || 'Jogador';
  const isGuest = !participant.user_id;

  const handleViewProfile = () => {
    if (participant.user_id) {
      navigate(`/player/${participant.user_id}`);
    }
    onClose();
  };

  const handleMakeAdmin = async () => {
    if (!participant.user_id || !isAdmin) return;

    setLoading(true);

    const { error } = await supabase
      .from('pelada_members')
      .update({ role: 'admin' })
      .eq('pelada_id', peladaId)
      .eq('user_id', participant.user_id);

    setLoading(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel promover o jogador',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Jogador promovido a admin!' });
    await onRefresh();
    onClose();
  };

  const handleRemove = async () => {
    if (!isAdmin) return;

    const confirmed = window.confirm(`Remover ${name} da partida?`);
    if (!confirmed) return;

    setLoading(true);

    const { error } = await supabase
      .from('match_participants')
      .delete()
      .eq('id', participant.id);

    setLoading(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Nao foi possivel remover o jogador',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Jogador removido' });
    await onRefresh();
    onClose();
  };

  return (
    <Dialog open={!!participant} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-elevated flex items-center justify-center overflow-hidden border-2 border-primary">
              {participant.profile?.avatar_url ? (
                <img
                  src={participant.profile.avatar_url}
                  alt={name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-display tracking-wider">{name}</p>
              {participant.profile && (
                <p className="text-sm text-muted-foreground font-normal">
                  {participant.profile.position} - OVR {participant.profile.overall_rating}
                </p>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 pt-4">
          {!isGuest && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleViewProfile}
            >
              <User className="h-4 w-4 mr-3" />
              Ver Perfil
            </Button>
          )}

          {isAdmin && !isGuest && (
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={handleMakeAdmin}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-3 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-3" />
              )}
              Tornar Admin da Pelada
            </Button>
          )}

          {isAdmin && (
            <Button
              variant="destructive"
              className="w-full justify-start"
              onClick={handleRemove}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-3 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-3" />
              )}
              Remover da Partida
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ParticipantActionsDialog;
