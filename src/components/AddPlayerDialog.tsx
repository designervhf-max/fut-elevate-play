import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { UserPlus, Search, Loader2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface AddPlayerDialogProps {
  gameId: string;
  existingParticipantIds: string[];
  onPlayerAdded: () => void;
}

const AddPlayerDialog = ({ gameId, existingParticipantIds, onPlayerAdded }: AddPlayerDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [players, setPlayers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchPlayers();
    }
  }, [open]);

  const fetchPlayers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('name');

    if (!error && data) {
      setPlayers(data);
    }
    setLoading(false);
  };

  const filteredPlayers = players.filter(
    (player) =>
      !existingParticipantIds.includes(player.id) &&
      player.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddPlayer = async (player: Profile) => {
    setAddingId(player.id);

    const { error } = await supabase.from('game_participants').insert({
      game_id: gameId,
      user_id: player.id,
      status: 'Confirmado',
    });

    setAddingId(null);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o jogador',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sucesso',
      description: `${player.name} foi adicionado à pelada`,
    });

    onPlayerAdded();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1">
          <UserPlus className="h-5 w-5 mr-2" />
          Adicionar Jogador
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">ADICIONAR JOGADOR</DialogTitle>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar jogador..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : filteredPlayers.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground text-sm">
              {search ? 'Nenhum jogador encontrado' : 'Todos os jogadores já estão na pelada'}
            </p>
          ) : (
            filteredPlayers.map((player) => (
              <div
                key={player.id}
                className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-background border-2 border-border flex items-center justify-center">
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-sm font-bold text-primary">
                        {player.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{player.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{player.position}</span>
                      <span>•</span>
                      <span className="text-primary font-bold">{player.overall_rating}</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="sport"
                  onClick={() => handleAddPlayer(player)}
                  disabled={addingId === player.id}
                >
                  {addingId === player.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerDialog;
