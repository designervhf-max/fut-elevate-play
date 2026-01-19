import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import MatchHistory from '@/components/MatchHistory';
import AvatarUpload from '@/components/AvatarUpload';
import CareerStats from '@/components/CareerStats';
import MvpShowcase from '@/components/MvpShowcase';
import EvolutionChart from '@/components/EvolutionChart';
import PeladaCareerHistory from '@/components/PeladaCareerHistory';
import DetailedStats from '@/components/DetailedStats';
import { ChevronLeft, Edit2, Loader2, History, BarChart3, TrendingUp, Users, Activity } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'evolution' | 'peladas' | 'analysis'>('stats');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  const handleAvatarUpdate = (url: string) => {
    if (profile) {
      setProfile({ ...profile, avatar_url: url });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const stats = [
    { label: 'ATA', value: profile.attack_rating },
    { label: 'DEF', value: profile.defense_rating },
    { label: 'HAB', value: profile.skill_rating },
    { label: 'FOR', value: profile.strength_rating },
  ];

  const isGoalkeeper = profile.position === 'Goleiro';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-display tracking-wider">MEU PERFIL</h1>
          </div>
          <button 
            onClick={() => navigate('/profile/edit')}
            className="p-2 text-muted-foreground hover:text-primary transition-colors"
          >
            <Edit2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Profile Header with Avatar Upload */}
        <section className="text-center animate-slide-up">
          <div className="flex justify-center mb-4">
            <AvatarUpload
              userId={profile.id}
              currentAvatarUrl={profile.avatar_url}
              onUploadComplete={handleAvatarUpdate}
              size="lg"
            />
          </div>
          <h2 className="text-3xl font-display tracking-wider">{profile.name.toUpperCase()}</h2>
          <p className="text-primary mt-1">{profile.position}</p>
        </section>

        {/* Overall Rating */}
        <section className="text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/30">
            <span className="text-3xl font-display font-bold text-white">{profile.overall_rating}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wider">Overall</p>
        </section>

        {/* Attribute Stats Grid */}
        <section className="grid grid-cols-4 gap-3 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="stat-circle w-16 h-16 mx-auto mb-2">
                <span className="text-lg font-bold">{stat.value}</span>
              </div>
              <span className="text-xs font-display tracking-wider text-muted-foreground">
                {stat.label}
              </span>
            </div>
          ))}
        </section>

        {/* MVP Showcase */}
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <MvpShowcase 
            mvpCount={profile.total_mvps || 0} 
            defenderCount={profile.total_best_defender || 0} 
          />
        </section>

        {/* Tabs */}
        <section className="animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <div className="grid grid-cols-5 gap-1 mb-4">
            <Button
              variant={activeTab === 'stats' ? 'sport' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('stats')}
              className="text-xs px-1"
            >
              <BarChart3 className="h-3 w-3 mr-0.5" />
              Stats
            </Button>
            <Button
              variant={activeTab === 'analysis' ? 'sport' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('analysis')}
              className="text-xs px-1"
            >
              <Activity className="h-3 w-3 mr-0.5" />
              Análise
            </Button>
            <Button
              variant={activeTab === 'evolution' ? 'sport' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('evolution')}
              className="text-xs px-1"
            >
              <TrendingUp className="h-3 w-3 mr-0.5" />
              Evolução
            </Button>
            <Button
              variant={activeTab === 'peladas' ? 'sport' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('peladas')}
              className="text-xs px-1"
            >
              <Users className="h-3 w-3 mr-0.5" />
              Peladas
            </Button>
            <Button
              variant={activeTab === 'history' ? 'sport' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('history')}
              className="text-xs px-1"
            >
              <History className="h-3 w-3 mr-0.5" />
              Jogos
            </Button>
          </div>

          {activeTab === 'stats' && (
            <div className="space-y-4">
              {/* Career Stats */}
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

              {/* Info Cards */}
              <div className="fifa-card p-4">
                <h3 className="text-sm text-muted-foreground uppercase tracking-wider mb-3">Informações</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Idade</p>
                    <p className="font-semibold">{profile.age} anos</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Camisa</p>
                    <p className="font-semibold">#{profile.shirt_number}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pé Dominante</p>
                    <p className="font-semibold">{profile.dominant_foot}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Preferência</p>
                    <p className="font-semibold">{profile.preferred_game_type || '-'}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'analysis' && (
            <DetailedStats userId={profile.id} />
          )}

          {activeTab === 'evolution' && (
            <EvolutionChart userId={profile.id} />
          )}

          {activeTab === 'peladas' && (
            <PeladaCareerHistory userId={profile.id} />
          )}

          {activeTab === 'history' && (
            <MatchHistory userId={profile.id} />
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
