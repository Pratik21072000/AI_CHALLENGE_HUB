// Complete data reset utility to ensure clean demo state

export function completeDataReset(): void {
  console.log('🧹 Performing complete data reset...');

  // Preserve user session during reset
  const currentUser = localStorage.getItem('challengeHub_user');

  // Clear specified localStorage data (but not user session)
  const keysToRemove = [
    'challengeHub_challenges',
    'challengeHub_acceptances',
    'challengeHub_submissions',
    'challengeHub_reviews',
    'challengeHub_version',
    'challenges', // Legacy key
    'pointsInitialized', // Legacy key
    'userPoints', // Legacy key
    'pointsRecords' // Legacy key
  ];

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear any other challengeHub related keys except user
  Object.keys(localStorage).forEach(key => {
    if ((key.startsWith('challengeHub_') || key.startsWith('challenge_')) && key !== 'challengeHub_user') {
      localStorage.removeItem(key);
    }
  });

  // Restore user session if it existed
  if (currentUser) {
    localStorage.setItem('challengeHub_user', currentUser);
  }
  
  console.log('✅ All localStorage data cleared');
  
  // Set fresh empty data to prevent any fallbacks
  localStorage.setItem('challengeHub_challenges', JSON.stringify([]));
  localStorage.setItem('challengeHub_acceptances', JSON.stringify([]));
  localStorage.setItem('challengeHub_submissions', JSON.stringify([]));
  localStorage.setItem('challengeHub_reviews', JSON.stringify([]));
  
  console.log('✅ Fresh empty data initialized');
  
  // Force page refresh to reload all contexts
  console.log('🔄 Refreshing page to apply clean state...');
  window.location.reload();
}

// Reset and set up clean demo data
export function resetToCleanDemoData(): void {
  // First reset everything
  completeDataReset();
}

// Make available globally for manual use only
if (typeof window !== 'undefined') {
  (window as any).completeDataReset = completeDataReset;
  (window as any).resetToCleanDemoData = resetToCleanDemoData;
}

export default completeDataReset;
