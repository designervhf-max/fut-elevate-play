import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BottomNav from '@/components/BottomNav';
import { useToast } from '@/hooks/use-toast';
import { useSubscription } from '@/hooks/useSubscription';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, User, Lock, Crown, LogOut, Trash2, Bell, Loader2 } from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isPro, isAdmin, isFree, trialDaysLeft, trialActive } = useSubscription();

  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(
    typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted'
  );

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

  const handleDeleteAccount = async () => {
    setDeleting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: 'Erro', description: 'Sessão expirada', variant: 'destructive' });
        setDeleting(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('delete-account');

      if (error) {
        toast({ title: 'Erro', description: 'Não foi possível excluir a conta', variant: 'destructive' });
        setDeleting(false);
        return;
      }

      await supabase.auth.signOut();
      navigate('/login');
      toast({ title: 'Conta excluída', description: 'Sua conta foi excluída com sucesso.' });
    } catch {
      toast({ title: 'Erro', description: 'Erro inesperado ao excluir conta', variant: 'destructive' });
      setDeleting(false);
    }
  };

  const handleToggleNotifications = async () => {
    if (!('Notification' in window)) {
      toast({ title: 'Indisponível', description: 'Seu navegador não suporta notificações push', variant: 'destructive' });
      return;
    }

    if (Notification.permission === 'granted') {
      toast({ title: 'Notificações', description: 'As notificações já estão ativas. Para desativar, altere nas configurações do navegador.' });
      return;
    }

    if (Notification.permission === 'denied') {
      toast({ title: 'Bloqueadas', description: 'As notificações foram bloqueadas. Ative nas configurações do navegador.', variant: 'destructive' });
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      toast({ title: 'Ativadas!', description: 'Você receberá lembretes antes das partidas ⚽' });
      
      // Schedule a test notification
      new Notification('EleveFut ⚽', {
        body: 'Notificações ativadas! Você será lembrado antes das partidas.',
        icon: '/favicon.ico',
      });
    } else {
      toast({ title: 'Negadas', description: 'Permissão de notificação negada.', variant: 'destructive' });
    }
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

        {/* Notifications Section */}
        <section className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Notificações</h2>
          <div className="bg-surface rounded-xl border border-border overflow-hidden">
            <button
              onClick={handleToggleNotifications}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-surface-elevated transition-colors"
            >
              <div className="flex items-center gap-3">
                <Bell className={`h-5 w-5 ${notificationsEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <p className="text-sm font-medium text-foreground">Lembretes de Partida</p>
                  <p className="text-xs text-muted-foreground">
                    {notificationsEnabled ? 'Ativas — você será notificado' : 'Toque para ativar notificações'}
                  </p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full transition-colors flex items-center px-0.5 ${notificationsEnabled ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}>
                <div className="w-5 h-5 rounded-full bg-white shadow-sm" />
              </div>
            </button>
          </div>
        </section>

        {/* Subscription Section */}
        <section className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
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
        <section className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-surface rounded-xl border border-border hover:bg-destructive/10 transition-colors"
          >
            <LogOut className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">Sair da Conta</span>
          </button>
        </section>

        {/* Delete Account */}
        <section className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <button
            onClick={() => setShowDeleteDialog(true)}
            className="w-full flex items-center gap-3 px-4 py-3.5 bg-surface rounded-xl border border-destructive/30 hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="h-5 w-5 text-destructive" />
            <div className="text-left">
              <p className="text-sm font-medium text-destructive">Excluir Conta</p>
              <p className="text-xs text-muted-foreground">Esta ação é irreversível</p>
            </div>
          </button>
        </section>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-surface border-border max-w-sm mx-auto">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir conta permanentemente?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              Todos os seus dados serão apagados: perfil, estatísticas, histórico de partidas e participações em peladas. Esta ação <strong className="text-destructive">não pode ser desfeita</strong>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-border text-foreground" disabled={deleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {deleting ? 'Excluindo...' : 'Sim, excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
};

export default Settings;
