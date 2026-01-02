Connecting to db 5432
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      bookmarked_questions: {
        Row: {
          created_at: string
          id: string
          note: string | null
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarked_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookmarked_questions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exam_sessions: {
        Row: {
          address: string | null
          address_2: string | null
          address_3: string | null
          city: string
          created_at: string
          email: string | null
          exam_date: string
          exam_time: string | null
          id: string
          latitude: number | null
          location_name: string | null
          longitude: number | null
          phone: string | null
          public_contact: string | null
          sponsor: string | null
          state: string
          title: string | null
          updated_at: string
          vec: string | null
          walk_ins_allowed: boolean | null
          zip: string
        }
        Insert: {
          address?: string | null
          address_2?: string | null
          address_3?: string | null
          city: string
          created_at?: string
          email?: string | null
          exam_date: string
          exam_time?: string | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          phone?: string | null
          public_contact?: string | null
          sponsor?: string | null
          state: string
          title?: string | null
          updated_at?: string
          vec?: string | null
          walk_ins_allowed?: boolean | null
          zip: string
        }
        Update: {
          address?: string | null
          address_2?: string | null
          address_3?: string | null
          city?: string
          created_at?: string
          email?: string | null
          exam_date?: string
          exam_time?: string | null
          id?: string
          latitude?: number | null
          location_name?: string | null
          longitude?: number | null
          phone?: string | null
          public_contact?: string | null
          sponsor?: string | null
          state?: string
          title?: string | null
          updated_at?: string
          vec?: string | null
          walk_ins_allowed?: boolean | null
          zip?: string
        }
        Relationships: []
      }
      explanation_feedback: {
        Row: {
          created_at: string
          id: string
          is_helpful: boolean
          question_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_helpful: boolean
          question_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_helpful?: boolean
          question_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "explanation_feedback_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "explanation_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_progress: {
        Row: {
          created_at: string
          id: string
          last_seen_at: string | null
          mastered: boolean
          term_id: string
          times_correct: number
          times_seen: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          mastered?: boolean
          term_id: string
          times_correct?: number
          times_seen?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_seen_at?: string | null
          mastered?: boolean
          term_id?: string
          times_correct?: number
          times_seen?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_progress_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glossary_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_study_sessions: {
        Row: {
          created_at: string
          id: string
          session_duration_seconds: number | null
          study_date: string
          terms_correct: number
          terms_studied: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_duration_seconds?: number | null
          study_date?: string
          terms_correct?: number
          terms_studied?: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_duration_seconds?: number | null
          study_date?: string
          terms_correct?: number
          terms_studied?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_study_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          created_at: string
          definition: string
          edit_history: Json
          id: string
          term: string
        }
        Insert: {
          created_at?: string
          definition: string
          edit_history?: Json
          id?: string
          term: string
        }
        Update: {
          created_at?: string
          definition?: string
          edit_history?: Json
          id?: string
          term?: string
        }
        Relationships: []
      }
      practice_test_results: {
        Row: {
          completed_at: string
          id: string
          passed: boolean
          percentage: number
          score: number
          test_type: string
          total_questions: number
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          passed: boolean
          percentage: number
          score: number
          test_type?: string
          total_questions: number
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          passed?: boolean
          percentage?: number
          score?: number
          test_type?: string
          total_questions?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_test_results_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          best_streak: number
          created_at: string
          display_name: string | null
          forum_username: string | null
          glossary_best_streak: number
          glossary_current_streak: number
          glossary_last_study_date: string | null
          id: string
          updated_at: string
        }
        Insert: {
          best_streak?: number
          created_at?: string
          display_name?: string | null
          forum_username?: string | null
          glossary_best_streak?: number
          glossary_current_streak?: number
          glossary_last_study_date?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          best_streak?: number
          created_at?: string
          display_name?: string | null
          forum_username?: string | null
          glossary_best_streak?: number
          glossary_current_streak?: number
          glossary_last_study_date?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      question_attempts: {
        Row: {
          attempt_type: string
          attempted_at: string
          id: string
          is_correct: boolean
          question_id: string
          selected_answer: number
          test_result_id: string | null
          user_id: string
        }
        Insert: {
          attempt_type?: string
          attempted_at?: string
          id?: string
          is_correct: boolean
          question_id: string
          selected_answer: number
          test_result_id?: string | null
          user_id: string
        }
        Update: {
          attempt_type?: string
          attempted_at?: string
          id?: string
          is_correct?: boolean
          question_id?: string
          selected_answer?: number
          test_result_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_attempts_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_test_result_id_fkey"
            columns: ["test_result_id"]
            isOneToOne: false
            referencedRelation: "practice_test_results"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          correct_answer: number
          created_at: string
          discourse_sync_at: string | null
          discourse_sync_error: string | null
          discourse_sync_status: string | null
          display_name: string
          edit_history: Json
          explanation: string | null
          fcc_reference: string | null
          figure_reference: string | null
          figure_url: string | null
          forum_url: string | null
          id: string
          links: Json
          options: Json
          question: string
          question_group: string
          subelement: string
        }
        Insert: {
          correct_answer: number
          created_at?: string
          discourse_sync_at?: string | null
          discourse_sync_error?: string | null
          discourse_sync_status?: string | null
          display_name: string
          edit_history?: Json
          explanation?: string | null
          fcc_reference?: string | null
          figure_reference?: string | null
          figure_url?: string | null
          forum_url?: string | null
          id?: string
          links?: Json
          options: Json
          question: string
          question_group: string
          subelement: string
        }
        Update: {
          correct_answer?: number
          created_at?: string
          discourse_sync_at?: string | null
          discourse_sync_error?: string | null
          discourse_sync_status?: string | null
          display_name?: string
          edit_history?: Json
          explanation?: string | null
          fcc_reference?: string | null
          figure_reference?: string | null
          figure_url?: string | null
          forum_url?: string | null
          id?: string
          links?: Json
          options?: Json
          question?: string
          question_group?: string
          subelement?: string
        }
        Relationships: []
      }
      syllabus: {
        Row: {
          code: string
          created_at: string | null
          exam_questions: number | null
          id: string
          license_type: string
          title: string
          type: string
        }
        Insert: {
          code: string
          created_at?: string | null
          exam_questions?: number | null
          id?: string
          license_type: string
          title: string
          type: string
        }
        Update: {
          code?: string
          created_at?: string | null
          exam_questions?: number | null
          id?: string
          license_type?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      topic_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          topic_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          topic_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_progress_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_questions: {
        Row: {
          created_at: string | null
          id: string
          question_id: string | null
          topic_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          question_id?: string | null
          topic_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          question_id?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "topic_questions_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_resources: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          resource_type: string
          storage_path: string | null
          title: string
          topic_id: string | null
          url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          resource_type: string
          storage_path?: string | null
          title: string
          topic_id?: string | null
          url?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          resource_type?: string
          storage_path?: string | null
          title?: string
          topic_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_resources_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topic_subelements: {
        Row: {
          created_at: string | null
          id: string
          subelement: string
          topic_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          subelement: string
          topic_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          subelement?: string
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "topic_subelements_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      topics: {
        Row: {
          content_path: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          edit_history: Json | null
          id: string
          is_published: boolean | null
          license_types: string[] | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content_path?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          edit_history?: Json | null
          id?: string
          is_published?: boolean | null
          license_types?: string[] | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content_path?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          edit_history?: Json | null
          id?: string
          is_published?: boolean | null
          license_types?: string[] | null
          slug?: string
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_target_exam: {
        Row: {
          created_at: string
          exam_session_id: string
          id: string
          study_intensity: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exam_session_id: string
          id?: string
          study_intensity?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exam_session_id?: string
          id?: string
          study_intensity?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_target_exam_exam_session_id_fkey"
            columns: ["exam_session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_target_exam_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_study_goals: {
        Row: {
          created_at: string
          id: string
          questions_goal: number
          tests_goal: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          questions_goal?: number
          tests_goal?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          questions_goal?: number
          tests_goal?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_study_goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      discourse_sync_overview: {
        Row: {
          errors: number | null
          license_type: string | null
          needs_verification: number | null
          pending: number | null
          synced: number | null
          total_questions: number | null
          with_forum_url: number | null
          without_forum_url: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_own_account: { Args: never; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const

