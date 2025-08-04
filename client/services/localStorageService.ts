import type { ChallengeAcceptance, ChallengeSubmission, SubmissionReview } from '@shared/types';

export class LocalStorageService {
  private readonly STORAGE_KEYS = {
    acceptances: 'challengeHub_acceptances',
    submissions: 'challengeHub_submissions',
    reviews: 'challengeHub_reviews',
    user: 'challengeHub_user',
    version: 'challengeHub_version'
  };

  private readonly CURRENT_VERSION = '1.0.0';

  constructor() {
    this.initializeStorage();
  }

  private initializeStorage(): void {
    try {
      // Check if localStorage is available
      if (typeof Storage === 'undefined') {
        console.warn('⚠️ LocalStorage not available');
        return;
      }

      // Check version and migrate if needed
      const currentVersion = localStorage.getItem(this.STORAGE_KEYS.version);
      if (currentVersion !== this.CURRENT_VERSION) {
        console.log('🔄 Initializing localStorage for Challenge Hub...');
        this.ensureDefaultData();
        localStorage.setItem(this.STORAGE_KEYS.version, this.CURRENT_VERSION);
      }

      console.log('✅ LocalStorage initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize localStorage:', error);
    }
  }

  private ensureDefaultData(): void {
    // Initialize with empty arrays if not exists
    if (!localStorage.getItem(this.STORAGE_KEYS.acceptances)) {
      localStorage.setItem(this.STORAGE_KEYS.acceptances, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.submissions)) {
      localStorage.setItem(this.STORAGE_KEYS.submissions, JSON.stringify([]));
    }
    if (!localStorage.getItem(this.STORAGE_KEYS.reviews)) {
      localStorage.setItem(this.STORAGE_KEYS.reviews, JSON.stringify([]));
    }
  }

  // Acceptances
  getAcceptances(): ChallengeAcceptance[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.acceptances);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting acceptances:', error);
      return [];
    }
  }

  saveAcceptances(acceptances: ChallengeAcceptance[]): boolean {
    try {
      localStorage.setItem(this.STORAGE_KEYS.acceptances, JSON.stringify(acceptances));
      console.log('✅ Acceptances saved to localStorage:', acceptances.length, 'items');
      return true;
    } catch (error) {
      console.error('❌ Error saving acceptances:', error);
      return false;
    }
  }

  addAcceptance(acceptance: ChallengeAcceptance): boolean {
    try {
      const acceptances = this.getAcceptances();
      acceptances.push(acceptance);
      return this.saveAcceptances(acceptances);
    } catch (error) {
      console.error('❌ Error adding acceptance:', error);
      return false;
    }
  }

  updateAcceptanceStatus(username: string, challengeId: string, status: string): boolean {
    try {
      const acceptances = this.getAcceptances();
      const index = acceptances.findIndex(
        acc => acc.username === username && acc.challengeId === challengeId
      );

      if (index >= 0) {
        acceptances[index].status = status as any;
        return this.saveAcceptances(acceptances);
      } else {
        console.warn(`⚠️ Acceptance not found for ${username} - ${challengeId}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating acceptance status:', error);
      return false;
    }
  }

  // Submissions
  getSubmissions(): ChallengeSubmission[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.submissions);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting submissions:', error);
      return [];
    }
  }

  saveSubmissions(submissions: ChallengeSubmission[]): boolean {
    try {
      localStorage.setItem(this.STORAGE_KEYS.submissions, JSON.stringify(submissions));
      console.log('✅ Submissions saved to localStorage:', submissions.length, 'items');
      return true;
    } catch (error) {
      console.error('❌ Error saving submissions:', error);
      return false;
    }
  }

  addSubmission(submission: ChallengeSubmission): boolean {
    try {
      const submissions = this.getSubmissions();
      submissions.push(submission);
      return this.saveSubmissions(submissions);
    } catch (error) {
      console.error('❌ Error adding submission:', error);
      return false;
    }
  }

  // Reviews
  getReviews(): SubmissionReview[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.reviews);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting reviews:', error);
      return [];
    }
  }

  saveReviews(reviews: SubmissionReview[]): boolean {
    try {
      localStorage.setItem(this.STORAGE_KEYS.reviews, JSON.stringify(reviews));
      console.log('✅ Reviews saved to localStorage:', reviews.length, 'items');
      return true;
    } catch (error) {
      console.error('❌ Error saving reviews:', error);
      return false;
    }
  }

  addReview(review: SubmissionReview): boolean {
    try {
      const reviews = this.getReviews();
      reviews.push(review);
      return this.saveReviews(reviews);
    } catch (error) {
      console.error('❌ Error adding review:', error);
      return false;
    }
  }

  // User management
  getCurrentUser(): { username: string; displayName: string; role: string } | null {
    try {
      const userData = localStorage.getItem(this.STORAGE_KEYS.user);
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  setCurrentUser(user: { username: string; displayName: string; role: string }): boolean {
    try {
      localStorage.setItem(this.STORAGE_KEYS.user, JSON.stringify(user));
      return true;
    } catch (error) {
      console.error('❌ Error setting current user:', error);
      return false;
    }
  }

  // Utility methods
  getUserActiveChallenge(username: string): ChallengeAcceptance | null {
    const acceptances = this.getAcceptances();
    const blockingStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    
    return acceptances.find(acc => 
      acc.username === username && blockingStatuses.includes(acc.status)
    ) || null;
  }

  canUserAcceptNewChallenge(username: string): boolean {
    const activeChallenge = this.getUserActiveChallenge(username);
    return activeChallenge === null;
  }

  // Clear all data (for debugging)
  clearAllData(): void {
    try {
      Object.values(this.STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('✅ All localStorage data cleared');
      this.initializeStorage();
    } catch (error) {
      console.error('❌ Error clearing localStorage:', error);
    }
  }

  // Get storage summary for debugging
  getStorageSummary(): void {
    const acceptances = this.getAcceptances();
    const submissions = this.getSubmissions();
    const reviews = this.getReviews();
    const user = this.getCurrentUser();

    console.log('📊 LocalStorage Summary:', {
      acceptances: acceptances.length,
      submissions: submissions.length,
      reviews: reviews.length,
      currentUser: user?.username || 'None',
      version: localStorage.getItem(this.STORAGE_KEYS.version)
    });
  }
}

// Create singleton instance
export const localStorageService = new LocalStorageService();

// Make it available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).localStorageService = localStorageService;
}
