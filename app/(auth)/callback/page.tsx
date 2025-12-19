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
      const { error } = await supabase.auth.getSession();

      if (error) {
        console.error('Error during auth callback:', error);
        router.push('/login?error=auth');
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

      // Redirect based on plan or default to dashboard
      if (plan) {
        router.push(`/settings?tab=billing&plan=${plan}`);
      } else {
        router.push('/dashboard');
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