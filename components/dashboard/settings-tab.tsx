'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, HardDrive, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useYouTubeChannel } from '@/contexts/youtube-channel-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

export function SettingsTab() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams?.get('settingsTab') || 'channel';
  const { channel, loading } = useYouTubeChannel();
  const [loadingSignOut, setLoadingSignOut] = useState(false);
  const { signOut, user } = useAuth(); // Assuming useAuth exposes user

  // Function to handle tab changes and update URL
  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(window.location.search);
    params.set('settingsTab', value);
    router.push(`/dashboard/settings?${params.toString()}`);
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account, connections and AI preferences</p>
        </div>
      </div>

      <Tabs value={currentTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1 border border-border/40 rounded-xl h-auto w-full md:w-auto">
          <TabsTrigger value="channel" className="gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium transition-all">
            <HardDrive className="h-4 w-4" />
            Channel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="channel" className="space-y-4">
          {!channel ? (
            <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
              <CardHeader>
                <CardTitle>Connect Your YouTube Channel</CardTitle>
                <CardDescription>
                  To get started, you need to connect your YouTube channel. This will allow us to access your channel data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => router.push('/connect-channel')}
                  className="w-full bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-500/20"
                >
                  Connect Channel
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">Connected Channel</CardTitle>
                    <CardDescription>Your synchronized YouTube channel details</CardDescription>
                  </div>
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200 gap-1 px-3 py-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl border border-border/50 bg-muted/20">
                  <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-background shadow-sm">
                    {channel.thumbnail ? (
                      <img src={channel.thumbnail} alt={channel.title} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {channel.title.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{channel.title}</h3>
                    <p className="text-sm text-muted-foreground font-mono bg-muted px-2 py-0.5 rounded-md inline-block">
                      {channel.id}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Last Synced</Label>
                    <p className="font-medium">
                      {channel.last_synced ? new Date(channel.last_synced).toLocaleString() : 'Never'}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Total Videos</Label>
                    <p className="font-medium">{channel.video_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 