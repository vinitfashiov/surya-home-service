import { useNavigate } from 'react-router-dom';
import { useAuth, useMyProvider } from '@/hooks/useSupabaseData';
import ProviderOnboarding from '@/components/provider/ProviderOnboarding';
import { useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function ProviderOnboardingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: provider, isLoading, refetch } = useMyProvider(user?.id);

  // If already completed onboarding or verified → go straight to dashboard
  useEffect(() => {
    if (!isLoading && provider) {
      const alreadyDone =
        provider.is_verified ||
        provider.status === 'active' ||
        localStorage.getItem(`provider_onboarding_completed_${provider.id}`) === 'true' ||
        (provider.aadhaar_number && provider.bank_account_number && provider.latitude);

      if (alreadyDone) {
        navigate('/provider', { replace: true });
      }
    }
  }, [isLoading, provider, navigate]);

  if (isLoading || !provider) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="space-y-4 w-full max-w-lg px-4">
          <Skeleton className="h-12 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    );
  }

  const handleComplete = async () => {
    await refetch();
    navigate('/provider', { replace: true });
  };

  return <ProviderOnboarding provider={provider} onComplete={handleComplete} />;
}
