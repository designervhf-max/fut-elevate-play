import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, Calendar, Clock, MapPin, Users, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type GameType = Database['public']['Enums']['game_type'];

const gameTypes: { value: GameType; label: string }[] = [
  { value: 'Futsal', label: 'Futsal' },
  { value: 'Society', label: 'Campo Society' },
  { value: 'Campo', label: 'Campo' },
];

const CreateGame = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    date: '',
    time: '',
    location: '',
    gameType: '' as GameType | '',
    maxPlayers: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.time || !formData.location || !formData.gameType || !formData.maxPlayers) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const maxPlayers = parseInt(formData.maxPlayers);
    if (isNaN(maxPlayers) || maxPlayers < 2 || maxPlayers > 30) {
      toast({
        title: "Erro",
        description: "Número de jogadores deve ser entre 2 e 30",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast({
        title: "Erro",
        description: "Você precisa estar logado",
        variant: "destructive",
      });
      setLoading(false);
      navigate('/login');
      return;
    }

    const { data: game, error } = await supabase
      .from('games')
      .insert({
        creator_id: user.id,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        game_type: formData.gameType as GameType,
        max_players: maxPlayers,
        status: 'Confirmado',
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Erro ao criar jogo",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Add creator as participant
    if (game) {
      await supabase
        .from('game_participants')
        .insert({
          game_id: game.id,
          user_id: user.id,
          status: 'Confirmado',
        });
    }

    setLoading(false);
    toast({
      title: "Jogo criado!",
      description: "Sua partida foi marcada com sucesso",
    });
    navigate('/games');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-display tracking-wider">CRIAR PARTIDA</h1>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleCreate} className="p-4 space-y-5">
        {/* Date */}
        <div className="space-y-2 animate-slide-up">
          <Label htmlFor="date" className="text-sm text-muted-foreground flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Data
          </Label>
          <Input
            id="date"
            type="date"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>

        {/* Time */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <Label htmlFor="time" className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Hora
          </Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => handleChange('time', e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Label htmlFor="location" className="text-sm text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Local
          </Label>
          <Input
            id="location"
            placeholder="Nome do campo ou endereço"
            value={formData.location}
            onChange={(e) => handleChange('location', e.target.value)}
          />
        </div>

        {/* Game Type */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <Label className="text-sm text-muted-foreground">Tipo de Jogo</Label>
          <Select value={formData.gameType} onValueChange={(v) => handleChange('gameType', v)}>
            <SelectTrigger className="h-12 bg-surface border-border">
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {gameTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Max Players */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Label htmlFor="maxPlayers" className="text-sm text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Número Máximo de Jogadores
          </Label>
          <Input
            id="maxPlayers"
            type="number"
            min={2}
            max={30}
            placeholder="Ex: 10"
            value={formData.maxPlayers}
            onChange={(e) => handleChange('maxPlayers', e.target.value)}
          />
        </div>

        {/* Submit Button */}
        <div className="pt-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <Button
            type="submit"
            variant="sport"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'CRIAR JOGO'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateGame;
