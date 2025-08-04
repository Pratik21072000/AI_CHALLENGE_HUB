// Unified Storage Service - Prioritizes MySQL over localStorage for cross-device sync
import type { ChallengeAcceptance, ChallengeSubmission, SubmissionReview } from '@shared/types';
import { mysqlStorageService } from './mysqlStorageService';
import { localStorageService } from './localStorageService';

export interface StorageData {
  acceptances: ChallengeAcceptance[];
  submissions: ChallengeSubmission[];
  reviews: SubmissionReview[];
}

class StorageService {
  private readonly STORAGE_KEYS = {
    acceptances: 'challengeHub_acceptances',
    submissions: 'challengeHub_submissions',
    reviews: 'challengeHub_reviews',
    user: 'challengeHub_user'
  };

  private initialized = false;

  // Initialize storage backend - prioritize localStorage for reliability
  async initialize(): Promise<void> {
    if (this.initialized) return;

    console.log('🔄 Initializing storage backend...');

    // Always ensure localStorage is working first
    localStorageService.getStorageSummary();

    // Try to initialize MySQL as secondary/sync option
    try {
      const mysqlSuccess = await mysqlStorageService.initialize();
      if (mysqlSuccess) {
        console.log('✅ MySQL storage available - enabling cross-device sync');
        // Auto-migrate existing localStorage data to MySQL
        await this.migrateToMySQL();
      } else {
        console.log('⚠️ MySQL not available - using localStorage as primary storage');
      }
    } catch (error) {
      console.warn('⚠️ MySQL initialization failed, using localStorage:', error);
    }

    this.initialized = true;
    console.log('✅ Storage service initialized');
  }

  // Migrate localStorage data to MySQL
  async migrateToMySQL(): Promise<void> {
    try {
      console.log('🔄 Migrating localStorage data to MySQL...');
      await mysqlStorageService.migrateFromLocalStorage();
      console.log('✅ Migration completed - data now synced across devices');
    } catch (error) {
      console.error('❌ Migration failed:', error);
    }
  }

  // Check if MySQL is active
  isUsingMySQL(): boolean {
    return mysqlStorageService.isActive();
  }

  // Get current user
  getCurrentUser(): { username: string; displayName: string; role: string } | null {
    return localStorageService.getCurrentUser();
  }

  // Acceptance Management
  getAcceptances(): ChallengeAcceptance[] {
    // Use localStorage as primary, reliable data source
    return localStorageService.getAcceptances();
  }

  // Async version that uses MySQL
  async getAcceptancesAsync(): Promise<ChallengeAcceptance[]> {
    return await mysqlStorageService.getAcceptances();
  }

  addAcceptance(acceptance: ChallengeAcceptance): boolean {
    // Use localStorage as primary storage
    const success = localStorageService.addAcceptance(acceptance);

    // Also try to sync to MySQL if available (non-blocking)
    if (this.isUsingMySQL()) {
      mysqlStorageService.addAcceptance(acceptance).catch(error => {
        console.warn('⚠️ MySQL sync failed for acceptance:', error);
      });
    }

    return success;
  }

  getUserAcceptance(username: string, challengeId: string): ChallengeAcceptance | null {
    const acceptances = this.getAcceptances();
    return acceptances.find(acc => acc.username === username && acc.challengeId === challengeId) || null;
  }

  hasUserAcceptedChallenge(username: string, challengeId: string): boolean {
    const acceptance = this.getUserAcceptance(username, challengeId);
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    const hasAccepted = acceptance ? activeStatuses.includes(acceptance.status) : false;

    console.log(`🔍 hasUserAcceptedChallenge(${username}, ${challengeId}):`, {
      acceptance,
      hasAccepted
    });

    return hasAccepted;
  }

  getUserActiveChallenge(username: string): ChallengeAcceptance | null {
    const acceptances = this.getAcceptances();
    // Only these statuses prevent accepting new challenges
    const blockingStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];

    const userAcceptances = acceptances.filter(acc => acc.username === username);
    const activeChallenge = acceptances.find(acc =>
      acc.username === username && blockingStatuses.includes(acc.status)
    ) || null;

    console.log(`🔍 getUserActiveChallenge(${username}):`, {
      allUserAcceptances: userAcceptances.map(acc => ({ challengeId: acc.challengeId, status: acc.status })),
      blockingStatuses,
      activeChallenge: activeChallenge ? { challengeId: activeChallenge.challengeId, status: activeChallenge.status } : null,
      totalAcceptances: acceptances.length
    });

    if (activeChallenge) {
      console.log(`⚠️ ${username} has active challenge: ${activeChallenge.challengeId} (${activeChallenge.status})`);
    } else {
      console.log(`✅ ${username} has no active challenges - can accept new ones`);
    }

