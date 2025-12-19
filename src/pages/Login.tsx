import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Mail, Lock, Loader2 } from 'lucide-react';
import elevefutLogo from '@/assets/elevefut-logo.gif';

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    // Master user secret login
    if (email === 'MASTER_USER' && password === 'master@user2025') {
      localStorage.setItem('master_session', 'true');
      setLoading(false);
      toast({ title: 'Acesso Master' });
      navigate('/home');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      toast({
        title: "Erro no login",
        description: "E-mail ou senha incorretos",
        variant: "destructive",
      });
      return;
    }

    // Check if there's a pending game join
    const joinGameId = sessionStorage.getItem('joinGameId');
    if (joinGameId) {
      sessionStorage.removeItem('joinGameId');
      navigate(`/join/${joinGameId}`);
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="mb-12 text-center animate-scale-in w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg px-4">
        <img 
          src={elevefutLogo} 
          alt="EleveFut" 
          className="w-full h-auto mx-auto mb-4"
        />
        <p className="text-muted-foreground text-sm animate-fade-in" style={{ animationDelay: '0.2s' }}>
          Eleve seu jogo
        </p>
      </div>

      {/* Login Form */}
      <div className="w-full max-w-sm space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="text"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm text-muted-foreground">
              Senha
            </Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
          </div>

          <button
            type="button"
            onClick={() => navigate('/forgot-password')}
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            Esqueci minha senha
          </button>

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
              'ENTRAR'
            )}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">ou</span>
          </div>
        </div>

        <Button
          variant="sport-outline"
          size="lg"
          className="w-full"
          onClick={() => navigate('/register')}
        >
          CRIAR CONTA
        </Button>
      </div>

      {/* Footer */}
      <p className="mt-10 text-xs text-muted-foreground animate-fade-in" style={{ animationDelay: '0.3s' }}>
        © {new Date().getFullYear()} EleveFut. Todos os direitos reservados.
      </p>
    </div>
  );
};

export default Login;
