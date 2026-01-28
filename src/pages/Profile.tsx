import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import BottomNav from '@/components/BottomNav';
import MatchHistory from '@/components/MatchHistory';
import CareerStats from '@/components/CareerStats';
import MvpShowcase from '@/components/MvpShowcase';
import EvolutionChart from '@/components/EvolutionChart';
import PeladaCareerHistory from '@/components/PeladaCareerHistory';
import DetailedStats from '@/components/DetailedStats';
import PlayerCard from '@/components/PlayerCard';
import SectionCard from '@/components/SectionCard';
import ProfileSkeleton from '@/components/skeletons/ProfileSkeleton';
import { ChevronLeft, Edit2 } from 'lucide-react';
import { useProfile } from '@/hooks/useProfile';

const Profile = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setUserId(session.user.id);
    };

    fetchSession();
  }, [navigate]);

  const { data: profile, isLoading } = useProfile(userId);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  if (isLoading || !userId) {
    return <ProfileSkeleton />;
  }

  if (!profile) {
    return null;
  }

  const isGoalkeeper = profile.position === 'Goleiro';
  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-md mx-auto pb-24">
        {/* Header */}
        <header className="sticky top-0 z-50 glass px-4 py-3 safe-top">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/home')}
                className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-medium">{profile.name}</h1>
            </div>
            <button 
              onClick={() => navigate('/profile/edit')}
              className="p-2 text-muted-foreground hover:text-primary transition-colors"
            >
              <Edit2 className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="p-4 space-y-4">
          {/* Player Card */}
          <section className="animate-slide-up">
            <PlayerCard profile={profile} showShareButton onShare={() => {}} />
          </section>

          {/* Estatísticas Section */}
          <section className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <SectionCard 
              title="Estatísticas" 
              rightLabel={String(currentYear)}
              onClick={() => toggleSection('stats')}
              isExpanded={expandedSection === 'stats'}
              collapsedContent={
                <CareerStats
                  totalGames={profile.total_games || 0}
                  totalGoals={profile.total_goals || 0}
                  totalAssists={profile.total_assists || 0}
                  totalParticipations={profile.total_participations || 0}
                  totalMvps={profile.total_mvps || 0}
                  totalBestDefender={profile.total_best_defender || 0}
                  totalSaves={profile.total_saves || 0}
                  isGoalkeeper={isGoalkeeper}
                />
              }
            >
              <div className="space-y-4">
                <CareerStats
                  totalGames={profile.total_games || 0}
                  totalGoals={profile.total_goals || 0}
                  totalAssists={profile.total_assists || 0}
                  totalParticipations={profile.total_participations || 0}
                  totalMvps={profile.total_mvps || 0}
                  totalBestDefender={profile.total_best_defender || 0}
                  totalSaves={profile.total_saves || 0}
                  isGoalkeeper={isGoalkeeper}
                />
                <div className="pt-4 border-t border-border">
                  <DetailedStats userId={profile.id} />
                </div>
              </div>
            </SectionCard>
          </section>

          {/* Conquistas Section */}
          {(profile.total_mvps || profile.total_best_defender) ? (
            <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <SectionCard 
                title="Conquistas"
                rightLabel={`${(profile.total_mvps || 0) + (profile.total_best_defender || 0)} títulos`}
                showArrow={false}
              >
                <MvpShowcase 
                  mvpCount={profile.total_mvps || 0} 
                  defenderCount={profile.total_best_defender || 0} 
                />
              </SectionCard>
            </section>
          ) : null}

          {/* Evolução Section */}
          <section className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
            <SectionCard 
              title="Evolução"
              onClick={() => toggleSection('evolution')}
              isExpanded={expandedSection === 'evolution'}
              collapsedContent={
                <p className="text-sm text-muted-foreground">Acompanhe sua evolução ao longo do tempo</p>
              }
            >
              <EvolutionChart userId={profile.id} />
            </SectionCard>
          </section>

          {/* Peladas Section */}
          <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <SectionCard 
              title="Peladas"
              onClick={() => toggleSection('peladas')}
              isExpanded={expandedSection === 'peladas'}
              collapsedContent={
                <p className="text-sm text-muted-foreground">Suas peladas ativas</p>
              }
            >
              <PeladaCareerHistory userId={profile.id} />
            </SectionCard>
          </section>

          {/* Histórico Section */}
          <section className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
            <SectionCard 
              title="Histórico de Jogos"
              onClick={() => toggleSection('history')}
              isExpanded={expandedSection === 'history'}
              collapsedContent={
                <p className="text-sm text-muted-foreground">Ver todos os jogos realizados</p>
              }
            >
              <MatchHistory userId={profile.id} />
            </SectionCard>
          </section>

          {/* Sobre Section */}
          <section className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
            <SectionCard 
              title="Sobre"
              showArrow={false}
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Idade</p>
                  <p className="text-sm font-medium text-foreground">{profile.age} anos</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Posição</p>
                  <p className="text-sm font-medium text-foreground">{profile.position}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Camisa</p>
                  <p className="text-sm font-medium text-foreground">#{profile.shirt_number}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pé Dominante</p>
                  <p className="text-sm font-medium text-foreground">{profile.dominant_foot}</p>
                </div>
              </div>
            </SectionCard>
          </section>
        </main>

        <BottomNav />
      </div>
    </div>
  );
};

export default Profile;
