import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  },
  global: {
    headers: {
      'X-Client-Info': 'gabi-family-docs-mobile'
    }
  }
})

// Tipos para Supabase
export type Database = {
  public: {
    Tables: {
      families: {
        Row: {
          id: string
          name: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      family_members: {
        Row: {
          id: string
          family_id: string
          name: string
          email: string | null
          phone: string | null
          role: string
          permissions: any
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          name: string
          email?: string | null
          phone?: string | null
          role?: string
          permissions?: any
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          role?: string
          permissions?: any
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          family_id: string
          title: string
          description: string | null
          document_type: string
          file_path: string | null
          file_size: number | null
          mime_type: string | null
          content: string | null
          tags: string[] | null
          metadata: any
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          family_id: string
          title: string
          description?: string | null
          document_type: string
          file_path?: string | null
          file_size?: number | null
          mime_type?: string | null
          content?: string | null
          tags?: string[] | null
          metadata?: any
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          title?: string
          description?: string | null
          document_type?: string
          file_path?: string | null
          file_size?: number | null
          mime_type?: string | null
          content?: string | null
          tags?: string[] | null
          metadata?: any
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      document_categories: {
        Row: {
          id: string
          name: string
          description: string | null
          color: string
          icon: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          color?: string
          icon?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          color?: string
          icon?: string | null
          created_at?: string
        }
      }
      alerts: {
        Row: {
          id: string
          family_id: string
          document_id: string | null
          alert_type: string
          message: string
          due_date: string | null
          is_read: boolean
          priority: string
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          document_id?: string | null
          alert_type: string
          message: string
          due_date?: string | null
          is_read?: boolean
          priority?: string
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          document_id?: string | null
          alert_type?: string
          message?: string
          due_date?: string | null
          is_read?: boolean
          priority?: string
          created_at?: string
        }
      }
      ai_chat_history: {
        Row: {
          id: string
          family_id: string
          question: string
          answer: string
          context: any | null
          created_at: string
        }
        Insert: {
          id?: string
          family_id: string
          question: string
          answer: string
          context?: any | null
          created_at?: string
        }
        Update: {
          id?: string
          family_id?: string
          question?: string
          answer?: string
          context?: any | null
          created_at?: string
        }
      }
    }
    Views: {
      documents_with_details: {
        Row: {
          id: string
          title: string
          description: string | null
          document_type: string
          file_path: string | null
          content: string | null
          tags: string[] | null
          metadata: any
          created_at: string
          updated_at: string
          family_member_name: string
          family_member_id: string
          family_name: string
          family_id: string
          categories: string[] | null
        }
      }
      reminders_with_details: {
        Row: {
          id: string
          title: string
          description: string | null
          reminder_type: string
          due_date: string
          reminder_date: string
          is_completed: boolean
          priority: string
          created_at: string
          family_member_name: string
          family_member_id: string
          family_name: string
          document_title: string | null
          document_type: string | null
          days_until_due: number | null
        }
      }
    }
    Functions: {
      search_documents: {
        Args: {
          search_query: string
          member_id?: string
        }
        Returns: {
          id: string
          title: string
          content: string
          document_type: string
          family_member_name: string
          relevance_score: number
        }[]
      }
      get_documents_by_type: {
        Args: {
          doc_type: string
          member_id?: string
        }
        Returns: {
          id: string
          title: string
          document_type: string
          family_member_name: string
          created_at: string
        }[]
      }
      get_upcoming_reminders: {
        Args: {
          days_ahead?: number
        }
        Returns: {
          id: string
          title: string
          due_date: string
          days_until_due: number
          family_member_name: string
          priority: string
        }[]
      }
    }
  }
}