    return activeChallenge;
  }

  canUserAcceptNewChallenge(username: string): boolean {
    const activeChallenge = this.getUserActiveChallenge(username);
    const allAcceptances = this.getAcceptances().filter(acc => acc.username === username);

    console.log(`🔍 Can ${username} accept new challenge?`, {
      activeChallenge,
      allAcceptances: allAcceptances.map(acc => ({ id: acc.challengeId, status: acc.status })),
      canAccept: !activeChallenge
    });

    return activeChallenge === null;
  }

  // Helper method to check if a challenge status is completed (allows new acceptances)
  isChallengeCompleted(status: string): boolean {
    const completedStatuses = ['Approved', 'Rejected', 'Needs Rework', 'Withdrawn'];
    return completedStatuses.includes(status);
  }

  // Helper method to check if a challenge status is active (blocks new acceptances)
  isChallengeActive(status: string): boolean {
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    return activeStatuses.includes(status);
  }

  updateAcceptanceStatus(username: string, challengeId: string, status: string): boolean {
    // Update in MySQL async (non-blocking)
    mysqlStorageService.updateAcceptanceStatus(username, challengeId, status);

    // Also update localStorage cache
    try {
      const acceptances = this.getAcceptances();
      const index = acceptances.findIndex(
        acc => acc.username === username && acc.challengeId === challengeId
      );

      if (index >= 0) {
        acceptances[index].status = status as any;
        localStorage.setItem(this.STORAGE_KEYS.acceptances, JSON.stringify(acceptances));
        console.log('✅ Acceptance status updated in both MySQL and localStorage:', { username, challengeId, status });

        // Log whether this frees up the user to accept new challenges
        if (this.isChallengeCompleted(status)) {
          console.log(`🎉 ${username} can now accept new challenges! (${challengeId} is ${status})`);
        }

        return true;
      } else {
        console.warn('⚠️ No acceptance found to update:', { username, challengeId });
        return false;
      }
    } catch (error) {
      console.error('❌ Failed to update acceptance status:', error);
      return false;
    }
  }

  // Submission Management
  getSubmissions(): ChallengeSubmission[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.submissions);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addSubmission(submission: ChallengeSubmission): boolean {
    try {
      const submissions = this.getSubmissions();
      
      // Check if user already has submission for this challenge
      const existingIndex = submissions.findIndex(
        sub => sub.username === submission.username && sub.challengeId === submission.challengeId
      );
      
      if (existingIndex >= 0) {
        submissions[existingIndex] = submission;
      } else {
        submissions.push(submission);
      }
      
      localStorage.setItem(this.STORAGE_KEYS.submissions, JSON.stringify(submissions));
      console.log('✅ Submission saved:', submission);
      return true;
    } catch (error) {
      console.error('❌ Failed to save submission:', error);
      return false;
    }
  }

  getUserSubmission(username: string, challengeId: string): ChallengeSubmission | null {
    const submissions = this.getSubmissions();
    return submissions.find(sub => sub.username === username && sub.challengeId === challengeId) || null;
  }

  hasUserSubmitted(username: string, challengeId: string): boolean {
    return this.getUserSubmission(username, challengeId) !== null;
  }

  // Review Management
  getReviews(): SubmissionReview[] {
    try {
      const data = localStorage.getItem(this.STORAGE_KEYS.reviews);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  addReview(review: SubmissionReview): boolean {
    try {
      const reviews = this.getReviews();
      
      // Check if review already exists
      const existingIndex = reviews.findIndex(
        rev => rev.submissionId === review.submissionId
      );
      
      if (existingIndex >= 0) {
        reviews[existingIndex] = review;
      } else {
        reviews.push(review);
      }
      
      localStorage.setItem(this.STORAGE_KEYS.reviews, JSON.stringify(reviews));
      console.log('✅ Review saved:', review);
      return true;
    } catch (error) {
      console.error('❌ Failed to save review:', error);
      return false;
    }
  }

  getSubmissionReview(submissionId: string): SubmissionReview | null {
    const reviews = this.getReviews();
    return reviews.find(rev => rev.submissionId === submissionId) || null;
  }

  // Utility Methods
  clearAllData(): void {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      if (key !== this.STORAGE_KEYS.user) { // Don't clear user session
        localStorage.removeItem(key);
      }
    });
    console.log('🗑️ All challenge data cleared except user session');
  }

  exportData(): StorageData {
    return {
      acceptances: this.getAcceptances(),
      submissions: this.getSubmissions(),
      reviews: this.getReviews()
    };
  }

  importData(data: Partial<StorageData>): void {
    if (data.acceptances) {
      localStorage.setItem(this.STORAGE_KEYS.acceptances, JSON.stringify(data.acceptances));
    }
    if (data.submissions) {
      localStorage.setItem(this.STORAGE_KEYS.submissions, JSON.stringify(data.submissions));
    }
    if (data.reviews) {
      localStorage.setItem(this.STORAGE_KEYS.reviews, JSON.stringify(data.reviews));
    }
    console.log('📥 Data imported successfully');
  }

  // Debug Methods
  debugPrint(): void {
    const user = this.getCurrentUser();
    console.log('=== STORAGE DEBUG ===');
    console.log('User:', user);
    console.log('Acceptances:', this.getAcceptances());
    console.log('Submissions:', this.getSubmissions());
    console.log('Reviews:', this.getReviews());

    if (user) {
      console.log(`\n--- ${user.username} ANALYSIS ---`);
      const allAcceptances = this.getAcceptances().filter(acc => acc.username === user.username);
      allAcceptances.forEach(acc => {
        console.log(`Challenge ${acc.challengeId}: ${acc.status} (${this.isChallengeActive(acc.status) ? 'ACTIVE' : 'INACTIVE'})`);
      });

      const activeChallenge = this.getUserActiveChallenge(user.username);
      console.log('Active challenge:', activeChallenge);
      console.log('Can accept new:', this.canUserAcceptNewChallenge(user.username));
    }
    console.log('==================');
  }
}

// Global instance
export const storageService = new StorageService();

// Export for browser console debugging
(window as any).storageService = storageService;
(window as any).debugStorage = () => storageService.debugPrint();
(window as any).clearChallengeData = () => storageService.clearAllData();
