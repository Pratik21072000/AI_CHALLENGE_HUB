// Supabase Migration Utility - Migrates localStorage data to Supabase
import { createClient } from '@supabase/supabase-js';
import { storageService } from '@/services/storageService';

interface MigrationConfig {
  supabaseUrl: string;
  supabaseKey: string;
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
  details: string[];
}

export class SupabaseMigration {
  private supabase: any;
  private dryRun: boolean;

  constructor(config: MigrationConfig) {
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    this.dryRun = config.dryRun || false;
  }

  async migrateAllData(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      usersCreated: 0,
      acceptancesMigrated: 0,
      submissionsMigrated: 0,
      reviewsMigrated: 0,
      pointsCalculated: 0,
      errors: [],
      details: []
    };

    try {
      console.log('🚀 Starting Supabase migration...');
      
      // Step 1: Migrate Users
      const usersResult = await this.migrateUsers();
      result.usersCreated = usersResult.created;
      result.errors.push(...usersResult.errors);
      result.details.push(...usersResult.details);

      // Step 2: Migrate Challenge Acceptances
      const acceptancesResult = await this.migrateAcceptances();
      result.acceptancesMigrated = acceptancesResult.migrated;
      result.errors.push(...acceptancesResult.errors);
      result.details.push(...acceptancesResult.details);

      // Step 3: Migrate Submissions
      const submissionsResult = await this.migrateSubmissions();
      result.submissionsMigrated = submissionsResult.migrated;
      result.errors.push(...submissionsResult.errors);
      result.details.push(...submissionsResult.details);

      // Step 4: Migrate Reviews
      const reviewsResult = await this.migrateReviews();
      result.reviewsMigrated = reviewsResult.migrated;
      result.errors.push(...reviewsResult.errors);
      result.details.push(...reviewsResult.details);

      // Step 5: Calculate and set user points
      const pointsResult = await this.calculateUserPoints();
      result.pointsCalculated = pointsResult.updated;
      result.errors.push(...pointsResult.errors);
      result.details.push(...pointsResult.details);

      result.success = result.errors.length === 0;
      
      console.log('✅ Migration completed:', result);
      return result;

    } catch (error) {
      console.error('❌ Migration failed:', error);
      result.errors.push(`Migration failed: ${error}`);
      return result;
    }
  }

  private async migrateUsers() {
    const result = { created: 0, errors: [] as string[], details: [] as string[] };
    
    try {
      // Get current user from localStorage
      const currentUser = storageService.getCurrentUser();
      if (!currentUser) {
        result.errors.push('No current user found in localStorage');
        return result;
      }

      // Get all unique users from acceptances/submissions
      const acceptances = storageService.getAcceptances();
      const submissions = storageService.getSubmissions();
      
      const usernames = new Set([
        currentUser.username,
        ...acceptances.map(acc => acc.username),
        ...submissions.map(sub => sub.username)
      ]);

      const userMappings: { [username: string]: any } = {
        'employee01': { email: 'john.doe@company.com', displayName: 'John Doe', role: 'Employee', department: 'Engineering' },
        'employee02': { email: 'lisa.thompson@company.com', displayName: 'Lisa Thompson', role: 'Employee', department: 'Product' },
        'employee03': { email: 'mike.chen@company.com', displayName: 'Mike Chen', role: 'Employee', department: 'Design' },
        'manager01': { email: 'sarah.wilson@company.com', displayName: 'Sarah Wilson', role: 'Management', department: 'Management' }
      };

      for (const username of usernames) {
        const mapping = userMappings[username];
        if (!mapping) {
          result.errors.push(`No mapping found for user: ${username}`);
          continue;
        }

        const userData = {
          username,
          email: mapping.email,
          display_name: mapping.displayName,
          role: mapping.role,
          department: mapping.department,
          total_points: 0 // Will be calculated later
        };

        if (!this.dryRun) {
          const { error } = await this.supabase
            .from('users')
            .upsert(userData, { onConflict: 'username' });

          if (error) {
            result.errors.push(`Failed to create user ${username}: ${error.message}`);
          } else {
            result.created++;
            result.details.push(`✅ User created: ${mapping.displayName} (${username})`);
          }
        } else {
          result.created++;
          result.details.push(`[DRY RUN] Would create user: ${mapping.displayName} (${username})`);
        }
      }

    } catch (error) {
      result.errors.push(`User migration failed: ${error}`);
    }

    return result;
  }

  private async migrateAcceptances() {
    const result = { migrated: 0, errors: [] as string[], details: [] as string[] };
    
    try {
      const acceptances = storageService.getAcceptances();
      
      for (const acceptance of acceptances) {
        // Get user ID from username
        const { data: user } = await this.supabase
          .from('users')
          .select('id')
          .eq('username', acceptance.username)
          .single();

        if (!user) {
          result.errors.push(`User not found for acceptance: ${acceptance.username}`);
          continue;
        }

        const acceptanceData = {
          user_id: user.id,
          username: acceptance.username,
          challenge_id: acceptance.challengeId,
          status: acceptance.status,
          committed_date: acceptance.committedDate,
          accepted_at: acceptance.acceptedAt
        };

        if (!this.dryRun) {
          const { error } = await this.supabase
            .from('challenge_acceptances')
            .upsert(acceptanceData, { onConflict: 'user_id,challenge_id' });

          if (error) {
            result.errors.push(`Failed to migrate acceptance ${acceptance.username}-${acceptance.challengeId}: ${error.message}`);
          } else {
            result.migrated++;
            result.details.push(`✅ Acceptance migrated: ${acceptance.username} - ${acceptance.challengeId} (${acceptance.status})`);
          }
        } else {
          result.migrated++;
          result.details.push(`[DRY RUN] Would migrate acceptance: ${acceptance.username} - ${acceptance.challengeId}`);
        }
      }

    } catch (error) {
      result.errors.push(`Acceptance migration failed: ${error}`);
    }

    return result;
  }

  private async migrateSubmissions() {
    const result = { migrated: 0, errors: [] as string[], details: [] as string[] };
    
    try {
      const submissions = storageService.getSubmissions();
      
      for (const submission of submissions) {
        // Get user ID
        const { data: user } = await this.supabase
          .from('users')
          .select('id')
          .eq('username', submission.username)
          .single();

        if (!user) {
          result.errors.push(`User not found for submission: ${submission.username}`);
          continue;
        }

        // Get acceptance ID
        const { data: acceptance } = await this.supabase
          .from('challenge_acceptances')
          .select('id')
          .eq('user_id', user.id)
          .eq('challenge_id', submission.challengeId)
          .single();

        const submissionData = {
          user_id: user.id,
          username: submission.username,
          challenge_id: submission.challengeId,
          acceptance_id: acceptance?.id,
          solution_description: submission.solutionDescription || 'No description provided',
          short_description: submission.shortDescription,
          github_url: submission.sourceCodeUrl,
          demo_url: submission.hostedAppUrl,
          technologies: submission.technologies,
          status: submission.status || 'Submitted',
          submitted_at: submission.submittedAt,
          is_submitted: submission.submitted !== false
        };

        if (!this.dryRun) {
          const { error } = await this.supabase
            .from('submissions')
            .upsert(submissionData, { onConflict: 'user_id,challenge_id' });

          if (error) {
            result.errors.push(`Failed to migrate submission ${submission.username}-${submission.challengeId}: ${error.message}`);
          } else {
            result.migrated++;
            result.details.push(`✅ Submission migrated: ${submission.username} - ${submission.challengeId}`);
          }
        } else {
          result.migrated++;
          result.details.push(`[DRY RUN] Would migrate submission: ${submission.username} - ${submission.challengeId}`);
        }
      }

    } catch (error) {
      result.errors.push(`Submission migration failed: ${error}`);
    }

    return result;
  }

  private async migrateReviews() {
    const result = { migrated: 0, errors: [] as string[], details: [] as string[] };
    
    try {
      const reviews = storageService.getReviews();
      
      for (const review of reviews) {
        // Get submission ID from Supabase
        const { data: submission } = await this.supabase
          .from('submissions')
          .select('id, user_id')
          .eq('username', review.username)
          .eq('challenge_id', review.challengeId)
          .single();

        if (!submission) {
          result.errors.push(`Submission not found for review: ${review.username}-${review.challengeId}`);
          continue;
        }

        // Get reviewer ID
        const { data: reviewer } = await this.supabase
          .from('users')
          .select('id')
          .eq('display_name', review.reviewedBy || 'Sarah Wilson')
          .single();

        const reviewData = {
          submission_id: submission.id,
          reviewer_id: reviewer?.id,
          reviewer_name: review.reviewedBy || 'Sarah Wilson',
          status: review.status,
          review_comment: review.reviewComment,
          points_awarded: review.pointsAwarded || 0,
          is_on_time: review.isOnTime !== false,
          submission_date: review.submissionDate,
          commitment_date: review.commitmentDate || review.submissionDate,
          reviewed_at: review.reviewedAt || new Date().toISOString()
        };

        if (!this.dryRun) {
          const { error } = await this.supabase
            .from('submission_reviews')
            .upsert(reviewData, { onConflict: 'submission_id' });

          if (error) {
            result.errors.push(`Failed to migrate review ${review.submissionId}: ${error.message}`);
          } else {
            result.migrated++;
            result.details.push(`✅ Review migrated: ${review.username} - ${review.challengeId} (${review.status})`);
          }
        } else {
          result.migrated++;
          result.details.push(`[DRY RUN] Would migrate review: ${review.username} - ${review.challengeId}`);
        }
      }

    } catch (error) {
      result.errors.push(`Review migration failed: ${error}`);
    }

    return result;
  }

  private async calculateUserPoints() {
    const result = { updated: 0, errors: [] as string[], details: [] as string[] };
    
    try {
      // Get all users
      const { data: users, error: usersError } = await this.supabase
        .from('users')
        .select('id, username, display_name');

      if (usersError) {
        result.errors.push(`Failed to fetch users: ${usersError.message}`);
        return result;
      }

      for (const user of users) {
        // Get all approved reviews for this user
        const { data: approvedReviews } = await this.supabase
          .from('submission_reviews')
          .select('points_awarded')
          .eq('reviewer_name', user.display_name)
          .eq('status', 'Approved');

        // Calculate total points
        const totalPoints = approvedReviews?.reduce((sum, review) => sum + (review.points_awarded || 0), 0) || 0;

        if (!this.dryRun) {
          const { error } = await this.supabase
            .from('users')
            .update({ total_points: totalPoints })
            .eq('id', user.id);

          if (error) {
            result.errors.push(`Failed to update points for ${user.username}: ${error.message}`);
          } else {
            result.updated++;
            result.details.push(`✅ Points updated: ${user.display_name} = ${totalPoints} points`);
          }
        } else {
          result.updated++;
          result.details.push(`[DRY RUN] Would set points: ${user.display_name} = ${totalPoints} points`);
        }
      }

    } catch (error) {
      result.errors.push(`Points calculation failed: ${error}`);
    }

    return result;
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
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
}

// Browser console utilities
(window as any).SupabaseMigration = SupabaseMigration;
(window as any).testSupabaseConnection = async (url: string, key: string) => {
  const migration = new SupabaseMigration({ supabaseUrl: url, supabaseKey: key });
  return await migration.testConnection();
};

export default SupabaseMigration;
