import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Loader2, Users, Shuffle, Minus, Plus, User, Share2 } from 'lucide-react';

type MatchParticipant = {
  id: string;
  user_id: string | null;
  guest_name: string | null;
  status: string;
  team: number | null;
  profile?: {
    id: string;
    name: string;
    position: string;
    avatar_url: string | null;
    overall_rating: number;
  };
};

const TeamDraw = () => {
  const { matchId } = useParams<{ matchId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [participants, setParticipants] = useState<MatchParticipant[]>([]);
  const [playersPerTeam, setPlayersPerTeam] = useState(6);
  const [teamA, setTeamA] = useState<MatchParticipant[]>([]);
  const [teamB, setTeamB] = useState<MatchParticipant[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    fetchParticipants();
  }, [matchId]);

  const fetchParticipants = async () => {
    if (!matchId) return;

    const { data: participantsData } = await supabase
      .from('match_participants')
      .select('*')
      .eq('match_id', matchId)
      .eq('status', 'Confirmado')
      .order('created_at', { ascending: true });

    if (participantsData) {
      const userIds = participantsData
        .filter(p => p.user_id)
        .map(p => p.user_id as string);

      let profilesMap: Record<string, MatchParticipant['profile']> = {};

      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, position, avatar_url, overall_rating')
          .in('id', userIds);

        if (profiles) {
          profilesMap = profiles.reduce((acc, p) => {
            acc[p.id] = {
              id: p.id,
              name: p.name,
              position: p.position,
              avatar_url: p.avatar_url,
              overall_rating: p.overall_rating || 50,
            };
            return acc;
          }, {} as typeof profilesMap);
        }
      }

      const participantsWithProfiles = participantsData.map(p => ({
        ...p,
        profile: p.user_id ? profilesMap[p.user_id] : undefined,
      }));

      setParticipants(participantsWithProfiles as MatchParticipant[]);

      // Calculate suggested players per team
      const confirmed = participantsWithProfiles.length;
      const maxPossible = Math.floor(confirmed / 2);
      const suggested = Math.min(maxPossible, 6);
      setPlayersPerTeam(Math.max(1, suggested));
    }

    setLoading(false);
  };

  const getPlayerName = (p: MatchParticipant) => {
    return p.profile?.name || p.guest_name || 'Jogador';
  };

  const getPlayerRating = (p: MatchParticipant) => {
    return p.profile?.overall_rating || 50;
  };

  const getTeamAverage = (team: MatchParticipant[]) => {
    if (team.length === 0) return 0;
    const total = team.reduce((sum, p) => sum + getPlayerRating(p), 0);
    return Math.round(total / team.length);
  };

  const shuffleTeams = () => {
    const confirmed = [...participants];
    const totalPlayers = playersPerTeam * 2;

    if (confirmed.length < 2) {
      toast({
        title: 'Aviso',
        description: 'Mínimo de 2 jogadores confirmados',
        variant: 'destructive',
      });
      return;
    }

    // Limit to total players needed
    const availablePlayers = confirmed.slice(0, totalPlayers);

    // Sort by overall rating (descending)
    const sorted = [...availablePlayers].sort((a, b) => getPlayerRating(b) - getPlayerRating(a));

    // Snake draft for balanced teams
    const newTeamA: MatchParticipant[] = [];
    const newTeamB: MatchParticipant[] = [];

    sorted.forEach((player, index) => {
      // Alternate between teams in pairs to balance
      const round = Math.floor(index / 2);
      if (round % 2 === 0) {
        // Even rounds: A gets first, B gets second
        if (index % 2 === 0) {
          newTeamA.push(player);
        } else {
          newTeamB.push(player);
        }
      } else {
        // Odd rounds: B gets first, A gets second
        if (index % 2 === 0) {
          newTeamB.push(player);
        } else {
          newTeamA.push(player);
        }
      }
    });

    setTeamA(newTeamA);
    setTeamB(newTeamB);
    setHasDrawn(true);
    toast({ title: 'Times sorteados!' });
  };

  const saveTeams = async () => {
    if (teamA.length === 0 || teamB.length === 0) return;

    setSaving(true);

    // Update team assignments in database
    const updates = [
      ...teamA.map(p => supabase.from('match_participants').update({ team: 1 }).eq('id', p.id)),
      ...teamB.map(p => supabase.from('match_participants').update({ team: 2 }).eq('id', p.id)),
    ];

    await Promise.all(updates);

    setSaving(false);
    toast({ title: 'Times salvos!' });
    navigate(-1);
  };

  const shareOnWhatsApp = () => {
    const teamANames = teamA.map(p => `• ${getPlayerName(p)} (${getPlayerRating(p)})`).join('\n');
    const teamBNames = teamB.map(p => `• ${getPlayerName(p)} (${getPlayerRating(p)})`).join('\n');
    
    const message = `⚽ *TIMES SORTEADOS* ⚽

🟢 *TIME A* (OVR ${getTeamAverage(teamA)})
${teamANames}

🔵 *TIME B* (OVR ${getTeamAverage(teamB)})
${teamBNames}

🎯 Diferença: ${Math.abs(getTeamAverage(teamA) - getTeamAverage(teamB))} pontos`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const confirmedCount = participants.length;
  const maxPerTeam = Math.floor(confirmedCount / 2);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-display tracking-wider">SORTEAR TIMES</h1>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Config Section */}
        <section className="fifa-card p-4 animate-slide-up">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">
                {confirmedCount} confirmados
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Jogadores por time:</p>
            <div className="flex items-center justify-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPlayersPerTeam(prev => Math.max(1, prev - 1))}
                disabled={playersPerTeam <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <div className="text-4xl font-display text-primary min-w-[60px] text-center">
                {playersPerTeam}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setPlayersPerTeam(prev => Math.min(maxPerTeam || 20, prev + 1))}
                disabled={maxPerTeam > 0 && playersPerTeam >= maxPerTeam}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Total: {playersPerTeam * 2} jogadores em campo
            </p>
          </div>

          <Button
            variant="sport"
            className="w-full mt-4"
            onClick={shuffleTeams}
          >
            <Shuffle className="h-5 w-5 mr-2" />
            Sortear Times
          </Button>
        </section>

        {/* Teams Result */}
        {hasDrawn && (
          <div className="grid grid-cols-2 gap-4 animate-slide-up">
            {/* Team A */}
            <div className="fifa-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg tracking-wider text-primary">TIME A</h3>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                  OVR {getTeamAverage(teamA)}
                </span>
              </div>
              <div className="space-y-2">
                {teamA.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 bg-surface/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center overflow-hidden">
                      {p.profile?.avatar_url ? (
                        <img src={p.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getPlayerName(p)}</p>
                      <p className="text-xs text-muted-foreground">{getPlayerRating(p)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Team B */}
            <div className="fifa-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display text-lg tracking-wider text-primary">TIME B</h3>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded">
                  OVR {getTeamAverage(teamB)}
                </span>
              </div>
              <div className="space-y-2">
                {teamB.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 p-2 bg-surface/50 rounded-lg">
                    <div className="w-8 h-8 rounded-full bg-surface flex items-center justify-center overflow-hidden">
                      {p.profile?.avatar_url ? (
                        <img src={p.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{getPlayerName(p)}</p>
                      <p className="text-xs text-muted-foreground">{getPlayerRating(p)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {hasDrawn && (
          <div className="flex gap-3 animate-slide-up">
            <Button
              variant="outline"
              className="flex-1"
              onClick={shareOnWhatsApp}
            >
              <Share2 className="h-5 w-5 mr-2" />
              WhatsApp
            </Button>
            <Button
              variant="sport"
              className="flex-1"
              onClick={saveTeams}
              disabled={saving}
            >
              {saving ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                'Salvar Times'
              )}
            </Button>
          </div>
        )}

        {/* Available Players */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">
            Jogadores Confirmados ({confirmedCount})
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {participants.map((p) => (
              <div key={p.id} className="flex items-center gap-2 p-3 bg-surface/50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center overflow-hidden border-2 border-primary/30">
                  {p.profile?.avatar_url ? (
                    <img src={p.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{getPlayerName(p)}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-primary font-semibold">{getPlayerRating(p)}</span>
                    <span className="text-xs text-muted-foreground">{p.profile?.position || '-'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TeamDraw;
