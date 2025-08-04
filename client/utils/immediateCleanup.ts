/**
 * Immediate cleanup utility to fix current withdrawn challenge data
 */

export function immediateWithdrawnCleanup(): void {
  console.log('🚨 IMMEDIATE CLEANUP: Removing all withdrawn challenges from storage...');
  
  // Clean acceptances
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const cleanedAcceptances = acceptances.filter((acc: any) => acc.status !== 'Withdrawn');
  
  if (cleanedAcceptances.length !== acceptances.length) {
    localStorage.setItem('challengeHub_acceptances', JSON.stringify(cleanedAcceptances));
    console.log(`✅ Removed ${acceptances.length - cleanedAcceptances.length} withdrawn acceptances`);
  }
  
  // Clean submissions for withdrawn challenges
  const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
  const withdrawnAcceptances = acceptances.filter((acc: any) => acc.status === 'Withdrawn');
  const withdrawnChallengeIds = withdrawnAcceptances.map((acc: any) => acc.challengeId);
  
  const cleanedSubmissions = submissions.filter((sub: any) => 
    !withdrawnChallengeIds.includes(sub.challengeId)
  );
  
  if (cleanedSubmissions.length !== submissions.length) {
    localStorage.setItem('challengeHub_submissions', JSON.stringify(cleanedSubmissions));
    console.log(`✅ Removed ${submissions.length - cleanedSubmissions.length} submissions for withdrawn challenges`);
  }
  
  console.log('✅ IMMEDIATE CLEANUP COMPLETE - Data cleaned from localStorage');
}

// Auto-run cleanup DISABLED to prevent data loss
// Only run cleanup manually when needed
console.log('🛡️ Auto-cleanup disabled to preserve completed challenges');
