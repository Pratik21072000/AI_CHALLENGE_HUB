import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_ANON_KEY || '';

// Create Supabase client only if credentials are provided
export const supabase: SupabaseClient | null = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Helper to check if Supabase is available
export const isSupabaseAvailable = (): boolean => {
  return supabase !== null;
};

// Database types for TypeScript
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          email: string;
          display_name: string;
          role: 'Employee' | 'Management' | 'Admin';
          total_points: number;
          avatar_url?: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          username: string;
          email: string;
          display_name: string;
          role: 'Employee' | 'Management' | 'Admin';
          total_points?: number;
          avatar_url?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          display_name?: string;
          role?: 'Employee' | 'Management' | 'Admin';
          total_points?: number;
          avatar_url?: string;
          updated_at?: string;
        };
      };
      challenges: {
        Row: {
          id: string;
          title: string;
          description: string;
          full_description?: string;
          expected_outcome?: string;
          tags?: string[];
          status: 'Open' | 'Closed' | 'Draft';
          points: number;
          penalty_points: number;
          deadline?: string;
          created_by_id?: string;
          created_by_name: string;
          attachments?: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          title: string;
          description: string;
          full_description?: string;
          expected_outcome?: string;
          tags?: string[];
          status?: 'Open' | 'Closed' | 'Draft';
          points?: number;
          penalty_points?: number;
          deadline?: string;
          created_by_id?: string;
          created_by_name: string;
          attachments?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          full_description?: string;
          expected_outcome?: string;
          tags?: string[];
          status?: 'Open' | 'Closed' | 'Draft';
          points?: number;
          penalty_points?: number;
          deadline?: string;
          created_by_name?: string;
          attachments?: string[];
          updated_at?: string;
        };
      };
      challenge_acceptances: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          challenge_id: string;
          status: 'Accepted' | 'Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework' | 'Withdrawn' | 'Completed';
          committed_date: string;
          accepted_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          challenge_id: string;
          status?: 'Accepted' | 'Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework' | 'Withdrawn' | 'Completed';
          committed_date: string;
          accepted_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'Accepted' | 'Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework' | 'Withdrawn' | 'Completed';
          committed_date?: string;
          updated_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          user_id: string;
          username: string;
          challenge_id: string;
          acceptance_id?: string;
          solution_description: string;
          short_description?: string;
          github_url?: string;
          demo_url?: string;
          technologies?: string;
          files_attached?: string[];
          status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework';
          submitted_at: string;
          is_submitted: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          username: string;
          challenge_id: string;
          acceptance_id?: string;
          solution_description: string;
          short_description?: string;
          github_url?: string;
          demo_url?: string;
          technologies?: string;
          files_attached?: string[];
          status?: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework';
          submitted_at?: string;
          is_submitted?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          solution_description?: string;
          short_description?: string;
          github_url?: string;
          demo_url?: string;
          technologies?: string;
          files_attached?: string[];
          status?: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework';
          is_submitted?: boolean;
          updated_at?: string;
        };
      };
      submission_reviews: {
        Row: {
          id: string;
          submission_id: string;
          reviewer_id?: string;
          reviewer_name: string;
          status: 'Pending Review' | 'Approved' | 'Rejected' | 'Needs Rework';
          review_comment?: string;
          points_awarded: number;
          is_on_time: boolean;
          submission_date: string;
          commitment_date: string;
          reviewed_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          submission_id: string;
          reviewer_id?: string;
          reviewer_name: string;
          status: 'Pending Review' | 'Approved' | 'Rejected' | 'Needs Rework';
          review_comment?: string;
          points_awarded?: number;
          is_on_time?: boolean;
          submission_date: string;
          commitment_date: string;
          reviewed_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          status?: 'Pending Review' | 'Approved' | 'Rejected' | 'Needs Rework';
          review_comment?: string;
          points_awarded?: number;
          is_on_time?: boolean;
          reviewed_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      user_challenge_status: {
        Row: {
          username: string;
          display_name: string;
          challenge_id: string;
          challenge_title: string;
          acceptance_status?: string;
          accepted_at?: string;
          committed_date?: string;
          submission_status?: string;
          submitted_at?: string;
          review_status?: string;
          points_awarded?: number;
          reviewed_at?: string;
        };
      };
      active_user_challenges: {
        Row: {
          username: string;
          challenge_id: string;
          status: string;
          accepted_at: string;
          committed_date: string;
        };
      };
    };
  };
}

// Helper function to get user ID by username
export async function getUserIdByUsername(username: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .eq('username', username)
    .single();
  
  if (error || !data) {
    console.error('Error fetching user ID:', error);
    return null;
  }
  
  return data.id;
}

// Helper function to ensure user exists
export async function ensureUserExists(username: string, displayName: string, role: 'Employee' | 'Management' | 'Admin' = 'Employee'): Promise<string | null> {
  // First try to find existing user
  const existingUser = await getUserIdByUsername(username);
  if (existingUser) {
    return existingUser;
  }
  
  // Create new user if doesn't exist
  const { data, error } = await supabase
    .from('users')
    .insert({
      username,
      email: `${username}@company.com`,
      display_name: displayName,
      role
    })
    .select('id')
    .single();
  
  if (error || !data) {
    console.error('Error creating user:', error);
    return null;
  }
  
  return data.id;
}
