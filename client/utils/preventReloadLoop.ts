// Prevent infinite reload loops

export function preventReloadLoop() {
  console.log('🛡️ Preventing reload loops...');
  
  // Track reload count in sessionStorage
  const reloadCount = parseInt(sessionStorage.getItem('challengeHub_reloadCount') || '0');
  
  if (reloadCount > 3) {
    console.log('🚨 Too many reloads detected - preventing further auto-reloads');
    
    // Override window.location.reload to prevent infinite loops
    const originalReload = window.location.reload.bind(window.location);
    
    window.location.reload = function() {
      console.log('🛡️ Auto-reload blocked to prevent infinite loop');
      console.log('💡 Use originalReload() in console if manual reload is needed');
      (window as any).originalReload = originalReload;
    };
    
    return;
  }
  
  // Increment reload count
  sessionStorage.setItem('challengeHub_reloadCount', (reloadCount + 1).toString());
  
  // Reset count after 10 seconds of no reloads
  setTimeout(() => {
    sessionStorage.removeItem('challengeHub_reloadCount');
  }, 10000);
}

// Auto-run
if (typeof window !== 'undefined') {
  preventReloadLoop();
}

console.log('🛡️ Reload loop prevention active');
