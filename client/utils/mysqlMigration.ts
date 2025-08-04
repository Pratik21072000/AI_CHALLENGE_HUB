// MySQL Migration - Transfers localStorage data to MySQL database
// Fixes data consistency issues and preserves all user progress

import { mysqlService } from '../services/mysqlService';
import { storageService } from '../services/storageService';

interface MigrationConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
  dryRun?: boolean;
}

interface MigrationResult {
  success: boolean;
  usersCreated: number;
  acceptancesMigrated: number;
  submissionsMigrated: number;
  reviewsMigrated: number;
  pointsCalculated: number;
  errors: string[];
}

class MySQLMigration {
  private config: MigrationConfig;
  private dryRun: boolean;

  constructor(config: MigrationConfig) {
    this.config = config;
    this.dryRun = config.dryRun || false;
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const result = await mysqlService.initialize({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database
      });
      return result;
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async migrateAllData(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      usersCreated: 0,
      acceptancesMigrated: 0,
      submissionsMigrated: 0,
      reviewsMigrated: 0,
      pointsCalculated: 0,
      errors: []
    };

    try {
      console.log(`🚀 Starting ${this.dryRun ? 'DRY RUN' : 'LIVE'} migration...`);

      // Get localStorage data
      const localData = this.extractLocalStorageData();
      console.log('📊 Local data extracted:', {
        users: localData.users.length,
        acceptances: localData.acceptances.length,
        submissions: localData.submissions.length,
        reviews: localData.reviews.length
      });

      if (!this.dryRun) {
        // Initialize MySQL connection
        const connectionResult = await mysqlService.initialize({
          host: this.config.host,
          port: this.config.port,
          user: this.config.user,
          password: this.config.password,
          database: this.config.database
        });

        if (!connectionResult.success) {
          result.errors.push(`Connection failed: ${connectionResult.error}`);
          return result;
        }
      }

      // Migrate users first
      result.usersCreated = await this.migrateUsers(localData.users);
      console.log(`✅ Users migrated: ${result.usersCreated}`);

      // Migrate acceptances
      result.acceptancesMigrated = await this.migrateAcceptances(localData.acceptances);
      console.log(`✅ Acceptances migrated: ${result.acceptancesMigrated}`);

      // Migrate submissions
      result.submissionsMigrated = await this.migrateSubmissions(localData.submissions);
      console.log(`✅ Submissions migrated: ${result.submissionsMigrated}`);

      // Migrate reviews
      result.reviewsMigrated = await this.migrateReviews(localData.reviews);
      console.log(`✅ Reviews migrated: ${result.reviewsMigrated}`);

      // Calculate and update points
      result.pointsCalculated = await this.calculateUserPoints();
      console.log(`✅ Points calculated: ${result.pointsCalculated}`);

      result.success = true;
      console.log('🎉 Migration completed successfully!');

    } catch (error: any) {
      console.error('❌ Migration failed:', error);
      result.errors.push(error.message);
    }

    return result;
  }

  private extractLocalStorageData() {
    console.log('📡 Extracting localStorage data...');

    // Get current user for context
    const currentUserStr = localStorage.getItem('challengeHub_user');
    const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;

    // Extract all data from localStorage
    const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
    const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
    const reviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');

    // Build unique users list from all data sources
    const usersMap = new Map();

    // Add current user
    if (currentUser) {
      usersMap.set(currentUser.username, {
        username: currentUser.username,
        email: currentUser.email || `${currentUser.username}@company.com`,
        display_name: currentUser.displayName || currentUser.username,
        role: currentUser.role || 'Employee',
        department: currentUser.department || 'General'
      });
    }

    // Add users from acceptances
    acceptances.forEach((acceptance: any) => {
      if (!usersMap.has(acceptance.username)) {
        usersMap.set(acceptance.username, {
          username: acceptance.username,
          email: `${acceptance.username}@company.com`,
          display_name: acceptance.username,
          role: 'Employee',
          department: 'General'
        });
      }
    });

    // Add users from submissions
    submissions.forEach((submission: any) => {
      if (!usersMap.has(submission.username)) {
        usersMap.set(submission.username, {
          username: submission.username,
          email: `${submission.username}@company.com`,
          display_name: submission.username,
          role: 'Employee',
          department: 'General'
        });
      }
    });

    // Add reviewers from reviews
    reviews.forEach((review: any) => {
      if (review.reviewerName && !usersMap.has(review.reviewerName)) {
        usersMap.set(review.reviewerName, {
          username: review.reviewerName,
          email: `${review.reviewerName}@company.com`,
          display_name: review.reviewerName,
          role: 'Management',
          department: 'Management'
        });
      }
    });

    return {
      users: Array.from(usersMap.values()),
      acceptances,
      submissions,
      reviews
    };
  }

