// Test utility to verify localStorage persistence is working correctly

export function testLocalStoragePersistence(): void {
  console.log('🧪 Testing localStorage persistence...');
  
  // Check all required keys exist
  const requiredKeys = [
    'challengeHub_challenges',
    'challengeHub_acceptances', 
    'challengeHub_submissions',
    'challengeHub_reviews'
  ];
  
  const results: Record<string, any> = {};
  
  requiredKeys.forEach(key => {
    const data = localStorage.getItem(key);
    if (data) {
      try {
        const parsed = JSON.parse(data);
        results[key] = {
          exists: true,
          count: Array.isArray(parsed) ? parsed.length : 'Not an array',
          sample: Array.isArray(parsed) && parsed.length > 0 ? parsed[0] : null
        };
      } catch (error) {
        results[key] = {
          exists: true,
          error: 'Parse error',
          rawData: data.substring(0, 100) + '...'
        };
      }
    } else {
      results[key] = {
        exists: false
      };
    }
  });
  
  console.log('📊 localStorage Persistence Test Results:');
  console.table(results);
  
  // Test data integrity
  const challenges = JSON.parse(localStorage.getItem('challengeHub_challenges') || '[]');
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
  const reviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');
  
  console.log('🔗 Data Relationships:');
  console.log('  Challenges:', challenges.length);
  console.log('  Acceptances:', acceptances.length);
  console.log('  Submissions:', submissions.length);
  console.log('  Reviews:', reviews.length);
  
  // Check for data consistency
  const uniqueUsers = [...new Set(acceptances.map((acc: any) => acc.username))];
  console.log('  Unique users:', uniqueUsers.length, uniqueUsers);
  
  // Test refresh simulation
  console.log('🔄 Simulating page refresh...');
  
  // Simulate what happens on page refresh - data should persist
  setTimeout(() => {
    const afterRefresh = {
      challenges: JSON.parse(localStorage.getItem('challengeHub_challenges') || '[]').length,
      acceptances: JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]').length,
      submissions: JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]').length,
      reviews: JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]').length
    };
    
    console.log('✅ Data after simulated refresh:', afterRefresh);
    console.log('🎉 localStorage persistence test completed!');
  }, 1000);
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).testLocalStoragePersistence = testLocalStoragePersistence;
  
  // Also provide a quick data summary function
  (window as any).getDataSummary = () => {
    const summary = {
      challenges: JSON.parse(localStorage.getItem('challengeHub_challenges') || '[]').length,
      acceptances: JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]').length,
      submissions: JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]').length,
      reviews: JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]').length
    };
    
    console.log('📊 Current Data Summary:', summary);
    return summary;
  };
  
  // Provide a function to force refresh all contexts
  (window as any).forceDataRefresh = () => {
    console.log('🔄 Forcing data refresh...');
    
    // Dispatch custom events that contexts listen to
    const refreshEvent = new CustomEvent('challengeHub:dataRefresh');
    window.dispatchEvent(refreshEvent);
    
    // Also refresh the page as last resort
    setTimeout(() => {
      console.log('🔄 Refreshing page to ensure latest data...');
      window.location.reload();
    }, 500);
  };
}

export default testLocalStoragePersistence;
