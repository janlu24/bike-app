export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      item_groups: {
        Row: {
          category: Database["public"]["Enums"]["item_category"]
          created_at: string
          id: string
          name: string
          property_keys: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          category: Database["public"]["Enums"]["item_category"]
          created_at?: string
          id?: string
          name: string
          property_keys?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: Database["public"]["Enums"]["item_category"]
          created_at?: string
          id?: string
          name?: string
          property_keys?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_templates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          brand: string
          category: Database["public"]["Enums"]["item_category"]
          created_at: string
          group_id: string | null
          id: string
          image_url: string | null
          is_public: boolean
          metadata: Json
          model: string | null
          parent_id: string | null
          updated_at: string
          user_id: string
          weight_g: number | null
        }
        Insert: {
          brand: string
          category: Database["public"]["Enums"]["item_category"]
          created_at?: string
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          metadata?: Json
          model?: string | null
          parent_id?: string | null
          updated_at?: string
          user_id: string
          weight_g?: number | null
        }
        Update: {
          brand?: string
          category?: Database["public"]["Enums"]["item_category"]
          created_at?: string
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_public?: boolean
          metadata?: Json
          model?: string | null
          parent_id?: string | null
          updated_at?: string
          user_id?: string
          weight_g?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "items_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "item_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          id: string
          is_public: boolean
          updated_at: string
          username: string
          weight_unit: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          is_public?: boolean
          updated_at?: string
          username: string
          weight_unit?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_public?: boolean
          updated_at?: string
          username?: string
          weight_unit?: string
        }
        Relationships: []
      }
      tour_items: {
        Row: {
          added_at: string
          id: string
          item_id: string
          note: string | null
          rating: number | null
          tour_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          item_id: string
          note?: string | null
          rating?: number | null
          tour_id: string
        }
        Update: {
          added_at?: string
          id?: string
          item_id?: string
          note?: string | null
          rating?: number | null
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tour_items_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tour_items_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          actual_distance_km: number | null
          actual_elevation_down_m: number | null
          actual_elevation_up_m: number | null
          created_at: string
          destination: string | null
          duration_hours: number | null
          duration_minutes: number | null
          end_date: string | null
          external_id: string | null
          external_source: string | null
          id: string
          is_public: boolean
          name: string
          planned_distance_km: number | null
          planned_elevation_down_m: number | null
          planned_elevation_up_m: number | null
          start_date: string | null
          start_location: string | null
          status: Database["public"]["Enums"]["tour_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          actual_distance_km?: number | null
          actual_elevation_down_m?: number | null
          actual_elevation_up_m?: number | null
          created_at?: string
          destination?: string | null
          duration_hours?: number | null
          duration_minutes?: number | null
          end_date?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          is_public?: boolean
          name: string
          planned_distance_km?: number | null
          planned_elevation_down_m?: number | null
          planned_elevation_up_m?: number | null
          start_date?: string | null
          start_location?: string | null
          status?: Database["public"]["Enums"]["tour_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          actual_distance_km?: number | null
          actual_elevation_down_m?: number | null
          actual_elevation_up_m?: number | null
          created_at?: string
          destination?: string | null
          duration_hours?: number | null
          duration_minutes?: number | null
          end_date?: string | null
          external_id?: string | null
          external_source?: string | null
          id?: string
          is_public?: boolean
          name?: string
          planned_distance_km?: number | null
          planned_elevation_down_m?: number | null
          planned_elevation_up_m?: number | null
          start_date?: string | null
          start_location?: string | null
          status?: Database["public"]["Enums"]["tour_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      item_category: "Bike" | "Part" | "Gear" | "Clothing"
      tour_status: "planned" | "completed"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      item_category: ["Bike", "Part", "Gear", "Clothing"],
      tour_status: ["planned", "completed"],
    },
  },
} as const

// ---------------------------------------------------------------------------
// Convenience aliases — derived from generated types
// ---------------------------------------------------------------------------
export type ItemRow = Tables<"items">;
export type GroupRow = Tables<"item_groups">;
export type ProfileRow = Tables<"profiles">;
export type TourRow = Tables<"tours">;
export type TourItemRow = Tables<"tour_items">;

export type ItemCategory = Enums<"item_category">;
export type TourStatus = Enums<"tour_status">;

export type BikeOption = Pick<ItemRow, "id" | "brand" | "model">;
