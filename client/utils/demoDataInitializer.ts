import { Challenge } from '@shared/types';
import { ChallengeAcceptance } from '@/contexts/ChallengeAcceptanceContext';
import { ChallengeSubmission } from '@/contexts/SubmissionContext';
import { SubmissionReview } from '@/contexts/SubmissionReviewContext';

// Demo challenges for consistent persistence
export const DEMO_CHALLENGES: Challenge[] = [
  {
    id: 'demo-challenge-1',
    title: 'E-commerce React Dashboard',
    description: 'Build a responsive dashboard for an e-commerce platform with charts and analytics.',
    fullDescription: 'Create a comprehensive dashboard using React and TypeScript that displays sales analytics, user metrics, and product performance charts. Must be responsive and include dark mode support.',
    expectedOutcome: 'Working dashboard with charts, responsive design, and modern UI components',
    tags: ['React', 'TypeScript', 'Charts', 'Dashboard'],
    points: 500,
    penaltyPoints: 50,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdBy: 'Sarah Johnson',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdated: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Open'
  },
  {
    id: 'demo-challenge-2', 
    title: 'Mobile-First Landing Page',
    description: 'Design and implement a modern landing page with animations and optimized performance.',
    fullDescription: 'Create a mobile-first landing page using modern CSS techniques, smooth animations, and performance optimizations. Should achieve 90+ Lighthouse score.',
    expectedOutcome: 'High-performance landing page with animations and mobile-first design',
    tags: ['HTML', 'CSS', 'JavaScript', 'Performance'],
    points: 400,
    penaltyPoints: 40,
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdBy: 'Mike Chen',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdated: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Open'
  },
  {
    id: 'demo-challenge-3',
    title: 'API Integration Challenge',
    description: 'Build a full-stack application with REST API integration and real-time features.',
    fullDescription: 'Develop a full-stack application that integrates with external APIs, includes user authentication, and implements real-time features using WebSockets.',
    expectedOutcome: 'Full-stack app with API integration, auth, and real-time functionality',
    tags: ['Node.js', 'Express', 'React', 'WebSocket'],
    points: 600,
    penaltyPoints: 60,
    deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdBy: 'Alex Rodriguez',
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdated: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'Open'
  }
];

// Demo acceptances with submissions and reviews
export const DEMO_ACCEPTANCES: ChallengeAcceptance[] = [
  {
    id: 'acc_employee01_demo-challenge-1',
    username: 'employee01',
    challengeId: 'demo-challenge-1',
    status: 'Approved',
    committedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    acceptedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'acc_employee02_demo-challenge-2',
    username: 'employee02',
    challengeId: 'demo-challenge-2',
    status: 'Needs Rework',
    committedDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    acceptedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'acc_employee03_demo-challenge-3',
    username: 'employee03',
    challengeId: 'demo-challenge-3',
    status: 'Submitted',
    committedDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    acceptedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  }
];

export const DEMO_SUBMISSIONS: ChallengeSubmission[] = [
  {
    id: 'employee01-demo-challenge-1',
    username: 'employee01',
    challengeId: 'demo-challenge-1',
    submitted: true,
    submittedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    fileUrl: '/demo/employee01-dashboard.zip',
    fileName: 'ecommerce-dashboard.zip',
    fileSize: 2456789,
    shortDescription: 'Complete e-commerce dashboard with React, charts, and responsive design.',
    technologies: 'React, TypeScript, Chart.js, Tailwind CSS',
    sourceCodeUrl: 'https://github.com/employee01/ecommerce-dashboard',
    hostedAppUrl: 'https://employee01-dashboard.netlify.app',
    status: 'Approved'
  },
  {
    id: 'employee02-demo-challenge-2',
    username: 'employee02',
    challengeId: 'demo-challenge-2',
    submitted: true,
    submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    fileUrl: '/demo/employee02-landing.zip',
    fileName: 'mobile-landing-page.zip',
    fileSize: 1234567,
    shortDescription: 'Mobile-first landing page with animations and 95 Lighthouse score.',
    technologies: 'HTML5, CSS3, JavaScript, GSAP',
    sourceCodeUrl: 'https://github.com/employee02/mobile-landing',
    hostedAppUrl: 'https://employee02-landing.vercel.app',
    status: 'Needs Rework'
  },
  {
    id: 'employee03-demo-challenge-3',
    username: 'employee03',
    challengeId: 'demo-challenge-3',
    submitted: true,
    submittedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
    fileUrl: '/demo/employee03-fullstack.zip',
    fileName: 'fullstack-api-app.zip',
    fileSize: 3456789,
    shortDescription: 'Full-stack app with API integration, auth, and WebSocket real-time features.',
    technologies: 'Node.js, Express, React, Socket.io, MongoDB',
    sourceCodeUrl: 'https://github.com/employee03/fullstack-api',
    hostedAppUrl: 'https://employee03-fullstack.herokuapp.com',
    status: 'Submitted'
  }
];

