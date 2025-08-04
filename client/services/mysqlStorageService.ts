// MySQL-backed storage service to replace localStorage
// This provides cross-device synchronization through database persistence

import type { ChallengeAcceptance, ChallengeSubmission, SubmissionReview } from '@shared/types';

interface MySQLUser {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: 'Employee' | 'Management' | 'Admin';
  department: string;
  total_points: number;
}

interface MySQLAcceptance {
  id: string;
  user_id: string;
  username: string;
  challenge_id: string;
  status: 'Accepted' | 'Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework' | 'Withdrawn';
  committed_date: string;
  accepted_at: string;
  updated_at: string;
}

interface MySQLSubmission {
  id: string;
  user_id: string;
  username: string;
  challenge_id: string;
  solution_description: string;
  short_description?: string;
  github_url?: string;
  demo_url?: string;
  technologies?: string;
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework';
  submitted_at: string;
  is_submitted: boolean;
}

interface MySQLReview {
  id: string;
  submission_id: string;
  username: string;
  challenge_id: string;
  reviewer_name: string;
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Needs Rework';
  review_comment?: string;
  points_awarded: number;
  is_on_time: boolean;
  submission_date: string;
  commitment_date: string;
  reviewed_at: string;
}

class MySQLStorageService {
  private baseUrl: string = '';
  private isInitialized: boolean = false;
  
  // Initialize with API endpoint
  async initialize(): Promise<boolean> {
    try {
      // Use current origin as base URL
      this.baseUrl = window.location.origin;
      
      // Test connection
      const response = await fetch(`${this.baseUrl}/api/mysql/test`);
      if (response.ok) {
        this.isInitialized = true;
        console.log('✅ MySQL Storage Service initialized');
        await this.ensureUsersExist();
        return true;
      } else {
        console.warn('⚠️ MySQL API not available, falling back to localStorage');
        return false;
      }
    } catch (error) {
      console.warn('⚠️ MySQL connection failed, using localStorage:', error);
      return false;
    }
  }

  // Ensure default users exist in database
  private async ensureUsersExist(): Promise<void> {
    const defaultUsers = [
      { username: 'employee01', email: 'john.doe@company.com', display_name: 'John Doe', role: 'Employee' as const, department: 'Engineering' },
      { username: 'employee02', email: 'lisa.thompson@company.com', display_name: 'Lisa Thompson', role: 'Employee' as const, department: 'Engineering' },
      { username: 'employee03', email: 'mike.chen@company.com', display_name: 'Mike Chen', role: 'Employee' as const, department: 'Engineering' },
      { username: 'manager01', email: 'sarah.wilson@company.com', display_name: 'Sarah Wilson', role: 'Management' as const, department: 'Engineering' }
    ];

    for (const user of defaultUsers) {
      try {
        await this.apiCall('/users', {
          method: 'POST',
          body: JSON.stringify(user)
        });
      } catch (error) {
        // User might already exist, that's fine
      }
    }
  }

