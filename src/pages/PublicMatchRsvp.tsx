import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CalendarDays, MapPin, Clock, Users, CheckCircle2, Sparkles, Smartphone } from 'lucide-react';
import { getWeekdayLabel } from '@/lib/weekday';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-match-rsvp`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

const POSITIONS = ['Goleiro', 'Fixo', 'Ala', 'Pivô', 'Zagueiro', 'Meia', 'Atacante'] as const;

type MatchInfo = {
  match: {
    id: string;
    date: string;
    time: string;
    location: string | null;
    status: string;
    openForConfirmation: boolean;
  };
  pelada: {
    id: string;
    name: string;
    location: string;
    weekday: number;
    time: string;
    game_type: string;
    max_players: number;
  };
  confirmedCount: number;
  confirmed: { name: string }[];
};

const PublicMatchRsvp = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<MatchInfo | null>(null);
  const [name, setName] = useState('');
  const [position, setPosition] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<null | { status: string; name: string }>(null);
  const [errors, setErrors] = useState<{ name?: string; position?: string }>({});

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await fetch(`${FUNCTION_URL}?matchId=${matchId}`, {
          headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro ao carregar partida');
        setInfo(data);
      } catch (e: any) {
        toast({ title: 'Erro', description: e.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    };
    if (matchId) fetchInfo();
  }, [matchId, toast]);

  const validate = () => {
    const errs: { name?: string; position?: string } = {};
    const trimmed = name.trim();
    if (trimmed.length < 2) errs.name = 'Informe seu nome (mín. 2 caracteres)';
    else if (trimmed.length > 60) errs.name = 'Nome muito longo';
    if (!position) errs.position = 'Selecione sua posição';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !matchId) return;

    setSubmitting(true);
    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ matchId, name: name.trim(), position }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível confirmar');

      setConfirmed({ status: data.status, name: name.trim() });
      toast({
        title: data.status === 'Confirmado' ? 'Presença confirmada!' : 'Você está na lista de espera',
      });
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <p className="text-foreground">Partida não encontrada.</p>
          <Link to="/" className="text-primary underline">Ir para o app</Link>
        </div>
      </div>
    );
  }

  const { match, pelada, confirmedCount } = info;
  const matchDate = new Date(`${match.date}T00:00:00`);
  const dateLabel = matchDate.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  const vagas = pelada.max_players - confirmedCount;
  const closed = !['scheduled', 'criada', 'confirmacoes_abertas'].includes(match.status) || !match.openForConfirmation;

  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="px-4 py-4 border-b border-border">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <span className="font-display text-primary text-lg tracking-wider">EleveFut</span>
          <Link to="/register" className="text-xs text-muted-foreground hover:text-foreground">
            Criar conta
          </Link>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-5">
        {/* Match card */}
        <section className="fifa-card p-5 animate-slide-up">
          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">
            {pelada.game_type}
          </span>
          <h1 className="text-2xl font-display tracking-wider text-foreground mt-2">
            {pelada.name}
          </h1>
          <div className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-center gap-3 text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span className="capitalize">{dateLabel}</span>
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <Clock className="h-4 w-4 text-primary" />
              {match.time.slice(0, 5)}
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <MapPin className="h-4 w-4 text-primary" />
              {match.location || pelada.location}
            </div>
            <div className="flex items-center gap-3 text-foreground">
              <Users className="h-4 w-4 text-primary" />
              {confirmedCount}/{pelada.max_players} confirmados
              {vagas > 0 && !closed && (
                <span className="text-xs text-muted-foreground">
                  • {vagas} vaga{vagas > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Confirmation form OR success */}
        {confirmed ? (
          <section className="fifa-card p-6 text-center animate-slide-up space-y-4">
            <div className="flex justify-center">
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {confirmed.status === 'Confirmado'
                  ? 'Presença confirmada!'
                  : 'Você entrou na lista de espera'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Beleza, {confirmed.name}! Te vejo em campo. ⚽
              </p>
            </div>

            {/* App promo */}
            <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/30 rounded-xl p-4 text-left space-y-3">
              <div className="flex items-start gap-3">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Quer acompanhar suas estatísticas?
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Crie sua conta no EleveFut e tenha card de jogador, gols, assistências, MVPs e ranking da pelada.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/register" className="flex-1">
                  <Button variant="sport" className="w-full" size="sm">
                    <Smartphone className="h-4 w-4 mr-1" />
                    Criar conta grátis
                  </Button>
                </Link>
                <Link to="/login" className="flex-1">
                  <Button variant="outline" className="w-full" size="sm">
                    Já tenho conta
                  </Button>
                </Link>
              </div>
            </div>
          </section>
        ) : closed ? (
          <section className="fifa-card p-6 text-center animate-slide-up">
            <p className="text-foreground font-medium">Confirmações encerradas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Fale com o organizador da pelada.
            </p>
          </section>
        ) : (
          <section className="fifa-card p-5 animate-slide-up">
            <h2 className="font-bold text-foreground mb-1">Confirmar presença</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Sem login. Só preencha seu nome e posição.
            </p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((p) => ({ ...p, name: undefined }));
                  }}
                  placeholder="Seu nome"
                  maxLength={60}
                  aria-invalid={!!errors.name}
                />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="position">Posição</Label>
                <Select
                  value={position}
                  onValueChange={(v) => {
                    setPosition(v);
                    if (errors.position) setErrors((p) => ({ ...p, position: undefined }));
                  }}
                >
                  <SelectTrigger id="position" aria-invalid={!!errors.position}>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {POSITIONS.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.position && (
                  <p className="text-xs text-destructive">{errors.position}</p>
                )}
              </div>

              <Button type="submit" variant="sport" className="w-full" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : vagas <= 0 ? (
                  'Entrar na lista de espera'
                ) : (
                  'Confirmar presença'
                )}
              </Button>
            </form>
          </section>
        )}

        {/* Confirmed list preview */}
        {info.confirmed.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
              Já confirmados
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {info.confirmed.slice(0, 12).map((p, i) => (
                <div key={i} className="text-sm bg-surface/50 px-3 py-2 rounded-lg truncate">
                  {p.name}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default PublicMatchRsvp;
