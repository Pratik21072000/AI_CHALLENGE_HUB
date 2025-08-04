// Utility to clear all application data for fresh start
export const clearAllData = () => {
  // Clear localStorage keys for all contexts
  localStorage.removeItem('challenges');
  localStorage.removeItem('challengeHub_acceptances');
  localStorage.removeItem('challengeHub_submissions');
  localStorage.removeItem('challengeHub_reviews');
  
  // Force reload to ensure fresh state
  window.location.reload();
};

// Auto-clear on app load for fresh testing (remove this in production)
export const autoInitializeFreshData = () => {
  clearAllData();
};
