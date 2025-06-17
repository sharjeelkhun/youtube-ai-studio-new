'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface EmptyChannelStateProps {
  userId: string;
}

export default function EmptyChannelState({ userId }: EmptyChannelStateProps) {
  const [loading, setLoading] = useState(false);

  const handleConnect = async () => {
    setLoading(true);
    try {
      // Redirect to YouTube OAuth
      window.location.href = '/api/youtube/auth';
    } catch (error) {
      console.error('Error connecting channel:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>No YouTube Channel Connected</CardTitle>
        <CardDescription>
          Connect your YouTube channel to start managing your videos and analytics.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleConnect} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect YouTube Channel'
          )}
        </Button>
      </CardContent>
    </Card>
  );
} 