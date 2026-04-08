import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import { ChevronLeft, ChevronRight, User, Lock, Crown, LogOut, Loader2 } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPro, isAdmin, isFree, trialDaysLeft, trialActive } = useSubscription();

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({ title: 'Erro', description: 'Preencha todos os campos', variant: 'destructive' });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: 'Erro', description: 'A senha deve ter no mínimo 6 caracteres', variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: 'Erro', description: 'As senhas não coincidem', variant: 'destructive' });
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setChangingPassword(false);

    if (error) {
      toast({ title: 'Erro', description: 'Não foi possível alterar a senha', variant: 'destructive' });
      return;
    }

    toast({ title: 'Sucesso', description: 'Senha alterada com sucesso!' });
    setNewPassword('');
    setConfirmPassword('');
    setShowPasswordSection(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const planLabel = isAdmin ? 'Admin' : isPro ? 'Pro' : 'Free';
  const planDescription = isAdmin
    ? 'Acesso total permanente'
    : isPro && trialActive
    ? `Trial Pro — ${trialDaysLeft} dias restantes`
    : isPro
    ? 'Plano Pro ativo'
    : 'Plano gratuito';

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-50 glass px-4 py-3 safe-top">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/profile')}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-display tracking-wider">CONFIGURAÇÕES</h1>
        </div>
      </header>

      <main className="p-4 space-y-4">
        {/* Profile Section */}
        <section className="animate-slide-up">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Conta</h2>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <button
              onClick={() => navigate('/profile/edit')}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-elevated transition-colors"
            >
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Editar Perfil</span>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            <div className="border-t border-border" />

            <button
              onClick={() => setShowPasswordSection(!showPasswordSection)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-elevated transition-colors"
            >
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Alterar Senha</span>
              </div>
              <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${showPasswordSection ? 'rotate-90' : ''}`} />
            </button>

            {showPasswordSection && (
              <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword" className="text-xs text-muted-foreground">Nova Senha</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" className="text-xs text-muted-foreground">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                  />
                </div>
                <Button
                  variant="sport"
                  size="sm"
                  className="w-full"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar Nova Senha'}
                </Button>
              </div>
            )}
          </div>
        </section>

        {/* Subscription Section */}
        <section className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Assinatura</h2>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <div className="px-4 py-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Crown className={`h-5 w-5 ${isPro || isAdmin ? 'text-yellow-400' : 'text-muted-foreground'}`} />
                <div>
                  <p className="text-sm font-medium text-foreground">{planLabel}</p>
                  <p className="text-xs text-muted-foreground">{planDescription}</p>
                </div>
              </div>
              {(isPro || isAdmin) && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                  Ativo
                </span>
              )}
            </div>

            {(isFree || (isPro && trialActive)) && (
              <>
                <div className="border-t border-border" />
                <button
                  onClick={() => navigate('/plans')}
                  className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-elevated transition-colors"
                >
                  <span className="text-sm font-medium text-primary">
                    {isFree ? 'Assinar Pro' : 'Ver Planos'}
                  </span>
                  <ChevronRight className="h-4 w-4 text-primary" />
                </button>
              </>
            )}
          </div>
        </section>

        {/* Logout */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-surface rounded-xl border border-border hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">Sair da Conta</span>
          </button>
        </section>
      </main>

      <BottomNav />
    </div>
  );
};

export default Settings;
