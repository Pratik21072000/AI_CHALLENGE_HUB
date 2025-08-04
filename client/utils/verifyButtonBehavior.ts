// Verify button behavior for challenge acceptance

export function verifyButtonBehavior(username: string) {
  console.log(`🔍 Verifying button behavior for ${username}:`);
  
  // Get current user's challenge status
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const userAcceptances = acceptances.filter((acc: any) => acc.username === username);
  
  const hasActiveChallenge = userAcceptances.some((acc: any) => 
    ['Accepted', 'Submitted', 'Pending Review', 'Under Review'].includes(acc.status)
  );
  
  const activeChallenge = userAcceptances.find((acc: any) => 
    ['Accepted', 'Submitted', 'Pending Review', 'Under Review'].includes(acc.status)
  );
  
  console.log(`User ${username} status:`, {
    hasActiveChallenge,
    activeChallenge: activeChallenge ? {
      challengeId: activeChallenge.challengeId,
      status: activeChallenge.status
    } : null,
    totalAcceptances: userAcceptances.length
  });
  
  // Expected behavior rules
  console.log('📋 Expected button behavior rules:');
  console.log('1. If no active challenge: All "Accept" buttons should be ENABLED');
  console.log('2. If has active challenge: Only active challenge shows status, others show "Accept" but DISABLED');
  console.log('3. Buttons should be enabled again when active challenge is approved/rejected/rework');
  
  return {
    hasActiveChallenge,
    activeChallenge,
    expectedBehavior: hasActiveChallenge 
      ? 'Only accepted challenge should show status, others should show disabled "Accept"'
      : 'All challenges should show enabled "Accept" buttons'
  };
}

// Make it available globally
if (typeof window !== 'undefined') {
  (window as any).verifyButtonBehavior = verifyButtonBehavior;
  
  console.log('🔍 Button behavior verification loaded - use verifyButtonBehavior(username) in console');
}
