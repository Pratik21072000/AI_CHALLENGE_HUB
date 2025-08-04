// Manual utility to fix user challenge status issues

export function fixUserChallengeStatus(username?: string) {
  console.log('🔧 Running user challenge status fix...');
  
  // Get current user if not provided
  const currentUser = username || (window as any).storageService?.getCurrentUser()?.username;
  
  if (!currentUser) {
    console.log('❌ No user specified and no current user found');
    return;
  }
  
  console.log(`🔧 Fixing challenge status for user: ${currentUser}`);
  
  // Clear any existing acceptances for this user
  const allAcceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const userAcceptances = allAcceptances.filter((acc: any) => acc.username === currentUser);
  
  console.log(`Found ${userAcceptances.length} acceptances for ${currentUser}:`, userAcceptances);
  
  // Remove all acceptances for this user
  const cleanedAcceptances = allAcceptances.filter((acc: any) => acc.username !== currentUser);
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(cleanedAcceptances));
  
  // Also clear submissions and reviews
  const allSubmissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
  const cleanedSubmissions = allSubmissions.filter((sub: any) => sub.username !== currentUser);
  localStorage.setItem('challengeHub_submissions', JSON.stringify(cleanedSubmissions));
  
  const allReviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');
  const cleanedReviews = allReviews.filter((rev: any) => rev.username !== currentUser);
  localStorage.setItem('challengeHub_reviews', JSON.stringify(cleanedReviews));
  
  console.log(`✅ Cleared all challenge data for ${currentUser}`);
  
  // Don't auto-reload - let contexts update naturally
  console.log('✅ User challenge data cleared - contexts will update automatically');
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).fixUserChallengeStatus = fixUserChallengeStatus;
  
  // Don't auto-fix anymore - this was clearing valid data
  console.log('✅ Auto-fix disabled to preserve user data');
}

console.log('🔧 User challenge fix utility loaded - use fixUserChallengeStatus(username) in console');
