import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, User, Hash, ChevronLeft, Loader2, Phone } from 'lucide-react';
import { registerSchema } from '@/lib/profileSchema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const positions = [
  'Goleiro',
  'Fixo',
  'Ala',
  'Pivô',
  'Zagueiro',
  'Meia',
  'Atacante',
];

const dominantFeet = [
  { value: 'Destro', label: 'Destro' },
  { value: 'Canhoto', label: 'Canhoto' },
  { value: 'Ambos', label: 'Ambos' },
];

const getPasswordStrength = (password: string): number => {
  let strength = 0;
  if (password.length >= 6) strength++;
  if (password.length >= 8) strength++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength++;
  if (/\d/.test(password) || /[!@#$%^&*(),.?":{}|<>]/.test(password)) strength++;
  return strength;
};

const getPasswordStrengthText = (password: string): string => {
  const strength = getPasswordStrength(password);
  if (strength <= 1) return 'Fraca';
  if (strength === 2) return 'Razoável';
  if (strength === 3) return 'Boa';
  return 'Forte';
};

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    position: '',
    shirtNumber: '',
    dominantFoot: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleChange = (field: string, value: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    if (field === 'phone') {
      // Apply phone mask (XX) XXXXX-XXXX
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
      setFormData((prev) => ({ ...prev, phone: formatted }));
    } else {
      setFormData((prev) => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = () => {
    const result = registerSchema.safeParse({
      name: formData.name,
      age: parseInt(formData.age),
      position: formData.position,
      shirtNumber: parseInt(formData.shirtNumber),
      dominantFoot: formData.dominantFoot,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? '');
        if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      toast({
        title: 'Verifique os campos',
        description: 'Há informações inválidas no formulário',
        variant: 'destructive',
      });
      return false;
    }

    setErrors({});
    return true;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: formData.email,
      password: formData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          name: formData.name,
          age: parseInt(formData.age),
          position: formData.position,
          shirt_number: parseInt(formData.shirtNumber),
          dominant_foot: formData.dominantFoot,
          phone: formData.phone.replace(/\D/g, ''),
        },
      },
    });

    setLoading(false);

    if (error) {
      const msg = error.message.toLowerCase();
      let description = error.message;

      if (msg.includes('already registered') || msg.includes('already been registered')) {
        description = 'Este e-mail já está cadastrado';
      } else if (msg.includes('weak') || msg.includes('pwned') || msg.includes('known to be')) {
        description = 'Esta senha é muito comum ou apareceu em vazamentos. Escolha uma senha mais forte.';
      } else if (msg.includes('password should be at least')) {
        description = 'A senha deve ter no mínimo 6 caracteres';
      } else if (msg.includes('invalid email')) {
        description = 'E-mail inválido';
      }

      toast({
        title: 'Erro no cadastro',
        description,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: "Conta criada!",
      description: "Vamos calibrar seu perfil",
    });

    // Check if user came from pelada invite
    const joinPeladaId = localStorage.getItem('join_pelada_id');
    if (joinPeladaId) {
      localStorage.removeItem('join_pelada_id');
      navigate(`/join-pelada/${joinPeladaId}`);
    } else {
      navigate('/calibration');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col p-4 safe-top">
      <div className="w-full max-w-sm mx-auto flex flex-col flex-1">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button
          onClick={() => navigate('/login')}
          className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-2xl font-display tracking-wider ml-2">CRIAR CONTA</h1>
      </div>

      {/* Form */}
      <form onSubmit={handleRegister} className="flex-1 space-y-4 overflow-auto pb-6">
        {/* Name */}
        <div className="space-y-2 animate-slide-up">
          <Label htmlFor="name" className="text-sm text-muted-foreground">Nome</Label>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="name"
              placeholder="Seu nome"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        {/* Age */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <Label htmlFor="age" className="text-sm text-muted-foreground">Idade</Label>
          <Input
            id="age"
            type="number"
            min={10}
            placeholder="Mínimo 10 anos"
            value={formData.age}
            onChange={(e) => handleChange('age', e.target.value)}
          />
        </div>

        {/* Position */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <Label className="text-sm text-muted-foreground">Posição</Label>
          <Select value={formData.position} onValueChange={(v) => handleChange('position', v)}>
            <SelectTrigger className="h-12 bg-surface border-border">
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
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <Label htmlFor="shirtNumber" className="text-sm text-muted-foreground">Número da Camisa</Label>
          <div className="relative">
            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="shirtNumber"
              type="number"
              min={1}
              max={99}
              placeholder="1 a 99"
              value={formData.shirtNumber}
              onChange={(e) => handleChange('shirtNumber', e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        {/* Dominant Foot */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <Label className="text-sm text-muted-foreground">Pé Dominante</Label>
          <Select value={formData.dominantFoot} onValueChange={(v) => handleChange('dominantFoot', v)}>
            <SelectTrigger className="h-12 bg-surface border-border">
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              {dominantFeet.map((foot) => (
                <SelectItem key={foot.value} value={foot.value}>{foot.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Email */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.25s' }}>
          <Label htmlFor="email" className="text-sm text-muted-foreground">E-mail</Label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        {/* Phone */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          <Label htmlFor="phone" className="text-sm text-muted-foreground">Telefone</Label>
          <div className="relative">
            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={formData.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.35s' }}>
          <Label htmlFor="password" className="text-sm text-muted-foreground">Senha</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className="pl-12 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {/* Password Strength Indicator */}
          {formData.password && (
            <div className="space-y-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => {
                  const strength = getPasswordStrength(formData.password);
                  return (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= strength
                          ? strength <= 1 ? 'bg-red-500' 
                          : strength <= 2 ? 'bg-yellow-500'
                          : strength <= 3 ? 'bg-lime/70'
                          : 'bg-green-500'
                          : 'bg-surface'
                      }`}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {getPasswordStrengthText(formData.password)}
              </p>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground">Confirmar Senha</Label>
          <div className="relative">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="Repita a senha"
              value={formData.confirmPassword}
              onChange={(e) => handleChange('confirmPassword', e.target.value)}
              className="pl-12 pr-12"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-4 animate-slide-up" style={{ animationDelay: '0.45s' }}>
          <Button
            type="submit"
            variant="sport"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              'CRIAR CONTA'
            )}
          </Button>
        </div>
      </form>
      </div>
    </div>
  );
};

export default Register;