export const DEMO_REVIEWS: SubmissionReview[] = [
  {
    submissionId: 'employee01-demo-challenge-1',
    challengeId: 'demo-challenge-1',
    username: 'employee01',
    status: 'Approved',
    reviewedBy: 'Sarah Johnson',
    reviewedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    reviewComment: 'Excellent implementation! Great use of modern React patterns and responsive design.',
    pointsAwarded: 500,
    submissionDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    commitmentDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isOnTime: true
  },
  {
    submissionId: 'employee02-demo-challenge-2',
    challengeId: 'demo-challenge-2',
    username: 'employee02',
    status: 'Needs Rework',
    reviewedBy: 'Mike Chen',
    reviewedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    reviewComment: 'Good foundation but animations need refinement and Lighthouse score is 82. Please optimize performance.',
    pointsAwarded: 400,
    submissionDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    commitmentDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isOnTime: true
  },
  {
    submissionId: 'employee03-demo-challenge-3',
    challengeId: 'demo-challenge-3',
    username: 'employee03',
    status: 'Pending Review',
    submissionDate: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    commitmentDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isOnTime: true
  }
];

export function initializeDemoData(): void {
  console.log('🚀 Initializing demo data (preserving existing data)');

  // Only add demo data if none exists - do NOT clear existing data
  const existingChallenges = localStorage.getItem('challengeHub_challenges');
  const existingAcceptances = localStorage.getItem('challengeHub_acceptances');
  const existingSubmissions = localStorage.getItem('challengeHub_submissions');
  const existingReviews = localStorage.getItem('challengeHub_reviews');

  if (!existingChallenges) {
    localStorage.setItem('challengeHub_challenges', JSON.stringify(DEMO_CHALLENGES));
    console.log('✅ Added demo challenges');
  } else {
    console.log('⚡ Preserving existing challenges');
  }

  if (!existingAcceptances) {
    localStorage.setItem('challengeHub_acceptances', JSON.stringify(DEMO_ACCEPTANCES));
    console.log('✅ Added demo acceptances');
  } else {
    console.log('⚡ Preserving existing acceptances');
  }

  if (!existingSubmissions) {
    localStorage.setItem('challengeHub_submissions', JSON.stringify(DEMO_SUBMISSIONS));
    console.log('✅ Added demo submissions');
  } else {
    console.log('⚡ Preserving existing submissions');
  }

  if (!existingReviews) {
    localStorage.setItem('challengeHub_reviews', JSON.stringify(DEMO_REVIEWS));
    console.log('✅ Added demo reviews');
  } else {
    console.log('⚡ Preserving existing reviews');
  }

  console.log('✅ Demo data initialization complete (existing data preserved)');
}

// Make available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).initializeDemoData = initializeDemoData;
  (window as any).clearDemoData = () => {
    localStorage.removeItem('challengeHub_challenges');
    localStorage.removeItem('challengeHub_acceptances');
    localStorage.removeItem('challengeHub_submissions');
    localStorage.removeItem('challengeHub_reviews');
    console.log('🗑️ Demo data cleared');
  };
}
