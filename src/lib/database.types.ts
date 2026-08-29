export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.17';
  };
  public: {
    Tables: {
      assignments: {
        Row: {
          assigned_date: string;
          created_at: string;
          due_date: string | null;
          id: string;
          overdue_notified_at: string | null;
          reading_id: string | null;
          sponsee_id: string;
          status: string;
          worksheet_id: string | null;
        };
        Insert: {
          assigned_date?: string;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          overdue_notified_at?: string | null;
          reading_id?: string | null;
          sponsee_id: string;
          status?: string;
          worksheet_id?: string | null;
        };
        Update: {
          assigned_date?: string;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          overdue_notified_at?: string | null;
          reading_id?: string | null;
          sponsee_id?: string;
          status?: string;
          worksheet_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assignments_sponsee_id_fkey';
            columns: ['sponsee_id'];
            isOneToOne: false;
            referencedRelation: 'sponsees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignments_worksheet_id_fkey';
            columns: ['worksheet_id'];
            isOneToOne: false;
            referencedRelation: 'worksheets';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignments_reading_id_fkey';
            columns: ['reading_id'];
            isOneToOne: false;
            referencedRelation: 'readings';
            referencedColumns: ['id'];
          },
        ];
      };
      readings: {
        Row: {
          chapter_or_section: string;
          created_at: string;
          id: string;
          source: string;
          sponsor_note: string | null;
          step_or_theme: string;
        };
        Insert: {
          chapter_or_section: string;
          created_at?: string;
          id?: string;
          source: string;
          sponsor_note?: string | null;
          step_or_theme: string;
        };
        Update: {
          chapter_or_section?: string;
          created_at?: string;
          id?: string;
          source?: string;
          sponsor_note?: string | null;
          step_or_theme?: string;
        };
        Relationships: [];
      };
      worksheet_readings: {
        Row: {
          created_at: string;
          reading_id: string;
          worksheet_id: string;
        };
        Insert: {
          created_at?: string;
          reading_id: string;
          worksheet_id: string;
        };
        Update: {
          created_at?: string;
          reading_id?: string;
          worksheet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'worksheet_readings_reading_id_fkey';
            columns: ['reading_id'];
            isOneToOne: false;
            referencedRelation: 'readings';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'worksheet_readings_worksheet_id_fkey';
            columns: ['worksheet_id'];
            isOneToOne: false;
            referencedRelation: 'worksheets';
            referencedColumns: ['id'];
          },
        ];
      };
      recurring_assignments: {
        Row: {
          created_at: string;
          id: string;
          sponsee_id: string;
          worksheet_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          sponsee_id: string;
          worksheet_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          sponsee_id?: string;
          worksheet_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_assignments_sponsee_id_fkey';
            columns: ['sponsee_id'];
            isOneToOne: false;
            referencedRelation: 'sponsees';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recurring_assignments_worksheet_id_fkey';
            columns: ['worksheet_id'];
            isOneToOne: false;
            referencedRelation: 'worksheets';
            referencedColumns: ['id'];
          },
        ];
      };
      sponsees: {
        Row: {
          archived_at: string | null;
          created_at: string;
          current_step: string;
          id: string;
          last_activity_date: string | null;
          name: string;
          notes: string | null;
          phone: string | null;
          sobriety_date: string | null;
          sponsor_id: string;
          streak_days: number;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          current_step?: string;
          id?: string;
          last_activity_date?: string | null;
          name: string;
          notes?: string | null;
          phone?: string | null;
          sobriety_date?: string | null;
          sponsor_id: string;
          streak_days?: number;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          current_step?: string;
          id?: string;
          last_activity_date?: string | null;
          name?: string;
          notes?: string | null;
          phone?: string | null;
          sobriety_date?: string | null;
          sponsor_id?: string;
          streak_days?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'sponsees_sponsor_id_fkey';
            columns: ['sponsor_id'];
            isOneToOne: false;
            referencedRelation: 'sponsors';
            referencedColumns: ['id'];
          },
        ];
      };
      sponsors: {
        Row: {
          created_at: string;
          email: string;
          id: string;
          push_token: string | null;
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
          push_token?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
          push_token?: string | null;
        };
        Relationships: [];
      };
      worksheets: {
        Row: {
          created_at: string;
          id: string;
          prompts: string[];
          purpose: string;
          step: string;
          title: string;
          type: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          prompts?: string[];
          purpose: string;
          step: string;
          title: string;
          type?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          prompts?: string[];
          purpose?: string;
          step?: string;
          title?: string;
          type?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      checkin_get_sponsee: {
        Args: { p_sponsee_id: string };
        Returns: {
          assignment_id: string;
          due_date: string;
          id: string;
          name: string;
          sobriety_date: string | null;
          streak_days: number;
          status: string;
          worksheet_id: string | null;
          worksheet_step: string | null;
          worksheet_title: string | null;
          worksheet_purpose: string | null;
          worksheet_prompts: string[] | null;
          reading_id: string | null;
          reading_source: string | null;
          reading_chapter_or_section: string | null;
        }[];
      };
      checkin_set_assignment_status: {
        Args: {
          p_assignment_id: string;
          p_sponsee_id: string;
          p_status: string;
        };
        Returns: undefined;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
