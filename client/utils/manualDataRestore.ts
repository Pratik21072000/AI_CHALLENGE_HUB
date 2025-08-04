/**
 * Manual data restore utilities that can be called from browser console
 * Usage: Open browser console and call window.restoreData()
 */

// Make functions available globally for console access
declare global {
  interface Window {
    showDataState: () => void;
    restoreData: () => void;
    createBackup: () => void;
  }
}

window.showDataState = () => {
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
  const reviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');
  
  console.log('📊 CURRENT DATA STATE:');
  console.log('Acceptances:', acceptances);
  console.log('Submissions:', submissions);
  console.log('Reviews:', reviews);
  
  // Summary by user
  const users = ['employee01', 'employee02', 'employee03', 'manager01'];
  users.forEach(username => {
    const userAcceptances = acceptances.filter((acc: any) => acc.username === username);
    const userSubmissions = submissions.filter((sub: any) => sub.username === username);
    const userReviews = reviews.filter((rev: any) => rev.username === username);
    
    console.log(`👤 ${username}:`, {
      acceptances: userAcceptances.length,
      submissions: userSubmissions.length,
      reviews: userReviews.length
    });
  });
};

window.createBackup = () => {
  const timestamp = new Date().toISOString();
  const acceptances = localStorage.getItem('challengeHub_acceptances');
  const submissions = localStorage.getItem('challengeHub_submissions');
  const reviews = localStorage.getItem('challengeHub_reviews');
  
  if (acceptances) localStorage.setItem(`challengeHub_acceptances_backup_${timestamp}`, acceptances);
  if (submissions) localStorage.setItem(`challengeHub_submissions_backup_${timestamp}`, submissions);
  if (reviews) localStorage.setItem(`challengeHub_reviews_backup_${timestamp}`, reviews);
  
  console.log('💾 Backup created with timestamp:', timestamp);
};

window.restoreData = () => {
  console.log('🔄 Manual data restore initiated...');
  
  // Look for any backup data
  const allKeys = Object.keys(localStorage);
  const backupKeys = allKeys.filter(key => key.includes('_backup'));
  
  console.log('📦 Available backups:', backupKeys);
  
  if (backupKeys.length === 0) {
    console.log('❌ No backup data found');
    return;
  }
  
  // Use the most recent backup
  const latestBackup = backupKeys.sort().reverse()[0];
  const baseKey = latestBackup.replace(/_backup.*/, '');
  
  const backupData = localStorage.getItem(latestBackup);
  if (backupData) {
    localStorage.setItem(baseKey, backupData);
    console.log(`✅ Restored ${baseKey} from ${latestBackup}`);
    console.log('🔄 Please refresh the page to see restored data');
  }
};

console.log('🛠️ Manual data restore utilities loaded');
console.log('📖 Available commands:');
console.log('  window.showDataState() - Show current data');
console.log('  window.createBackup() - Create backup of current data');
console.log('  window.restoreData() - Restore from backup');
