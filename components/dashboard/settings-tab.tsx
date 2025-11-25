'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter } from 'next/navigation';
import { useYouTubeChannel } from '@/contexts/youtube-channel-context';

export function SettingsTab() {
  const router = useRouter();
  const { channel, loading } = useYouTubeChannel();
  const [loadingSignOut, setLoadingSignOut] = useState(false);
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    setLoadingSignOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoadingSignOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Connect Your YouTube Channel</CardTitle>
            <CardDescription>
              To get started, you need to connect your YouTube channel. This will allow us to access your channel data and provide you with insights.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => router.push('/settings')}
              className="w-full"
            >
              Connect Channel
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Channel Settings</CardTitle>
          <CardDescription>
            Manage your YouTube channel connection and settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">Connected Channel</h3>
              <p className="text-sm text-muted-foreground">
                {channel.title}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Channel ID</h3>
              <p className="text-sm text-muted-foreground">
                {channel.id}
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium">Last Synced</h3>
              <p className="text-sm text-muted-foreground">
                {channel.last_synced ? new Date(channel.last_synced).toLocaleString() : 'Never'}
              </p>
            </div>
            <Button
              onClick={() => router.push('/settings')}
              variant="outline"
            >
              Manage Connection
            </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Account Settings</CardTitle>
          <CardDescription>Manage your account settings and preferences.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium">User ID</h3>
              <p className="text-sm text-gray-500">{channel.id}</p>
            </div>
            <Button variant="destructive" onClick={handleSignOut} disabled={loadingSignOut}>
              {loadingSignOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing out...
                </>
              ) : (
                'Sign Out'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 