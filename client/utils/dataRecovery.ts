/**
 * Data recovery utility to restore lost completed challenges
 */

export function recoverLostData(): void {
  console.log('🔄 Attempting to recover lost challenge data...');
  
  // Check for any backup data that might exist
  const backupKeys = [
    'challengeHub_acceptances_backup',
    'challengeHub_submissions_backup',
    'challengeHub_reviews_backup'
  ];
  
  let recoveredData = false;
  
  for (const backupKey of backupKeys) {
    const backup = localStorage.getItem(backupKey);
    if (backup) {
      const originalKey = backupKey.replace('_backup', '');
      const current = localStorage.getItem(originalKey);
      
      if (!current || JSON.parse(current).length === 0) {
        console.log(`📦 Restoring from backup: ${backupKey} -> ${originalKey}`);
        localStorage.setItem(originalKey, backup);
        recoveredData = true;
      }
    }
  }
  
  if (!recoveredData) {
    console.log('⚠️ No backup data found to recover');
  } else {
    console.log('✅ Data recovery completed');
  }
}

/**
 * Create backup of current data before any operations
 */
export function createDataBackup(): void {
  const dataKeys = [
    'challengeHub_acceptances',
    'challengeHub_submissions', 
    'challengeHub_reviews'
  ];
  
  for (const key of dataKeys) {
    const data = localStorage.getItem(key);
    if (data) {
      localStorage.setItem(`${key}_backup`, data);
      console.log(`💾 Backup created for ${key}`);
    }
  }
}

/**
 * Show current data summary for debugging
 */
export function showDataSummary(): void {
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
  const reviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');
  
  console.log('📊 Current Data Summary:');
  console.log(`  Acceptances: ${acceptances.length}`);
  console.log(`  Submissions: ${submissions.length}`);
  console.log(`  Reviews: ${reviews.length}`);
  
  // Group by user
  const userSummary: Record<string, any> = {};
  
  acceptances.forEach((acc: any) => {
    if (!userSummary[acc.username]) {
      userSummary[acc.username] = { acceptances: 0, submissions: 0, reviews: 0 };
    }
    userSummary[acc.username].acceptances++;
  });
  
  submissions.forEach((sub: any) => {
    if (!userSummary[sub.username]) {
      userSummary[sub.username] = { acceptances: 0, submissions: 0, reviews: 0 };
    }
    userSummary[sub.username].submissions++;
  });
  
  reviews.forEach((rev: any) => {
    if (!userSummary[rev.username]) {
      userSummary[rev.username] = { acceptances: 0, submissions: 0, reviews: 0 };
    }
    userSummary[rev.username].reviews++;
  });
  
  console.log('👥 Per User Summary:');
  Object.entries(userSummary).forEach(([username, stats]) => {
    console.log(`  ${username}:`, stats);
  });
}