  private async migrateUsers(users: any[]): Promise<number> {
    console.log('👥 Migrating users...');
    let migrated = 0;

    for (const user of users) {
      try {
        if (this.dryRun) {
          console.log(`[DRY RUN] Would create user: ${user.username} (${user.display_name})`);
          migrated++;
        } else {
          // Check if user already exists
          const existing = await mysqlService.getUserByUsername(user.username);
          if (!existing) {
            const created = await mysqlService.createUser(user);
            if (created) {
              console.log(`✅ Created user: ${user.username}`);
              migrated++;
            }
          } else {
            console.log(`ℹ️ User already exists: ${user.username}`);
            migrated++;
          }
        }
      } catch (error: any) {
        console.error(`❌ Failed to migrate user ${user.username}:`, error.message);
      }
    }

    return migrated;
  }

  private async migrateAcceptances(acceptances: any[]): Promise<number> {
    console.log('🎯 Migrating challenge acceptances...');
    let migrated = 0;

    for (const acceptance of acceptances) {
      try {
        if (this.dryRun) {
          console.log(`[DRY RUN] Would migrate acceptance: ${acceptance.username} -> ${acceptance.challengeId} (${acceptance.status})`);
          migrated++;
        } else {
          const created = await mysqlService.acceptChallenge({
            username: acceptance.username,
            challenge_id: acceptance.challengeId,
            committed_date: acceptance.committedDate
          });

          if (created) {
            // Update status if different from 'Accepted'
            if (acceptance.status !== 'Accepted') {
              await mysqlService.updateAcceptanceStatus(
                acceptance.username,
                acceptance.challengeId,
                acceptance.status
              );
            }
            console.log(`✅ Migrated acceptance: ${acceptance.username} -> ${acceptance.challengeId}`);
            migrated++;
          }
        }
      } catch (error: any) {
        console.error(`❌ Failed to migrate acceptance ${acceptance.username}-${acceptance.challengeId}:`, error.message);
      }
    }

    return migrated;
  }

  private async migrateSubmissions(submissions: any[]): Promise<number> {
    console.log('📝 Migrating submissions...');
    let migrated = 0;

    for (const submission of submissions) {
      try {
        if (this.dryRun) {
          console.log(`[DRY RUN] Would migrate submission: ${submission.username} -> ${submission.challengeId}`);
          migrated++;
        } else {
          const created = await mysqlService.createSubmission({
            username: submission.username,
            challenge_id: submission.challengeId,
            solution_description: submission.solutionDescription || submission.solution || 'Migrated from localStorage',
            short_description: submission.shortDescription,
            github_url: submission.githubUrl,
            demo_url: submission.demoUrl,
            technologies: submission.technologies,
            files_attached: submission.filesAttached || []
          });

          if (created) {
            console.log(`✅ Migrated submission: ${submission.username} -> ${submission.challengeId}`);
            migrated++;
          }
        }
      } catch (error: any) {
        console.error(`❌ Failed to migrate submission ${submission.username}-${submission.challengeId}:`, error.message);
      }
    }

    return migrated;
  }

