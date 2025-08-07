"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { useSession } from './session-context'
import { Database } from '@/lib/database.types'

interface YouTubeChannel {
  id: string
  user_id: string
  title: string
  description: string
  thumbnail: string
  subscriber_count: number
  video_count: number
  view_count: number
  access_token: string
  refresh_token: string
  token_expires_at: string
  last_synced: string | null
  created_at: string
  updated_at: string
  watch_time?: number
  likes?: number
  comments?: number
  previous_subscribers?: number
  previous_watch_time?: number
  previous_likes?: number
  previous_comments?: number
}

interface YouTubeChannelContextType {
  channel: YouTubeChannel | null
  loading: boolean
  error: string | null
  isConnected: boolean
  refreshChannel: () => Promise<void>
  channelData: YouTubeChannel | null
  isLoading: boolean
}

const YouTubeChannelContext = createContext<YouTubeChannelContextType>({
  channel: null,
  loading: true,
  error: null,
  isConnected: false,
  refreshChannel: async () => {},
  channelData: null,
  isLoading: true
})

export function YouTubeChannelProvider({ children }: { children: React.ReactNode }) {
  const [channel, setChannel] = useState<YouTubeChannel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { session } = useSession()
  const supabase = createClient()

  const refreshToken = useCallback(async (channelData: YouTubeChannel): Promise<YouTubeChannel> => {
    try {
      const response = await fetch('/api/youtube/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: channelData.refresh_token,
        }),
      })

      const responseData = await response.json();

      if (!response.ok) {
        console.error('Token refresh failed:', {
          status: response.status,
          statusText: response.statusText,
          error: responseData
        });
        
        if (response.status === 401) {
          throw new Error('Invalid refresh token. Please reconnect your channel.');
        }
        throw new Error(responseData.error || 'Failed to refresh token');
      }

      const { access_token, expires_in, refresh_token } = responseData;

      if (!access_token) {
        throw new Error('No access token received from refresh');
      }

      // Update the channel with the new token
      const { error: updateError } = await supabase
        .from('youtube_channels')
        .update({
          access_token,
          refresh_token: refresh_token || channelData.refresh_token,
          token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
        })
        .eq('id', channelData.id)
        .eq('user_id', session?.user?.id)

      if (updateError) {
        console.error('Error updating token in database:', updateError);
        throw new Error('Failed to update token in database');
      }

      // Return updated channel data
      return {
        ...channelData,
        access_token,
        refresh_token: refresh_token || channelData.refresh_token,
        token_expires_at: new Date(Date.now() + expires_in * 1000).toISOString(),
      }
    } catch (error) {
      console.error('Error in refreshToken:', error);
      throw error;
    }
  }, [session?.user?.id])

  const fetchChannelStats = useCallback(async (accessToken: string, channelId: string) => {
    try {
      console.log('Fetching channel stats for channel:', channelId);
      
      // Fetch channel statistics
      const channelResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!channelResponse.ok) {
        const errorData = await channelResponse.json();
        console.error('Channel API error:', errorData);
        throw new Error('Failed to fetch channel statistics');
      }

      const channelData = await channelResponse.json();
      console.log('Channel API response:', channelData);
      
      if (!channelData.items?.length) {
        throw new Error('No channel data found');
      }

      const channelInfo = channelData.items[0];
      console.log('Channel info:', {
        id: channelInfo.id,
        title: channelInfo.snippet.title,
        stats: channelInfo.statistics
      });

      // Fetch video statistics
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&maxResults=50`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!videosResponse.ok) {
        const errorData = await videosResponse.json();
        console.error('Videos API error:', errorData);
        throw new Error('Failed to fetch video statistics');
      }

      const videosData = await videosResponse.json();
      console.log('Videos found:', videosData.items?.length || 0);

      if (!videosData.items?.length) {
        return {
          subscriber_count: parseInt(channelInfo.statistics.subscriberCount || '0'),
          video_count: parseInt(channelInfo.statistics.videoCount || '0'),
          view_count: parseInt(channelInfo.statistics.viewCount || '0'),
          likes: 0,
          comments: 0,
          watch_time: 0,
        };
      }

      const videoIds = videosData.items.map((item: any) => item.id.videoId).join(',');
      console.log('Fetching stats for videos:', videoIds);

      // Fetch detailed video statistics
      const videoStatsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!videoStatsResponse.ok) {
        const errorData = await videoStatsResponse.json();
        console.error('Video stats API error:', errorData);
        throw new Error('Failed to fetch video statistics');
      }

      const videoStatsData = await videoStatsResponse.json();
      console.log('Video stats response:', videoStatsData);
      
      // Calculate total likes and comments
      const totalLikes = videoStatsData.items.reduce((sum: number, video: any) => {
        return sum + parseInt(video.statistics.likeCount || '0');
      }, 0);

      const totalComments = videoStatsData.items.reduce((sum: number, video: any) => {
        return sum + parseInt(video.statistics.commentCount || '0');
      }, 0);

      const stats = {
        subscriber_count: parseInt(channelInfo.statistics.subscriberCount || '0'),
        video_count: parseInt(channelInfo.statistics.videoCount || '0'),
        view_count: parseInt(channelInfo.statistics.viewCount || '0'),
        likes: totalLikes,
        comments: totalComments,
        watch_time: 0, // This would require additional API calls to get watch time
      };

      console.log('Calculated stats:', stats);
      return stats;
    } catch (error) {
      console.error('Error fetching channel stats:', error);
      throw error;
    }
  }, []);

  const fetchChannel = useCallback(async () => {
    if (!session?.user?.id) {
      console.log('No user ID available');
      setLoading(false);
      return;
    }

    console.log('Fetching YouTube channel for user:', session.user.id);
    setLoading(true);
    setError(null);

    try {
      // First try to get the channel from the database
      const { data: channelData, error: channelError } = await supabase
        .from('youtube_channels')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (channelError || !channelData) {
        if (channelError && channelError.code !== 'PGRST116') { // Ignore 'not found' errors
          console.error('Error fetching channel from DB:', channelError)
          throw new Error('Failed to fetch channel from database')
        }
        console.log('No channel found in DB, user needs to connect.')
        setChannel(null)
      } else {
        console.log('Found channel in database:', {
          id: channelData.id,
          title: channelData.title,
          hasAccessToken: !!channelData.access_token,
          hasRefreshToken: !!channelData.refresh_token,
          tokenExpiresAt: channelData.token_expires_at,
          lastSynced: channelData.last_synced
        })

        let currentChannel = channelData as YouTubeChannel
        const tokenExpiresAt = new Date(currentChannel.token_expires_at).getTime()
        const now = Date.now()
        
        // Refresh token if it's expired or close to expiring
        if (now >= tokenExpiresAt - 5 * 60 * 1000) {
          console.log('Token has expired or is expiring soon, refreshing...');
          try {
            currentChannel = await refreshToken(currentChannel)
          } catch (error) {
            console.error('Failed to refresh token:', error)
            setError('Failed to refresh token. Please try reconnecting your channel.')
            setChannel(null)
            setLoading(false)
            return
          }
        }
        
        // Fetch fresh stats if not synced recently
        const lastSynced = channelData.last_synced ? new Date(channelData.last_synced).getTime() : 0
        if (now - lastSynced > 5 * 60 * 1000) { // 5 minutes
          console.log('Channel not synced recently, fetching fresh stats...')
          try {
            const stats = await fetchChannelStats(currentChannel.access_token, currentChannel.id)
            
            const updatedChannel = {
              ...currentChannel,
              ...stats,
              last_synced: new Date().toISOString()
            }
            
            // Update database with new stats
            const { error: updateError } = await supabase
              .from('youtube_channels')
              .update({
                subscriber_count: stats.subscriber_count,
                video_count: stats.video_count,
                view_count: stats.view_count,
                likes: stats.likes,
                comments: stats.comments,
                last_synced: updatedChannel.last_synced
              })
              .eq('id', currentChannel.id)

            if (updateError) {
              console.error('Error updating channel stats in DB:', updateError)
              // Don't throw, just log the error and continue with the stale data
            }
            
            setChannel(updatedChannel)
          } catch (error) {
            console.error('Error fetching fresh channel stats:', error)
            setError('Could not update channel statistics.')
            setChannel(currentChannel); // Fallback to DB data
          }
        } else {
          console.log('Using existing channel data:', channelData)
          setChannel(channelData as YouTubeChannel)
        }
      }
    } catch (error: any) {
      console.error('Error in fetchChannel:', error)
      setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, refreshToken, fetchChannelStats])

  useEffect(() => {
    console.log('YouTube channel context - Session state:', {
      hasSession: !!session,
      userId: session?.user?.id,
      sessionLoading: !session
    })

    if (session?.user?.id) {
      fetchChannel()
    } else {
      setChannel(null)
      setLoading(false)
    }
  }, [session?.user?.id, fetchChannel])

  const refreshChannel = useCallback(async () => {
    await fetchChannel()
  }, [fetchChannel])

  return (
    <YouTubeChannelContext.Provider
      value={{
        channel,
        loading,
        error,
        isConnected: !!channel,
        refreshChannel,
        channelData: channel,
        isLoading: loading
      }}
    >
      {children}
    </YouTubeChannelContext.Provider>
  )
}

export function useYouTubeChannel() {
  const context = useContext(YouTubeChannelContext)
  if (!context) {
    throw new Error('useYouTubeChannel must be used within a YouTubeChannelProvider')
  }
  return {
    ...context,
    channelData: context.channel,
    isLoading: context.loading
  }
}
