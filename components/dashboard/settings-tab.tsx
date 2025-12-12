'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, User, HardDrive, Cpu, LogOut, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { useYouTubeChannel } from '@/contexts/youtube-channel-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"

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
    router.push(`/dashboard?${params.toString()}`);
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
        <TabsList className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-1 border border-border/40 rounded-xl h-auto w-full md:w-auto grid grid-cols-3 md:inline-flex md:grid-cols-none">
          <TabsTrigger value="channel" className="gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium transition-all">
            <HardDrive className="h-4 w-4" />
            Channel
          </TabsTrigger>
          <TabsTrigger value="ai" className="gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium transition-all">
            <Cpu className="h-4 w-4" />
            AI Config
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2 rounded-lg px-4 py-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary font-medium transition-all">
            <User className="h-4 w-4" />
            Account
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

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => router.push('/connect-channel')}
                    variant="outline"
                  >
                    Manage Connection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle>AI Preferences</CardTitle>
              <CardDescription>Configure how AI analyzes and generates content for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Default Model</Label>
                  <Select defaultValue="gpt-4">
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Select model" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4 Turbo (Recommended)</SelectItem>
                      <SelectItem value="claude-3">Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="gemini-pro">Gemini 1.5 Pro</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">This model will be used for title and script generation.</p>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label>Creativity Level (Temperature)</Label>
                  <div className="flex items-center gap-4">
                    <Input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="0.7"
                      className="w-full flex-1" // Range inputs might need custom styling
                    />
                    <span className="text-sm font-medium w-8 text-center">0.7</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Higher values make output more creative but less focused.</p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-end border-t border-border/50 pt-6">
              <Button>Save Preferences</Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card className="border-border/50 bg-background/60 backdrop-blur-xl shadow-sm">
            <CardHeader>
              <CardTitle>Profile Details</CardTitle>
              <CardDescription>Manage your personal account settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input value={user?.email || ''} readOnly className="bg-muted text-muted-foreground" />
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="font-medium text-destructive">Danger Zone</h3>
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-xl bg-destructive/5">
                  <div className="space-y-0.5">
                    <div className="font-medium text-destructive">Sign Out</div>
                    <div className="text-sm text-muted-foreground">Securely log out of your session on this device</div>
                  </div>
                  <Button variant="destructive" size="sm" onClick={handleSignOut} disabled={loadingSignOut}>
                    {loadingSignOut ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing out...
                      </>
                    ) : (
                      <>
                        <LogOut className="mr-2 h-4 w-4" />
                        Sign Out
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 