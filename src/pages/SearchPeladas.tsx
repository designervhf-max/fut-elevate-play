import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, MapPin, Locate, Loader2, Search, ExternalLink, Users, Calendar, Clock } from 'lucide-react';
import { usePlacesAutocomplete } from '@/lib/googleMaps';
import { WEEKDAYS } from '@/lib/weekday';
import BottomNav from '@/components/BottomNav';

type Mod = 'Futsal' | 'Society' | 'Campo';
type Period = 'morning' | 'afternoon' | 'evening' | 'any';

const RADII = [2, 5, 10, 20, 50];

function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

interface Result {
  id: string;
  name: string;
  game_type: string;
  address: string | null;
  location: string;
  weekday: number;
  time: string;
  max_players: number;
  latitude: number;
  longitude: number;
  distance: number;
  nextMatch?: { id: string; match_date: string; match_time: string; confirmed: number } | null;
}

const SearchPeladas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const addressRef = useRef<HTMLInputElement>(null);

  const [origin, setOrigin] = useState<{ lat: number; lng: number } | null>(null);
  const [originLabel, setOriginLabel] = useState('');
  const [radiusIdx, setRadiusIdx] = useState(2); // 10km
  const [mods, setMods] = useState<Set<Mod>>(new Set(['Futsal', 'Society', 'Campo']));
  const [weekday, setWeekday] = useState<string>('any');
  const [period, setPeriod] = useState<Period>('any');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [myRequests, setMyRequests] = useState<Record<string, string>>({});

  usePlacesAutocomplete(addressRef, (p) => {
    setOrigin({ lat: p.latitude, lng: p.longitude });
    setOriginLabel(p.address);
  });

  const radius = RADII[radiusIdx];

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('pelada_join_requests' as any).select('pelada_id, status').eq('user_id', user.id);
      const map: Record<string, string> = {};
      (data as any[] | null)?.forEach((r) => (map[r.pelada_id] = r.status));
      setMyRequests(map);
    })();
  }, []);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'GPS não disponível', variant: 'destructive' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setOrigin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setOriginLabel('Minha localização');
      },
      () => toast({ title: 'Permissão negada', description: 'Não foi possível acessar sua localização', variant: 'destructive' }),
    );
  };

  const periodMatches = (time: string): boolean => {
    if (period === 'any') return true;
    const h = parseInt(time.split(':')[0]);
    if (period === 'morning') return h >= 5 && h < 12;
    if (period === 'afternoon') return h >= 12 && h < 18;
    return h >= 18 || h < 5;
  };

  const search = async () => {
    if (!origin) {
      toast({ title: 'Defina sua localização', variant: 'destructive' });
      return;
    }
    setLoading(true);

    let q = supabase
      .from('peladas')
      .select('id, name, game_type, address, location, weekday, time, max_players, latitude, longitude, status, visibility' as any)
      .eq('visibility', 'public' as any)
      .eq('status', 'active')
      .not('latitude', 'is', null);

    if (mods.size < 3) q = q.in('game_type', Array.from(mods));
    if (weekday !== 'any') q = q.eq('weekday', parseInt(weekday));

    const { data, error } = await q;
    if (error) {
      toast({ title: 'Erro ao buscar', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }

    const filtered: Result[] = ((data as any[]) ?? [])
      .map((p) => ({
        ...p,
        distance: haversine(origin.lat, origin.lng, p.latitude, p.longitude),
      }))
      .filter((p) => p.distance <= radius && periodMatches(p.time))
      .sort((a, b) => a.distance - b.distance);

    // Fetch next match counts
    if (filtered.length > 0) {
      const ids = filtered.map((p) => p.id);
      const today = new Date().toISOString().split('T')[0];
      const { data: matches } = await supabase
        .from('matches')
        .select('id, pelada_id, match_date, match_time')
        .in('pelada_id', ids)
        .gte('match_date', today)
        .in('status', ['scheduled','criada','confirmacoes_abertas'])
        .order('match_date', { ascending: true });

      const nextByPelada: Record<string, any> = {};
      matches?.forEach((m) => {
        if (!nextByPelada[m.pelada_id]) nextByPelada[m.pelada_id] = m;
      });
      const matchIds = Object.values(nextByPelada).map((m: any) => m.id);
      let countByMatch: Record<string, number> = {};
      if (matchIds.length) {
        const { data: parts } = await supabase
          .from('match_participants').select('match_id').in('match_id', matchIds).eq('status', 'Confirmado');
        parts?.forEach((p) => { countByMatch[p.match_id] = (countByMatch[p.match_id] ?? 0) + 1; });
      }
      filtered.forEach((p) => {
        const m = nextByPelada[p.id];
        p.nextMatch = m ? { id: m.id, match_date: m.match_date, match_time: m.match_time, confirmed: countByMatch[m.id] ?? 0 } : null;
      });
    }

    setResults(filtered);
    setLoading(false);
  };

  const requestJoin = async (peladaId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }
    setRequesting(peladaId);
    const { error } = await supabase.from('pelada_join_requests' as any).insert({ pelada_id: peladaId, user_id: user.id });
    setRequesting(null);
    if (error) {
      toast({ title: 'Não foi possível solicitar', description: error.message, variant: 'destructive' });
      return;
    }
    setMyRequests((p) => ({ ...p, [peladaId]: 'pending' }));
    toast({ title: 'Solicitação enviada!', description: 'O organizador vai analisar seu pedido' });
  };

  const toggleMod = (m: Mod) => {
    setMods((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      if (next.size === 0) next.add(m);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 glass px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2"><ChevronLeft className="h-6 w-6" /></button>
        <h1 className="text-xl font-display tracking-wider">BUSCAR PELADA</h1>
      </header>

      <div className="p-4 space-y-5">
        {/* Location */}
        <div className="space-y-2">
          <Label>Localização</Label>
          <div className="flex gap-2">
            <Input ref={addressRef} placeholder="Digite um endereço" value={originLabel}
              onChange={(e) => { setOriginLabel(e.target.value); setOrigin(null); }} />
            <Button type="button" variant="outline" size="icon" onClick={useMyLocation} title="Usar minha localização">
              <Locate className="h-4 w-4" />
            </Button>
          </div>
          {origin && <p className="text-xs text-primary">✓ {originLabel}</p>}
        </div>

        {/* Radius */}
        <div className="space-y-2">
          <Label>Raio: <span className="text-primary font-bold">{radius} km</span></Label>
          <Slider value={[radiusIdx]} onValueChange={(v) => setRadiusIdx(v[0])} min={0} max={4} step={1} />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            {RADII.map((r) => <span key={r}>{r}km</span>)}
          </div>
        </div>

        {/* Modality */}
        <div className="space-y-2">
          <Label>Modalidade</Label>
          <div className="flex gap-2">
            {(['Futsal', 'Society', 'Campo'] as Mod[]).map((m) => (
              <button key={m} type="button" onClick={() => toggleMod(m)}
                className={`flex-1 py-2 rounded-lg text-sm border-2 transition ${
                  mods.has(m) ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-muted-foreground'
                }`}>{m}</button>
            ))}
          </div>
        </div>

        {/* Day */}
        <div className="space-y-2">
          <Label>Dia da semana</Label>
          <select value={weekday} onChange={(e) => setWeekday(e.target.value)}
            className="w-full h-12 rounded-lg bg-surface border border-border px-3">
            <option value="any">Qualquer dia</option>
            {WEEKDAYS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
        </div>

        {/* Period */}
        <div className="space-y-2">
          <Label>Turno</Label>
          <div className="grid grid-cols-4 gap-2">
            {([['any', 'Qualquer'], ['morning', 'Manhã'], ['afternoon', 'Tarde'], ['evening', 'Noite']] as [Period, string][]).map(([k, label]) => (
              <button key={k} type="button" onClick={() => setPeriod(k)}
                className={`py-2 rounded-lg text-xs border-2 ${period === k ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-surface text-muted-foreground'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>

        <Button variant="sport" size="lg" className="w-full" onClick={search} disabled={loading}>
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Search className="h-4 w-4 mr-2" /> Buscar</>}
        </Button>

        {/* Results */}
        <div className="space-y-3 pt-4">
          {results.length === 0 && !loading && (
            <p className="text-center text-sm text-muted-foreground">Nenhum resultado ainda. Defina filtros e busque.</p>
          )}
          {results.map((r) => {
            const reqStatus = myRequests[r.id];
            return (
              <div key={r.id} className="p-4 rounded-lg bg-surface border border-border space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold">{r.name}</h3>
                    <span className="text-[10px] uppercase tracking-wider text-primary">{r.game_type}</span>
                  </div>
                  <span className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-medium whitespace-nowrap">
                    {r.distance < 1 ? `${Math.round(r.distance * 1000)} m` : `${r.distance.toFixed(1)} km`}
                  </span>
                </div>
                <a href={`https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary">
                  <MapPin className="h-3 w-3" /> {r.address || r.location} <ExternalLink className="h-3 w-3" />
                </a>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {WEEKDAYS.find(w => w.value === r.weekday)?.label}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {r.time.slice(0, 5)}</span>
                  {r.nextMatch && (
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {r.nextMatch.confirmed}/{r.max_players}</span>
                  )}
                </div>
                <Button variant={reqStatus ? 'outline' : 'sport'} size="sm" className="w-full"
                  disabled={!!reqStatus || requesting === r.id}
                  onClick={() => requestJoin(r.id)}>
                  {requesting === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> :
                    reqStatus === 'pending' ? 'Solicitação enviada' :
                    reqStatus === 'approved' ? 'Aprovada ✓' :
                    reqStatus === 'rejected' ? 'Recusada' : 'Quero participar'}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default SearchPeladas;
