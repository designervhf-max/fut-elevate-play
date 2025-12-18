import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import elevefutLogo from '@/assets/elevefut-logo.gif';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast({
        title: 'Erro',
        description: 'Preencha o e-mail',
        variant: 'destructive',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast({
        title: 'Erro',
        description: 'E-mail inválido',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });

    setLoading(false);

    if (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar o e-mail. Tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="text-center animate-slide-up">
          <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-2xl font-display tracking-wider mb-4">
            E-MAIL ENVIADO
          </h1>
          <p className="text-muted-foreground mb-8 max-w-sm">
            Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
          </p>
          <Button
            variant="sport"
            size="lg"
            onClick={() => navigate('/login')}
          >
            VOLTAR AO LOGIN
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/login')}
        className="absolute top-6 left-6 p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>

      {/* Logo */}
      <div className="mb-12 text-center animate-slide-up">
        <img src={elevefutLogo} alt="EleveFut" className="h-20 mx-auto mb-4" />
      </div>

      {/* Form */}
      <div className="w-full max-w-sm space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-display tracking-wider mb-2">
            RECUPERAR SENHA
          </h1>
          <p className="text-muted-foreground text-sm">
            Digite seu e-mail para receber o link de recuperação
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm text-muted-foreground">
              E-mail
            </Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12"
              />
            </div>
          </div>

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
              'ENVIAR LINK'
            )}
          </Button>
        </form>

        <button
          type="button"
          onClick={() => navigate('/login')}
          className="w-full text-sm text-muted-foreground hover:text-primary transition-colors text-center"
        >
          Voltar ao login
        </button>
      </div>
    </div>
  );
};

export default ForgotPassword;
