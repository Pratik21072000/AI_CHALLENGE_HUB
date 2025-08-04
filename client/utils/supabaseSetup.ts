// Supabase Setup Wizard - Guides through database setup
import { supabaseService } from '@/services/supabaseService';
import SupabaseMigration from './supabaseMigration';

export class SupabaseSetup {
  
  static async checkConfiguration(): Promise<{ 
    configured: boolean; 
    hasEnvVars: boolean; 
    canConnect: boolean; 
    error?: string 
  }> {
    const hasEnvVars = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
    
    if (!hasEnvVars) {
      return { 
        configured: false, 
        hasEnvVars: false, 
        canConnect: false,
        error: 'Environment variables not set'
      };
    }

    const connectionTest = await supabaseService.testConnection();
    
    return {
      configured: connectionTest.success,
      hasEnvVars: true,
      canConnect: connectionTest.success,
      error: connectionTest.error
    };
  }

  static async runMigration(supabaseUrl: string, supabaseKey: string, dryRun: boolean = false) {
    console.log(`🚀 Starting ${dryRun ? 'DRY RUN' : 'LIVE'} migration to Supabase...`);
    
    const migration = new SupabaseMigration({
      supabaseUrl,
      supabaseKey,
      dryRun
    });

    // Test connection first
    const connectionTest = await migration.testConnection();
    if (!connectionTest.success) {
      console.error('❌ Cannot connect to Supabase:', connectionTest.error);
      return { success: false, error: connectionTest.error };
    }

    console.log('✅ Supabase connection successful');

    // Run the migration
    const result = await migration.migrateAllData();
    
    if (result.success) {
      console.log('🎉 Migration completed successfully!');
      console.log(`📊 Results:
        - Users: ${result.usersCreated}
        - Acceptances: ${result.acceptancesMigrated}
        - Submissions: ${result.submissionsMigrated}
        - Reviews: ${result.reviewsMigrated}
        - Points Updated: ${result.pointsCalculated}`);
      
      if (!dryRun) {
        console.log('💾 Your data is now stored in Supabase!');
        console.log('🔄 Refreshing page to use new database...');
        
        // Wait a moment then reload
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } else {
      console.error('❌ Migration failed:', result.errors);
    }

    return result;
  }

  static showSetupInstructions() {
    console.log(`
🎯 SUPABASE SETUP INSTRUCTIONS

1. Connect Supabase MCP:
   - Click the "MCP Servers" button in your interface
   - Select "Supabase" from available integrations
   - Follow the connection prompts

2. Once connected, run setup:
   setupSupabase('your-project-url', 'your-anon-key')

3. The system will:
   ✅ Create all necessary tables
   ✅ Migrate your localStorage data
   ✅ Update the app to use Supabase
   ✅ Fix all data inconsistencies

🔧 Commands available:
   - setupSupabase(url, key)     # Full setup with migration
   - testSupabase()              # Test current connection
   - debugSupabase()             # Show current data
   - runMigrationDryRun(url, key) # Preview migration without changes

📋 Current Issues That Will Be Fixed:
   ❌ Lisa Thompson shows 0 points (should show actual points)
   ❌ Challenge status inconsistencies
   ❌ Dashboard stats don't match reality
   ❌ Data lost on browser refresh
   ❌ No real-time updates between users

✅ After Supabase Setup:
   ✅ Accurate point totals
   ✅ Consistent challenge states
   ✅ Real-time updates
   ✅ Persistent data storage
   ✅ Multi-user support
    `);
  }

  static detectDataIssues() {
    console.log('🔍 Analyzing current data issues...');
    
    // Get current user
    const userStr = localStorage.getItem('challengeHub_user');
    if (!userStr) {
      console.log('❌ No user logged in');
      return;
    }

    const user = JSON.parse(userStr);
    console.log(`👤 Current user: ${user.displayName} (${user.username})`);

    // Check localStorage data
    const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
    const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
    const reviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');

    console.log('\n📊 Data Summary:');
    console.log(`Acceptances: ${acceptances.length}`);
    console.log(`Submissions: ${submissions.length}`);
    console.log(`Reviews: ${reviews.length}`);

    // Analyze issues
    const issues = [];
    
    // Check for status mismatches
    acceptances.forEach((acc: any) => {
      const submission = submissions.find((sub: any) => 
        sub.username === acc.username && sub.challengeId === acc.challengeId
      );
      const review = reviews.find((rev: any) => 
        rev.username === acc.username && rev.challengeId === acc.challengeId
      );

      if (review && review.status === 'Approved' && acc.status !== 'Approved') {
        issues.push(`${acc.username} - ${acc.challengeId}: Acceptance is "${acc.status}" but review is "Approved"`);
      }

      if (submission && !review && acc.status === 'Accepted') {
        issues.push(`${acc.username} - ${acc.challengeId}: Has submission but acceptance still shows "Accepted"`);
      }
    });

    if (issues.length > 0) {
      console.log('\n❌ Issues Found:');
      issues.forEach(issue => console.log(`  • ${issue}`));
      console.log('\n💡 These will be automatically fixed when you migrate to Supabase!');
    } else {
      console.log('\n✅ No obvious data issues detected');
    }

    return issues;
  }
}

// Browser console commands
(window as any).SupabaseSetup = SupabaseSetup;
(window as any).setupSupabase = async (url: string, key: string) => {
  return await SupabaseSetup.runMigration(url, key, false);
};
(window as any).runMigrationDryRun = async (url: string, key: string) => {
  return await SupabaseSetup.runMigration(url, key, true);
};
(window as any).checkSupabaseConfig = () => SupabaseSetup.checkConfiguration();
(window as any).showSupabaseInstructions = () => SupabaseSetup.showSetupInstructions();
(window as any).detectDataIssues = () => SupabaseSetup.detectDataIssues();

export default SupabaseSetup;
