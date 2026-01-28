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
import { ChevronLeft, CalendarDays, Clock, MapPin, Users, Loader2, Trophy, DollarSign } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { WEEKDAYS, getNextOccurrence } from '@/lib/weekday';

type GameType = Database['public']['Enums']['game_type'];

const gameTypes: { value: GameType; label: string }[] = [
  { value: 'Futsal', label: 'Futsal' },
  { value: 'Society', label: 'Campo Society' },
  { value: 'Campo', label: 'Campo' },
];

const CreatePelada = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    weekday: '',
    time: '',
    location: '',
    gameType: '' as GameType | '',
    maxPlayers: '',
    pricePerGame: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.weekday || !formData.time || !formData.location || !formData.gameType || !formData.maxPlayers) {
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

    // Parse price
    const pricePerGame = formData.pricePerGame ? parseFloat(formData.pricePerGame) : null;

    // 1. Create the pelada
    const { data: pelada, error: peladaError } = await supabase
      .from('peladas')
      .insert({
        creator_id: user.id,
        name: formData.name.trim(),
        weekday: parseInt(formData.weekday),
        time: formData.time,
        location: formData.location,
        game_type: formData.gameType as GameType,
        max_players: maxPlayers,
        status: 'active',
        price_per_game: pricePerGame,
      })
      .select()
      .single();

    if (peladaError || !pelada) {
      toast({
        title: "Erro ao criar pelada",
        description: peladaError?.message || 'Erro desconhecido',
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // 2. Add creator as admin member
    const { error: memberError } = await supabase
      .from('pelada_members')
      .insert({
        pelada_id: pelada.id,
        user_id: user.id,
        role: 'admin',
      });

    if (memberError) {
      console.error('Error adding member:', memberError);
    }

    // 3. Create first match for the next occurrence
    const nextMatchDate = getNextOccurrence(parseInt(formData.weekday), formData.time);
    const matchDateStr = nextMatchDate.toISOString().split('T')[0];

    const { data: match, error: matchError } = await supabase
      .from('matches')
      .insert({
        pelada_id: pelada.id,
        match_date: matchDateStr,
        match_time: formData.time,
        location: formData.location,
        status: 'scheduled',
      })
      .select()
      .single();

    if (matchError) {
      console.error('Error creating first match:', matchError);
    }

    // 4. Add creator as confirmed participant in the first match
    if (match) {
      await supabase
        .from('match_participants')
        .insert({
          match_id: match.id,
          user_id: user.id,
          status: 'Confirmado',
        });
    }

    setLoading(false);
    toast({
      title: "Pelada criada!",
      description: "Sua pelada foi criada com sucesso",
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
          <h1 className="text-xl font-display tracking-wider">CRIAR PELADA</h1>
        </div>
      </header>

      {/* Form */}
      <form onSubmit={handleCreate} className="p-4 space-y-5">
        {/* Name */}
        <div className="space-y-2 animate-slide-up">
          <Label htmlFor="name" className="text-sm text-muted-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" />
            Nome da Pelada
          </Label>
          <Input
            id="name"
            placeholder="Ex: Pelada dos Amigos"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
          />
        </div>

        {/* Weekday */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <Label className="text-sm text-muted-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" />
            Dia da Semana
          </Label>
          <Select value={formData.weekday} onValueChange={(v) => handleChange('weekday', v)}>
            <SelectTrigger className="h-12 bg-surface border-border">
              <SelectValue placeholder="Selecione o dia" />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((day) => (
                <SelectItem key={day.value} value={day.value.toString()}>{day.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Time */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Label htmlFor="time" className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Horário
          </Label>
          <Input
            id="time"
            type="time"
            value={formData.time}
            onChange={(e) => handleChange('time', e.target.value)}
          />
        </div>

        {/* Location */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.15s' }}>
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
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
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
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <Label htmlFor="maxPlayers" className="text-sm text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Número Máximo de Jogadores
          </Label>
          <Input
            id="maxPlayers"
            type="number"
            min={2}
            max={30}
            placeholder="Ex: 14"
            value={formData.maxPlayers}
            onChange={(e) => handleChange('maxPlayers', e.target.value)}
          />
        </div>

        {/* Price Per Game (Optional) */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Label htmlFor="pricePerGame" className="text-sm text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-lime" />
            Valor por Jogo (opcional)
          </Label>
          <Input
            id="pricePerGame"
            type="number"
            min={0}
            step={0.01}
            placeholder="Ex: 25.00"
            value={formData.pricePerGame}
            onChange={(e) => handleChange('pricePerGame', e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Deixe vazio se não houver cobrança
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
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
              'CRIAR PELADA'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePelada;
