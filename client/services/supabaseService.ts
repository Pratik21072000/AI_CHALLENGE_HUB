// Supabase Service - Replaces localStorage with proper database
import { createClient, SupabaseClient } from '@supabase/supabase-js';

interface SupabaseConfig {
  url: string;
  key: string;
}

interface UserData {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: 'Employee' | 'Management' | 'Admin';
  department: string;
  total_points: number;
  created_at: string;
  updated_at: string;
}

interface ChallengeAcceptance {
  id: string;
  user_id: string;
  username: string;
  challenge_id: string;
  status: 'Accepted' | 'Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework' | 'Withdrawn';
  committed_date: string;
  accepted_at: string;
  updated_at: string;
}

interface Submission {
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
}

interface SubmissionReview {
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
}

export class SupabaseService {
  private supabase: SupabaseClient;
  private isConnected: boolean = false;

  constructor(config?: SupabaseConfig) {
    if (config) {
      this.supabase = createClient(config.url, config.key);
      this.isConnected = true;
    } else {
      // Try to get from environment variables
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (url && key) {
        this.supabase = createClient(url, key);
        this.isConnected = true;
      } else {
        console.warn('⚠️ Supabase not configured - falling back to localStorage');
        this.isConnected = false;
      }
    }
  }

  isAvailable(): boolean {
    return this.isConnected;
  }

