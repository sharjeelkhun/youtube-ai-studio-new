"use client"

import { useState, useEffect } from 'react';
import { useYouTubeChannel } from '@/contexts/youtube-channel-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Youtube, ArrowRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useRouter, useSearchParams } from 'next/navigation';
import { OverviewTab } from './overview-tab';
import { VideosTab } from './videos-tab';
import { AnalyticsTab } from './analytics-tab';
import { SettingsTab } from '@/components/dashboard/settings-tab';
import { SuggestionsTab } from '@/components/tabs/suggestions-tab';
import { ConnectChannelHero } from '@/components/connect-channel-hero';
import { ContinueSetup } from './continue-setup';

interface DashboardContentProps {
  userId?: string;
  email: string;
  channelId?: string;
}

export default function DashboardContent({ userId, email, channelId }: DashboardContentProps) {
  const searchParams = useSearchParams();
  const initialTab = (searchParams?.get('tab') as string) || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
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

  // Keep activeTab in sync with URL changes
  useEffect(() => {
    const tab = (searchParams?.get('tab') as string) || 'overview';
    if (tab !== activeTab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', value);
    const query = params.toString();
    router.replace(`/dashboard${query ? `?${query}` : ''}`);
  };

  if (loading || !userId) {
    return (
      <div className="container mx-auto py-8 space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="space-y-6">
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-10 w-24 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
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

  // If no channel is connected, show a connection prompt along with setup progress
  if (!channel) {
    return (
      <div className="container mx-auto py-8">
        <ContinueSetup />
        <div className="flex-1 flex flex-col pt-8">
          <ConnectChannelHero />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, <span className="font-medium text-foreground">{email}</span>
        </p>
      </div>

      <ContinueSetup />

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1 border border-border/40 rounded-xl h-auto w-full md:w-auto grid grid-cols-2 md:inline-flex md:grid-cols-none">
          {["Overview", "Videos", "Ideas", "Analytics", "Settings"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab.toLowerCase()}
              className="rounded-lg px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium transition-all"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab channelData={channel} isLoading={loading} />
        </TabsContent>

        <TabsContent value="videos">
          <VideosTab channelData={channel} isLoading={loading} />
        </TabsContent>

        <TabsContent value="ideas">
          <SuggestionsTab />
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
