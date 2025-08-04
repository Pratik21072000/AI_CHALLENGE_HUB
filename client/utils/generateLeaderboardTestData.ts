/**
 * Generate test data for leaderboard demonstration
 */

export function generateLeaderboardTestData(): void {
  console.log('🧪 Generating test data for leaderboard...');

  // Check if we already have enough data
  const existingAcceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
  const existingSubmissions = JSON.parse(localStorage.getItem('challengeHub_submissions') || '[]');
  const existingReviews = JSON.parse(localStorage.getItem('challengeHub_reviews') || '[]');

  // If we already have substantial data, don't override
  if (existingReviews.length >= 5) {
    console.log('📊 Sufficient test data already exists');
    return;
  }

  // Sample acceptances
  const sampleAcceptances = [
    {
      id: 'acc_employee01_challenge_1',
      username: 'employee01',
      challengeId: 'challenge_1',
      status: 'Approved',
      committedDate: '2024-01-15T23:59:59Z',
      acceptedAt: '2024-01-10T09:00:00Z'
    },
    {
      id: 'acc_employee01_challenge_2',
      username: 'employee01', 
      challengeId: 'challenge_2',
      status: 'Approved',
      committedDate: '2024-01-20T23:59:59Z',
      acceptedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: 'acc_employee02_challenge_1',
      username: 'employee02',
      challengeId: 'challenge_1', 
      status: 'Approved',
      committedDate: '2024-01-15T23:59:59Z',
      acceptedAt: '2024-01-10T11:00:00Z'
    },
    {
      id: 'acc_employee03_challenge_1',
      username: 'employee03',
      challengeId: 'challenge_1',
      status: 'Needs Rework',
      committedDate: '2024-01-15T23:59:59Z', 
      acceptedAt: '2024-01-10T12:00:00Z'
    },
    {
      id: 'acc_employee03_challenge_2',
      username: 'employee03',
      challengeId: 'challenge_2',
      status: 'Rejected',
      committedDate: '2024-01-20T23:59:59Z',
      acceptedAt: '2024-01-15T13:00:00Z'
    }
  ];

  // Sample submissions  
  const sampleSubmissions = [
    {
      id: 'sub_employee01_challenge_1',
      username: 'employee01',
      challengeId: 'challenge_1',
      submitted: true,
      submittedAt: '2024-01-14T16:00:00Z', // On time
      fileUrl: 'https://example.com/file1.zip',
      fileName: 'challenge1_solution.zip',
      fileSize: 1024000,
      shortDescription: 'Implemented React dashboard with all requirements',
      technologies: 'React, TypeScript, Tailwind',
      sourceCodeUrl: 'https://github.com/user/challenge1',
      hostedAppUrl: 'https://challenge1.netlify.app',
      status: 'Approved'
    },
    {
      id: 'sub_employee01_challenge_2',
      username: 'employee01',
      challengeId: 'challenge_2', 
      submitted: true,
      submittedAt: '2024-01-19T20:00:00Z', // On time
      fileUrl: 'https://example.com/file2.zip',
      fileName: 'challenge2_solution.zip',
      fileSize: 2048000,
      shortDescription: 'Built e-commerce API with authentication',
      technologies: 'Node.js, Express, MongoDB',
      sourceCodeUrl: 'https://github.com/user/challenge2',
      hostedAppUrl: 'https://challenge2-api.herokuapp.com',
      status: 'Approved'
    },
    {
      id: 'sub_employee02_challenge_1',
      username: 'employee02',
      challengeId: 'challenge_1',
      submitted: true,
      submittedAt: '2024-01-16T10:00:00Z', // Late
      fileUrl: 'https://example.com/file3.zip',
      fileName: 'dashboard_solution.zip',
      fileSize: 1536000,
      shortDescription: 'React dashboard with beautiful UI design',
      technologies: 'React, CSS3, Material-UI',
      sourceCodeUrl: 'https://github.com/user/dashboard',
      hostedAppUrl: 'https://my-dashboard.vercel.app',
      status: 'Approved'
    },
    {
      id: 'sub_employee03_challenge_1',
      username: 'employee03',
      challengeId: 'challenge_1',
      submitted: true,
      submittedAt: '2024-01-14T14:00:00Z', // On time
      fileUrl: 'https://example.com/file4.zip',
      fileName: 'dashboard_v1.zip',
      fileSize: 768000,
      shortDescription: 'Basic dashboard implementation',
      technologies: 'React, Bootstrap',
      sourceCodeUrl: 'https://github.com/user/basic-dashboard',
      hostedAppUrl: '',
      status: 'Under Review'
    },
    {
      id: 'sub_employee03_challenge_2',
      username: 'employee03',
      challengeId: 'challenge_2',
      submitted: true,
      submittedAt: '2024-01-21T09:00:00Z', // Late
      fileUrl: 'https://example.com/file5.zip',
      fileName: 'api_solution.zip',
      fileSize: 512000,
      shortDescription: 'Incomplete API implementation',
      technologies: 'Node.js',
      sourceCodeUrl: 'https://github.com/user/incomplete-api',
      hostedAppUrl: '',
      status: 'Under Review'
    }
  ];

  // Sample reviews
  const sampleReviews = [
    {
      submissionId: 'sub_employee01_challenge_1',
      challengeId: 'challenge_1',
      username: 'employee01', 
      status: 'Approved' as const,
      reviewedBy: 'manager01',
      reviewedAt: '2024-01-15T10:00:00Z',
      reviewComment: 'Excellent work! All requirements met and submitted on time.',
      pointsAwarded: 500, // Full points - approved on time
      submissionDate: '2024-01-14T16:00:00Z',
      commitmentDate: '2024-01-15T23:59:59Z',
      isOnTime: true
    },
    {
      submissionId: 'sub_employee01_challenge_2', 
      challengeId: 'challenge_2',
      username: 'employee01',
      status: 'Approved' as const,
      reviewedBy: 'manager01',
      reviewedAt: '2024-01-20T14:00:00Z',
      reviewComment: 'Great API design and implementation. Well documented.',
      pointsAwarded: 500, // Full points - approved on time
      submissionDate: '2024-01-19T20:00:00Z', 
      commitmentDate: '2024-01-20T23:59:59Z',
      isOnTime: true
    },
    {
      submissionId: 'sub_employee02_challenge_1',
      challengeId: 'challenge_1',
      username: 'employee02',
      status: 'Approved' as const,
      reviewedBy: 'manager01',
      reviewedAt: '2024-01-17T11:00:00Z',
      reviewComment: 'Beautiful design and good functionality, but submitted late.',
      pointsAwarded: 450, // Late penalty applied
      submissionDate: '2024-01-16T10:00:00Z',
      commitmentDate: '2024-01-15T23:59:59Z',
      isOnTime: false
    },
    {
      submissionId: 'sub_employee03_challenge_1',
      challengeId: 'challenge_1',
      username: 'employee03',
      status: 'Needs Rework' as const,
      reviewedBy: 'manager01',
      reviewedAt: '2024-01-16T09:00:00Z',
      reviewComment: 'Good start but needs error handling and better styling.',
      pointsAwarded: 400, // Rework penalty applied
      submissionDate: '2024-01-14T14:00:00Z',
      commitmentDate: '2024-01-15T23:59:59Z',
      isOnTime: true
    },
    {
      submissionId: 'sub_employee03_challenge_2',
      challengeId: 'challenge_2', 
      username: 'employee03',
      status: 'Rejected' as const,
      reviewedBy: 'manager01',
      reviewedAt: '2024-01-22T10:00:00Z',
      reviewComment: 'Incomplete implementation. Missing key requirements.',
      pointsAwarded: 0, // No points for rejected
      submissionDate: '2024-01-21T09:00:00Z',
      commitmentDate: '2024-01-20T23:59:59Z',
      isOnTime: false
    }
  ];

  // Merge with existing data
  const mergedAcceptances = [...existingAcceptances, ...sampleAcceptances];
  const mergedSubmissions = [...existingSubmissions, ...sampleSubmissions];
  const mergedReviews = [...existingReviews, ...sampleReviews];

  // Save to localStorage
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(mergedAcceptances));
  localStorage.setItem('challengeHub_submissions', JSON.stringify(mergedSubmissions));
  localStorage.setItem('challengeHub_reviews', JSON.stringify(mergedReviews));

  console.log('✅ Leaderboard test data generated:');
  console.log(`  - employee01: 1000 pts (2 approved challenges)`);
  console.log(`  - employee02: 450 pts (1 approved late)`);
  console.log(`  - employee03: 400 pts (1 rework, 1 rejected)`);
  console.log('🏆 Leaderboard should now show meaningful rankings!');
}
