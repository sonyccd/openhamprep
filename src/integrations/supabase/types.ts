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
      arrl_chapters: {
        Row: {
          chapter_number: number
          created_at: string | null
          description: string | null
          display_order: number
          id: string
          license_type: string
          title: string
          updated_at: string | null
        }
        Insert: {
          chapter_number: number
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          license_type: string
          title: string
          updated_at?: string | null
        }
        Update: {
          chapter_number?: number
          created_at?: string | null
          description?: string | null
          display_order?: number
          id?: string
          license_type?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
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
          fts: unknown
          id: string
          term: string
        }
        Insert: {
          created_at?: string
          definition: string
          edit_history?: Json
          fts?: unknown
          id?: string
          term: string
        }
        Update: {
          created_at?: string
          definition?: string
          edit_history?: Json
          fts?: unknown
          id?: string
          term?: string
        }
        Relationships: []
      }
      ham_radio_tool_categories: {
        Row: {
          created_at: string | null
          description: string | null
          display_order: number | null
          icon_name: string | null
          id: string
          name: string
          slug: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          name: string
          slug: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          icon_name?: string | null
          id?: string
          name?: string
          slug?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      ham_radio_tools: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string
          display_order: number | null
          edit_history: Json | null
          fts: unknown
          id: string
          image_url: string | null
          is_published: boolean | null
          storage_path: string | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description: string
          display_order?: number | null
          edit_history?: Json | null
          fts?: unknown
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          storage_path?: string | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string
          display_order?: number | null
          edit_history?: Json | null
          fts?: unknown
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          storage_path?: string | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ham_radio_tools_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ham_radio_tool_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          lesson_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          lesson_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          lesson_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_topics: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          lesson_id: string | null
          topic_id: string | null
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          lesson_id?: string | null
          topic_id?: string | null
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          lesson_id?: string | null
          topic_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lesson_topics_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lesson_topics_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "topics"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
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
      mapbox_usage: {
        Row: {
          created_at: string
          id: string
          last_updated_at: string
          request_count: number
          year_month: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_updated_at?: string
          request_count?: number
          year_month: string
        }
        Update: {
          created_at?: string
          id?: string
          last_updated_at?: string
          request_count?: number
          year_month?: string
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
      question_mastery: {
        Row: {
          correct_attempts: number
          created_at: string
          first_attempt_at: string | null
          id: string
          incorrect_attempts: number
          is_mastered: boolean | null
          is_weak: boolean | null
          last_attempt_at: string | null
          question_id: string
          total_attempts: number
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_attempts?: number
          created_at?: string
          first_attempt_at?: string | null
          id?: string
          incorrect_attempts?: number
          is_mastered?: boolean | null
          is_weak?: boolean | null
          last_attempt_at?: string | null
          question_id: string
          total_attempts?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_attempts?: number
          created_at?: string
          first_attempt_at?: string | null
          id?: string
          incorrect_attempts?: number
          is_mastered?: boolean | null
          is_weak?: boolean | null
          last_attempt_at?: string | null
          question_id?: string
          total_attempts?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "question_mastery_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "question_mastery_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          arrl_chapter_id: string | null
          arrl_page_reference: string | null
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
          fts: unknown
          id: string
          links: Json
          options: Json
          question: string
          question_group: string
          subelement: string
        }
        Insert: {
          arrl_chapter_id?: string | null
          arrl_page_reference?: string | null
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
          fts?: unknown
          id?: string
          links?: Json
          options: Json
          question: string
          question_group: string
          subelement: string
        }
        Update: {
          arrl_chapter_id?: string | null
          arrl_page_reference?: string | null
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
          fts?: unknown
          id?: string
          links?: Json
          options?: Json
          question?: string
          question_group?: string
          subelement?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_arrl_chapter_id_fkey"
            columns: ["arrl_chapter_id"]
            isOneToOne: false
            referencedRelation: "arrl_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      readiness_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: Json
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
          content: string | null
          content_path: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          edit_history: Json | null
          fts: unknown
          id: string
          is_published: boolean | null
          license_types: string[] | null
          slug: string
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          content?: string | null
          content_path?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          edit_history?: Json | null
          fts?: unknown
          id?: string
          is_published?: boolean | null
          license_types?: string[] | null
          slug: string
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string | null
          content_path?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          edit_history?: Json | null
          fts?: unknown
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
      user_readiness_cache: {
        Row: {
          calculated_at: string
          config_version: string | null
          coverage: number | null
          created_at: string
          exam_type: string
          expected_exam_score: number | null
          id: string
          last_study_at: string | null
          mastery: number | null
          overall_accuracy: number | null
          pass_probability: number | null
          readiness_score: number | null
          recent_accuracy: number | null
          subelement_metrics: Json
          tests_passed: number
          tests_taken: number
          total_attempts: number
          unique_questions_seen: number
          updated_at: string
          user_id: string
        }
        Insert: {
          calculated_at?: string
          config_version?: string | null
          coverage?: number | null
          created_at?: string
          exam_type: string
          expected_exam_score?: number | null
          id?: string
          last_study_at?: string | null
          mastery?: number | null
          overall_accuracy?: number | null
          pass_probability?: number | null
          readiness_score?: number | null
          recent_accuracy?: number | null
          subelement_metrics?: Json
          tests_passed?: number
          tests_taken?: number
          total_attempts?: number
          unique_questions_seen?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          calculated_at?: string
          config_version?: string | null
          coverage?: number | null
          created_at?: string
          exam_type?: string
          expected_exam_score?: number | null
          id?: string
          last_study_at?: string | null
          mastery?: number | null
          overall_accuracy?: number | null
          pass_probability?: number | null
          readiness_score?: number | null
          recent_accuracy?: number | null
          subelement_metrics?: Json
          tests_passed?: number
          tests_taken?: number
          total_attempts?: number
          unique_questions_seen?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_readiness_cache_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_readiness_snapshots: {
        Row: {
          coverage: number | null
          created_at: string
          exam_type: string
          id: string
          mastery: number | null
          overall_accuracy: number | null
          pass_probability: number | null
          questions_attempted: number
          questions_correct: number
          readiness_score: number | null
          recent_accuracy: number | null
          snapshot_date: string
          tests_passed: number
          tests_taken: number
          user_id: string
        }
        Insert: {
          coverage?: number | null
          created_at?: string
          exam_type: string
          id?: string
          mastery?: number | null
          overall_accuracy?: number | null
          pass_probability?: number | null
          questions_attempted?: number
          questions_correct?: number
          readiness_score?: number | null
          recent_accuracy?: number | null
          snapshot_date: string
          tests_passed?: number
          tests_taken?: number
          user_id: string
        }
        Update: {
          coverage?: number | null
          created_at?: string
          exam_type?: string
          id?: string
          mastery?: number | null
          overall_accuracy?: number | null
          pass_probability?: number | null
          questions_attempted?: number
          questions_correct?: number
          readiness_score?: number | null
          recent_accuracy?: number | null
          snapshot_date?: string
          tests_passed?: number
          tests_taken?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_readiness_snapshots_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
          custom_exam_date: string | null
          exam_session_id: string | null
          id: string
          study_intensity: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_exam_date?: string | null
          exam_session_id?: string | null
          id?: string
          study_intensity?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_exam_date?: string | null
          exam_session_id?: string | null
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
      [_ in never]: never
    }
    Functions: {
      delete_own_account: { Args: never; Returns: Json }
      get_chapter_question_counts: {
        Args: { license_prefix?: string }
        Returns: {
          chapter_id: string
          question_count: number
        }[]
      }
      get_discourse_sync_overview: {
        Args: never
        Returns: {
          errors: number
          license_type: string
          needs_verification: number
          pending: number
          synced: number
          total_questions: number
          with_forum_url: number
          without_forum_url: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_mapbox_usage: {
        Args: { p_year_month: string }
        Returns: number
      }
      search_content: {
        Args: {
          glossary_limit?: number
          license_prefix?: string
          questions_limit?: number
          search_query: string
          tools_limit?: number
          topics_limit?: number
        }
        Returns: Json
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

