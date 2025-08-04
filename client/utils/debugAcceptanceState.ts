// Utility to debug acceptance state issues
export function debugAcceptanceState() {
  console.log('🔍 === DEBUGGING ACCEPTANCE STATE ===');
  
  // Get all data from localStorage
  const challenges = JSON.parse(localStorage.getItem('challengeHub_challenges') || '[]');
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
  
  console.log('📊 Data counts:');
  console.log('  - Challenges:', challenges.length);
  console.log('  - Acceptances:', acceptances.length);
  console.log('  - Submissions:', submissions.length);
  
  console.log('🏆 All challenges:');
  challenges.forEach((challenge: any) => {
    console.log(`  - ${challenge.id}: ${challenge.title}`);
  });
  
  console.log('✅ All acceptances:');
  acceptances.forEach((acceptance: any) => {
    console.log(`  - ${acceptance.username} → ${acceptance.challengeId}: ${acceptance.status}`);
  });
  
  console.log('📤 All submissions:');
  submissions.forEach((submission: any) => {
    console.log(`  - ${submission.username} → ${submission.challengeId}: submitted=${submission.submitted}`);
  });
  
  // Current URL analysis
  const currentPath = window.location.pathname;
  const challengeIdMatch = currentPath.match(/\/challenge\/(.+)/);
  const currentChallengeId = challengeIdMatch ? challengeIdMatch[1] : null;
  
  if (currentChallengeId) {
    console.log('🎯 Current challenge:', currentChallengeId);
    const currentChallenge = challenges.find((c: any) => c.id === currentChallengeId);
    console.log('   Challenge found:', !!currentChallenge);
    if (currentChallenge) {
      console.log('   Title:', currentChallenge.title);
    }
    
    const currentAcceptances = acceptances.filter((a: any) => a.challengeId === currentChallengeId);
    console.log('   Acceptances for this challenge:', currentAcceptances.length);
    currentAcceptances.forEach((acc: any) => {
      console.log(`     - ${acc.username}: ${acc.status}`);
    });
  }
  
  return {
    challenges,
    acceptances,
    submissions,
    currentChallengeId,
    challengeAcceptances: currentChallengeId ? acceptances.filter((a: any) => a.challengeId === currentChallengeId) : []
  };
}

// Force acceptance for current user and challenge (for testing)
export function forceAcceptance(username?: string, challengeId?: string) {
  const currentPath = window.location.pathname;
  const challengeIdMatch = currentPath.match(/\/challenge\/(.+)/);
  const currentChallengeId = challengeId || (challengeIdMatch ? challengeIdMatch[1] : null);
  
  if (!currentChallengeId) {
    console.error('❌ No challenge ID found');
    return false;
  }
  
  const currentUser = username || 'employee03'; // Default to employee03
  
  console.log(`🔧 Forcing acceptance for ${currentUser} on challenge ${currentChallengeId}`);
  
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  
  // Remove any existing acceptance for this user/challenge
  const filteredAcceptances = acceptances.filter((acc: any) => 
    !(acc.username === currentUser && acc.challengeId === currentChallengeId)
  );
  
  // Add new acceptance
  const newAcceptance = {
    id: `acc_${currentUser}_${currentChallengeId}_${Date.now()}`,
    username: currentUser,
    challengeId: currentChallengeId,
    status: 'Accepted',
    committedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    acceptedAt: new Date().toISOString()
  };
  
  filteredAcceptances.push(newAcceptance);
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(filteredAcceptances));
  
  console.log('✅ Forced acceptance created:', newAcceptance);
  
  // Trigger events to refresh UI
  window.dispatchEvent(new CustomEvent('challengeHub:acceptanceChanged'));
  window.dispatchEvent(new CustomEvent('challengeHub:dataChanged'));
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'challengeHub_acceptances',
    newValue: JSON.stringify(filteredAcceptances)
  }));
  
  return true;
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).debugAcceptanceState = debugAcceptanceState;
  (window as any).forceAcceptance = forceAcceptance;
  
  // Quick access for current page
  (window as any).quickDebug = () => {
    const data = debugAcceptanceState();
    console.log('🚀 Quick debug summary:');
    console.log(`Current challenge: ${data.currentChallengeId}`);
    console.log(`Acceptances for this challenge: ${data.challengeAcceptances.length}`);
    return data;
  };
  
  (window as any).quickFix = () => {
    return forceAcceptance();
  };
}
