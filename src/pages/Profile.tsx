import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import BottomNav from '@/components/BottomNav';
import { ChevronLeft, User, Edit2, Loader2 } from 'lucide-react';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="min-h-screen bg-background pb-6">
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
        {/* Profile Header */}
        <section className="text-center animate-slide-up">
          <div className="w-28 h-28 rounded-full bg-surface-elevated border-4 border-primary shadow-neon mx-auto mb-4 flex items-center justify-center">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-14 h-14 text-muted-foreground" />
            )}
          </div>
          <h2 className="text-3xl font-display tracking-wider">{profile.name.toUpperCase()}</h2>
          <p className="text-primary mt-1">{profile.position}</p>
        </section>

        {/* Overall Card */}
        <section className="fifa-card p-6 text-center animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-6xl font-display neon-text mb-2">{profile.overall_rating}</div>
          <p className="text-sm text-muted-foreground uppercase tracking-wider">Overall Rating</p>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-4 gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
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

        {/* Info Cards */}
        <section className="space-y-3 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider">Informações</h3>
          
          <div className="fifa-card p-4">
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
        </section>

        {/* Career Stats */}
        <section className="space-y-3 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <h3 className="text-sm text-muted-foreground uppercase tracking-wider">Carreira</h3>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="fifa-card p-4 text-center">
              <div className="text-3xl font-display neon-text">{profile.total_goals}</div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Gols</p>
            </div>
            <div className="fifa-card p-4 text-center">
              <div className="text-3xl font-display neon-text">{profile.total_assists}</div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Assistências</p>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Profile;