  private async migrateReviews(reviews: any[]): Promise<number> {
    console.log('⭐ Migrating reviews...');
    let migrated = 0;

    for (const review of reviews) {
      try {
        if (this.dryRun) {
          console.log(`[DRY RUN] Would migrate review: ${review.username} -> ${review.challengeId} (${review.status})`);
          migrated++;
        } else {
          // Find the submission for this review
          const submissions = await mysqlService.getUserSubmissions(review.username);
          const submission = submissions.find(s => s.challenge_id === review.challengeId);

          if (submission) {
            const created = await mysqlService.createReview({
              submission_id: submission.id,
              username: review.username,
              challenge_id: review.challengeId,
              reviewer_name: review.reviewerName || 'System',
              status: review.status,
              review_comment: review.reviewComment,
              points_awarded: review.pointsAwarded || 0,
              is_on_time: review.isOnTime !== false,
              submission_date: review.submissionDate || submission.submitted_at,
              commitment_date: review.commitmentDate || submission.submitted_at
            });

            if (created) {
              console.log(`✅ Migrated review: ${review.username} -> ${review.challengeId}`);
              migrated++;
            }
          } else {
            console.warn(`⚠️ No submission found for review: ${review.username} -> ${review.challengeId}`);
          }
        }
      } catch (error: any) {
        console.error(`❌ Failed to migrate review ${review.username}-${review.challengeId}:`, error.message);
      }
    }

    return migrated;
  }

  private async calculateUserPoints(): Promise<number> {
    console.log('🧮 Calculating user points...');
    let calculated = 0;

    if (this.dryRun) {
      console.log('[DRY RUN] Would calculate and update user points');
      return 1;
    }

    try {
      // Get all reviews and calculate points per user
      const allReviews = await mysqlService.getAllReviews();
      const userPoints = new Map<string, number>();

      allReviews.forEach(review => {
        const current = userPoints.get(review.username) || 0;
        userPoints.set(review.username, current + review.points_awarded);
      });

      // Update each user's total points
      for (const [username, totalPoints] of userPoints) {
        const user = await mysqlService.getUserByUsername(username);
        if (user && user.total_points !== totalPoints) {
          await mysqlService.updateUserPoints(username, totalPoints - user.total_points, 'Migration points calculation');
          console.log(`✅ Updated points for ${username}: ${totalPoints}`);
          calculated++;
        }
      }

    } catch (error: any) {
      console.error('❌ Failed to calculate points:', error.message);
    }

    return calculated;
  }

  // Fix common data issues found in localStorage
  async fixDataConsistency(): Promise<{ fixed: number; issues: string[] }> {
    console.log('🔧 Fixing data consistency issues...');
    const issues: string[] = [];
    let fixed = 0;

    if (this.dryRun) {
      console.log('[DRY RUN] Would fix data consistency issues');
      return { fixed: 0, issues: [] };
    }

    try {
      // Fix 1: Ensure acceptance status matches review status
      const allReviews = await mysqlService.getAllReviews();
      for (const review of allReviews) {
        const acceptances = await mysqlService.getUserAcceptances(review.username);
        const acceptance = acceptances.find(a => a.challenge_id === review.challenge_id);
        
        if (acceptance && acceptance.status !== review.status) {
          await mysqlService.updateAcceptanceStatus(review.username, review.challenge_id, review.status);
          issues.push(`Fixed acceptance status mismatch for ${review.username} - ${review.challenge_id}`);
          fixed++;
        }
      }

      // Fix 2: Update submission statuses to match reviews
      const allSubmissions = await mysqlService.getAllSubmissions();
      for (const submission of allSubmissions) {
        const userReviews = await mysqlService.getUserReviews(submission.username);
        const review = userReviews.find(r => r.challenge_id === submission.challenge_id);
        
        if (review && submission.status !== review.status) {
          // Note: This would require adding updateSubmissionStatus method to mysqlService
          issues.push(`Submission status mismatch detected for ${submission.username} - ${submission.challenge_id}`);
        }
      }

      console.log(`✅ Fixed ${fixed} data consistency issues`);

    } catch (error: any) {
      console.error('❌ Failed to fix data consistency:', error.message);
      issues.push(`Error fixing consistency: ${error.message}`);
    }

    return { fixed, issues };
  }
}

export default MySQLMigration;
