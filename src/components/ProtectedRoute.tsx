import { Navigate } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: string;
  redirectTo?: string;
}

// Determine default redirect based on role
function getDefaultRedirect(requiredRole: string): string {
  if (requiredRole === 'admin') return '/admin/login';
  if (requiredRole === 'provider' || requiredRole === 'serviceman' || requiredRole === 'provider_employee') {
    return '/provider/login';
  }
  return '/login';
}

export default function ProtectedRoute({ children, requiredRole, redirectTo }: ProtectedRouteProps) {
  const { user, roles, loading } = useAuthContext();
  const fallback = redirectTo ?? getDefaultRedirect(requiredRole);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="space-y-4 w-full max-w-md px-4">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <Skeleton className="h-64 w-full rounded-xl mt-8" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallback} replace />;
  }

  if (!roles.includes(requiredRole)) {
    return <Navigate to={fallback} replace />;
  }

  return <>{children}</>;
}
