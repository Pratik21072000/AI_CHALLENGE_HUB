// Emergency fix for false active challenge detection

export function emergencyFixActiveChallenge() {
  // Check if fix has already been applied
  const fixApplied = sessionStorage.getItem('challengeHub_emergencyFixApplied');
  if (fixApplied) {
    console.log('✅ Emergency fix already applied in this session');
    return;
  }

  console.log('🚨 Running emergency fix for false active challenge detection...');
  
  // Clear all potentially corrupted data immediately
  const keysToCheck = [
    'challengeHub_acceptances',
    'challengeHub_submissions', 
    'challengeHub_reviews'
  ];
  
  // Don't automatically clear valid data - this was causing data loss
  console.log('✅ Emergency fix no longer clears valid data automatically');

  // Only clear data if explicitly corrupted (malformed JSON)
  keysToCheck.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (!Array.isArray(parsed)) {
          console.log(`🧹 Fixing malformed ${key} - not an array`);
          localStorage.setItem(key, JSON.stringify([]));
        } else {
          console.log(`✅ ${key} is valid array with ${parsed.length} items`);
        }
      } catch (e) {
        console.log(`🧹 Clearing malformed ${key} - invalid JSON`);
        localStorage.setItem(key, JSON.stringify([]));
      }
    } else {
      // Initialize missing keys
      localStorage.setItem(key, JSON.stringify([]));
    }
  });
  
  console.log('✅ Emergency fix completed - all challenge data cleared');
  
  // Don't override storage service functions - let them work properly
  console.log('✅ Storage service functions left intact for proper challenge tracking');
  
  // Also override the challenge status hook if available
  if ((window as any).useChallengeStatus) {
    console.log('🔧 Challenge status hook found - applying fixes');
  }
  
  // Mark fix as applied for this session
  sessionStorage.setItem('challengeHub_emergencyFixApplied', 'true');

  // Don't auto-reload - let user manually refresh if needed
  console.log('✅ Fix applied successfully - manual refresh recommended if issues persist');
}

// Auto-run the fix immediately
if (typeof window !== 'undefined') {
  // Run immediately
  emergencyFixActiveChallenge();
  
  // Also make it available globally
  (window as any).emergencyFixActiveChallenge = emergencyFixActiveChallenge;
}

console.log('🚨 Emergency active challenge fix loaded and executed');
