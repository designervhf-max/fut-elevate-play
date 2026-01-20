import { useState } from 'react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { UserPlus, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Constants } from '@/integrations/supabase/types';

const positions = Constants.public.Enums.player_position;

interface AddPlayerDialogProps {
  matchId: string;
  onPlayerAdded: () => void;
}

const AddPlayerDialog = ({ matchId, onPlayerAdded }: AddPlayerDialogProps) => {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [position, setPosition] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !position) {
      toast({
        title: 'Erro',
        description: 'Preencha o nome e a posição',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.from('match_participants').insert({
      match_id: matchId,
      guest_name: name.trim(),
      guest_position: position,
      status: 'Confirmado',
      rating: 50,
    });

    setLoading(false);

    if (error) {
      console.error('Error adding guest player:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível adicionar o jogador',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sucesso',
      description: `${name} foi adicionado à partida`,
    });

    setName('');
    setPosition('');
    onPlayerAdded();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="flex-1">
          <UserPlus className="h-5 w-5 mr-2" />
          Add Jogador
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display tracking-wider">ADICIONAR JOGADOR ALEATÓRIO</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Nome do jogador"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Posição</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a posição" />
              </SelectTrigger>
              <SelectContent>
                {positions.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            Jogadores aleatórios têm overall fixo de 50
          </p>

          <Button type="submit" variant="sport" className="w-full" disabled={loading}>
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'Adicionar'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddPlayerDialog;