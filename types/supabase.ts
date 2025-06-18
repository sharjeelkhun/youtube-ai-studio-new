export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      channels: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          user_id: string
          channel_id: string
          title: string
          description: string | null
          custom_url: string | null
          thumbnails: Json | null
          subscriber_count: number | null
          video_count: number | null
          view_count: number | null
          last_synced_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id: string
          channel_id: string
          title: string
          description?: string | null
          custom_url?: string | null
          thumbnails?: Json | null
          subscriber_count?: number | null
          video_count?: number | null
          view_count?: number | null
          last_synced_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          user_id?: string
          channel_id?: string
          title?: string
          description?: string | null
          custom_url?: string | null
          thumbnails?: Json | null
          subscriber_count?: number | null
          video_count?: number | null
          view_count?: number | null
          last_synced_at?: string | null
        }
      }
      videos: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          channel_id: string
          video_id: string
          title: string
          description: string | null
          thumbnails: Json | null
          published_at: string | null
          view_count: number | null
          like_count: number | null
          comment_count: number | null
          duration: string | null
          status: string | null
          last_synced_at: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          channel_id: string
          video_id: string
          title: string
          description?: string | null
          thumbnails?: Json | null
          published_at?: string | null
          view_count?: number | null
          like_count?: number | null
          comment_count?: number | null
          duration?: string | null
          status?: string | null
          last_synced_at?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          channel_id?: string
          video_id?: string
          title?: string
          description?: string | null
          thumbnails?: Json | null
          published_at?: string | null
          view_count?: number | null
          like_count?: number | null
          comment_count?: number | null
          duration?: string | null
          status?: string | null
          last_synced_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 