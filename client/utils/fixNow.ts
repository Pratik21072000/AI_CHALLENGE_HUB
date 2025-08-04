// Immediate fix to run right now

console.log('🚨 IMMEDIATE FIX STARTING...');

// Clear data but preserve user session
const currentUser = localStorage.getItem('challengeHub_user');
localStorage.clear();
if (currentUser) {
  localStorage.setItem('challengeHub_user', currentUser);
}

// Set working data NOW
const challenges = [
  {
    id: 'demo-challenge-1',
    title: 'React Dashboard Builder',
    description: 'Build a comprehensive admin dashboard',
    fullDescription: 'Build a comprehensive admin dashboard',
    expectedOutcome: 'Working dashboard',
    tags: ['React', 'TypeScript'],
    points: 500,
    penaltyPoints: 50,
    deadline: '2024-12-31',
    createdBy: 'Sarah Wilson',
    createdAt: '2024-01-01T00:00:00.000Z',
    lastUpdated: '2024-01-01T00:00:00.000Z',
    status: 'Open'
  },
  {
    id: 'demo-challenge-2',
    title: 'E-commerce Integration',
    description: 'Build e-commerce features',
    fullDescription: 'Build e-commerce features',
    expectedOutcome: 'Working e-commerce',
    tags: ['API', 'Integration'],
    points: 400,
    penaltyPoints: 40,
    deadline: '2024-12-31',
    createdBy: 'Sarah Wilson',
    createdAt: '2024-01-02T00:00:00.000Z',
    lastUpdated: '2024-01-02T00:00:00.000Z',
    status: 'Open'
  },
  {
    id: 'demo-challenge-3',
    title: 'Mobile App Development',
    description: 'Build mobile app',
    fullDescription: 'Build mobile app',
    expectedOutcome: 'Working mobile app',
    tags: ['React Native', 'Mobile'],
    points: 600,
    penaltyPoints: 60,
    deadline: '2024-12-31',
    createdBy: 'Sarah Wilson',
    createdAt: '2024-01-03T00:00:00.000Z',
    lastUpdated: '2024-01-03T00:00:00.000Z',
    status: 'Open'
  }
];

const acceptances = [
  {
    id: 'acc_employee01_demo-challenge-1',
    username: 'employee01',
    challengeId: 'demo-challenge-1',
    status: 'Approved',
    committedDate: '2024-12-31',
    acceptedAt: '2024-01-10T00:00:00.000Z'
  },
  {
    id: 'acc_employee02_demo-challenge-2', 
    username: 'employee02',
    challengeId: 'demo-challenge-2',
    status: 'Needs Rework',
    committedDate: '2024-12-31',
    acceptedAt: '2024-01-11T00:00:00.000Z'
  },
  {
    id: 'acc_employee03_demo-challenge-3',
    username: 'employee03', 
    challengeId: 'demo-challenge-3',
    status: 'Submitted',
    committedDate: '2024-12-31',
    acceptedAt: '2024-01-12T00:00:00.000Z'
  }
];

const submissions = [
  {
    id: 'employee01-demo-challenge-1',
    username: 'employee01',
    challengeId: 'demo-challenge-1',
    submitted: true,
    submittedAt: '2024-01-15T00:00:00.000Z',
    fileUrl: '/demo/dashboard.zip',
    fileName: 'dashboard.zip',
    fileSize: 1000000,
    shortDescription: 'React dashboard',
    technologies: 'React, TypeScript',
    sourceCodeUrl: 'https://github.com/employee01/dashboard',
    hostedAppUrl: 'https://dashboard.netlify.app',
    status: 'Approved'
  },
  {
    id: 'employee02-demo-challenge-2',
    username: 'employee02',
    challengeId: 'demo-challenge-2', 
    submitted: true,
    submittedAt: '2024-01-16T00:00:00.000Z',
    fileUrl: '/demo/ecommerce.zip',
    fileName: 'ecommerce.zip',
    fileSize: 1500000,
    shortDescription: 'E-commerce integration',
    technologies: 'Node.js, React',
    sourceCodeUrl: 'https://github.com/employee02/ecommerce',
    hostedAppUrl: 'https://ecommerce.netlify.app',
    status: 'Needs Rework'
  },
  {
    id: 'employee03-demo-challenge-3',
    username: 'employee03',
    challengeId: 'demo-challenge-3',
    submitted: true,
    submittedAt: '2024-01-17T00:00:00.000Z',
    fileUrl: '/demo/mobile.zip',
    fileName: 'mobile.zip',
    fileSize: 2000000,
    shortDescription: 'Mobile app',
    technologies: 'React Native',
    sourceCodeUrl: 'https://github.com/employee03/mobile',
    hostedAppUrl: 'https://mobile.netlify.app',
    status: 'Submitted'
  }
];

const reviews = [
  {
    submissionId: 'employee01-demo-challenge-1',
    challengeId: 'demo-challenge-1',
    username: 'employee01',
    status: 'Approved',
    reviewedBy: 'Sarah Wilson',
    reviewedAt: '2024-01-18T00:00:00.000Z',
    reviewComment: 'Excellent work!',
    pointsAwarded: 500,
    submissionDate: '2024-01-15T00:00:00.000Z',
    commitmentDate: '2024-12-31',
    isOnTime: true
  },
  {
    submissionId: 'employee02-demo-challenge-2',
    challengeId: 'demo-challenge-2',
    username: 'employee02',
    status: 'Needs Rework',
    reviewedBy: 'Sarah Wilson',
    reviewedAt: '2024-01-19T00:00:00.000Z',
    reviewComment: 'Good but needs improvements',
    pointsAwarded: 350,
    submissionDate: '2024-01-16T00:00:00.000Z',
    commitmentDate: '2024-12-31',
    isOnTime: true
  },
  {
    submissionId: 'employee03-demo-challenge-3',
    challengeId: 'demo-challenge-3',
    username: 'employee03',
    status: 'Pending Review',
    submissionDate: '2024-01-17T00:00:00.000Z',
    commitmentDate: '2024-12-31',
    isOnTime: true
  }
];

localStorage.setItem('challengeHub_challenges', JSON.stringify(challenges));
localStorage.setItem('challengeHub_acceptances', JSON.stringify(acceptances));
localStorage.setItem('challengeHub_submissions', JSON.stringify(submissions));
localStorage.setItem('challengeHub_reviews', JSON.stringify(reviews));

console.log('✅ IMMEDIATE FIX COMPLETE - REFRESH PAGE');
console.log('Data set: 3 challenges, 3 acceptances, 3 submissions, 3 reviews');

export {};
