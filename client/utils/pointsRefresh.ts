/**
 * Global utility to trigger points refresh across components
 */

// Global event for points refresh
const POINTS_REFRESH_EVENT = 'points-refresh';

/**
 * Trigger a global points refresh
 * Call this after any review action (approve, reject, rework)
 */
export function triggerPointsRefresh(): void {
  console.log('🔄 Triggering global points refresh...');
  
  // Dispatch custom event
  window.dispatchEvent(new CustomEvent(POINTS_REFRESH_EVENT, {
    detail: { timestamp: Date.now() }
  }));
  
  // Also trigger a storage event for localStorage listeners
  window.dispatchEvent(new StorageEvent('storage', {
    key: 'challengeHub_reviews',
    newValue: localStorage.getItem('challengeHub_reviews'),
    url: window.location.href
  }));
}

/**
 * Listen for points refresh events
 * @param callback Function to call when refresh is triggered
 * @returns Cleanup function
 */
export function onPointsRefresh(callback: () => void): () => void {
  const handleRefresh = (event: Event) => {
    console.log('📊 Points refresh triggered:', event);
    callback();
  };
  
  window.addEventListener(POINTS_REFRESH_EVENT, handleRefresh);
  
  // Also listen for storage events
  window.addEventListener('storage', (event) => {
    if (event.key === 'challengeHub_reviews') {
      handleRefresh(event);
    }
  });
  
  // Return cleanup function
  return () => {
    window.removeEventListener(POINTS_REFRESH_EVENT, handleRefresh);
  };
}

/**
 * Global function accessible from browser console for testing
 */
declare global {
  interface Window {
    refreshPoints: () => void;
  }
}

window.refreshPoints = triggerPointsRefresh;

console.log('🎯 Points refresh utility loaded');
console.log('💡 Use window.refreshPoints() to manually trigger refresh');
