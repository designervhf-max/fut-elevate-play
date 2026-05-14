import { useState, useRef } from 'react';
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
import { ChevronLeft, CalendarDays, Clock, MapPin, Users, Loader2, Trophy, DollarSign, Globe, Lock } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';
import { WEEKDAYS, getNextOccurrence } from '@/lib/weekday';
import { peladaSchema } from '@/lib/peladaSchema';
import { usePlacesAutocomplete } from '@/lib/googleMaps';

type GameType = Database['public']['Enums']['game_type'];

const gameTypes: { value: GameType; label: string }[] = [
  { value: 'Futsal', label: 'Futsal' },
  { value: 'Society', label: 'Society' },
  { value: 'Campo', label: 'Campo' },
];

const CreatePelada = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const addressInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    weekday: '',
    time: '',
    location: '',
    address: '',
    latitude: null as number | null,
    longitude: null as number | null,
    visibility: 'private' as 'public' | 'private',
    gameType: '' as GameType | '',
    maxPlayers: '',
    pricePerGame: '',
  });

  usePlacesAutocomplete(addressInputRef, (place) => {
    setFormData((prev) => ({
      ...prev,
      address: place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      location: prev.location || place.address,
    }));
  });

  const handleChange = (field: string, value: any) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = peladaSchema.safeParse({
      name: formData.name,
      weekday: formData.weekday,
      time: formData.time,
      location: formData.location,
      address: formData.address,
      latitude: formData.latitude,
      longitude: formData.longitude,
      visibility: formData.visibility,
      gameType: formData.gameType,
      maxPlayers: formData.maxPlayers === '' ? NaN : parseInt(formData.maxPlayers),
      pricePerGame: formData.pricePerGame === '' ? '' : parseFloat(formData.pricePerGame),
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast({ title: 'Verifique os campos', description: 'Há informações inválidas no formulário', variant: 'destructive' });
      return;
    }

    if (formData.visibility === 'public' && (!formData.latitude || !formData.longitude)) {
      setErrors({ address: 'Selecione um endereço sugerido para peladas públicas' });
      toast({ title: 'Endereço obrigatório', description: 'Peladas públicas precisam de endereço com localização', variant: 'destructive' });
      return;
    }

    setErrors({});
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: 'Erro', description: 'Você precisa estar logado', variant: 'destructive' });
      setLoading(false);
      navigate('/login');
      return;
    }

    const pricePerGame = formData.pricePerGame ? parseFloat(formData.pricePerGame) : null;
    const maxPlayers = parseInt(formData.maxPlayers);

    const { data: pelada, error: peladaError } = await supabase
      .from('peladas')
      .insert({
        creator_id: user.id,
        name: formData.name.trim(),
        weekday: parseInt(formData.weekday),
        time: formData.time,
        location: formData.location.trim(),
        address: formData.address?.trim() || null,
        latitude: formData.latitude,
        longitude: formData.longitude,
        visibility: formData.visibility,
        game_type: formData.gameType as GameType,
        max_players: maxPlayers,
        status: 'active',
        price_per_game: pricePerGame,
      } as any)
      .select()
      .single();

    if (peladaError || !pelada) {
      toast({ title: 'Erro ao criar pelada', description: peladaError?.message || 'Erro desconhecido', variant: 'destructive' });
      setLoading(false);
      return;
    }

    await supabase.from('pelada_members').insert({ pelada_id: pelada.id, user_id: user.id, role: 'admin' });

    const nextMatchDate = getNextOccurrence(parseInt(formData.weekday), formData.time);
    const matchDateStr = nextMatchDate.toISOString().split('T')[0];

    const { data: match } = await supabase
      .from('matches')
      .insert({
        pelada_id: pelada.id,
        match_date: matchDateStr,
        match_time: formData.time,
        location: formData.location.trim(),
        status: 'scheduled',
      })
      .select()
      .single();

    if (match) {
      await supabase.from('match_participants').insert({ match_id: match.id, user_id: user.id, status: 'Confirmado' });
    }

    setLoading(false);
    toast({ title: 'Pelada criada!', description: 'Sua pelada foi criada com sucesso' });
    navigate('/games');
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-display tracking-wider">CRIAR PELADA</h1>
        </div>
      </header>

      <form onSubmit={handleCreate} className="p-4 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm text-muted-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-primary" /> Nome da Pelada
          </Label>
          <Input id="name" placeholder="Ex: Pelada dos Amigos" value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={errors.name ? 'border-destructive' : ''} />
          {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Visibilidade</Label>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => handleChange('visibility', 'private')}
              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition ${
                formData.visibility === 'private' ? 'border-primary bg-primary/10' : 'border-border bg-surface'
              }`}>
              <Lock className="h-5 w-5" />
              <span className="text-sm font-medium">Privada</span>
              <span className="text-[10px] text-muted-foreground text-center">Apenas convidados</span>
            </button>
            <button type="button" onClick={() => handleChange('visibility', 'public')}
              className={`p-3 rounded-lg border-2 flex flex-col items-center gap-1 transition ${
                formData.visibility === 'public' ? 'border-primary bg-primary/10' : 'border-border bg-surface'
              }`}>
              <Globe className="h-5 w-5" />
              <span className="text-sm font-medium">Pública</span>
              <span className="text-[10px] text-muted-foreground text-center">Qualquer um pode pedir entrada</span>
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-primary" /> Dia da Semana
          </Label>
          <Select value={formData.weekday} onValueChange={(v) => handleChange('weekday', v)}>
            <SelectTrigger className={`h-12 bg-surface ${errors.weekday ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Selecione o dia" />
            </SelectTrigger>
            <SelectContent>
              {WEEKDAYS.map((day) => <SelectItem key={day.value} value={day.value.toString()}>{day.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.weekday && <p className="text-xs text-destructive">{errors.weekday}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="time" className="text-sm text-muted-foreground flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" /> Horário
          </Label>
          <Input id="time" type="time" value={formData.time} onChange={(e) => handleChange('time', e.target.value)}
            className={errors.time ? 'border-destructive' : ''} />
          {errors.time && <p className="text-xs text-destructive">{errors.time}</p>}
        </div>

        {/* Address with autocomplete */}
        <div className="space-y-2">
          <Label htmlFor="address" className="text-sm text-muted-foreground flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" /> Endereço {formData.visibility === 'public' && <span className="text-destructive">*</span>}
          </Label>
          <Input id="address" ref={addressInputRef} placeholder="Digite o endereço para autocompletar"
            value={formData.address}
            onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value, latitude: null, longitude: null }))}
            className={errors.address ? 'border-destructive' : ''} />
          {formData.latitude && (
            <p className="text-xs text-primary">✓ Localização confirmada</p>
          )}
          {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="location" className="text-sm text-muted-foreground">Nome do local (apelido)</Label>
          <Input id="location" placeholder="Ex: Quadra do João"
            value={formData.location} onChange={(e) => handleChange('location', e.target.value)}
            className={errors.location ? 'border-destructive' : ''} />
          {errors.location && <p className="text-xs text-destructive">{errors.location}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Modalidade</Label>
          <Select value={formData.gameType} onValueChange={(v) => handleChange('gameType', v)}>
            <SelectTrigger className={`h-12 bg-surface ${errors.gameType ? 'border-destructive' : ''}`}>
              <SelectValue placeholder="Futsal, Society ou Campo" />
            </SelectTrigger>
            <SelectContent>
              {gameTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {errors.gameType && <p className="text-xs text-destructive">{errors.gameType}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="maxPlayers" className="text-sm text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" /> Número Máximo de Jogadores
          </Label>
          <Input id="maxPlayers" type="number" min={2} max={30} placeholder="Ex: 14"
            value={formData.maxPlayers} onChange={(e) => handleChange('maxPlayers', e.target.value)}
            className={errors.maxPlayers ? 'border-destructive' : ''} />
          {errors.maxPlayers && <p className="text-xs text-destructive">{errors.maxPlayers}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="pricePerGame" className="text-sm text-muted-foreground flex items-center gap-2">
            <DollarSign className="h-4 w-4" /> Valor por Jogo (opcional)
          </Label>
          <Input id="pricePerGame" type="number" min={0} step={0.01} placeholder="Ex: 25.00"
            value={formData.pricePerGame} onChange={(e) => handleChange('pricePerGame', e.target.value)} />
          <p className="text-xs text-muted-foreground">Deixe vazio se não houver cobrança</p>
        </div>

        <div className="pt-6">
          <Button type="submit" variant="sport" size="lg" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'CRIAR PELADA'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreatePelada;
