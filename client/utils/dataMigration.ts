// Data Migration Utility - Fixes existing challenge data
import { storageService } from '@/services/storageService';

interface MigrationResult {
  migratedCount: number;
  errors: string[];
  details: string[];
}

export class DataMigration {
  
  // Fix stuck challenges that should be completed
  static fixStuckChallenges(): MigrationResult {
    const result: MigrationResult = {
      migratedCount: 0,
      errors: [],
      details: []
    };

    try {
      const acceptances = storageService.getAcceptances();
      const submissions = storageService.getSubmissions();
      const reviews = storageService.getReviews();

      console.log('🔍 Starting data migration...');
      console.log('Found:', { acceptances: acceptances.length, submissions: submissions.length, reviews: reviews.length });

      acceptances.forEach(acceptance => {
        const submissionKey = `${acceptance.username}-${acceptance.challengeId}`;
        const hasSubmission = submissions.some(sub => 
          sub.username === acceptance.username && sub.challengeId === acceptance.challengeId
        );
        const review = reviews.find(rev => rev.submissionId === submissionKey);

        // Case 1: Challenge is submitted but has an approved/rejected review
        if (acceptance.status === 'Submitted' && review) {
          let newStatus: string | null = null;
          
          switch (review.status) {
            case 'Approved':
              newStatus = 'Approved';
              break;
            case 'Rejected':
              newStatus = 'Rejected';
              break;
            case 'Needs Rework':
              newStatus = 'Needs Rework';
              break;
          }

          if (newStatus) {
            const success = storageService.updateAcceptanceStatus(acceptance.username, acceptance.challengeId, newStatus);
            if (success) {
              result.migratedCount++;
              result.details.push(`${acceptance.username} - ${acceptance.challengeId}: ${acceptance.status} → ${newStatus}`);
            } else {
              result.errors.push(`Failed to update ${acceptance.username} - ${acceptance.challengeId}`);
            }
          }
        }

        // Case 2: Challenge is in "Under Review" but has a review completed
        if (acceptance.status === 'Under Review' && review && review.status !== 'Pending Review') {
          let newStatus: string | null = null;
          
          switch (review.status) {
            case 'Approved':
              newStatus = 'Approved';
              break;
            case 'Rejected':
              newStatus = 'Rejected';
              break;
            case 'Needs Rework':
              newStatus = 'Needs Rework';
              break;
          }

          if (newStatus) {
            const success = storageService.updateAcceptanceStatus(acceptance.username, acceptance.challengeId, newStatus);
            if (success) {
              result.migratedCount++;
              result.details.push(`${acceptance.username} - ${acceptance.challengeId}: ${acceptance.status} → ${newStatus}`);
            } else {
              result.errors.push(`Failed to update ${acceptance.username} - ${acceptance.challengeId}`);
            }
          }
        }

        // Case 3: Challenge has submission but acceptance is still "Accepted"
        if (acceptance.status === 'Accepted' && hasSubmission) {
          const newStatus = review ? 'Under Review' : 'Submitted';
          const success = storageService.updateAcceptanceStatus(acceptance.username, acceptance.challengeId, newStatus);
          if (success) {
            result.migratedCount++;
            result.details.push(`${acceptance.username} - ${acceptance.challengeId}: ${acceptance.status} → ${newStatus}`);
          } else {
            result.errors.push(`Failed to update ${acceptance.username} - ${acceptance.challengeId}`);
          }
        }
      });

      console.log('✅ Migration completed:', result);
      return result;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      result.errors.push(`Migration failed: ${error}`);
      return result;
    }
  }

  // Auto-run migration if needed
  static autoMigrate(): boolean {
    const acceptances = storageService.getAcceptances();
    const needsMigration = acceptances.some(acc => 
      acc.status === 'Submitted' || acc.status === 'Under Review' || acc.status === 'Accepted'
    );

    if (needsMigration) {
      console.log('🔄 Auto-migration needed, running...');
      const result = this.fixStuckChallenges();
      
      if (result.migratedCount > 0) {
        console.log(`🎉 Auto-migration successful: ${result.migratedCount} challenges fixed`);
        // Reload the page to reflect changes
        window.location.reload();
        return true;
      }
    }

    return false;
  }

  // Manual debugging methods
  static analyzeData() {
    console.log('=== DATA ANALYSIS ===');
    const acceptances = storageService.getAcceptances();
    const submissions = storageService.getSubmissions();
    const reviews = storageService.getReviews();

    console.log('\nChallenge Status Summary:');
    acceptances.forEach(acc => {
      const hasSubmission = submissions.some(sub => 
        sub.username === acc.username && sub.challengeId === acc.challengeId
      );
      const review = reviews.find(rev => 
        rev.submissionId === `${acc.username}-${acc.challengeId}`
      );

      console.log(`${acc.username} - ${acc.challengeId}:`);
      console.log(`  Acceptance: ${acc.status}`);
      console.log(`  Has Submission: ${hasSubmission}`);
      console.log(`  Review: ${review ? review.status : 'None'}`);
      console.log(`  Blocks New Challenges: ${storageService.isChallengeActive(acc.status)}`);
      console.log('');
    });
  }
}

// Export for browser console
(window as any).DataMigration = DataMigration;
(window as any).fixStuckChallenges = () => DataMigration.fixStuckChallenges();
(window as any).analyzeData = () => DataMigration.analyzeData();

export default DataMigration;
