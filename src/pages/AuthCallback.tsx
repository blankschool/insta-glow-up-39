import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Processando autenticação...');

  useEffect(() => {
    const handleCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const stateParam = urlParams.get('state');
      const error = urlParams.get('error');

      if (error) {
        setStatus('Erro na autenticação: ' + error);
        setTimeout(() => navigate('/auth?error=unknown'), 2000);
        return;
      }

      if (!code) {
        setStatus('Código de autorização não encontrado');
        setTimeout(() => navigate('/auth?error=unknown'), 2000);
        return;
      }

      // Validate state parameter
      const storedState = localStorage.getItem('oauth_state');
      if (!stateParam || stateParam !== storedState) {
        console.error('State mismatch:', { stateParam, storedState });
        setStatus('Sessão de autenticação inválida');
        localStorage.removeItem('oauth_state');
        setTimeout(() => navigate('/auth?error=invalid_state'), 2000);
        return;
      }

      // Parse state to get login method and redirect
      let loginMethod = 'instagram';
      let redirectTo = '/';
      try {
        const stateData = JSON.parse(atob(stateParam));
        loginMethod = stateData.login_method || 'instagram';
        redirectTo = stateData.redirect_to || '/';
      } catch (e) {
        console.warn('Could not parse state data');
      }

      // Clear stored state
      localStorage.removeItem('oauth_state');

      // Check if user is logged in
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setStatus('Por favor, faça login primeiro');
        // Store the code temporarily to retry after login
        localStorage.setItem('pending_oauth_code', code);
        localStorage.setItem('pending_oauth_method', loginMethod);
        localStorage.setItem('auth_redirect_to', redirectTo);
        setTimeout(() => navigate('/auth?error=no_session'), 2000);
        return;
      }

      try {
        setStatus('Trocando código por token...');
        
        const { data, error: fnError } = await supabase.functions.invoke('instagram-oauth', {
          body: { 
            code,
            user_id: session.user.id,
            provider: loginMethod
          }
        });

        if (fnError) throw fnError;

        if (data?.success) {
          setStatus('Conta conectada com sucesso! Redirecionando...');
          // Clear any old localStorage tokens
          localStorage.removeItem('instagram_access_token');
          localStorage.removeItem('instagram_user_id');
          localStorage.removeItem('demoMode');
          
          setTimeout(() => navigate(redirectTo), 1000);
        } else {
          throw new Error(data?.error || 'Token não recebido');
        }
      } catch (err: any) {
        console.error('OAuth error:', err);
        setStatus('Erro ao processar autenticação: ' + err.message);
        setTimeout(() => navigate('/auth?error=token_exchange_failed'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-foreground">{status}</p>
      </div>
    </div>
  );
}
