export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      youtube_channels: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          subscribers: number
          videos: number
          thumbnail: string | null
          access_token: string | null
          refresh_token: string | null
          token_expires_at: string | null
          last_updated: string
          created_at: string
        }
        Insert: {
          id: string
          user_id: string
          title: string
          description?: string | null
          subscribers?: number
          videos?: number
          thumbnail?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          last_updated?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          subscribers?: number
          videos?: number
          thumbnail?: string | null
          access_token?: string | null
          refresh_token?: string | null
          token_expires_at?: string | null
          last_updated?: string
          created_at?: string
        }
      }
      videos: {
        Row: {
          id: string
          channel_id: string
          title: string
          description: string | null
          thumbnail: string | null
          status: string | null
          views: number
          likes: number
          comments: number
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          channel_id: string
          title: string
          description?: string | null
          thumbnail?: string | null
          status?: string | null
          views?: number
          likes?: number
          comments?: number
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          title?: string
          description?: string | null
          thumbnail?: string | null
          status?: string | null
          views?: number
          likes?: number
          comments?: number
          published_at?: string | null
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
    }
  }
}
