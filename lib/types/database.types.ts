export type Database = {
  public: {
    Tables: {
      content_ideas: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string
          type: string
          status: string
          metrics: Record<string, any>
          metadata: Record<string, any>
          source: string
          created_at: string
          updated_at: string
        }
      }
    }
  }
}
