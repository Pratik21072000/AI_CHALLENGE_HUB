// Definitive acceptance state manager

export interface AcceptanceState {
  isAccepted: boolean;
  status: string;
  acceptedAt?: string;
}

export function getDefinitiveAcceptanceState(username: string, challengeId: string): AcceptanceState {
  console.log('🎯 DEFINITIVE ACCEPTANCE STATE CHECK');
  console.log('   Checking:', { username, challengeId });
  
  // Get acceptances from localStorage (most reliable source)
  const acceptancesStr = localStorage.getItem('challengeHub_acceptances');
  const acceptances = acceptancesStr ? JSON.parse(acceptancesStr) : [];
  
  console.log('   All acceptances:', acceptances);
  
  // Find this user's acceptance for this challenge
  const acceptance = acceptances.find((acc: any) => 
    acc.username === username && acc.challengeId === challengeId
  );
  
  console.log('   Found acceptance:', acceptance);
  
  const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review', 'Approved', 'Needs Rework'];
  const isAccepted = acceptance && activeStatuses.includes(acceptance.status);
  
  const result = {
    isAccepted: !!isAccepted,
    status: acceptance?.status || 'Not Found',
    acceptedAt: acceptance?.acceptedAt
  };
  
  console.log('   🎯 FINAL STATE:', result);
  
  return result;
}

export function forceAcceptanceCreation(username: string, challengeId: string): void {
  console.log('🚨 FORCE CREATING ACCEPTANCE');
  
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  
  // Remove any existing acceptance for this user/challenge
  const filtered = acceptances.filter((acc: any) => 
    !(acc.username === username && acc.challengeId === challengeId)
  );
  
  // Create new acceptance
  const newAcceptance = {
    id: `acc_${username}_${challengeId}_${Date.now()}`,
    username: username,
    challengeId: challengeId,
    status: 'Accepted',
    committedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    acceptedAt: new Date().toISOString()
  };
  
  filtered.push(newAcceptance);
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(filtered));
  
  console.log('✅ FORCED ACCEPTANCE CREATED:', newAcceptance);
  
  // Force refresh the page
  window.location.reload();
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).getDefinitiveAcceptanceState = getDefinitiveAcceptanceState;
  (window as any).forceAcceptanceCreation = forceAcceptanceCreation;
  
  // Auto-check current page on load
  setTimeout(() => {
    const currentPath = window.location.pathname;
    const challengeMatch = currentPath.match(/\/challenge\/([^\/]+)/);
    
    if (challengeMatch) {
      const challengeId = challengeMatch[1];
      const userStr = localStorage.getItem('challengeHub_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        getDefinitiveAcceptanceState(user.username, challengeId);
      }
    }
  }, 1000);
}

export default getDefinitiveAcceptanceState;
