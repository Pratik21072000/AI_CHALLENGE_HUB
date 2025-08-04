// Utility to clear stuck challenge state for demo

export function clearStuckChallenge() {
  console.log('🧹 Clearing stuck challenge state...');
  
  try {
    // Get current acceptances
    const acceptancesStr = localStorage.getItem('challengeHub_acceptances') || '[]';
    const acceptances = JSON.parse(acceptancesStr);
    
    console.log('Current acceptances:', acceptances);
    
    // Remove all acceptances for employee01 (John Doe)
    const filteredAcceptances = acceptances.filter((acc: any) => 
      acc.username !== 'employee01'
    );
    
    localStorage.setItem('challengeHub_acceptances', JSON.stringify(filteredAcceptances));
    
    console.log('✅ Cleared all acceptances for employee01');
    console.log('Remaining acceptances:', filteredAcceptances);
    
    // Also clear session storage markers
    Object.keys(sessionStorage).forEach(key => {
      if (key.includes('recentAcceptance_employee01') || key.includes('challengeAcceptedFrom')) {
        sessionStorage.removeItem(key);
        console.log('Cleared session key:', key);
      }
    });
    
    // Trigger events to refresh UI
    window.dispatchEvent(new CustomEvent('challengeHub:acceptanceChanged'));
    window.dispatchEvent(new CustomEvent('challengeHub:dataChanged'));
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'challengeHub_acceptances',
      newValue: JSON.stringify(filteredAcceptances)
    }));
    
    console.log('✅ Triggered refresh events');
    
    // Force page reload to ensure clean state
    setTimeout(() => {
      console.log('🔄 Reloading page for clean state...');
      window.location.reload();
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to clear stuck challenge:', error);
    return false;
  }
}

// Make available globally for emergency use
if (typeof window !== 'undefined') {
  (window as any).clearStuckChallenge = clearStuckChallenge;
  
  // Also provide a complete data reset
  (window as any).completeReset = () => {
    console.log('🚨 COMPLETE DATA RESET');
    localStorage.removeItem('challengeHub_acceptances');
    localStorage.removeItem('challengeHub_submissions');
    sessionStorage.clear();
    window.location.reload();
  };
}
