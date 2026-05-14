import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Loader2,
  CalendarDays,
  MapPin,
  Clock,
  Users,
  CheckCircle2,
  Download,
} from 'lucide-react';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/public-match-rsvp`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=app.lovable.elevefut';

type MatchInfo = {
  match: {
    id: string;
    date: string;
    time: string;
    location: string | null;
    status: string;
    openForConfirmation: boolean;
    pelada_id?: string;
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

const fetchInfo = async (matchId: string): Promise<MatchInfo> => {
  const res = await fetch(`${FUNCTION_URL}?matchId=${matchId}`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Erro ao carregar partida');
  return data;
};

const PublicRsvp = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [info, setInfo] = useState<MatchInfo | null>(null);
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<null | { status: string; name: string }>(
    null,
  );
  const [nameError, setNameError] = useState<string | undefined>();

  // Initial load
  useEffect(() => {
    if (!matchId) return;
    fetchInfo(matchId)
      .then(setInfo)
      .catch((e) =>
        toast({ title: 'Erro', description: e.message, variant: 'destructive' }),
      )
      .finally(() => setLoading(false));
  }, [matchId, toast]);

  // Realtime: refetch on any participant change for this match
  useEffect(() => {
    if (!matchId) return;
    const channel = supabase
      .channel(`public-rsvp-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'match_participants',
          filter: `match_id=eq.${matchId}`,
        },
        () => {
          fetchInfo(matchId).then(setInfo).catch(() => {});
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId]);

  const dateLabel = useMemo(() => {
    if (!info) return '';
    const d = new Date(`${info.match.date}T00:00:00`);
    return d.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  }, [info]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchId) return;
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setNameError('Informe seu nome (mín. 2 caracteres)');
      return;
    }
    if (trimmed.length > 60) {
      setNameError('Nome muito longo');
      return;
    }
    setNameError(undefined);
    setSubmitting(true);
    try {
      const res = await fetch(FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: ANON_KEY,
          Authorization: `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ matchId, name: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível confirmar');
      setConfirmed({ status: data.status, name: trimmed });
      toast({
        title:
          data.status === 'Confirmado'
            ? 'Presença confirmada!'
            : 'Você está na lista de espera',
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
          <Link to="/" className="text-primary underline">
            Ir para o app
          </Link>
        </div>
      </div>
    );
  }

  const { match, pelada, confirmedCount } = info;
  const vagas = pelada.max_players - confirmedCount;
  const closed = match.status !== 'scheduled' || !match.openForConfirmation;
  const ogTitle = `${pelada.name} • ${dateLabel} ${match.time.slice(0, 5)}`;
  const ogDesc = `Confirme sua presença na pelada. ${confirmedCount}/${pelada.max_players} confirmados.`;

  return (
    <div className="min-h-screen bg-background pb-20">
      <Helmet>
        <title>{ogTitle} — EleveFut</title>
        <meta name="description" content={ogDesc} />
        <meta property="og:title" content={ogTitle} />
        <meta property="og:description" content={ogDesc} />
        <meta property="og:type" content="website" />
      </Helmet>

      {/* Green header */}
      <header className="bg-primary text-primary-foreground px-4 py-5">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="font-display text-lg tracking-wider">EleveFut</span>
            <Link
              to="/register"
              className="text-xs opacity-80 hover:opacity-100"
            >
              Criar conta
            </Link>
          </div>
          <h1 className="text-2xl font-bold leading-tight">{pelada.name}</h1>
          <p className="text-sm opacity-90 capitalize mt-1">
            {dateLabel} • {match.time.slice(0, 5)}
          </p>
        </div>
      </header>

      <main className="max-w-md mx-auto p-4 space-y-4">
        {/* Match info card */}
        <section className="fifa-card p-4 space-y-2.5 text-sm">
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
        </section>

        {/* Form / closed / confirmed */}
        {confirmed ? (
          <section className="fifa-card p-5 text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">
                {confirmed.status === 'Confirmado'
                  ? 'Presença confirmada!'
                  : 'Você está na lista de espera'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Beleza, {confirmed.name}! Te vejo em campo. ⚽
              </p>
            </div>
          </section>
        ) : closed ? (
          <section className="fifa-card p-5 text-center">
            <p className="text-foreground font-medium">Confirmações encerradas</p>
            <p className="text-sm text-muted-foreground mt-1">
              Fale com o organizador da pelada.
            </p>
          </section>
        ) : (
          <section className="fifa-card p-4">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="name">Seu nome</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (nameError) setNameError(undefined);
                  }}
                  placeholder="Digite seu nome"
                  maxLength={60}
                  autoFocus
                  aria-invalid={!!nameError}
                />
                {nameError && (
                  <p className="text-xs text-destructive">{nameError}</p>
                )}
              </div>
              <Button
                type="submit"
                variant="sport"
                className="w-full h-12 text-base"
                disabled={submitting}
              >
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

        {/* Confirmed list (realtime) */}
        {info.confirmed.length > 0 && (
          <section className="space-y-2">
            <h3 className="text-xs uppercase tracking-wider text-muted-foreground">
              Já confirmados ({info.confirmed.length})
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {info.confirmed.map((p, i) => (
                <div
                  key={i}
                  className="text-sm bg-surface/50 px-3 py-2 rounded-lg truncate"
                >
                  {p.name}
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Discreet download banner only after confirming */}
      {confirmed && (
        <div className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur border-t border-border p-3 z-50">
          <div className="max-w-md mx-auto flex items-center justify-between gap-3">
            <p className="text-xs text-foreground">
              Organiza peladas?{' '}
              <span className="text-muted-foreground">Baixe o EleveFut grátis.</span>
            </p>
            <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="sport" className="h-9">
                <Download className="h-4 w-4 mr-1" />
                Baixar
              </Button>
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicRsvp;
