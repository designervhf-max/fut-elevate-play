import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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

        // Sort: Confirmado first, then Pendente, then Recusado
        enrichedParticipants.sort((a, b) => {
          const order = { Confirmado: 0, Pendente: 1, Recusado: 2 };
          return (order[a.status as keyof typeof order] || 2) - (order[b.status as keyof typeof order] || 2);
        });

        setParticipants(enrichedParticipants);
      }

      setLoading(false);
    };

    fetchData();
  }, [matchId]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return <CheckCircle className="h-4 w-4 text-primary" />;
      case 'Recusado':
        return <XCircle className="h-4 w-4 text-destructive" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Confirmado':
        return 'text-primary';
      case 'Recusado':
        return 'text-destructive';
      default:
        return 'text-yellow-500';
    }
  };

  const confirmedCount = participants.filter(p => p.status === 'Confirmado').length;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
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

        {/* Stats */}
        <div className="fifa-card p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="font-medium">Total de jogadores</span>
            </div>
            <span className="text-xl font-bold text-primary">{participants.length}</span>
          </div>
          <div className="flex items-center justify-between mt-2">
            <span className="text-sm text-muted-foreground">Confirmados</span>
            <span className="text-sm font-medium text-primary">{confirmedCount}</span>
          </div>
        </div>

        {/* Players List */}
        <div className="space-y-2">
          {participants.map((participant) => {
            const isGuest = !participant.user_id;
            const name = isGuest ? participant.guest_name : participant.profile?.name;
            const position = isGuest ? participant.guest_position : participant.profile?.position;
            const avatar = isGuest ? null : participant.profile?.avatar_url;
            const rating = isGuest ? 50 : participant.profile?.overall_rating;

            return (
              <div key={participant.id} className="fifa-card p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface border-2 border-border flex items-center justify-center">
                    {avatar ? (
                      <img src={avatar} alt={name || ''} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-primary">
                        {name?.charAt(0) || '?'}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm">{name}</p>
                      {isGuest && (
                        <span className="text-[10px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                          Aleatório
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{position}</span>
                      <span>•</span>
                      <span className="text-primary font-bold">{rating}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(participant.status)}
                  <span className={`text-xs ${getStatusColor(participant.status)}`}>
                    {participant.status}
                  </span>
                </div>
              </div>
            );
          })}

          {participants.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Nenhum jogador na partida</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MatchParticipants;
