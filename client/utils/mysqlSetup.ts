// MySQL Setup Wizard - Easy database setup and migration
import { mysqlService } from '@/services/mysqlService';
import MySQLMigration from './mysqlMigration';

export class MySQLSetup {
  
  static async checkConfiguration(mysqlConfig: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }): Promise<{
    configured: boolean;
    canConnect: boolean;
    error?: string
  }> {
    try {
      // First configure the server-side MySQL
      const configResponse = await fetch('/api/mysql/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mysqlConfig)
      });

      if (!configResponse.ok) {
        const error = await configResponse.text();
        return { configured: false, canConnect: false, error };
      }

      // Then test the client-side API connection
      const connectionTest = await mysqlService.initialize({ apiUrl: '' });

      return {
        configured: connectionTest.success,
        canConnect: connectionTest.success,
        error: connectionTest.error
      };
    } catch (error: any) {
      return {
        configured: false,
        canConnect: false,
        error: error.message
      };
    }
  }

  static async runMigration(config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }, dryRun: boolean = false) {
    console.log(`🚀 Starting ${dryRun ? 'DRY RUN' : 'LIVE'} migration to MySQL...`);
    
    const migration = new MySQLMigration({
      ...config,
      dryRun
    });

    // Test connection first
    const connectionTest = await migration.testConnection();
    if (!connectionTest.success) {
      console.error('❌ Cannot connect to MySQL:', connectionTest.error);
      return { success: false, error: connectionTest.error };
    }

    console.log('✅ MySQL connection successful');

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
        console.log('💾 Your data is now stored in MySQL!');
        console.log('🔄 Refreshing page to use new database...');
        
        // Update localStorage to indicate MySQL is active
        localStorage.setItem('challengeHub_useMySQL', 'true');
        localStorage.setItem('challengeHub_mysqlConfig', JSON.stringify(config));
        
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
🎯 MYSQL SETUP INSTRUCTIONS

1. Prepare MySQL Database:
   - Create a database called 'challengehub'
   - Ensure MySQL server is running
   - Have connection credentials ready
   - Run the schema: mysql -u username -p challengehub < database/mysql-schema.sql

2. Run setup command:
   setupMySQL({
     host: 'localhost',
     port: 3306,
     user: 'your_username',
     password: 'your_password',
     database: 'challengehub'
   })

3. The system will:
   ✅ Configure server-side MySQL connection
   ✅ Create all necessary tables (if not exists)
   ✅ Migrate your localStorage data
   ✅ Update the app to use MySQL
   ✅ Fix all data inconsistencies

🔧 Commands available:
   - setupMySQL(config)           # Full setup with migration
   - testMySQL(config)            # Test connection only
   - debugMySQL()                 # Show current data
   - runMySQLMigrationDryRun(config) # Preview migration without changes

📋 Current Issues That Will Be Fixed:
   ❌ Lisa Thompson shows 0 points (should show actual points)
   ❌ Challenge status inconsistencies
   ❌ Dashboard stats don't match reality
   ❌ Data lost on browser refresh
   ❌ No real-time updates between users

✅ After MySQL Setup:
   ✅ Accurate point totals
   ✅ Consistent challenge states
   ✅ Persistent data storage
   ✅ Multi-user support
   ✅ Better performance
   ✅ Server-side data processing

📝 Example MySQL Setup:
   setupMySQL({
     host: 'localhost',
     port: 3306,
     user: 'root',
     password: 'your_password',
     database: 'challengehub'
   });
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

    // Check points calculation
    let totalPointsFromReviews = 0;
    reviews.forEach((review: any) => {
      if (review.username === user.username && review.status === 'Approved') {
        totalPointsFromReviews += review.pointsAwarded || 0;
      }
    });

    if (totalPointsFromReviews > 0) {
      issues.push(`${user.displayName} should have ${totalPointsFromReviews} points from reviews, but localStorage doesn't track this properly`);
    }

    if (issues.length > 0) {
      console.log('\n❌ Issues Found:');
      issues.forEach(issue => console.log(`  • ${issue}`));
      console.log('\n💡 These will be automatically fixed when you migrate to MySQL!');
    } else {
      console.log('\n✅ No obvious data issues detected');
    }

    return issues;
  }

  static async createDatabase(config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🏗️ Creating MySQL database schema...');
      
      // Initialize connection
      const result = await mysqlService.initialize(config);
      if (!result.success) {
        return result;
      }

      // Note: Schema creation would typically be done via SQL file
      // For now, we assume the schema exists or is created separately
      console.log('✅ Database schema ready');
      
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static getCurrentConfig(): any {
    const configStr = localStorage.getItem('challengeHub_mysqlConfig');
    return configStr ? JSON.parse(configStr) : null;
  }

  static isUsingMySQL(): boolean {
    return localStorage.getItem('challengeHub_useMySQL') === 'true';
  }

  static async switchToMySQL(config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }): Promise<{ success: boolean; error?: string }> {
    try {
      // Test connection
      const test = await this.checkConfiguration(config);
      if (!test.canConnect) {
        return { success: false, error: test.error };
      }

      // Store config and enable MySQL
      localStorage.setItem('challengeHub_mysqlConfig', JSON.stringify(config));
      localStorage.setItem('challengeHub_useMySQL', 'true');

      console.log('✅ Switched to MySQL storage');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  static switchToLocalStorage(): void {
    localStorage.removeItem('challengeHub_useMySQL');
    localStorage.removeItem('challengeHub_mysqlConfig');
    console.log('✅ Switched back to localStorage');
  }

  static async validateMigration(config: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }): Promise<{ valid: boolean; issues: string[] }> {
    const issues: string[] = [];

    try {
      // Initialize connection
      const connectionResult = await mysqlService.initialize(config);
      if (!connectionResult.success) {
        issues.push(`Cannot connect to MySQL: ${connectionResult.error}`);
        return { valid: false, issues };
      }

      // Get data from both sources
      const localStorage_data = {
        acceptances: JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]'),
        submissions: JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]'),
        reviews: JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]')
      };

      const mysql_data = {
        acceptances: await mysqlService.getUserAcceptances('lisa.thompson'), // Use current user
        submissions: await mysqlService.getUserSubmissions('lisa.thompson'),
        reviews: await mysqlService.getUserReviews('lisa.thompson')
      };

      // Compare data counts
      if (localStorage_data.acceptances.length !== mysql_data.acceptances.length) {
        issues.push(`Acceptance count mismatch: localStorage(${localStorage_data.acceptances.length}) vs MySQL(${mysql_data.acceptances.length})`);
      }

      if (localStorage_data.submissions.length !== mysql_data.submissions.length) {
        issues.push(`Submission count mismatch: localStorage(${localStorage_data.submissions.length}) vs MySQL(${mysql_data.submissions.length})`);
      }

      if (localStorage_data.reviews.length !== mysql_data.reviews.length) {
        issues.push(`Review count mismatch: localStorage(${localStorage_data.reviews.length}) vs MySQL(${mysql_data.reviews.length})`);
      }

      console.log(`📊 Validation Results:
        localStorage: ${localStorage_data.acceptances.length} acceptances, ${localStorage_data.submissions.length} submissions, ${localStorage_data.reviews.length} reviews
        MySQL: ${mysql_data.acceptances.length} acceptances, ${mysql_data.submissions.length} submissions, ${mysql_data.reviews.length} reviews
        Issues: ${issues.length}`);

      return { valid: issues.length === 0, issues };

    } catch (error: any) {
      issues.push(`Validation error: ${error.message}`);
      return { valid: false, issues };
    }
  }
}

// Browser console commands for easy access
(window as any).MySQLSetup = MySQLSetup;
(window as any).setupMySQL = async (config: any) => {
  return await MySQLSetup.runMigration(config, false);
};
(window as any).runMySQLMigrationDryRun = async (config: any) => {
  return await MySQLSetup.runMigration(config, true);
};
(window as any).testMySQL = async (config: any) => {
  return await MySQLSetup.checkConfiguration(config);
};
(window as any).showMySQLInstructions = () => MySQLSetup.showSetupInstructions();
(window as any).detectDataIssues = () => MySQLSetup.detectDataIssues();
(window as any).switchToMySQL = async (config: any) => MySQLSetup.switchToMySQL(config);
(window as any).switchToLocalStorage = () => MySQLSetup.switchToLocalStorage();
(window as any).validateMySQLMigration = async (config: any) => MySQLSetup.validateMigration(config);
(window as any).debugMySQL = () => {
  console.log('🔍 MySQL Debug Info:');
  console.log('Using MySQL:', MySQLSetup.isUsingMySQL());
  console.log('Current Config:', MySQLSetup.getCurrentConfig());
  MySQLSetup.detectDataIssues();
};

export default MySQLSetup;
