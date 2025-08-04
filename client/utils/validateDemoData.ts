// Validate demo data consistency

export function validateDemoData(): boolean {
  console.log('🔍 Validating demo data consistency...');
  
  const challenges = JSON.parse(localStorage.getItem('challengeHub_challenges') || '[]');
  const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
  const reviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');
  
  console.log('📊 Data counts:');
  console.log(`   Challenges: ${challenges.length}`);
  console.log(`   Acceptances: ${acceptances.length}`);
  console.log(`   Submissions: ${submissions.length}`);
  console.log(`   Reviews: ${reviews.length}`);
  
  // Expected demo data counts
  const expected = {
    challenges: 3,
    acceptances: 3,
    submissions: 3,
    reviews: 3
  };
  
  const actual = {
    challenges: challenges.length,
    acceptances: acceptances.length,
    submissions: submissions.length,
    reviews: reviews.length
  };
  
  // Check if counts match
  const countsMatch = JSON.stringify(expected) === JSON.stringify(actual);
  
  if (!countsMatch) {
    console.log('❌ Data count mismatch!');
    console.log('Expected:', expected);
    console.log('Actual:', actual);
    return false;
  }
  
  // Check data relationships
  const expectedUsers = ['employee01', 'employee02', 'employee03'];
  const acceptanceUsers = [...new Set(acceptances.map((acc: any) => acc.username))];
  const submissionUsers = [...new Set(submissions.map((sub: any) => sub.username))];
  const reviewUsers = [...new Set(reviews.map((rev: any) => rev.username))];
  
  console.log('👥 Users in data:');
  console.log('   Acceptances:', acceptanceUsers);
  console.log('   Submissions:', submissionUsers);
  console.log('   Reviews:', reviewUsers);
  
  // Validate each user has corresponding data
  const isValid = expectedUsers.every(user => {
    const hasAcceptance = acceptances.some((acc: any) => acc.username === user);
    const hasSubmission = submissions.some((sub: any) => sub.username === user);
    const hasReview = reviews.some((rev: any) => rev.username === user);
    
    if (!hasAcceptance || !hasSubmission || !hasReview) {
      console.log(`❌ ${user} missing data: acceptance=${hasAcceptance}, submission=${hasSubmission}, review=${hasReview}`);
      return false;
    }
    return true;
  });
  
  if (isValid) {
    console.log('✅ Demo data validation passed!');
    
    // Show expected results
    console.log('📋 Expected demo results:');
    console.log('   employee01: 500 points (Approved)');
    console.log('   employee02: 400 points (Needs Rework)');
    console.log('   employee03: 0 points (Pending Review)');
    console.log('   Total submissions: 3');
    console.log('   Dashboard should show: 3 submissions, 3 acceptances');
  } else {
    console.log('❌ Demo data validation failed!');
  }
  
  return isValid;
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).validateDemoData = validateDemoData;
}

export default validateDemoData;
