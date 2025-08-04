// Data preservation utility to ensure localStorage persists across refreshes

export function preserveData() {
  console.log('🛡️ Activating data preservation...');
  
  const keys = ['challengeHub_acceptances', 'challengeHub_submissions', 'challengeHub_reviews'];
  
  // Check current data state
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          console.log(`✅ ${key}: ${parsed.length} items preserved`);
        } else {
          console.log(`🔧 ${key}: fixing non-array data`);
          localStorage.setItem(key, JSON.stringify([]));
        }
      } catch (e) {
        console.log(`🔧 ${key}: fixing corrupted data`);
        localStorage.setItem(key, JSON.stringify([]));
      }
    } else {
      console.log(`🔧 ${key}: initializing empty array`);
      localStorage.setItem(key, JSON.stringify([]));
    }
  });
  
  // Override any function that might clear localStorage
  const originalClear = localStorage.clear.bind(localStorage);
  const originalRemoveItem = localStorage.removeItem.bind(localStorage);
  
  localStorage.clear = function() {
    console.log('🛡️ localStorage.clear() blocked to preserve data');
    console.log('💡 Use preservedClear() if you really need to clear all data');
  };
  
  localStorage.removeItem = function(key: string) {
    if (key.startsWith('challengeHub_')) {
      console.log(`🛡️ Blocked removal of ${key} to preserve data`);
      console.log('💡 Use preservedRemoveItem(key) if you really need to remove this');
    } else {
      originalRemoveItem(key);
    }
  };
  
  // Provide emergency access methods
  (window as any).preservedClear = originalClear;
  (window as any).preservedRemoveItem = originalRemoveItem;
  
  // Monitor for external attempts to clear data
  const observer = new MutationObserver(() => {
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (!data) {
        console.log(`🚨 ${key} was cleared externally - restoring empty array`);
        localStorage.setItem(key, JSON.stringify([]));
      }
    });
  });
  
  // Start monitoring
  observer.observe(document.body, { 
    childList: true, 
    subtree: true 
  });
  
  // Periodic data integrity check (every 10 seconds, not aggressive)
  setInterval(() => {
    keys.forEach(key => {
      const data = localStorage.getItem(key);
      if (!data) {
        console.log(`🔧 Restoring missing ${key}`);
        localStorage.setItem(key, JSON.stringify([]));
      }
    });
  }, 10000);
  
  console.log('✅ Data preservation active - localStorage is protected');
}

// Add debug utility
export function getDataSummary() {
  const keys = ['challengeHub_acceptances', 'challengeHub_submissions', 'challengeHub_reviews'];
  const summary: any = {};
  
  keys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        summary[key] = Array.isArray(parsed) ? parsed.length : 'invalid';
      } catch (e) {
        summary[key] = 'corrupted';
      }
    } else {
      summary[key] = 'missing';
    }
  });
  
  console.log('📊 Data Summary:', summary);
  return summary;
}

// Auto-activate
if (typeof window !== 'undefined') {
  preserveData();
  
  // Make utilities available globally
  (window as any).getDataSummary = getDataSummary;
  (window as any).preserveData = preserveData;
}

console.log('🛡️ Data preservation utility loaded');
