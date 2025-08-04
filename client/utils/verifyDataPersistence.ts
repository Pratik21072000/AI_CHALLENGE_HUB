// Verify data persistence is working correctly

export function verifyDataPersistence() {
  console.log('🔍 Verifying data persistence...');
  
  const testKey = 'challengeHub_persistenceTest';
  const testData = {
    timestamp: Date.now(),
    test: 'persistence_verification'
  };
  
  try {
    // Test write
    localStorage.setItem(testKey, JSON.stringify(testData));
    
    // Test read
    const retrieved = localStorage.getItem(testKey);
    const parsed = retrieved ? JSON.parse(retrieved) : null;
    
    if (parsed && parsed.timestamp === testData.timestamp) {
      console.log('✅ Data persistence test PASSED');
      localStorage.removeItem(testKey);
      return true;
    } else {
      console.error('❌ Data persistence test FAILED - data not matching');
      return false;
    }
  } catch (error) {
    console.error('❌ Data persistence test FAILED - error:', error);
    return false;
  }
}

export function checkCurrentData() {
  const keys = ['challengeHub_acceptances', 'challengeHub_submissions', 'challengeHub_reviews'];
  const data: any = {};
  
  keys.forEach(key => {
    const value = localStorage.getItem(key);
    if (value) {
      try {
        data[key] = JSON.parse(value);
      } catch (e) {
        data[key] = 'CORRUPTED';
      }
    } else {
      data[key] = 'MISSING';
    }
  });
  
  console.log('🔍 Current localStorage data:', data);
  return data;
}

// Run verification on load
if (typeof window !== 'undefined') {
  setTimeout(() => {
    verifyDataPersistence();
    checkCurrentData();
  }, 1000);
  
  // Make available globally
  (window as any).verifyDataPersistence = verifyDataPersistence;
  (window as any).checkCurrentData = checkCurrentData;
  
  console.log('🔍 Data persistence verification loaded');
}
