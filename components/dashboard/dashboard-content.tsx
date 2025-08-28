"use client"

import { useState, useEffect } from 'react';
import { useYouTubeChannel } from '@/contexts/youtube-channel-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Youtube, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { OverviewTab } from './overview-tab';
import { VideosTab } from './videos-tab';
import { AnalyticsTab } from './analytics-tab';
import { SettingsTab } from '@/components/dashboard/settings-tab';

interface DashboardContentProps {
  userId?: string;
  email: string;
  channelId?: string;
}

export default function DashboardContent({ userId, email, channelId }: DashboardContentProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const { channel, loading, error, refreshChannel } = useYouTubeChannel();
  const router = useRouter();

  useEffect(() => {
    console.log('DashboardContent - Initial state:', {
      userId,
      email,
      channelId,
      hasChannel: !!channel,
      loading
    });

    if (channelId) {
      refreshChannel();
    }
  }, [channelId, refreshChannel]);

  // If no userId is provided, show loading or redirect
  if (!userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Card className="border-2 border-dashed border-muted-foreground/25">
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="mt-2 h-4 w-3/4" />
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Skeleton className="mb-6 h-24 w-24 rounded-full" />
            <Skeleton className="mb-2 h-6 w-1/2" />
            <Skeleton className="mb-6 h-4 w-3/4" />
            <Skeleton className="h-10 w-48" />
          </CardContent>
          <CardFooter className="justify-center border-t bg-muted/20 py-4">
            <Skeleton className="h-4 w-1/2" />
          </CardFooter>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => refreshChannel()}>Retry</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // If no channel is connected, show a connection prompt
  if (!channel) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>

        <Card className="border-2 border-dashed border-muted-foreground/25">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              Connect Your YouTube Channel
            </CardTitle>
            <CardDescription>
              Connect your YouTube channel to see personalized analytics and AI-powered recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-red-500/10 mb-6">
              <Youtube className="h-12 w-12 text-red-500" />
            </div>
            <h3 className="text-xl font-medium mb-2">No YouTube Channel Connected</h3>
            <p className="text-center text-muted-foreground max-w-md mb-6">
              Connect your YouTube channel to unlock personalized analytics, content suggestions, and optimization
              tools.
            </p>
            <Button
              onClick={() => router.push("/connect-channel")}
              className="bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
            >
              Connect YouTube Channel
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
          <CardFooter className="justify-center border-t bg-muted/20 py-4">
            <p className="text-sm text-muted-foreground">
              Your data is secure and we only request read-only access to your channel.
            </p>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-600">Welcome back, {email}</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="videos">Videos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab channelData={channel} isLoading={loading} />
        </TabsContent>

        <TabsContent value="videos">
            <VideosTab />
        </TabsContent>

        <TabsContent value="analytics">
          <AnalyticsTab channelData={channel} isLoading={loading} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
