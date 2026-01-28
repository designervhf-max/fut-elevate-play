import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, CheckCircle, XCircle, Clock, Search, X, UserPlus, Hourglass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import CollapsibleSection from '@/components/CollapsibleSection';
import PositionBadge from '@/components/PositionBadge';
import BottomActionBar from '@/components/BottomActionBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type Participant = {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  guest_position: string | null;
  status: string;
  profile?: {
    id: string;
    name: string;
    position: string;
    avatar_url: string | null;
    overall_rating: number;
  };
};

type MatchInfo = {
  id: string;
  match_date: string;
  pelada: {
    id: string;
    name: string;
  };
};

const MatchParticipants = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [matchInfo, setMatchInfo] = useState<MatchInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!matchId) return;

      // Fetch match info
      const { data: match } = await supabase
        .from('matches')
        .select(`
          id,
          match_date,
          pelada:peladas(id, name)
        `)
        .eq('id', matchId)
        .single();

      if (match) {
        setMatchInfo({
          id: match.id,
          match_date: match.match_date,
          pelada: Array.isArray(match.pelada) ? match.pelada[0] : match.pelada
        });
      }

      // Fetch participants
      const { data: participantsData } = await supabase
        .from('match_participants')
        .select('id, user_id, guest_name, guest_position, status')
        .eq('match_id', matchId);

      if (participantsData) {
        const userIds = participantsData
          .filter(p => p.user_id)
          .map(p => p.user_id as string);

        let profiles: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, name, position, avatar_url, overall_rating')
            .in('id', userIds);

          if (profilesData) {
            profiles = profilesData.reduce((acc, p) => {
              acc[p.id] = p;
              return acc;
            }, {} as Record<string, any>);
          }
        }

        const enrichedParticipants = participantsData.map(p => ({
          ...p,
          profile: p.user_id ? profiles[p.user_id] : undefined
        }));

        setParticipants(enrichedParticipants);
      }

      setLoading(false);
    };

    fetchData();
  }, [matchId]);

  // Group participants by status
  const groupedParticipants = useMemo(() => {
    const filtered = participants.filter(p => {
      if (!searchQuery) return true;
      const name = p.user_id ? p.profile?.name : p.guest_name;
      return name?.toLowerCase().includes(searchQuery.toLowerCase());
    });

    return {
      confirmed: filtered.filter(p => p.status === 'Confirmado'),
      waitlist: filtered.filter(p => p.status === 'Lista de Espera'),
      pending: filtered.filter(p => p.status === 'Pendente'),
      refused: filtered.filter(p => p.status === 'Recusado'),
    };
  }, [participants, searchQuery]);

  const renderParticipantCard = (participant: Participant, index: number) => {
    const isGuest = !participant.user_id;
    const name = isGuest ? participant.guest_name : participant.profile?.name;
    const position = isGuest ? participant.guest_position : participant.profile?.position;
    const avatar = isGuest ? null : participant.profile?.avatar_url;
    const rating = isGuest ? 50 : participant.profile?.overall_rating;
    const initials = name?.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || '?';

    return (
      <div 
        key={participant.id} 
        className="flex items-center gap-3 p-3 bg-card/50 rounded-lg hover:bg-card/80 transition-colors animate-fade-in"
        style={{ animationDelay: `${index * 30}ms` }}
      >
        {/* Avatar with Position Badge */}
        <div className="relative">
          <Avatar className="h-11 w-11 border-2 border-border">
            <AvatarImage src={avatar || undefined} alt={name || ''} />
            <AvatarFallback className="bg-surface text-primary font-bold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          {position && (
            <div className="absolute -bottom-1 -right-1">
              <PositionBadge position={position} size="sm" />
            </div>
          )}
        </div>

        {/* Player Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-medium text-sm truncate">{name}</p>
            {isGuest && (
              <span className="flex-shrink-0 text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                Convidado
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            OVR <span className="text-primary font-bold">{rating}</span>
          </p>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const confirmedCount = groupedParticipants.confirmed.length;
  const waitlistCount = groupedParticipants.waitlist.length;
  const pendingCount = groupedParticipants.pending.length;
  const refusedCount = groupedParticipants.refused.length;

  return (
    <div className="min-h-screen bg-background pb-24 animate-fade-in">
      <div className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="h-10 w-10"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold">Jogadores</h1>
            {matchInfo && (
              <p className="text-sm text-muted-foreground">{matchInfo.pelada.name}</p>
            )}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="fifa-card p-4 mb-5">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold text-primary">{confirmedCount}</p>
                <p className="text-xs text-muted-foreground">Confirmados</p>
              </div>
            </div>
            {waitlistCount > 0 && (
              <>
                <div className="h-8 w-px bg-border" />
                <div>
                  <p className="text-lg font-semibold text-sky-400">{waitlistCount}</p>
                  <p className="text-xs text-muted-foreground">Lista de Espera</p>
                </div>
              </>
            )}
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-lg font-semibold text-warning">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pendentes</p>
            </div>
            <div className="h-8 w-px bg-border" />
            <div>
              <p className="text-lg font-semibold text-muted-foreground">{refusedCount}</p>
              <p className="text-xs text-muted-foreground">Fora</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar jogador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 bg-card border-border"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Collapsible Sections */}
        <div className="space-y-3">
          {confirmedCount > 0 && (
            <CollapsibleSection
              title="Dentro"
              count={confirmedCount}
              icon={<CheckCircle className="h-4 w-4 text-primary" />}
              badgeColor="bg-primary"
              defaultOpen={true}
            >
              {groupedParticipants.confirmed.map((p, i) => renderParticipantCard(p, i))}
            </CollapsibleSection>
          )}

          {waitlistCount > 0 && (
            <CollapsibleSection
              title="Lista de Espera"
              count={waitlistCount}
              icon={<Hourglass className="h-4 w-4 text-sky-400" />}
              badgeColor="bg-sky-500"
              defaultOpen={true}
            >
              {groupedParticipants.waitlist.map((p, i) => renderParticipantCard(p, i))}
            </CollapsibleSection>
          )}

          {pendingCount > 0 && (
            <CollapsibleSection
              title="Pendente"
              count={pendingCount}
              icon={<Clock className="h-4 w-4 text-warning" />}
              badgeColor="bg-warning"
              defaultOpen={true}
            >
              {groupedParticipants.pending.map((p, i) => renderParticipantCard(p, i))}
            </CollapsibleSection>
          )}

          {refusedCount > 0 && (
            <CollapsibleSection
              title="Fora"
              count={refusedCount}
              icon={<XCircle className="h-4 w-4 text-muted-foreground" />}
              badgeColor="bg-muted"
              defaultOpen={false}
            >
              {groupedParticipants.refused.map((p, i) => renderParticipantCard(p, i))}
            </CollapsibleSection>
          )}

          {participants.length === 0 && (
            <div className="text-center py-12 text-muted-foreground animate-fade-in">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum jogador na partida</p>
            </div>
          )}

          {searchQuery && confirmedCount === 0 && pendingCount === 0 && refusedCount === 0 && participants.length > 0 && (
            <div className="text-center py-12 text-muted-foreground animate-fade-in">
              <Search className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum jogador encontrado</p>
              <button
                onClick={() => setSearchQuery('')}
                className="text-primary text-sm mt-2 hover:underline"
              >
                Limpar busca
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Action Bar */}
      <BottomActionBar
        secondaryAction={{
          label: 'Convidar',
          onClick: () => {/* TODO: Implement invite */},
          variant: 'outline',
        }}
        primaryAction={{
          label: 'Adicionar Jogador',
          onClick: () => {/* TODO: Implement add player */},
          icon: <UserPlus className="h-4 w-4 mr-2" />,
        }}
      />
    </div>
  );
};

export default MatchParticipants;
