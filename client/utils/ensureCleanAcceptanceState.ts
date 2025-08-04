import { storageService } from '@/services/storageService';

/**
 * Ensures that the user's acceptance state is clean before accepting a new challenge
 * Removes stale withdrawn acceptances and corrects any data inconsistencies
 */
export function ensureCleanAcceptanceState(username: string): boolean {
  console.log(`🧹 Ensuring clean acceptance state for ${username}...`);
  
  const allAcceptances = storageService.getAcceptances();
  const userAcceptances = allAcceptances.filter(acc => acc.username === username);
  
  console.log(`Found ${userAcceptances.length} acceptances for ${username}:`, 
    userAcceptances.map(acc => ({ challengeId: acc.challengeId, status: acc.status }))
  );
  
  // Remove any withdrawn acceptances (they should not be blocking new acceptances)
  const withdrawnCount = userAcceptances.filter(acc => acc.status === 'Withdrawn').length;
  
  if (withdrawnCount > 0) {
    const cleanedAcceptances = allAcceptances.filter(acc => 
      !(acc.username === username && acc.status === 'Withdrawn')
    );
    
    localStorage.setItem('challengeHub_acceptances', JSON.stringify(cleanedAcceptances));
    console.log(`✅ Removed ${withdrawnCount} withdrawn acceptances for ${username}`);
    
    return true; // Cleanup was performed
  }
  
  console.log(`✅ No cleanup needed for ${username}`);
  return false; // No cleanup needed
}

/**
 * Completely removes all traces of withdrawn challenges from storage
 */
export function cleanAllWithdrawnData(username: string): boolean {
  console.log(`🧹 Complete cleanup of withdrawn data for ${username}...`);

  const allAcceptances = storageService.getAcceptances();
  const withdrawnAcceptances = allAcceptances.filter(acc =>
    acc.username === username && acc.status === 'Withdrawn'
  );

  if (withdrawnAcceptances.length === 0) {
    console.log(`✅ No withdrawn data found for ${username}`);
    return false;
  }

  // Remove withdrawn acceptances
  const cleanedAcceptances = allAcceptances.filter(acc =>
    !(acc.username === username && acc.status === 'Withdrawn')
  );

  localStorage.setItem('challengeHub_acceptances', JSON.stringify(cleanedAcceptances));

  // Also clean up any submissions for withdrawn challenges
  const allSubmissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
  const withdrawnChallengeIds = withdrawnAcceptances.map(acc => acc.challengeId);

  const cleanedSubmissions = allSubmissions.filter(sub =>
    !(sub.username === username && withdrawnChallengeIds.includes(sub.challengeId))
  );

  if (cleanedSubmissions.length !== allSubmissions.length) {
    localStorage.setItem('challengeHub_submissions', JSON.stringify(cleanedSubmissions));
    console.log(`✅ Cleaned up submissions for withdrawn challenges`);
  }

  console.log(`✅ Removed ${withdrawnAcceptances.length} withdrawn records for ${username}`);
  return true;
}

/**
 * Debug function to log current acceptance state
 */
export function debugAcceptanceState(username: string): void {
  const allAcceptances = storageService.getAcceptances();
  const userAcceptances = allAcceptances.filter(acc => acc.username === username);
  const activeChallenge = storageService.getUserActiveChallenge(username);
  const canAccept = storageService.canUserAcceptNewChallenge(username);

  console.log(`📊 Acceptance State Debug for ${username}:`, {
    totalAcceptances: userAcceptances.length,
    acceptances: userAcceptances.map(acc => ({
      challengeId: acc.challengeId,
      status: acc.status,
      acceptedAt: acc.acceptedAt
    })),
    activeChallenge: activeChallenge ? {
      challengeId: activeChallenge.challengeId,
      status: activeChallenge.status
    } : null,
    canAcceptNew: canAccept
  });
}
