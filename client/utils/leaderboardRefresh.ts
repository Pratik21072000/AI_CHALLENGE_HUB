/**
 * Leaderboard-specific refresh utility for real-time updates
 */

// Leaderboard refresh event
const LEADERBOARD_REFRESH_EVENT = 'leaderboard-refresh';

/**
 * Trigger leaderboard refresh after review actions
 * Call this after approve/reject/rework actions
 */
export function triggerLeaderboardRefresh(reason?: string): void {
  console.log('🏆 Triggering leaderboard refresh...', reason ? `Reason: ${reason}` : '');
  
  // Dispatch custom leaderboard event
  window.dispatchEvent(new CustomEvent(LEADERBOARD_REFRESH_EVENT, {
    detail: { 
      timestamp: Date.now(),
      reason: reason || 'Manual refresh'
    }
  }));
  
  // Also dispatch storage events for localStorage listeners
  ['challengeHub_reviews', 'challengeHub_submissions', 'challengeHub_acceptances'].forEach(key => {
    window.dispatchEvent(new StorageEvent('storage', {
      key,
      newValue: localStorage.getItem(key),
      url: window.location.href
    }));
  });
}

/**
 * Listen for leaderboard refresh events
 */
export function onLeaderboardRefresh(callback: (reason?: string) => void): () => void {
  const handleRefresh = (event: any) => {
    const reason = event.detail?.reason || 'Unknown';
    console.log('🔄 Leaderboard refresh triggered:', reason);
    callback(reason);
  };
  
  window.addEventListener(LEADERBOARD_REFRESH_EVENT, handleRefresh);
  
  // Also listen for storage events that affect leaderboard
  const handleStorageRefresh = (event: StorageEvent) => {
    if (['challengeHub_reviews', 'challengeHub_submissions', 'challengeHub_acceptances'].includes(event.key || '')) {
      callback('Data change detected');
    }
  };
  
  window.addEventListener('storage', handleStorageRefresh);
  
  // Return cleanup function
  return () => {
    window.removeEventListener(LEADERBOARD_REFRESH_EVENT, handleRefresh);
    window.removeEventListener('storage', handleStorageRefresh);
  };
}

/**
 * Auto-refresh leaderboard on review status changes
 */
export function initLeaderboardAutoRefresh(): void {
  // Listen for review status changes
  const originalSetItem = localStorage.setItem;
  localStorage.setItem = function(key: string, value: string) {
    originalSetItem.call(localStorage, key, value);
    
    // Trigger refresh if reviews data changes
    if (key === 'challengeHub_reviews') {
      setTimeout(() => {
        triggerLeaderboardRefresh('Review status updated');
      }, 100);
    }
  };
  
  console.log('🔄 Leaderboard auto-refresh initialized');
}

/**
 * Global functions for testing
 */
declare global {
  interface Window {
    refreshLeaderboard: () => void;
    simulateReviewChange: () => void;
  }
}

window.refreshLeaderboard = () => triggerLeaderboardRefresh('Manual trigger');

window.simulateReviewChange = () => {
  console.log('🧪 Simulating review change...');
  triggerLeaderboardRefresh('Simulated review change');
};

// Initialize auto-refresh
initLeaderboardAutoRefresh();

console.log('🏆 Leaderboard refresh system loaded');
console.log('💡 Commands: window.refreshLeaderboard(), window.simulateReviewChange()');
