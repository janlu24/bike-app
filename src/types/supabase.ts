export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type ItemCategory = 'Bike' | 'Part' | 'Gear' | 'Clothing'

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          is_public: boolean
          weight_unit: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          weight_unit?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          is_public?: boolean
          weight_unit?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      items: {
        Row: {
          id: string
          user_id: string
          category: ItemCategory
          brand: string
          model: string | null
          weight_g: number | null
          is_public: boolean
          metadata: Json
          image_url: string | null
          parent_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          category: ItemCategory
          brand: string
          model?: string | null
          weight_g?: number | null
          is_public?: boolean
          metadata?: Json
          image_url?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          category?: ItemCategory
          brand?: string
          model?: string | null
          weight_g?: number | null
          is_public?: boolean
          metadata?: Json
          image_url?: string | null
          parent_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      item_category: ItemCategory
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type ItemRow = Database['public']['Tables']['items']['Row']
export type ProfileRow = Database['public']['Tables']['profiles']['Row']
