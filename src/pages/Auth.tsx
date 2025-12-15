import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Instagram, Facebook, Mail, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Auth = () => {
  const { user, loading, connectedAccounts, connectWithInstagram, connectWithFacebook, signInWithEmail, signUpWithEmail } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'signup'>('login');
  
  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Check for error in URL params
  useEffect(() => {
    const error = searchParams.get('error');
    if (error) {
      const errorMessages: Record<string, string> = {
        'invalid_state': 'Sessão de autenticação expirada. Por favor, tente novamente.',
        'token_exchange_failed': 'Falha ao conectar sua conta. Por favor, tente novamente.',
        'no_session': 'Por favor, faça login antes de conectar uma conta.',
        'unknown': 'Ocorreu um erro. Por favor, tente novamente.',
      };
      toast({
        title: 'Erro de autenticação',
        description: errorMessages[error] || errorMessages['unknown'],
        variant: 'destructive',
      });
    }
  }, [searchParams]);

  // Redirect authenticated users with connected accounts to dashboard
  useEffect(() => {
    if (user && !loading && connectedAccounts.length > 0) {
      const redirectTo = localStorage.getItem('auth_redirect_to') || '/';
      localStorage.removeItem('auth_redirect_to');
      navigate(redirectTo);
    }
  }, [user, loading, connectedAccounts, navigate]);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSigningIn(true);
    
    try {
      if (authTab === 'login') {
        const { error } = await signInWithEmail(email, password);
        if (error) throw error;
        toast({
          title: 'Login realizado',
          description: 'Você está conectado!',
        });
      } else {
        const { error } = await signUpWithEmail(email, password, fullName);
        if (error) throw error;
        toast({
          title: 'Conta criada',
          description: 'Verifique seu email para confirmar o cadastro.',
        });
      }
    } catch (error: any) {
      const errorMessage = error.message === 'Invalid login credentials'
        ? 'Email ou senha incorretos.'
        : error.message === 'User already registered'
          ? 'Este email já está cadastrado.'
          : error.message;
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleInstagramConnect = async () => {
    setIsSigningIn(true);
    try {
      await connectWithInstagram();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao conectar com Instagram.',
        variant: 'destructive',
      });
      setIsSigningIn(false);
    }
  };

  const handleFacebookConnect = async () => {
    setIsSigningIn(true);
    try {
      await connectWithFacebook();
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Ocorreu um erro ao conectar com Facebook.',
        variant: 'destructive',
      });
      setIsSigningIn(false);
    }
  };

  const handleDemoMode = () => {
    localStorage.setItem('demoMode', 'true');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // User is logged in but needs to connect an account
  const needsAccountConnection = user && connectedAccounts.length === 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-secondary">
      <div className="w-full max-w-md animate-slide-up p-8">
        <div className="rounded-3xl border border-border bg-card p-10 shadow-card">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background">
              <Instagram className="h-8 w-8 text-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Painel de Dados</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {needsAccountConnection 
                ? 'Conecte sua conta Instagram ou Facebook para continuar'
                : 'Análise completa do seu perfil Instagram'}
            </p>
          </div>

          {needsAccountConnection ? (
            // Show only Meta connection options
            <div className="space-y-4">
              <p className="text-center text-sm text-muted-foreground mb-4">
                Olá, {user.email}! Conecte uma conta para acessar o painel.
              </p>
              
              {/* Instagram Button */}
              <Button
                onClick={handleInstagramConnect}
                disabled={isSigningIn}
                className="w-full gap-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 py-6 text-sm font-semibold text-white transition-all hover:from-purple-700 hover:to-pink-600 hover:shadow-hover"
              >
                {isSigningIn ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Instagram className="h-5 w-5" />
                )}
                Conectar Instagram
              </Button>

              {/* Facebook Button */}
              <Button
                onClick={handleFacebookConnect}
                disabled={isSigningIn}
                className="w-full gap-3 rounded-xl bg-[#1877F2] py-6 text-sm font-semibold text-white transition-all hover:bg-[#166FE5] hover:shadow-hover"
              >
                {isSigningIn ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Facebook className="h-5 w-5" />
                )}
                Conectar Facebook
              </Button>
            </div>
          ) : (
            // Show full login options
            <div className="space-y-6">
              {/* Meta OAuth Buttons */}
              <div className="space-y-3">
                {/* Instagram Button */}
                <Button
                  onClick={handleInstagramConnect}
                  disabled={isSigningIn}
                  className="w-full gap-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-500 py-6 text-sm font-semibold text-white transition-all hover:from-purple-700 hover:to-pink-600 hover:shadow-hover"
                >
                  {isSigningIn ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Instagram className="h-5 w-5" />
                  )}
                  Continuar com Instagram
                </Button>

                {/* Facebook Button */}
                <Button
                  onClick={handleFacebookConnect}
                  disabled={isSigningIn}
                  className="w-full gap-3 rounded-xl bg-[#1877F2] py-6 text-sm font-semibold text-white transition-all hover:bg-[#166FE5] hover:shadow-hover"
                >
                  {isSigningIn ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Facebook className="h-5 w-5" />
                  )}
                  Continuar com Facebook
                </Button>
              </div>

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">ou</span>
                </div>
              </div>

              {/* Email Auth */}
              <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as 'login' | 'signup')} className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="signup">Criar conta</TabsTrigger>
                </TabsList>
                
                <form onSubmit={handleEmailAuth} className="space-y-4">
                  <TabsContent value="signup" className="mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome completo</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="Seu nome"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="rounded-xl"
                      />
                    </div>
                  </TabsContent>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        className="rounded-xl pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSigningIn}
                    variant="outline"
                    className="w-full gap-2 rounded-xl py-6 text-sm font-medium"
                  >
                    {isSigningIn ? (
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    ) : (
                      <Mail className="h-5 w-5" />
                    )}
                    {authTab === 'login' ? 'Entrar com Email' : 'Criar conta'}
                  </Button>
                </form>
              </Tabs>

              {/* Demo Mode Button */}
              <Button
                variant="ghost"
                onClick={handleDemoMode}
                className="w-full gap-2 rounded-xl py-6 text-sm font-medium text-muted-foreground"
              >
                Ver demonstração
              </Button>
            </div>
          )}

          {/* Info */}
          <div className="mt-6 rounded-xl border border-border bg-secondary/50 p-4">
            <p className="text-center text-xs text-muted-foreground">
              Ao continuar, você autoriza o acesso às informações do seu perfil Instagram.
            </p>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Seus dados estão protegidos e seguros.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;
