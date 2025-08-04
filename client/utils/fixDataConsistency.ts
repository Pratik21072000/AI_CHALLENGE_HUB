import { initializeDemoData, DEMO_CHALLENGES, DEMO_ACCEPTANCES, DEMO_SUBMISSIONS, DEMO_REVIEWS } from './demoDataInitializer';

/**
 * Fix data consistency issues by clearing and reinitializing all demo data
 */
export function fixDataConsistency(): void {
  console.log('🔧 Fixing data consistency issues...');
  
  // Clear all existing data
  localStorage.removeItem('challengeHub_challenges');
  localStorage.removeItem('challengeHub_acceptances');
  localStorage.removeItem('challengeHub_submissions');
  localStorage.removeItem('challengeHub_reviews');
  
  console.log('🗑️ Cleared existing localStorage data');
  
  // Force reinitialize with fresh demo data
  localStorage.setItem('challengeHub_challenges', JSON.stringify(DEMO_CHALLENGES));
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(DEMO_ACCEPTANCES));
  localStorage.setItem('challengeHub_submissions', JSON.stringify(DEMO_SUBMISSIONS));
  localStorage.setItem('challengeHub_reviews', JSON.stringify(DEMO_REVIEWS));
  
  console.log('✅ Reinitialized with fresh demo data:');
  console.log(`   - Challenges: ${DEMO_CHALLENGES.length}`);
  console.log(`   - Acceptances: ${DEMO_ACCEPTANCES.length}`);
  console.log(`   - Submissions: ${DEMO_SUBMISSIONS.length}`);
  console.log(`   - Reviews: ${DEMO_REVIEWS.length}`);
  
  // Verify the data
  const storedSubmissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
  console.log('🔍 Verification - Stored submissions:', storedSubmissions.length);
  
  storedSubmissions.forEach((sub: any, index: number) => {
    console.log(`   ${index + 1}. ${sub.username} -> ${sub.challengeId} (submitted: ${sub.submitted})`);
  });
  
  // Check submission counts by challenge
  const challengeCounts = DEMO_CHALLENGES.map(challenge => {
    const count = storedSubmissions.filter((sub: any) => 
      sub.challengeId === challenge.id && sub.submitted
    ).length;
    return {
      challengeId: challenge.id,
      title: challenge.title,
      submissionCount: count
    };
  });
  
  console.log('📊 Submission counts by challenge:');
  console.table(challengeCounts);
  
  const totalSubmissions = storedSubmissions.filter((sub: any) => sub.submitted).length;
  console.log(`🎯 Total submissions: ${totalSubmissions}`);
  
  // Force page refresh to reload contexts with new data
  setTimeout(() => {
    console.log('🔄 Refreshing page to apply data changes...');
    window.location.reload();
  }, 1000);
}

/**
 * Check current data consistency without fixing
 */
export function checkDataConsistency(): void {
  console.log('🔍 Checking data consistency...');
  
  const challenges = JSON.parse(localStorage.getItem('challengeHub_challenges') || '[]');
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
  const reviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');
  
  console.log('📊 Current data counts:');
  console.log(`   - Challenges: ${challenges.length}`);
  console.log(`   - Acceptances: ${acceptances.length}`);
  console.log(`   - Submissions: ${submissions.length}`);
  console.log(`   - Reviews: ${reviews.length}`);
  
  // Check submission details
  const submittedCount = submissions.filter((sub: any) => sub.submitted).length;
  console.log(`   - Submitted: ${submittedCount}`);
  
  // Check per-challenge submission counts
  challenges.forEach((challenge: any) => {
    const count = submissions.filter((sub: any) => 
      sub.challengeId === challenge.id && sub.submitted
    ).length;
    console.log(`   - ${challenge.title}: ${count} submissions`);
  });
  
  // Check if data matches expected demo data
  const expectedCounts = {
    challenges: DEMO_CHALLENGES.length,
    acceptances: DEMO_ACCEPTANCES.length,
    submissions: DEMO_SUBMISSIONS.length,
    reviews: DEMO_REVIEWS.length
  };
  
  const actualCounts = {
    challenges: challenges.length,
    acceptances: acceptances.length,
    submissions: submissions.length,
    reviews: reviews.length
  };
  
  const isConsistent = JSON.stringify(expectedCounts) === JSON.stringify(actualCounts);
  
  if (isConsistent) {
    console.log('✅ Data is consistent with demo data');
  } else {
    console.log('❌ Data inconsistency detected!');
    console.log('Expected:', expectedCounts);
    console.log('Actual:', actualCounts);
    console.log('💡 Run fixDataConsistency() to fix');
  }
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).fixDataConsistency = fixDataConsistency;
  (window as any).checkDataConsistency = checkDataConsistency;
}

export default fixDataConsistency;
