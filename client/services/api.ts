import {
  Challenge,
  ChallengeAcceptance,
  ChallengeSubmission,
  SubmissionReview,
  AcceptChallengeRequest,
  AcceptChallengeResponse,
  SubmitSolutionRequest,
  SubmitSolutionResponse,
  ReviewSubmissionRequest,
  ReviewSubmissionResponse,
  GetUserDataResponse,
  ErrorResponse
} from '@shared/api';
import { createClient } from '@supabase/supabase-js';
import { apiHealthMonitor } from '@/utils/apiHealthMonitor';

// API base URL - use environment variable or default to current origin
const API_BASE = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' ? window.location.origin : '');

// Supabase client for real-time features (optional)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabaseClient = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}, retries = 1): Promise<T> {
    const url = `${API_BASE}${endpoint}`;

    // Check if we should skip API calls due to persistent issues
    if (apiHealthMonitor.shouldSkipApiCalls()) {
      console.log(`⚠️ Skipping API call to ${endpoint} due to health issues: ${apiHealthMonitor.getStatusMessage()}`);
      throw new Error(`API calls temporarily disabled: ${apiHealthMonitor.getStatusMessage()}`);
    }

    // Get current user from localStorage for authentication (fix key name)
    const currentUser = localStorage.getItem('challengeHub_user');
    const userObj = currentUser ? JSON.parse(currentUser) : null;

    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (userObj?.username) {
      defaultHeaders['x-user-id'] = userObj.username;
    }

    try {
      const response = await fetch(url, {
        headers: { ...defaultHeaders, ...options.headers },
        ...options,
      });

      let data: any;

      try {
        // Try the simplest approach first - direct JSON parsing
        data = await response.json();
      } catch (jsonError) {
        // Check if this is a "body already used" error
        const errorMessage = jsonError instanceof Error ? jsonError.message : String(jsonError);

        if (errorMessage.includes('body') && (errorMessage.includes('already') || errorMessage.includes('used'))) {
          console.warn(`🚨 Response body conflict detected for ${url}. This is likely due to dev server middleware.`);

          // Record the conflict in the health monitor
          apiHealthMonitor.recordBodyConflict();

          // For body conflicts, we can't read the response, so create a synthetic response
          // based on the status code
          if (response.ok) {
            // If request was successful, create a generic success response
            data = {
              success: true,
              message: 'Request successful but response body was consumed by middleware',
              // For acceptance status, provide a neutral fallback
              data: endpoint.includes('acceptance-status') ? {
                accepted: false,
                acceptedChallengeId: null,
                userAcceptance: null,
                isCurrentChallengeAccepted: false,
                hasActiveChallenge: false,
                activeChallengeId: null
              } : {}
            };
          } else {
            data = {
              success: false,
              message: `Request failed (${response.status}) and response body was consumed by middleware`
            };
          }
        } else {
          console.warn(`Failed to parse JSON response from ${url}:`, jsonError);

          // For other JSON errors, create a basic response
          data = {
            success: response.ok,
            message: response.statusText || 'Invalid JSON response'
          };
        }
      }

      if (!response.ok) {
        const error = data as ErrorResponse;
        throw new Error(error.message || `API request failed: ${response.status} ${response.statusText}`);
      }

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      // Check for network connectivity issues
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError') || errorMessage.includes('ERR_NETWORK')) {
        console.error(`🌐 Network connectivity issue for ${url}:`, errorMessage);

        // Retry the request if we have retries left
        if (retries > 0) {
          console.log(`🔄 Retrying request (${retries} attempts left)...`);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
          return this.request<T>(endpoint, options, retries - 1);
        }

        console.log('💡 Max retries reached. The app will fall back to localStorage data.');

        // Record network failure in health monitor
        apiHealthMonitor.recordNetworkFailure();

        // Re-throw with a more specific error type that our components can detect
        const networkError = new Error(`Network connectivity failed after retries: ${errorMessage}`);
        (networkError as any).isNetworkError = true;
        throw networkError;
      }

      // Check for response body issues and provide helpful context
      if (errorMessage.includes('body') && (errorMessage.includes('already') || errorMessage.includes('used'))) {
        console.error(`🚨 Response body conflict for ${url}. This usually happens in development when middleware consumes the response.`);
        console.log('💡 The app will fall back to context-based data.');

        // Record the conflict in the health monitor
        apiHealthMonitor.recordBodyConflict();

        // Re-throw with a more specific error type that our components can detect
        const specificError = new Error(`Response body consumed by middleware: ${errorMessage}`);
        (specificError as any).isBodyConflict = true;
        throw specificError;
      }

      console.error(`API request failed for ${url}:`, error);
      throw new Error(`API request failed: ${errorMessage}`);
    }
  }

  // Challenge APIs
  async getAllChallenges(): Promise<Challenge[]> {
    const response = await this.request<{ success: boolean; data: Challenge[] }>('/api/challenges', {
      method: 'GET'
    });
    return response.data;
  }

  async getChallengeById(id: string): Promise<Challenge> {
    const response = await this.request<{ success: boolean; data: Challenge }>(`/api/challenges/${id}`, {
      method: 'GET'
    });
    return response.data;
  }

  async getChallengeAcceptanceStatus(challengeId: string): Promise<{
    accepted: boolean;
    acceptedChallengeId: string | null;
    userAcceptance: ChallengeAcceptance | null;
    isCurrentChallengeAccepted: boolean;
    hasActiveChallenge: boolean;
    activeChallengeId: string | null;
  }> {
    const response = await this.request<{
      success: boolean;
      data: {
        accepted: boolean;
        acceptedChallengeId: string | null;
        userAcceptance: ChallengeAcceptance | null;
        isCurrentChallengeAccepted: boolean;
        hasActiveChallenge: boolean;
        activeChallengeId: string | null;
      }
    }>(`/api/challenges/${challengeId}/acceptance-status`, {
      method: 'GET'
    });
    return response.data;
  }

  async createChallenge(challengeData: Partial<Challenge>): Promise<Challenge> {
    const response = await this.request<{ success: boolean; data: Challenge }>('/api/challenges', {
      method: 'POST',
      body: JSON.stringify(challengeData),
    });
    return response.data;
  }

  async acceptChallenge(challengeId: string, committedDate: string): Promise<ChallengeAcceptance> {
    const request: AcceptChallengeRequest = { challengeId, committedDate };
    const response = await this.request<AcceptChallengeResponse>('/api/challenges/accept', {
      method: 'POST',
      body: JSON.stringify(request),
    });
    return response.data;
  }

  async getUserAcceptances(username: string): Promise<ChallengeAcceptance[]> {
    const response = await this.request<{ success: boolean; data: ChallengeAcceptance[] }>(
      `/api/challenges/acceptances/${username}`
    );
    return response.data;
  }

  async getChallengeAcceptances(challengeId: string): Promise<ChallengeAcceptance[]> {
    const response = await this.request<{ success: boolean; data: ChallengeAcceptance[] }>(
      `/api/challenges/${challengeId}/acceptances`
    );
    return response.data;
  }

  async withdrawChallenge(acceptanceId: string): Promise<ChallengeAcceptance> {
    const response = await this.request<{ success: boolean; data: ChallengeAcceptance }>(
      `/api/challenges/accept/${acceptanceId}`,
      { method: 'DELETE' }
    );
    return response.data;
  }

  // Submission APIs
  async getAllSubmissions(userId?: string): Promise<ChallengeSubmission[]> {
    const query = userId ? `?userId=${userId}` : '';
    const response = await this.request<{ success: boolean; data: ChallengeSubmission[] }>(
      `/api/submissions${query}`
    );
    return response.data;
  }

  async getSubmissionById(id: string): Promise<ChallengeSubmission> {
    const response = await this.request<{ success: boolean; data: ChallengeSubmission }>(
      `/api/submissions/${id}`
    );
    return response.data;
  }

  async submitSolution(submissionData: SubmitSolutionRequest): Promise<ChallengeSubmission> {
    const response = await this.request<SubmitSolutionResponse>('/api/submissions', {
      method: 'POST',
      body: JSON.stringify(submissionData),
    });
    return response.submission;
  }

  async getUserSubmissions(username: string): Promise<ChallengeSubmission[]> {
    const response = await this.request<{ success: boolean; data: ChallengeSubmission[] }>(
      `/api/submissions/user/${username}`
    );
    return response.data;
  }

  async getChallengeSubmissions(challengeId: string): Promise<ChallengeSubmission[]> {
    const response = await this.request<{ success: boolean; data: ChallengeSubmission[] }>(
      `/api/submissions/challenge/${challengeId}`
    );
    return response.data;
  }

  // Review APIs
  async getAllReviews(status?: string): Promise<SubmissionReview[]> {
    const query = status ? `?status=${status}` : '';
    const response = await this.request<{ success: boolean; data: SubmissionReview[] }>(
      `/api/submissions/reviews${query}`
    );
    return response.data;
  }

  async reviewSubmission(
    submissionId: string,
    action: 'approve' | 'reject' | 'rework',
    comment?: string
  ): Promise<SubmissionReview> {
    const request: ReviewSubmissionRequest = { action, comment };
    const response = await this.request<ReviewSubmissionResponse>(
      `/api/submissions/${submissionId}/review`,
      {
        method: 'PATCH',
        body: JSON.stringify(request),
      }
    );
    return response.review;
  }

  // User APIs
  async getUserData(username: string): Promise<GetUserDataResponse> {
    const response = await this.request<{ success: boolean; data: GetUserDataResponse }>(
      `/api/users/${username}`
    );
    return response.data;
  }

  async getAllUsers(): Promise<any[]> {
    const response = await this.request<{ success: boolean; data: any[] }>('/api/users');
    return response.data;
  }
}

export const apiService = new ApiService();
