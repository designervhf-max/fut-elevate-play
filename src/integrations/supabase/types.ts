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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      match_defender_votes: {
        Row: {
          created_at: string
          id: string
          match_id: string
          voted_for_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          voted_for_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          voted_for_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_defender_votes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_mvp_votes: {
        Row: {
          created_at: string
          id: string
          match_id: string
          voted_for_id: string
          voter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_id: string
          voted_for_id: string
          voter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_id?: string
          voted_for_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_mvp_votes_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      match_participants: {
        Row: {
          assists: number | null
          created_at: string
          goals: number | null
          guest_name: string | null
          guest_position: string | null
          id: string
          match_id: string
          paid: boolean | null
          rating: number | null
          saves: number | null
          stats_submitted: boolean | null
          status: Database["public"]["Enums"]["participant_status"]
          team: number | null
          user_id: string | null
        }
        Insert: {
          assists?: number | null
          created_at?: string
          goals?: number | null
          guest_name?: string | null
          guest_position?: string | null
          id?: string
          match_id: string
          paid?: boolean | null
          rating?: number | null
          saves?: number | null
          stats_submitted?: boolean | null
          status?: Database["public"]["Enums"]["participant_status"]
          team?: number | null
          user_id?: string | null
        }
        Update: {
          assists?: number | null
          created_at?: string
          goals?: number | null
          guest_name?: string | null
          guest_position?: string | null
          id?: string
          match_id?: string
          paid?: boolean | null
          rating?: number | null
          saves?: number | null
          stats_submitted?: boolean | null
          status?: Database["public"]["Enums"]["participant_status"]
          team?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "match_participants_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          best_defender_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          location: string | null
          match_date: string
          match_time: string
          mvp_id: string | null
          open_for_confirmation: boolean
          pelada_id: string
          results_determined: boolean | null
          started_at: string | null
          status: Database["public"]["Enums"]["match_status"]
        }
        Insert: {
          best_defender_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          location?: string | null
          match_date: string
          match_time: string
          mvp_id?: string | null
          open_for_confirmation?: boolean
          pelada_id: string
          results_determined?: boolean | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
        }
        Update: {
          best_defender_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          location?: string | null
          match_date?: string
          match_time?: string
          mvp_id?: string | null
          open_for_confirmation?: boolean
          pelada_id?: string
          results_determined?: boolean | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["match_status"]
        }
        Relationships: [
          {
            foreignKeyName: "matches_pelada_id_fkey"
            columns: ["pelada_id"]
            isOneToOne: false
            referencedRelation: "peladas"
            referencedColumns: ["id"]
          },
        ]
      }
      pelada_members: {
        Row: {
          id: string
          joined_at: string
          pelada_id: string
          role: Database["public"]["Enums"]["pelada_role"]
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          pelada_id: string
          role?: Database["public"]["Enums"]["pelada_role"]
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          pelada_id?: string
          role?: Database["public"]["Enums"]["pelada_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pelada_members_pelada_id_fkey"
            columns: ["pelada_id"]
            isOneToOne: false
            referencedRelation: "peladas"
            referencedColumns: ["id"]
          },
        ]
      }
      peladas: {
        Row: {
          created_at: string
          creator_id: string
          game_type: Database["public"]["Enums"]["game_type"]
          id: string
          location: string
          max_players: number
          name: string
          price_per_game: number | null
          status: Database["public"]["Enums"]["pelada_status"]
          time: string
          weekday: number
        }
        Insert: {
          created_at?: string
          creator_id: string
          game_type: Database["public"]["Enums"]["game_type"]
          id?: string
          location: string
          max_players?: number
          name?: string
          price_per_game?: number | null
          status?: Database["public"]["Enums"]["pelada_status"]
          time: string
          weekday: number
        }
        Update: {
          created_at?: string
          creator_id?: string
          game_type?: Database["public"]["Enums"]["game_type"]
          id?: string
          location?: string
          max_players?: number
          name?: string
          price_per_game?: number | null
          status?: Database["public"]["Enums"]["pelada_status"]
          time?: string
          weekday?: number
        }
        Relationships: []
      }
      player_ratings: {
        Row: {
          created_at: string | null
          id: string
          match_id: string
          rated_id: string
          rater_id: string
          rating: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_id: string
          rated_id: string
          rater_id: string
          rating: number
        }
        Update: {
          created_at?: string | null
          id?: string
          match_id?: string
          rated_id?: string
          rater_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "player_ratings_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number
          attack_rating: number | null
          avatar_url: string | null
          calibration_completed: boolean | null
          created_at: string | null
          defense_rating: number | null
          dominant_foot: Database["public"]["Enums"]["dominant_foot"]
          id: string
          name: string
          overall_rating: number | null
          position: Database["public"]["Enums"]["player_position"]
          preferred_game_type: Database["public"]["Enums"]["game_type"] | null
          shirt_number: number
          skill_rating: number | null
          strength_rating: number | null
          total_assists: number | null
          total_best_defender: number | null
          total_games: number | null
          total_goals: number | null
          total_mvps: number | null
          total_participations: number | null
          total_saves: number | null
        }
        Insert: {
          age: number
          attack_rating?: number | null
          avatar_url?: string | null
          calibration_completed?: boolean | null
          created_at?: string | null
          defense_rating?: number | null
          dominant_foot: Database["public"]["Enums"]["dominant_foot"]
          id: string
          name: string
          overall_rating?: number | null
          position: Database["public"]["Enums"]["player_position"]
          preferred_game_type?: Database["public"]["Enums"]["game_type"] | null
          shirt_number: number
          skill_rating?: number | null
          strength_rating?: number | null
          total_assists?: number | null
          total_best_defender?: number | null
          total_games?: number | null
          total_goals?: number | null
          total_mvps?: number | null
          total_participations?: number | null
          total_saves?: number | null
        }
        Update: {
          age?: number
          attack_rating?: number | null
          avatar_url?: string | null
          calibration_completed?: boolean | null
          created_at?: string | null
          defense_rating?: number | null
          dominant_foot?: Database["public"]["Enums"]["dominant_foot"]
          id?: string
          name?: string
          overall_rating?: number | null
          position?: Database["public"]["Enums"]["player_position"]
          preferred_game_type?: Database["public"]["Enums"]["game_type"] | null
          shirt_number?: number
          skill_rating?: number | null
          strength_rating?: number | null
          total_assists?: number | null
          total_best_defender?: number | null
          total_games?: number | null
          total_goals?: number | null
          total_mvps?: number | null
          total_participations?: number | null
          total_saves?: number | null
        }
        Relationships: []
      }
      rating_history: {
        Row: {
          assists: number | null
          attack_after: number
          attack_before: number
          created_at: string | null
          defense_after: number
          defense_before: number
          game_id: string
          goals: number | null
          id: string
          overall_after: number
          overall_before: number
          skill_after: number
          skill_before: number
          strength_after: number
          strength_before: number
          user_id: string
          was_best_defender: boolean | null
          was_mvp: boolean | null
        }
        Insert: {
          assists?: number | null
          attack_after: number
          attack_before: number
          created_at?: string | null
          defense_after: number
          defense_before: number
          game_id: string
          goals?: number | null
          id?: string
          overall_after: number
          overall_before: number
          skill_after: number
          skill_before: number
          strength_after: number
          strength_before: number
          user_id: string
          was_best_defender?: boolean | null
          was_mvp?: boolean | null
        }
        Update: {
          assists?: number | null
          attack_after?: number
          attack_before?: number
          created_at?: string | null
          defense_after?: number
          defense_before?: number
          game_id?: string
          goals?: number | null
          id?: string
          overall_after?: number
          overall_before?: number
          skill_after?: number
          skill_before?: number
          strength_after?: number
          strength_before?: number
          user_id?: string
          was_best_defender?: boolean | null
          was_mvp?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "rating_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_contact_info: {
        Row: {
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_contact_info_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_subscriptions: {
        Row: {
          created_at: string | null
          id: string
          role: string
          subscription_status: string
          trial_ends_at: string | null
          trial_started_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: string
          subscription_status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: string
          subscription_status?: string
          trial_ends_at?: string | null
          trial_started_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      get_my_phone: { Args: never; Returns: string }
      has_pelada_role: {
        Args: {
          _pelada_id: string
          _role: Database["public"]["Enums"]["pelada_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_pelada_member: {
        Args: { _pelada_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      dominant_foot: "Destro" | "Canhoto" | "Ambos"
      game_status: "Confirmado" | "Pendente" | "Cancelado" | "Finalizado"
      game_type: "Futsal" | "Society" | "Campo"
      match_status: "scheduled" | "in_progress" | "finished" | "cancelled"
      participant_status:
        | "Confirmado"
        | "Pendente"
        | "Recusado"
        | "Lista de Espera"
      pelada_role: "admin" | "member"
      pelada_status: "active" | "inactive"
      player_position:
        | "Goleiro"
        | "Fixo"
        | "Ala"
        | "Pivô"
        | "Zagueiro"
        | "Meia"
        | "Atacante"
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
  public: {
    Enums: {
      dominant_foot: ["Destro", "Canhoto", "Ambos"],
      game_status: ["Confirmado", "Pendente", "Cancelado", "Finalizado"],
      game_type: ["Futsal", "Society", "Campo"],
      match_status: ["scheduled", "in_progress", "finished", "cancelled"],
      participant_status: [
        "Confirmado",
        "Pendente",
        "Recusado",
        "Lista de Espera",
      ],
      pelada_role: ["admin", "member"],
      pelada_status: ["active", "inactive"],
      player_position: [
        "Goleiro",
        "Fixo",
        "Ala",
        "Pivô",
        "Zagueiro",
        "Meia",
        "Atacante",
      ],
    },
  },
} as const
