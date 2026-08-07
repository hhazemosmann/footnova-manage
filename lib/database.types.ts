// GENERATED FILE — do not edit by hand.
// Regenerate with:  npm run supabase:types
// Source: Supabase project `recruitment-app` (veaazwasmtxanwpmubsu)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      app_settings: {
        Row: {
          careers_inbox_email: string | null
          default_pipeline: string
          email_on_shortlist_add: boolean
          id: number
          require_cv_before_interview: boolean
          require_email_on_new_candidates: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          careers_inbox_email?: string | null
          default_pipeline?: string
          email_on_shortlist_add?: boolean
          id?: number
          require_cv_before_interview?: boolean
          require_email_on_new_candidates?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          careers_inbox_email?: string | null
          default_pipeline?: string
          email_on_shortlist_add?: boolean
          id?: number
          require_cv_before_interview?: boolean
          require_email_on_new_candidates?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_documents: {
        Row: {
          candidate_id: string
          created_at: string
          created_by: string | null
          file_name: string
          id: string
          label: string
          mime_type: string
          object_path: string
          size_bytes: number
          updated_at: string
        }
        Insert: {
          candidate_id: string
          created_at?: string
          created_by?: string | null
          file_name: string
          id?: string
          label: string
          mime_type: string
          object_path: string
          size_bytes: number
          updated_at?: string
        }
        Update: {
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          file_name?: string
          id?: string
          label?: string
          mime_type?: string
          object_path?: string
          size_bytes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_documents_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_documents_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_notes: {
        Row: {
          body: string
          candidate_id: string
          created_at: string
          created_by: string | null
          id: string
          updated_at: string
        }
        Insert: {
          body: string
          candidate_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string
        }
        Update: {
          body?: string
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_notes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_stage_events: {
        Row: {
          candidate_id: string
          created_at: string
          created_by: string | null
          from_stage: Database["public"]["Enums"]["candidate_stage"] | null
          id: string
          to_stage: Database["public"]["Enums"]["candidate_stage"]
        }
        Insert: {
          candidate_id: string
          created_at?: string
          created_by?: string | null
          from_stage?: Database["public"]["Enums"]["candidate_stage"] | null
          id?: string
          to_stage: Database["public"]["Enums"]["candidate_stage"]
        }
        Update: {
          candidate_id?: string
          created_at?: string
          created_by?: string | null
          from_stage?: Database["public"]["Enums"]["candidate_stage"] | null
          id?: string
          to_stage?: Database["public"]["Enums"]["candidate_stage"]
        }
        Relationships: [
          {
            foreignKeyName: "candidate_stage_events_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidate_stage_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      candidates: {
        Row: {
          applied_on: string
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string | null
          cv_file_name: string | null
          cv_mime_type: string | null
          cv_object_path: string | null
          cv_size_bytes: number | null
          cv_uploaded_at: string | null
          cv_uploaded_by: string | null
          email: string | null
          full_name: string
          id: string
          is_shortlisted: boolean
          job_id: string
          linkedin_url: string | null
          location: string | null
          phone: string | null
          rating: number | null
          source: Database["public"]["Enums"]["entity_source"]
          stage: Database["public"]["Enums"]["candidate_stage"]
          updated_at: string
        }
        Insert: {
          applied_on?: string
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          cv_file_name?: string | null
          cv_mime_type?: string | null
          cv_object_path?: string | null
          cv_size_bytes?: number | null
          cv_uploaded_at?: string | null
          cv_uploaded_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_shortlisted?: boolean
          job_id: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          rating?: number | null
          source?: Database["public"]["Enums"]["entity_source"]
          stage?: Database["public"]["Enums"]["candidate_stage"]
          updated_at?: string
        }
        Update: {
          applied_on?: string
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          cv_file_name?: string | null
          cv_mime_type?: string | null
          cv_object_path?: string | null
          cv_size_bytes?: number | null
          cv_uploaded_at?: string | null
          cv_uploaded_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_shortlisted?: boolean
          job_id?: string
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          rating?: number | null
          source?: Database["public"]["Enums"]["entity_source"]
          stage?: Database["public"]["Enums"]["candidate_stage"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidates_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_cv_uploaded_by_fkey"
            columns: ["cv_uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "candidates_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          archived_at: string | null
          archived_by: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          location: string | null
          posted_on: string
          source: Database["public"]["Enums"]["entity_source"]
          status: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at: string
        }
        Insert: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          posted_on?: string
          source?: Database["public"]["Enums"]["entity_source"]
          status?: Database["public"]["Enums"]["job_status"]
          title: string
          updated_at?: string
        }
        Update: {
          archived_at?: string | null
          archived_by?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          location?: string | null
          posted_on?: string
          source?: Database["public"]["Enums"]["entity_source"]
          status?: Database["public"]["Enums"]["job_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_archived_by_fkey"
            columns: ["archived_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          job_title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          full_name?: string
          id: string
          job_title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          job_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_team_member: { Args: never; Returns: boolean }
    }
    Enums: {
      candidate_stage:
        | "Applied"
        | "Screening"
        | "Interview"
        | "Offer"
        | "Hired"
        | "Rejected"
      entity_source:
        | "Manual entry"
        | "Referral"
        | "Direct application"
        | "Agency"
        | "Scouting network"
      job_status: "Open" | "Closed"
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
      candidate_stage: [
        "Applied",
        "Screening",
        "Interview",
        "Offer",
        "Hired",
        "Rejected",
      ],
      entity_source: [
        "Manual entry",
        "Referral",
        "Direct application",
        "Agency",
        "Scouting network",
      ],
      job_status: ["Open", "Closed"],
    },
  },
} as const
