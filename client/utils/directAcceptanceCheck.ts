// Direct localStorage acceptance checker - bypasses all complex logic
export function getDirectAcceptanceStatus(username: string, challengeId: string) {
  try {
    const acceptancesStr = localStorage.getItem('challengeHub_acceptances');
    if (!acceptancesStr) return { isAccepted: false, status: null };
    
    const acceptances = JSON.parse(acceptancesStr);
    const userAcceptance = acceptances.find((acc: any) => 
      acc.username === username && acc.challengeId === challengeId
    );
    
    if (!userAcceptance) return { isAccepted: false, status: null };
    
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review', 'Approved', 'Needs Rework'];
    const isAccepted = activeStatuses.includes(userAcceptance.status);
    
    console.log('🎯 DIRECT CHECK:', { username, challengeId, userAcceptance, isAccepted });
    
    return { isAccepted, status: userAcceptance.status, acceptance: userAcceptance };
  } catch (error) {
    console.error('Direct acceptance check failed:', error);
    return { isAccepted: false, status: null };
  }
}

export function forceCreateAcceptance(username: string, challengeId: string) {
  try {
    const acceptancesStr = localStorage.getItem('challengeHub_acceptances') || '[]';
    const acceptances = JSON.parse(acceptancesStr);
    
    // Remove any existing acceptance for this user/challenge
    const filteredAcceptances = acceptances.filter((acc: any) => 
      !(acc.username === username && acc.challengeId === challengeId)
    );
    
    // Add new acceptance
    const newAcceptance = {
      id: `acc_${username}_${challengeId}_${Date.now()}`,
      username,
      challengeId,
      status: 'Accepted',
      committedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      acceptedAt: new Date().toISOString()
    };
    
    filteredAcceptances.push(newAcceptance);
    localStorage.setItem('challengeHub_acceptances', JSON.stringify(filteredAcceptances));
    
    // Trigger all possible refresh events
    window.dispatchEvent(new CustomEvent('challengeHub:acceptanceChanged'));
    window.dispatchEvent(new CustomEvent('challengeHub:dataChanged'));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'challengeHub_acceptances',
      newValue: JSON.stringify(filteredAcceptances)
    }));
    
    console.log('✅ FORCED ACCEPTANCE CREATED:', newAcceptance);
    return true;
  } catch (error) {
    console.error('Failed to force create acceptance:', error);
    return false;
  }
}

// Make globally available for emergency fixes
if (typeof window !== 'undefined') {
  (window as any).getDirectAcceptanceStatus = getDirectAcceptanceStatus;
  (window as any).forceCreateAcceptance = forceCreateAcceptance;
  (window as any).emergencyFix = () => {
    const currentPath = window.location.pathname;
    const challengeIdMatch = currentPath.match(/\/challenge\/(.+)/);
    if (challengeIdMatch) {
      const challengeId = challengeIdMatch[1];
      return forceCreateAcceptance('employee03', challengeId);
    }
    return false;
  };
}
