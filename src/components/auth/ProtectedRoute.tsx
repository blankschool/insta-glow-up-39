import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireConnectedAccount?: boolean;
}

export function ProtectedRoute({ children, requireConnectedAccount = true }: ProtectedRouteProps) {
  const { user, loading, connectedAccounts, loadingAccounts } = useAuth();
  const location = useLocation();

  // Check for demo mode
  const isDemoMode = localStorage.getItem('demoMode') === 'true';

  // Still loading auth state
  if (loading || loadingAccounts) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Demo mode bypass
  if (isDemoMode) {
    return <>{children}</>;
  }

  // No user session - redirect to login
  if (!user) {
    // Store the intended destination
    localStorage.setItem('auth_redirect_to', location.pathname);
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User logged in but no connected account
  if (requireConnectedAccount && connectedAccounts.length === 0) {
    // Store the intended destination
    localStorage.setItem('auth_redirect_to', location.pathname);
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}
