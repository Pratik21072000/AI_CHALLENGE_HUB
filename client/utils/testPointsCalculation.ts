/**
 * Test points calculation with sample data
 */

// Sample review data to test points calculation
const sampleReviews = [
  {
    submissionId: 'sub_employee01_challenge_1',
    challengeId: 'challenge_1', 
    username: 'employee01',
    status: 'Approved' as const,
    reviewedBy: 'manager01',
    reviewedAt: '2024-01-15T10:00:00Z',
    reviewComment: 'Excellent work, submitted on time!',
    pointsAwarded: undefined, // Let calculation determine points
    submissionDate: '2024-01-14T09:00:00Z',
    commitmentDate: '2024-01-15T23:59:59Z',
    isOnTime: true
  },
  {
    submissionId: 'sub_employee02_challenge_1',
    challengeId: 'challenge_1',
    username: 'employee02', 
    status: 'Approved' as const,
    reviewedBy: 'manager01',
    reviewedAt: '2024-01-16T10:00:00Z',
    reviewComment: 'Good work but submitted late',
    pointsAwarded: undefined,
    submissionDate: '2024-01-16T09:00:00Z', // Late submission
    commitmentDate: '2024-01-15T23:59:59Z',
    isOnTime: false
  },
  {
    submissionId: 'sub_employee03_challenge_1',
    challengeId: 'challenge_1',
    username: 'employee03',
    status: 'Needs Rework' as const,
    reviewedBy: 'manager01',
    reviewedAt: '2024-01-15T11:00:00Z',
    reviewComment: 'Good effort but needs improvements in error handling',
    pointsAwarded: undefined,
    submissionDate: '2024-01-14T08:00:00Z',
    commitmentDate: '2024-01-15T23:59:59Z',
    isOnTime: true
  }
];

// Add sample reviews to localStorage if they don't exist
function addSampleReviews() {
  const existingReviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');
  
  // Only add if no reviews exist yet
  if (existingReviews.length === 0) {
    localStorage.setItem('challengeHub_reviews', JSON.stringify(sampleReviews));
    console.log('📊 Added sample reviews for points calculation testing:');
    console.log('  - employee01: Approved (on time) → 500 pts');
    console.log('  - employee02: Approved (late) → 450 pts');
    console.log('  - employee03: Needs Rework → 400 pts');
    console.log('  - Total for challenge_1: 1350 pts');
  } else {
    console.log('📊 Reviews already exist, not adding sample data');
  }
}

// Run the test
addSampleReviews();

export { addSampleReviews };
