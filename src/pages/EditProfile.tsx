import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import BottomNav from '@/components/BottomNav';
import { ChevronLeft, Camera, Loader2, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';
import { Constants } from '@/integrations/supabase/types';
import { editProfileSchema } from '@/lib/profileSchema';

type Profile = Database['public']['Tables']['profiles']['Row'];

const EditProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [position, setPosition] = useState('');
  const [shirtNumber, setShirtNumber] = useState('');
  const [dominantFoot, setDominantFoot] = useState('');
  const [preferredGameType, setPreferredGameType] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, age, position, shirt_number, dominant_foot, avatar_url, preferred_game_type, overall_rating, attack_rating, defense_rating, skill_rating, strength_rating, total_goals, total_assists, total_saves, total_mvps, total_best_defender, total_games, total_participations, calibration_completed, created_at')
        .eq('id', session.user.id)
        .maybeSingle();

      // Fetch own phone via secure RPC (phone is not exposed via direct select)
      const { data: phoneData } = await supabase.rpc('get_my_phone');

      if (!error && data) {
        setProfile(data as any);
        setName(data.name);
        setAge(data.age.toString());
        setPosition(data.position);
        setShirtNumber(data.shirt_number.toString());
        setDominantFoot(data.dominant_foot);
        setPreferredGameType(data.preferred_game_type || '');
        setPhone(phoneData || '');
        setAvatarUrl(data.avatar_url);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Erro',
        description: 'Por favor, selecione uma imagem',
        variant: 'destructive',
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'Erro',
        description: 'A imagem deve ter no máximo 5MB',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);

    const fileExt = file.name.split('.').pop();
    const filePath = `${profile.id}/avatar.${fileExt}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setUploading(false);
      toast({
        title: 'Erro',
        description: 'Não foi possível fazer upload da imagem',
        variant: 'destructive',
      });
      return;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    // Add timestamp to bust cache
    const urlWithTimestamp = `${publicUrl}?t=${Date.now()}`;
    setAvatarUrl(urlWithTimestamp);
    setUploading(false);

    toast({
      title: 'Sucesso',
      description: 'Foto atualizada!',
    });
  };

  const handleSave = async () => {
    if (!profile) return;

    const parsed = editProfileSchema.safeParse({
      name,
      age: parseInt(age),
      position,
      shirtNumber: parseInt(shirtNumber),
      dominantFoot,
      phone,
      preferredGameType,
    });

    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast({
        title: 'Verifique os campos',
        description: 'Há informações inválidas no formulário',
        variant: 'destructive',
      });
      return;
    }

    setErrors({});

    setSaving(true);

    const { error } = await supabase
      .from('profiles')
      .update({
        name: name.trim(),
        age: parseInt(age),
        position: position as Database['public']['Enums']['player_position'],
        shirt_number: parseInt(shirtNumber),
        dominant_foot: dominantFoot as Database['public']['Enums']['dominant_foot'],
        preferred_game_type: preferredGameType as Database['public']['Enums']['game_type'] || null,
        phone: phone.replace(/\D/g, ''),
        avatar_url: avatarUrl,
      } as any)
      .eq('id', profile.id);

    setSaving(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as alterações',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Sucesso',
      description: 'Perfil atualizado!',
    });
    navigate('/profile');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/profile')}
              className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-display tracking-wider">EDITAR PERFIL</h1>
          </div>
          <Button
            variant="sport"
            size="sm"
            onClick={handleSave}
            disabled={saving}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : 'SALVAR'}
          </Button>
        </div>
      </header>

      <main className="p-4 space-y-6">
        {/* Avatar Upload */}
        <section className="text-center animate-slide-up">
          <div className="relative inline-block">
            <div className="w-28 h-28 rounded-full bg-surface-elevated border-4 border-primary mx-auto flex items-center justify-center overflow-hidden">
              {uploading ? (
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              ) : avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-14 h-14 text-muted-foreground" />
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg"
              disabled={uploading}
            >
              <Camera className="h-5 w-5" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarUpload}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Toque para alterar a foto
          </p>
        </section>

        {/* Form */}
        <section className="space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Seu nome"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Idade *</Label>
              <Input
                id="age"
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="25"
                min="10"
                max="99"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shirtNumber">Camisa *</Label>
              <Input
                id="shirtNumber"
                type="number"
                value={shirtNumber}
                onChange={(e) => setShirtNumber(e.target.value)}
                placeholder="10"
                min="1"
                max="99"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Posição *</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Constants.public.Enums.player_position.map((pos) => (
                  <SelectItem key={pos} value={pos}>
                    {pos}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Pé Dominante *</Label>
            <Select value={dominantFoot} onValueChange={setDominantFoot}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                {Constants.public.Enums.dominant_foot.map((foot) => (
                  <SelectItem key={foot} value={foot}>
                    {foot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Telefone *</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>

          <div className="space-y-2">
            <Label>Tipo de Jogo Preferido</Label>
            <Select value={preferredGameType} onValueChange={setPreferredGameType}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {Constants.public.Enums.game_type.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default EditProfile;
