// Emergency cleanup for stale acceptance data affecting all users

export function emergencyCleanupAcceptances() {
  console.log('🚨 Running emergency cleanup of acceptance data...');
  
  // Clear all acceptance data from localStorage
  localStorage.removeItem('challengeHub_acceptances');
  
  // Also clear submissions and reviews to be safe
  localStorage.removeItem('challengeHub_submissions');
  localStorage.removeItem('challengeHub_reviews');
  
  console.log('✅ Emergency cleanup completed - all acceptance data cleared');
  
  // Don't auto-reload - let contexts reset naturally
  console.log('✅ Emergency cleanup completed - contexts will reset automatically');
}

// Auto-run the cleanup immediately
if (import.meta.env.DEV) {
  // Make it available globally for manual use
  (window as any).emergencyCleanupAcceptances = emergencyCleanupAcceptances;
  
  console.log('🔧 emergencyCleanupAcceptances() available in console');
  
  // Check if we need to auto-run cleanup
  const acceptances = localStorage.getItem('challengeHub_acceptances');
  if (acceptances) {
    try {
      const parsed = JSON.parse(acceptances);
      if (Array.isArray(parsed) && parsed.length > 0) {
        console.log('🚨 Found existing acceptance data that may be causing issues:', parsed);
        console.log('🔧 Run emergencyCleanupAcceptances() in console to clear problematic data');
      }
    } catch (e) {
      console.log('🚨 Found corrupted acceptance data - recommend running emergencyCleanupAcceptances()');
    }
  }
}
