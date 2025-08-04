// Immediate fix for employee03 active challenge issue

console.log('🔧 Fixing employee03 active challenge issue...');

// Check current acceptances
const acceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
const employee03Acceptances = acceptances.filter((acc: any) => acc.username === 'employee03');

console.log('Current employee03 acceptances:', employee03Acceptances);

if (employee03Acceptances.length > 0) {
  console.log('🚨 Found stale acceptances for employee03, removing...');
  
  // Remove all employee03 acceptances
  const filtered = acceptances.filter((acc: any) => acc.username !== 'employee03');
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(filtered));
  
  console.log('✅ Removed all employee03 acceptances');
  console.log('Updated acceptances:', filtered);
} else {
  console.log('✅ No stale acceptances found for employee03');
}

// Also check submissions
const submissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
const employee03Submissions = submissions.filter((sub: any) => sub.username === 'employee03');

console.log('Current employee03 submissions:', employee03Submissions);

if (employee03Submissions.length > 0) {
  console.log('🚨 Found stale submissions for employee03, removing...');
  
  // Remove all employee03 submissions
  const filteredSubmissions = submissions.filter((sub: any) => sub.username !== 'employee03');
  localStorage.setItem('challengeHub_submissions', JSON.stringify(filteredSubmissions));
  
  console.log('✅ Removed all employee03 submissions');
}

// Also check reviews
const reviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');
const employee03Reviews = reviews.filter((rev: any) => rev.username === 'employee03');

console.log('Current employee03 reviews:', employee03Reviews);

if (employee03Reviews.length > 0) {
  console.log('🚨 Found stale reviews for employee03, removing...');
  
  // Remove all employee03 reviews
  const filteredReviews = reviews.filter((rev: any) => rev.username !== 'employee03');
  localStorage.setItem('challengeHub_reviews', JSON.stringify(filteredReviews));
  
  console.log('✅ Removed all employee03 reviews');
}

console.log('✅ Employee03 data cleanup complete');

export {};
