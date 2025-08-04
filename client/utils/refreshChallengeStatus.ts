// Challenge status refresh utility for navigation consistency

export function refreshChallengeStatus() {
  console.log('🔄 Refreshing challenge status...');
  
  // Force a sync from localStorage to contexts
  const event = new CustomEvent('challengeHub:refreshStatus', {
    detail: {
      timestamp: Date.now()
    }
  });
  
  window.dispatchEvent(event);
  
  // Also manually trigger context updates by dispatching storage events
  const keys = ['challengeHub_acceptances', 'challengeHub_submissions', 'challengeHub_reviews'];
  
  keys.forEach(key => {
    window.dispatchEvent(new StorageEvent('storage', {
      key,
      newValue: localStorage.getItem(key),
      oldValue: localStorage.getItem(key),
      url: window.location.href
    }));
  });
  
  console.log('✅ Challenge status refresh triggered');
}

// Auto-refresh on page navigation
if (typeof window !== 'undefined') {
  // Listen for React Router navigation
  let currentPath = window.location.pathname;
  
  const observer = new MutationObserver(() => {
    if (window.location.pathname !== currentPath) {
      currentPath = window.location.pathname;
      console.log('🔄 Navigation detected, refreshing challenge status');
      setTimeout(refreshChallengeStatus, 100);
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // Also listen for popstate (back/forward navigation)
  window.addEventListener('popstate', () => {
    console.log('🔄 Popstate detected, refreshing challenge status');
    setTimeout(refreshChallengeStatus, 100);
  });
  
  // Make it available globally
  (window as any).refreshChallengeStatus = refreshChallengeStatus;
  
  console.log('🔄 Challenge status refresh utility loaded');
}
