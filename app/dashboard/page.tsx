'use client';

import { useSession } from '@/contexts/session-context';
import DashboardContent from '@/components/dashboard/dashboard-content';
import { Loader2 } from 'lucide-react';

export default function DashboardPage() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardContent
        userId={session?.user?.id || undefined}
        email={session?.user?.email || ''}
        channelId={session?.user?.user_metadata?.channel_id}
      />
    </div>
  );
}
