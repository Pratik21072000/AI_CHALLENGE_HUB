// Emergency fix for challenge acceptance issues

export function emergencyAcceptancefix() {
  console.log('🚨 RUNNING EMERGENCY ACCEPTANCE FIX');
  
  try {
    // Get current URL to extract challenge ID
    const currentPath = window.location.pathname;
    const challengeIdMatch = currentPath.match(/\/challenge\/(.+)/);
    
    if (!challengeIdMatch) {
      console.log('❌ Not on a challenge page');
      return false;
    }
    
    const challengeId = challengeIdMatch[1];
    const username = 'employee03'; // Default user for demo
    
    console.log(`🎯 Fixing acceptance for ${username} on challenge ${challengeId}`);
    
    // Get current acceptances
    const acceptancesStr = localStorage.getItem('challengeHub_acceptances') || '[]';
    const acceptances = JSON.parse(acceptancesStr);
    
    // Remove any existing acceptance for this user/challenge
    const filteredAcceptances = acceptances.filter((acc: any) => 
      !(acc.username === username && acc.challengeId === challengeId)
    );
    
    // Create new acceptance
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
    
    console.log('✅ EMERGENCY ACCEPTANCE CREATED:', newAcceptance);
    
    // Trigger all possible refresh events
    window.dispatchEvent(new CustomEvent('challengeHub:acceptanceChanged'));
    window.dispatchEvent(new CustomEvent('challengeHub:dataChanged'));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'challengeHub_acceptances',
      newValue: JSON.stringify(filteredAcceptances)
    }));
    
    // Force page reload to ensure UI updates
    setTimeout(() => {
      console.log('🔄 Force reloading page...');
      window.location.reload();
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('❌ Emergency fix failed:', error);
    return false;
  }
}

// Make globally available
if (typeof window !== 'undefined') {
  (window as any).emergencyAcceptancefix = emergencyAcceptancefix;
  
  // Add to existing emergency fix
  (window as any).DEMO_EMERGENCY_FIX = () => {
    console.log('🚨 RUNNING DEMO EMERGENCY FIX');
    
    // Create acceptances for all demo users on current challenge
    const currentPath = window.location.pathname;
    const challengeIdMatch = currentPath.match(/\/challenge\/(.+)/);
    
    if (challengeIdMatch) {
      const challengeId = challengeIdMatch[1];
      
      ['employee01', 'employee02', 'employee03'].forEach((username, index) => {
        const acceptancesStr = localStorage.getItem('challengeHub_acceptances') || '[]';
        const acceptances = JSON.parse(acceptancesStr);
        
        // Remove existing
        const filtered = acceptances.filter((acc: any) => 
          !(acc.username === username && acc.challengeId === challengeId)
        );
        
        // Add new if this is employee03 (current user for demo)
        if (username === 'employee03') {
          const newAcceptance = {
            id: `acc_${username}_${challengeId}_${Date.now()}`,
            username,
            challengeId,
            status: 'Accepted',
            committedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            acceptedAt: new Date().toISOString()
          };
          
          filtered.push(newAcceptance);
          localStorage.setItem('challengeHub_acceptances', JSON.stringify(filtered));
          console.log('✅ Created acceptance for', username);
        }
      });
      
      // Reload page
      window.location.reload();
    }
  };
}
