"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
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
}

const YouTubeChannelContext = createContext<YouTubeChannelContextType>({
  channel: null,
  loading: true,
  error: null,
  isConnected: false,
  refreshChannel: async () => {},
})

// Create a single Supabase client instance
const supabase = createClientComponentClient<Database>()

export function YouTubeChannelProvider({ children }: { children: React.ReactNode }) {
  const [channel, setChannel] = useState<YouTubeChannel | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { session } = useSession()

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

  const fetchChannelStats = async (accessToken: string, channelId: string) => {
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
  };

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

      if (channelError) {
        console.error('Error fetching channel from database:', channelError);
        throw new Error('Failed to fetch channel from database');
      }

      if (channelData) {
        console.log('Found channel in database:', {
          id: channelData.id,
          title: channelData.title,
          hasAccessToken: !!channelData.access_token,
          hasRefreshToken: !!channelData.refresh_token,
          tokenExpiresAt: channelData.token_expires_at,
          stats: {
            subscribers: channelData.subscriber_count,
            videos: channelData.video_count,
            views: channelData.view_count,
            likes: channelData.likes,
            comments: channelData.comments
          }
        });

        // Check if we need to refresh the token
        const tokenExpiry = new Date(channelData.token_expires_at);
        const timeUntilExpiry = tokenExpiry.getTime() - Date.now();
        
        // Refresh token if it's expired or will expire in the next 5 minutes
        if (timeUntilExpiry <= 300000 && channelData.refresh_token) {
          console.log('Token expired or expiring soon, refreshing...');
          try {
            const updatedChannel = await refreshToken(channelData);
            // Fetch fresh statistics
            const stats = await fetchChannelStats(updatedChannel.access_token, updatedChannel.id);
            
            // Update channel with fresh statistics
            const { error: updateError } = await supabase
              .from('youtube_channels')
              .update({
                ...stats,
                last_synced: new Date().toISOString(),
              })
              .eq('id', updatedChannel.id)
              .eq('user_id', session.user.id);

            if (updateError) {
              console.error('Error updating channel stats:', updateError);
            }

            const updatedChannelWithStats = { ...updatedChannel, ...stats };
            console.log('Updated channel with fresh stats:', updatedChannelWithStats);
            setChannel(updatedChannelWithStats);
            setError(null);
          } catch (error) {
            console.error('Token refresh failed:', error);
            const errorMessage = error instanceof Error 
              ? error.message 
              : 'Failed to refresh token. Please try reconnecting your channel.';
            setError(errorMessage);
            setChannel(channelData);
          }
        } else {
          console.log('Using existing channel data:', channelData);
          setChannel(channelData);
          setError(null);
        }
        
        setLoading(false);
        return;
      }

      // If no channel found, check if we have an access token
      const { data: { session: authSession } } = await supabase.auth.getSession()
      if (!authSession?.provider_token) {
        console.log('No provider token available')
        setLoading(false)
        return
      }

      // Fetch channel data from YouTube API
      const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true', {
        headers: {
          Authorization: `Bearer ${authSession.provider_token}`,
        },
      })

      if (!response.ok) {
        const error = await response.json()
        console.error('YouTube API error:', error)
        throw new Error('Failed to fetch channel from YouTube')
      }

      const data = await response.json()
      console.log('YouTube API response:', data);

      if (!data.items?.length) {
        console.log('No channel found in YouTube API response')
        setLoading(false)
        return
      }

      const channelInfo = data.items[0]
      const stats = await fetchChannelStats(authSession.provider_token, channelInfo.id);

      const newChannel = {
        id: channelInfo.id,
        user_id: session.user.id,
        title: channelInfo.snippet.title,
        description: channelInfo.snippet.description,
        thumbnail: channelInfo.snippet.thumbnails.default.url,
        access_token: authSession.provider_token,
        refresh_token: authSession.provider_refresh_token,
        token_expires_at: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour from now
        last_synced: new Date().toISOString(),
        ...stats
      }

      console.log('Creating new channel with stats:', newChannel);

      // Save the channel to the database
      const { error: insertError } = await supabase
        .from('youtube_channels')
        .insert(newChannel)

      if (insertError) {
        console.error('Error saving channel to database:', insertError)
        throw new Error('Failed to save channel to database')
      }

      setChannel(newChannel)
    } catch (err) {
      console.error('Error in fetchChannel:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }, [session?.user?.id, refreshToken])

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
  return context
}
