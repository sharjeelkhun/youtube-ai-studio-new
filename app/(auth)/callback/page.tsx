'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallbackPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuthCallback = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error during auth callback:', error);
        router.push('/login?error=auth');
        return;
      }

      if (!session?.user) {
        router.push('/login');
        return;
      }

      // Check for plan in URL first, then fallback to cookies
      const searchParams = new URLSearchParams(window.location.search);
      let plan = searchParams.get('plan');

      if (!plan) {
        const cookies = document.cookie.split('; ');
        const pendingPlanCookie = cookies.find(row => row.startsWith('pending_plan='));
        if (pendingPlanCookie) {
          plan = pendingPlanCookie.split('=')[1];
        }
      }

      // 3. Check for existing profile and onboarding status
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single();

      // Initialize onboarding data if plan is selected
      if (plan) {
        try {
          await supabase
            .from('profiles')
            .update({
              onboarding_data: { selectedPlan: plan },
            })
            .eq('id', session.user.id);
        } catch (err) {
          console.error('Error saving plan to onboarding data:', err);
        }
      }

      // 4. Intelligent redirect
      if (profile?.onboarding_completed) {
        router.push('/dashboard');
      } else {
        router.push('/setup');
      }
    };

    handleAuthCallback();
  }, [router, supabase.auth]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <h1 className="text-2xl font-bold">Completing authentication...</h1>
        <p className="text-muted-foreground">Please wait while we log you in.</p>
      </div>
    </div>
  );
} 