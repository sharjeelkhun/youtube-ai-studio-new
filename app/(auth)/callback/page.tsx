'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      console.log('[CALLBACK] Handling auth callback...');

      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error('[CALLBACK] Error getting session:', error);
        router.push('/login?error=auth');
        return;
      }

      if (!session?.user) {
        console.warn('[CALLBACK] No session found, redirecting to login');
        router.push('/login');
        return;
      }

      console.log('[CALLBACK] Session established for user:', session.user.id);

      // Check for plan in URL first, then fallback to cookies
      const searchParams = new URLSearchParams(window.location.search);
      let plan = searchParams.get('plan');

      if (!plan) {
        const cookies = document.cookie.split('; ');
        const pendingPlanCookie = cookies.find(row => row.startsWith('pending_plan='));
        if (pendingPlanCookie) {
          plan = pendingPlanCookie.split('=')[1];
          console.log('[CALLBACK] Found pending plan in cookie:', plan);
        }
      }

      // Check for existing profile and onboarding status
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single() as any;

        if (profileError) {
          console.error('[CALLBACK] Error fetching profile:', profileError);
          // If profile doesn't exist, it's likely a new signup
        }

        // Initialize onboarding data if plan is selected
        if (plan) {
          console.log('[CALLBACK] Updating profile with selected plan:', plan);
          await supabase
            .from('profiles')
            .update({
              onboarding_data: { selectedPlan: plan },
            } as any)
            .eq('id', session.user.id);
        }

        // Intelligent redirect
        if (profile?.onboarding_completed) {
          console.log('[CALLBACK] Onboarding complete, redirecting to dashboard');
          router.push('/dashboard');
        } else {
          console.log('[CALLBACK] Onboarding incomplete or profile missing, redirecting to setup');
          router.push('/setup');
        }
      } catch (err) {
        console.error('[CALLBACK] Unexpected error during profile check:', err);
        router.push('/dashboard'); // Fallback redirect
      }
    };

    handleAuthCallback();
  }, [router]);

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