  // API call helper
  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.isInitialized) {
      throw new Error('MySQL Storage Service not initialized');
    }

    const response = await fetch(`${this.baseUrl}/api/mysql${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error}`);
    }

    return response.json();
  }

  // Get current user
  getCurrentUser(): { username: string; displayName: string; role: string } | null {
    try {
      const userData = localStorage.getItem('challengeHub_user');
      return userData ? JSON.parse(userData) : null;
    } catch {
      return null;
    }
  }

  // Challenge Acceptance Methods
  async getAcceptances(): Promise<ChallengeAcceptance[]> {
    if (!this.isInitialized) {
      // Fallback to localStorage
      try {
        const data = localStorage.getItem('challengeHub_acceptances');
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }

    try {
      const acceptances: MySQLAcceptance[] = await this.apiCall('/acceptances');
      return acceptances.map(acc => ({
        id: acc.id,
        username: acc.username,
        challengeId: acc.challenge_id,
        status: acc.status,
        committedDate: acc.committed_date,
        acceptedAt: acc.accepted_at
      }));
    } catch (error) {
      console.error('Error fetching acceptances from MySQL:', error);
      // Fallback to localStorage
      try {
        const data = localStorage.getItem('challengeHub_acceptances');
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }
  }

  async addAcceptance(acceptance: ChallengeAcceptance): Promise<boolean> {
    if (!this.isInitialized) {
      // Fallback to localStorage
      try {
        const acceptances = await this.getAcceptances();
        const existingIndex = acceptances.findIndex(
          acc => acc.username === acceptance.username && acc.challengeId === acceptance.challengeId
        );
        
        if (existingIndex >= 0) {
          acceptances[existingIndex] = acceptance;
        } else {
          acceptances.push(acceptance);
        }
        
        localStorage.setItem('challengeHub_acceptances', JSON.stringify(acceptances));
        return true;
      } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
      }
    }

    try {
      await this.apiCall('/acceptances', {
        method: 'POST',
        body: JSON.stringify({
          username: acceptance.username,
          challenge_id: acceptance.challengeId,
          committed_date: acceptance.committedDate
        })
      });
      console.log('✅ Acceptance saved to MySQL:', acceptance);
      return true;
    } catch (error) {
      console.error('Error saving acceptance to MySQL:', error);
      // Fallback to localStorage
      try {
        const acceptances = await this.getAcceptances();
        acceptances.push(acceptance);
        localStorage.setItem('challengeHub_acceptances', JSON.stringify(acceptances));
        return true;
      } catch {
        return false;
      }
    }
  }

  async updateAcceptanceStatus(username: string, challengeId: string, status: string): Promise<boolean> {
    if (!this.isInitialized) {
      // Fallback to localStorage
      try {
        const acceptances = await this.getAcceptances();
        const index = acceptances.findIndex(
          acc => acc.username === username && acc.challengeId === challengeId
        );

        if (index >= 0) {
          acceptances[index].status = status as any;
          localStorage.setItem('challengeHub_acceptances', JSON.stringify(acceptances));
          console.log('✅ Acceptance status updated in localStorage:', { username, challengeId, status });
          return true;
        }
        return false;
      } catch (error) {
        console.error('Error updating localStorage:', error);
        return false;
      }
    }

    try {
      await this.apiCall(`/acceptances/${username}/${challengeId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      console.log('✅ Acceptance status updated in MySQL:', { username, challengeId, status });
      return true;
    } catch (error) {
      console.error('Error updating acceptance in MySQL:', error);
      // Fallback to localStorage
      try {
        const acceptances = await this.getAcceptances();
        const index = acceptances.findIndex(
          acc => acc.username === username && acc.challengeId === challengeId
        );

        if (index >= 0) {
          acceptances[index].status = status as any;
          localStorage.setItem('challengeHub_acceptances', JSON.stringify(acceptances));
          return true;
        }
        return false;
      } catch {
        return false;
      }
    }
  }

  async getUserAcceptance(username: string, challengeId: string): Promise<ChallengeAcceptance | null> {
    const acceptances = await this.getAcceptances();
    return acceptances.find(acc => acc.username === username && acc.challengeId === challengeId) || null;
  }

  async hasUserAcceptedChallenge(username: string, challengeId: string): Promise<boolean> {
    const acceptance = await this.getUserAcceptance(username, challengeId);
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    return acceptance ? activeStatuses.includes(acceptance.status) : false;
  }

  async getUserActiveChallenge(username: string): Promise<ChallengeAcceptance | null> {
    const acceptances = await this.getAcceptances();
    const blockingStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    return acceptances.find(acc =>
      acc.username === username && blockingStatuses.includes(acc.status)
    ) || null;
  }

  async canUserAcceptNewChallenge(username: string): Promise<boolean> {
    const activeChallenge = await this.getUserActiveChallenge(username);
    return activeChallenge === null;
  }

  // Submission Methods
  async getSubmissions(): Promise<ChallengeSubmission[]> {
    if (!this.isInitialized) {
      try {
        const data = localStorage.getItem('challengeHub_submissions');
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }

    try {
      const submissions: MySQLSubmission[] = await this.apiCall('/submissions');
      return submissions.map(sub => ({
        id: sub.id,
        username: sub.username,
        challengeId: sub.challenge_id,
        submitted: sub.is_submitted,
        submittedAt: sub.submitted_at,
        fileUrl: '',
        fileName: 'solution.zip',
        fileSize: 1024,
        shortDescription: sub.short_description || '',
        technologies: sub.technologies || '',
        sourceCodeUrl: sub.github_url || '',
        hostedAppUrl: sub.demo_url || '',
        status: sub.status
      }));
    } catch (error) {
      console.error('Error fetching submissions from MySQL:', error);
      try {
        const data = localStorage.getItem('challengeHub_submissions');
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }
  }

  async addSubmission(submission: ChallengeSubmission): Promise<boolean> {
    if (!this.isInitialized) {
      try {
        const submissions = await this.getSubmissions();
        const existingIndex = submissions.findIndex(
          sub => sub.username === submission.username && sub.challengeId === submission.challengeId
        );
        
        if (existingIndex >= 0) {
          submissions[existingIndex] = submission;
        } else {
          submissions.push(submission);
        }
        
        localStorage.setItem('challengeHub_submissions', JSON.stringify(submissions));
        return true;
      } catch {
        return false;
      }
    }

    try {
      await this.apiCall('/submissions', {
        method: 'POST',
        body: JSON.stringify({
          username: submission.username,
          challenge_id: submission.challengeId,
          solution_description: submission.shortDescription,
          short_description: submission.shortDescription,
          github_url: submission.sourceCodeUrl,
          demo_url: submission.hostedAppUrl,
          technologies: submission.technologies
        })
      });
      console.log('✅ Submission saved to MySQL:', submission);
      return true;
    } catch (error) {
      console.error('Error saving submission to MySQL:', error);
      // Fallback to localStorage
      try {
        const submissions = await this.getSubmissions();
        submissions.push(submission);
        localStorage.setItem('challengeHub_submissions', JSON.stringify(submissions));
        return true;
      } catch {
        return false;
      }
    }
  }

  // Review Methods
  async getReviews(): Promise<SubmissionReview[]> {
    if (!this.isInitialized) {
      try {
        const data = localStorage.getItem('challengeHub_reviews');
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }

    try {
      const reviews: MySQLReview[] = await this.apiCall('/reviews');
      return reviews.map(rev => ({
        submissionId: rev.submission_id,
        challengeId: rev.challenge_id,
        username: rev.username,
        status: rev.status,
        reviewedBy: rev.reviewer_name,
        reviewedAt: rev.reviewed_at,
        reviewComment: rev.review_comment,
        pointsAwarded: rev.points_awarded,
        submissionDate: rev.submission_date,
        commitmentDate: rev.commitment_date,
        isOnTime: rev.is_on_time
      }));
    } catch (error) {
      console.error('Error fetching reviews from MySQL:', error);
      try {
        const data = localStorage.getItem('challengeHub_reviews');
        return data ? JSON.parse(data) : [];
      } catch {
        return [];
      }
    }
  }

  async addReview(review: SubmissionReview): Promise<boolean> {
    if (!this.isInitialized) {
      try {
        const reviews = await this.getReviews();
        const existingIndex = reviews.findIndex(rev => rev.submissionId === review.submissionId);
        
        if (existingIndex >= 0) {
          reviews[existingIndex] = review;
        } else {
          reviews.push(review);
        }
        
        localStorage.setItem('challengeHub_reviews', JSON.stringify(reviews));
        return true;
      } catch {
        return false;
      }
    }

    try {
      await this.apiCall('/reviews', {
        method: 'POST',
        body: JSON.stringify({
          submission_id: review.submissionId,
          username: review.username,
          challenge_id: review.challengeId,
          reviewer_name: review.reviewedBy || 'System',
          status: review.status,
          review_comment: review.reviewComment,
          points_awarded: review.pointsAwarded || 0,
          is_on_time: review.isOnTime,
          submission_date: review.submissionDate,
          commitment_date: review.commitmentDate
        })
      });
      console.log('✅ Review saved to MySQL:', review);
      return true;
    } catch (error) {
      console.error('Error saving review to MySQL:', error);
      // Fallback to localStorage
      try {
        const reviews = await this.getReviews();
        reviews.push(review);
        localStorage.setItem('challengeHub_reviews', JSON.stringify(reviews));
        return true;
      } catch {
        return false;
      }
    }
  }

  // Utility Methods
  isActive(): boolean {
    return this.isInitialized;
  }

  async clearAllData(): Promise<void> {
    if (this.isInitialized) {
      try {
        await this.apiCall('/clear-all', { method: 'DELETE' });
        console.log('✅ MySQL data cleared');
      } catch (error) {
        console.error('Error clearing MySQL data:', error);
      }
    }
    
    // Also clear localStorage as fallback
    localStorage.removeItem('challengeHub_acceptances');
    localStorage.removeItem('challengeHub_submissions');
    localStorage.removeItem('challengeHub_reviews');
    console.log('✅ localStorage cleared');
  }

  async migrateFromLocalStorage(): Promise<void> {
    if (!this.isInitialized) {
      console.log('⚠️ MySQL not available, skipping migration');
      return;
    }

    console.log('🔄 Migrating data from localStorage to MySQL...');
    
    try {
      // Migrate acceptances
      const localAcceptances = localStorage.getItem('challengeHub_acceptances');
      if (localAcceptances) {
        const acceptances: ChallengeAcceptance[] = JSON.parse(localAcceptances);
        for (const acceptance of acceptances) {
          await this.addAcceptance(acceptance);
        }
        console.log(`✅ Migrated ${acceptances.length} acceptances`);
      }

      // Migrate submissions
      const localSubmissions = localStorage.getItem('challengeHub_submissions');
      if (localSubmissions) {
        const submissions: ChallengeSubmission[] = JSON.parse(localSubmissions);
        for (const submission of submissions) {
          await this.addSubmission(submission);
        }
        console.log(`✅ Migrated ${submissions.length} submissions`);
      }

      // Migrate reviews
      const localReviews = localStorage.getItem('challengeHub_reviews');
      if (localReviews) {
        const reviews: SubmissionReview[] = JSON.parse(localReviews);
        for (const review of reviews) {
          await this.addReview(review);
        }
        console.log(`✅ Migrated ${reviews.length} reviews`);
      }

      console.log('🎉 Migration completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }
}

// Create and export singleton instance
export const mysqlStorageService = new MySQLStorageService();

// Add to window for debugging
(window as any).mysqlStorageService = mysqlStorageService;
(window as any).migrateToMySQL = () => mysqlStorageService.migrateFromLocalStorage();

export default MySQLStorageService;
