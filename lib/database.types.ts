export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      content_ideas: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          type: 'video_idea' | 'script_outline' | 'series_idea' | 'collaboration_idea' | 'tutorial_idea'
          status: 'saved' | 'in_progress' | 'completed' | 'archived'
          metrics: Json
          metadata: Json
          source: 'ai_generated' | 'user_created' | 'imported'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          type?: 'video_idea' | 'script_outline' | 'series_idea' | 'collaboration_idea' | 'tutorial_idea'
          status?: 'saved' | 'in_progress' | 'completed' | 'archived'
          metrics?: Json
          metadata?: Json
          source?: 'ai_generated' | 'user_created' | 'imported'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          type?: 'video_idea' | 'script_outline' | 'series_idea' | 'collaboration_idea' | 'tutorial_idea'
          status?: 'saved' | 'in_progress' | 'completed' | 'archived'
          metrics?: Json
          metadata?: Json
          source?: 'ai_generated' | 'user_created' | 'imported'
          created_at?: string
          updated_at?: string
        }
      },
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          ai_provider: string | null
          ai_settings: Json | null
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          ai_provider?: string | null
          ai_settings?: Json | null
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          ai_provider?: string | null
          ai_settings?: Json | null
        }
      }
      youtube_channels: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          thumbnail: string | null
          subscriber_count: number
          video_count: number
          view_count: number
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          last_synced: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          user_id: string
          title: string
          description?: string | null
          thumbnail?: string | null
          subscriber_count?: number
          video_count?: number
          view_count?: number
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          last_synced?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          thumbnail?: string | null
          subscriber_count?: number
          video_count?: number
          view_count?: number
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          last_synced?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          channel_id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          published_at: string | null
          view_count: number
          like_count: number
          comment_count: number
          duration: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          channel_id: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          published_at?: string | null
          view_count?: number
          like_count?: number
          comment_count?: number
          duration?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          published_at?: string | null
          view_count?: number
          like_count?: number
          comment_count?: number
          duration?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      video_tags: {
        Row: {
          id: number
          video_id: string
          tag: string
        }
        Insert: {
          id?: number
          video_id: string
          tag: string
        }
        Update: {
          id?: number
          video_id?: string
          tag?: string
        }
      }
      analytics_data: {
        Row: {
          id: number
          channel_id: string
          date: string
          views: number
          watch_time: number
          engagement: number
          subscribers: number
          created_at: string
        }
        Insert: {
          id?: number
          channel_id: string
          date: string
          views?: number
          watch_time?: number
          engagement?: number
          subscribers?: number
          created_at?: string
        }
        Update: {
          id?: number
          channel_id?: string
          date?: string
          views?: number
          watch_time?: number
          engagement?: number
          subscribers?: number
          created_at?: string
        }
      }
      youtube_videos: {
        Row: {
          id: string
          channel_id: string
          title: string
          description: string | null
          thumbnail_url: string | null
          published_at: string | null
          view_count: number
          like_count: number
          comment_count: number
          duration: string | null
          status: string
          created_at: string
          updated_at: string
          tags?: string[]
        }
        Insert: {
          id: string
          channel_id: string
          title: string
          description?: string | null
          thumbnail_url?: string | null
          published_at?: string | null
          view_count?: number
          like_count?: number
          comment_count?: number
          duration?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          tags?: string[]
        }
        Update: {
          id?: string
          channel_id?: string
          title?: string
          description?: string | null
          thumbnail_url?: string | null
          published_at?: string | null
          view_count?: number
          like_count?: number
          comment_count?: number
          duration?: string | null
          status?: string
          created_at?: string
          updated_at?: string
          tags?: string[]
        }
      }
    }
  }
}
