// Comprehensive data consistency fix for demo

export function ensureDataConsistency() {
  console.log('🔧 Ensuring data consistency for demo...');
  
  // Clear the emergency fix session flag so normal logic works
  sessionStorage.removeItem('challengeHub_emergencyFixApplied');
  
  // Ensure localStorage data is properly formatted
  const keys = ['challengeHub_acceptances', 'challengeHub_submissions', 'challengeHub_reviews'];
  
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (!data) {
      localStorage.setItem(key, JSON.stringify([]));
    } else {
      try {
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) {
          localStorage.setItem(key, JSON.stringify([]));
        }
      } catch (e) {
        localStorage.setItem(key, JSON.stringify([]));
      }
    }
  });
  
  // Override localStorage setItem to force immediate sync
  const originalSetItem = localStorage.setItem.bind(localStorage);
  localStorage.setItem = function(key: string, value: string) {
    originalSetItem(key, value);
    
    if (key.startsWith('challengeHub_')) {
      console.log(`✅ Data saved: ${key} - triggering sync`);
      
      // Trigger immediate context refresh
      setTimeout(() => {
        window.dispatchEvent(new StorageEvent('storage', {
          key,
          newValue: value,
          oldValue: value,
          url: window.location.href
        }));
      }, 10);
    }
  };
  
  // Add debug function for demo
  (window as any).debugChallengeState = (username: string) => {
    const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
    const userAcceptances = acceptances.filter((acc: any) => acc.username === username);
    
    console.log(`🔍 Challenge state for ${username}:`, {
      totalAcceptances: acceptances.length,
      userAcceptances: userAcceptances.length,
      userAcceptanceDetails: userAcceptances,
      canAcceptNew: !(window as any).storageService?.getUserActiveChallenge(username)
    });
    
    return {
      acceptances: userAcceptances,
      canAcceptNew: !(window as any).storageService?.getUserActiveChallenge(username)
    };
  };
  
  console.log('✅ Data consistency ensured for demo');
  console.log('💡 Use debugChallengeState(username) in console to inspect user state');
}

// Auto-run for demo stability
if (typeof window !== 'undefined') {
  ensureDataConsistency();

  // Don't run every 5 seconds - this was causing data loss
  console.log('✅ Data consistency check completed - no aggressive intervals');
}
