import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Hash, Phone } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Database } from '@/integrations/supabase/types';

type GameType = Database['public']['Enums']['game_type'];

const positions = [
  'Goleiro', 'Fixo', 'Ala', 'Pivô', 'Zagueiro', 'Meia', 'Atacante',
];

const dominantFeet = [
  { value: 'Destro', label: 'Destro' },
  { value: 'Canhoto', label: 'Canhoto' },
  { value: 'Ambos', label: 'Ambos' },
];

const gameTypes: { value: GameType; label: string }[] = [
  { value: 'Futsal', label: 'Futsal' },
  { value: 'Society', label: 'Campo Society' },
  { value: 'Campo', label: 'Campo' },
];

const Setup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [needsProfileData, setNeedsProfileData] = useState(false);
  const [step, setStep] = useState<'profile' | 'game_type'>('game_type');

  const [profileData, setProfileData] = useState({
    name: '',
    age: '',
    position: '',
    shirtNumber: '',
    dominantFoot: '',
    phone: '',
  });

  const [selectedGameType, setSelectedGameType] = useState<GameType | null>(null);

  useEffect(() => {
    const checkProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('name, age, position, shirt_number, dominant_foot, phone')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profile) {
        // Check if profile has default/placeholder values (Google user)
        const isGoogleDefault = profile.age === 18 &&
          profile.position === 'Meia' &&
          profile.shirt_number === 10 &&
          profile.dominant_foot === 'Destro' &&
          !profile.phone;

        if (isGoogleDefault) {
          setNeedsProfileData(true);
          setStep('profile');
          setProfileData(prev => ({
            ...prev,
            name: profile.name || '',
          }));
        }
      }

      setCheckingProfile(false);
    };

    checkProfile();
  }, [navigate]);

  const handlePhoneChange = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    let formatted = digits;
    if (digits.length > 0) {
      formatted = `(${digits.slice(0, 2)}`;
      if (digits.length > 2) {
        formatted += `) ${digits.slice(2, 7)}`;
        if (digits.length > 7) {
          formatted += `-${digits.slice(7, 11)}`;
        }
      }
    }
    setProfileData(prev => ({ ...prev, phone: formatted }));
  };

  const validateProfileData = () => {
    if (!profileData.name || !profileData.age || !profileData.position ||
        !profileData.shirtNumber || !profileData.dominantFoot || !profileData.phone) {
      toast({ title: "Erro", description: "Preencha todos os campos", variant: "destructive" });
      return false;
    }
    const age = parseInt(profileData.age);
    if (isNaN(age) || age < 10 || age > 99) {
      toast({ title: "Erro", description: "Idade deve ser entre 10 e 99", variant: "destructive" });
      return false;
    }
    const shirtNumber = parseInt(profileData.shirtNumber);
    if (isNaN(shirtNumber) || shirtNumber < 1 || shirtNumber > 99) {
      toast({ title: "Erro", description: "Número da camisa deve ser entre 1 e 99", variant: "destructive" });
      return false;
    }
    const phoneDigits = profileData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast({ title: "Erro", description: "Telefone inválido", variant: "destructive" });
      return false;
    }
    return true;
  };

  const handleProfileSubmit = async () => {
    if (!validateProfileData()) return;

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    const phoneDigits = profileData.phone.replace(/\D/g, '');
    const { error } = await supabase
      .from('profiles')
      .update({
        name: profileData.name,
        age: parseInt(profileData.age),
        position: profileData.position as Database['public']['Enums']['player_position'],
        shirt_number: parseInt(profileData.shirtNumber),
        dominant_foot: profileData.dominantFoot as Database['public']['Enums']['dominant_foot'],
        phone: `+55${phoneDigits}`,
      })
      .eq('id', user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar seus dados", variant: "destructive" });
      return;
    }
    setStep('game_type');
  };

  const handleGameTypeSubmit = async () => {
    if (!selectedGameType) {
      toast({ title: "Selecione uma opção", description: "Escolha seu tipo de jogo preferido", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { navigate('/login'); return; }

    const { error } = await supabase
      .from('profiles')
      .update({ preferred_game_type: selectedGameType })
      .eq('id', user.id);

    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível salvar sua preferência", variant: "destructive" });
      return;
    }
    navigate('/calibration');
  };

  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (step === 'profile') {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start p-6 pt-12 safe-top">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8 animate-slide-up">
            <h1 className="text-3xl font-semibold mb-2">Complete seu perfil</h1>
            <p className="text-muted-foreground text-sm">Precisamos de algumas informações para começar</p>
          </div>

          <div className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Nome</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Seu nome"
                  value={profileData.name}
                  onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                  className="pl-12"
                />
              </div>
            </div>

            {/* Age */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Idade</Label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="Sua idade"
                  value={profileData.age}
                  onChange={(e) => setProfileData(prev => ({ ...prev, age: e.target.value }))}
                  className="pl-12"
                  min="10"
                  max="99"
                />
              </div>
            </div>

            {/* Position */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Posição</Label>
              <Select value={profileData.position} onValueChange={(v) => setProfileData(prev => ({ ...prev, position: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione sua posição" />
                </SelectTrigger>
                <SelectContent>
                  {positions.map((pos) => (
                    <SelectItem key={pos} value={pos}>{pos}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Shirt Number */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Número da camisa</Label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="1-99"
                  value={profileData.shirtNumber}
                  onChange={(e) => setProfileData(prev => ({ ...prev, shirtNumber: e.target.value }))}
                  className="pl-12"
                  min="1"
                  max="99"
                />
              </div>
            </div>

            {/* Dominant Foot */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Pé dominante</Label>
              <Select value={profileData.dominantFoot} onValueChange={(v) => setProfileData(prev => ({ ...prev, dominantFoot: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {dominantFeet.map((foot) => (
                    <SelectItem key={foot.value} value={foot.value}>{foot.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Phone */}
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Telefone</Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="tel"
                  placeholder="(XX) XXXXX-XXXX"
                  value={profileData.phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>

            <Button
              variant="sport"
              size="lg"
              className="w-full mt-6"
              onClick={handleProfileSubmit}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Continuar →'}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Game type selection step
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="text-center mb-10 animate-slide-up">
        <h1 className="text-3xl font-semibold mb-2">Configuração</h1>
        <p className="text-muted-foreground">Você prefere jogar:</p>
      </div>

      <div className="w-full max-w-sm space-y-4 mb-10">
        {gameTypes.map((type, index) => (
          <button
            key={type.value}
            onClick={() => setSelectedGameType(type.value)}
            className={`w-full p-5 rounded-xl border-2 transition-all duration-300 animate-slide-up ${
              selectedGameType === type.value
                ? 'border-primary bg-primary/10'
                : 'border-border bg-card hover:border-primary/50'
            }`}
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center justify-center">
              <span className={`font-semibold text-lg ${
                selectedGameType === type.value ? 'text-primary' : 'text-foreground'
              }`}>
                {type.label}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm animate-slide-up" style={{ animationDelay: '0.3s' }}>
        <Button
          variant="sport"
          size="lg"
          className="w-full"
          onClick={handleGameTypeSubmit}
          disabled={loading || !selectedGameType}
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Próximo →'}
        </Button>
      </div>
    </div>
  );
};

export default Setup;
