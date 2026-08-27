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
          sponsee_id: string;
          status: string;
          worksheet_id: string;
        };
        Insert: {
          assigned_date?: string;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          sponsee_id: string;
          status?: string;
          worksheet_id: string;
        };
        Update: {
          assigned_date?: string;
          created_at?: string;
          due_date?: string | null;
          id?: string;
          sponsee_id?: string;
          status?: string;
          worksheet_id?: string;
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
        ];
      };
      sponsees: {
        Row: {
          created_at: string;
          current_step: string;
          id: string;
          last_activity_date: string | null;
          name: string;
          phone: string | null;
          sponsor_id: string;
          streak_days: number;
        };
        Insert: {
          created_at?: string;
          current_step?: string;
          id?: string;
          last_activity_date?: string | null;
          name: string;
          phone?: string | null;
          sponsor_id: string;
          streak_days?: number;
        };
        Update: {
          created_at?: string;
          current_step?: string;
          id?: string;
          last_activity_date?: string | null;
          name?: string;
          phone?: string | null;
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
        };
        Insert: {
          created_at?: string;
          email: string;
          id: string;
        };
        Update: {
          created_at?: string;
          email?: string;
          id?: string;
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
          status: string;
          worksheet_id: string;
          worksheet_step: string;
          worksheet_title: string;
          worksheet_purpose: string;
          worksheet_prompts: string[];
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
