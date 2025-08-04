// Force localStorage persistence to work correctly

export function enforceLocalStoragePersistence() {
  console.log('🔧 Enforcing localStorage persistence...');
  
  // Override localStorage methods to ensure they work
  const originalSetItem = localStorage.setItem.bind(localStorage);
  const originalGetItem = localStorage.getItem.bind(localStorage);
  
  localStorage.setItem = function(key: string, value: string) {
    try {
      originalSetItem(key, value);
      console.log(`✅ localStorage.setItem: ${key} (${value.length} chars)`);
      
      // Verify it was saved
      const saved = originalGetItem(key);
      if (saved !== value) {
        console.error(`❌ localStorage verification failed for ${key}`);
      }
    } catch (error) {
      console.error(`❌ localStorage.setItem failed for ${key}:`, error);
    }
  };
  
  localStorage.getItem = function(key: string) {
    try {
      const value = originalGetItem(key);
      if (value) {
        console.log(`✅ localStorage.getItem: ${key} (${value.length} chars)`);
      }
      return value;
    } catch (error) {
      console.error(`❌ localStorage.getItem failed for ${key}:`, error);
      return null;
    }
  };
  
  // Test localStorage functionality
  try {
    const testKey = 'challengeHub_test';
    const testValue = JSON.stringify({ test: true, timestamp: Date.now() });
    
    localStorage.setItem(testKey, testValue);
    const retrieved = localStorage.getItem(testKey);
    
    if (retrieved === testValue) {
      console.log('✅ localStorage test passed');
      localStorage.removeItem(testKey);
    } else {
      console.error('❌ localStorage test failed - data not persisting');
    }
  } catch (error) {
    console.error('❌ localStorage test error:', error);
  }
  
  // Monitor all challengeHub_ keys
  setInterval(() => {
    const keys = Object.keys(localStorage).filter(key => key.startsWith('challengeHub_'));
    console.log(`���� localStorage monitoring: ${keys.length} challengeHub keys active`);
  }, 30000); // Every 30 seconds
}

// Auto-run
if (typeof window !== 'undefined') {
  enforceLocalStoragePersistence();
}