  // User Management
  async getCurrentUser(): Promise<UserData | null> {
    if (!this.isConnected) return null;

    try {
      // Get current user from localStorage first (for username)
      const localUser = localStorage.getItem('challengeHub_user');
      if (!localUser) return null;

      const { username } = JSON.parse(localUser);
      
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error) {
        console.error('Failed to fetch user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async createUser(userData: Omit<UserData, 'id' | 'created_at' | 'updated_at'>): Promise<UserData | null> {
    if (!this.isConnected) return null;

    try {
      const { data, error } = await this.supabase
        .from('users')
        .upsert(userData, { onConflict: 'username' })
        .select()
        .single();

      if (error) {
        console.error('Failed to create user:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  // Challenge Acceptance Management
  async getUserAcceptances(username: string): Promise<ChallengeAcceptance[]> {
    if (!this.isConnected) return [];

    try {
      const { data, error } = await this.supabase
        .from('challenge_acceptances')
        .select('*')
        .eq('username', username)
        .order('accepted_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch acceptances:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user acceptances:', error);
      return [];
    }
  }

  async acceptChallenge(username: string, challengeId: string, committedDate: string): Promise<ChallengeAcceptance | null> {
    if (!this.isConnected) return null;

    try {
      // Get user ID
      const user = await this.getCurrentUser();
      if (!user) {
        console.error('User not found for acceptance');
        return null;
      }

      const acceptanceData = {
        user_id: user.id,
        username,
        challenge_id: challengeId,
        status: 'Accepted' as const,
        committed_date: committedDate
      };

      const { data, error } = await this.supabase
        .from('challenge_acceptances')
        .upsert(acceptanceData, { onConflict: 'user_id,challenge_id' })
        .select()
        .single();

      if (error) {
        console.error('Failed to accept challenge:', error);
        return null;
      }

      console.log('✅ Challenge accepted in Supabase:', data);
      return data;
    } catch (error) {
      console.error('Error accepting challenge:', error);
      return null;
    }
  }

  async updateAcceptanceStatus(username: string, challengeId: string, status: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const { error } = await this.supabase
        .from('challenge_acceptances')
        .update({ status })
        .eq('username', username)
        .eq('challenge_id', challengeId);

      if (error) {
        console.error('Failed to update acceptance status:', error);
        return false;
      }

      console.log('✅ Acceptance status updated in Supabase:', { username, challengeId, status });
      return true;
    } catch (error) {
      console.error('Error updating acceptance status:', error);
      return false;
    }
  }

  async getUserActiveChallenge(username: string): Promise<ChallengeAcceptance | null> {
    if (!this.isConnected) return null;

    try {
      const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
      
      const { data, error } = await this.supabase
        .from('challenge_acceptances')
        .select('*')
        .eq('username', username)
        .in('status', activeStatuses)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to get active challenge:', error);
        return null;
      }

      return data || null;
    } catch (error) {
      console.error('Error getting active challenge:', error);
      return null;
    }
  }

  async hasUserAcceptedChallenge(username: string, challengeId: string): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
      
      const { data, error } = await this.supabase
        .from('challenge_acceptances')
        .select('id')
        .eq('username', username)
        .eq('challenge_id', challengeId)
        .in('status', activeStatuses)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Failed to check acceptance:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking challenge acceptance:', error);
      return false;
    }
  }

  async canUserAcceptNewChallenge(username: string): Promise<boolean> {
    const activeChallenge = await this.getUserActiveChallenge(username);
    return !activeChallenge;
  }

  // Submission Management
  async getUserSubmissions(username: string): Promise<Submission[]> {
    if (!this.isConnected) return [];

    try {
      const { data, error } = await this.supabase
        .from('submissions')
        .select('*')
        .eq('username', username)
        .order('submitted_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch submissions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting user submissions:', error);
      return [];
    }
  }

  async createSubmission(submissionData: Omit<Submission, 'id' | 'created_at' | 'updated_at'>): Promise<Submission | null> {
    if (!this.isConnected) return null;

    try {
      const { data, error } = await this.supabase
        .from('submissions')
        .upsert(submissionData, { onConflict: 'user_id,challenge_id' })
        .select()
        .single();

      if (error) {
        console.error('Failed to create submission:', error);
        return null;
      }

      console.log('✅ Submission created in Supabase:', data);
      return data;
    } catch (error) {
      console.error('Error creating submission:', error);
      return null;
    }
  }

  // Review Management
  async getAllReviews(): Promise<SubmissionReview[]> {
    if (!this.isConnected) return [];

    try {
      const { data, error } = await this.supabase
        .from('submission_reviews')
        .select('*')
        .order('reviewed_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch reviews:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting reviews:', error);
      return [];
    }
  }

  async createReview(reviewData: Omit<SubmissionReview, 'id' | 'created_at' | 'updated_at'>): Promise<SubmissionReview | null> {
    if (!this.isConnected) return null;

    try {
      const { data, error } = await this.supabase
        .from('submission_reviews')
        .upsert(reviewData, { onConflict: 'submission_id' })
        .select()
        .single();

      if (error) {
        console.error('Failed to create review:', error);
        return null;
      }

      console.log('✅ Review created in Supabase:', data);
      return data;
    } catch (error) {
      console.error('Error creating review:', error);
      return null;
    }
  }

  // Utility Methods
  async updateUserPoints(username: string, points: number): Promise<boolean> {
    if (!this.isConnected) return false;

    try {
      const { error } = await this.supabase
        .from('users')
        .update({ total_points: points })
        .eq('username', username);

      if (error) {
        console.error('Failed to update user points:', error);
        return false;
      }

      console.log('✅ User points updated in Supabase:', { username, points });
      return true;
    } catch (error) {
      console.error('Error updating user points:', error);
      return false;
    }
  }

  // Real-time Subscriptions
  subscribeToUserData(username: string, callback: (data: any) => void) {
    if (!this.isConnected) return null;

    return this.supabase
      .channel('user-data')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'challenge_acceptances',
          filter: `username=eq.${username}`
        }, 
        callback
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'submissions',
          filter: `username=eq.${username}`
        }, 
        callback
      )
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'users',
          filter: `username=eq.${username}`
        }, 
        callback
      )
      .subscribe();
  }

  // Test and Debug Methods
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.isConnected) {
      return { success: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: String(error) };
    }
  }

  async debugPrint(): Promise<void> {
    console.log('=== SUPABASE DEBUG ===');
    console.log('Connected:', this.isConnected);
    
    if (this.isConnected) {
      try {
        const { data: users } = await this.supabase.from('users').select('*');
        const { data: acceptances } = await this.supabase.from('challenge_acceptances').select('*');
        const { data: submissions } = await this.supabase.from('submissions').select('*');
        const { data: reviews } = await this.supabase.from('submission_reviews').select('*');
        
        console.log('Users:', users?.length || 0);
        console.log('Acceptances:', acceptances?.length || 0);
        console.log('Submissions:', submissions?.length || 0);
        console.log('Reviews:', reviews?.length || 0);
        
        if (users) {
          users.forEach(user => {
            console.log(`${user.display_name} (${user.username}): ${user.total_points} points`);
          });
        }
      } catch (error) {
        console.error('Debug failed:', error);
      }
    }
    console.log('==================');
  }
}

// Global instance
export const supabaseService = new SupabaseService();

// Browser console utilities
(window as any).supabaseService = supabaseService;
(window as any).debugSupabase = () => supabaseService.debugPrint();
(window as any).testSupabase = () => supabaseService.testConnection();

export default SupabaseService;
