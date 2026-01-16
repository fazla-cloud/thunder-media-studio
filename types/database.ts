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
      profiles: {
        Row: {
          id: string
          role: 'client' | 'admin' | 'designer' | 'marketer'
          full_name: string | null
          title: string | null
          avatar_url: string | null
          is_active: boolean
          created_at: string
        }
        Insert: {
          id: string
          role: 'client' | 'admin' | 'designer' | 'marketer'
          full_name?: string | null
          title?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          role?: 'client' | 'admin' | 'designer' | 'marketer'
          full_name?: string | null
          title?: string | null
          avatar_url?: string | null
          is_active?: boolean
          created_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          client_id: string
          name: string
          description: string | null
          status: 'active' | 'completed' | 'archived'
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          name: string
          description?: string | null
          status?: 'active' | 'completed' | 'archived'
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          name?: string
          description?: string | null
          status?: 'active' | 'completed' | 'archived'
          created_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          client_id: string
          title: string
          content_type: string
          platform: string
          duration_seconds: number | null
          dimensions: string | null
          brief: string
          status: 'drafts' | 'in_progress' | 'completed' | 'archived'
          assigned_to: string | null
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          client_id: string
          title: string
          content_type: string
          platform: string
          duration_seconds?: number | null
          dimensions?: string | null
          brief: string
          status?: 'drafts' | 'in_progress' | 'completed' | 'archived'
          assigned_to?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          client_id?: string
          title?: string
          content_type?: string
          platform?: string
          duration_seconds?: number | null
          dimensions?: string | null
          brief?: string
          status?: 'drafts' | 'in_progress' | 'completed' | 'archived'
          assigned_to?: string | null
          created_at?: string
        }
      }
      content_types: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      platforms: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      durations: {
        Row: {
          id: string
          label: string
          seconds: number
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          seconds: number
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          seconds?: number
          created_at?: string
        }
      }
      dimensions: {
        Row: {
          id: string
          label: string
          value: string
          created_at: string
        }
        Insert: {
          id?: string
          label: string
          value: string
          created_at?: string
        }
        Update: {
          id?: string
          label?: string
          value?: string
          created_at?: string
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
