// Emergency data fix - simple and reliable for demo

export function emergencyDataFix(): void {
  console.log('🚨 EMERGENCY DATA FIX - FIXING ALL INCONSISTENCIES');
  
  // Clear data but preserve user session
  const currentUser = localStorage.getItem('challengeHub_user');
  localStorage.clear();
  if (currentUser) {
    localStorage.setItem('challengeHub_user', currentUser);
  }
  
  // Set simple, working demo data with EXACT matching
  const challenges = [
    {
      id: 'demo-challenge-1',
      title: 'React Dashboard Builder',
      description: 'Build a comprehensive admin dashboard using React, TypeScript, and Tailwind CSS with data visualization components.',
      fullDescription: 'Build a comprehensive admin dashboard using React, TypeScript, and Tailwind CSS with data visualization components.',
      expectedOutcome: 'Working dashboard with charts and analytics',
      tags: ['React', 'TypeScript', 'Dashboard'],
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
      title: 'E-commerce API Integration',
      description: 'Integrate with a third-party e-commerce API to create a product catalog with shopping cart functionality.',
      fullDescription: 'Integrate with a third-party e-commerce API to create a product catalog with shopping cart functionality.',
      expectedOutcome: 'Working e-commerce integration',
      tags: ['API', 'Integration', 'E-commerce'],
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
      title: 'Mobile App with Push Notifications',
      description: 'Develop a mobile application using React Native with real-time push notification capabilities.',
      fullDescription: 'Develop a mobile application using React Native with real-time push notification capabilities.',
      expectedOutcome: 'Working mobile app with notifications',
      tags: ['React Native', 'Mobile', 'Notifications'],
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
      fileUrl: '/demo/employee01-dashboard.zip',
      fileName: 'dashboard.zip',
      fileSize: 1000000,
      shortDescription: 'React dashboard with TypeScript',
      technologies: 'React, TypeScript, Tailwind',
      sourceCodeUrl: 'https://github.com/employee01/dashboard',
      hostedAppUrl: 'https://employee01-dashboard.netlify.app',
      status: 'Approved'
    },
    {
      id: 'employee02-demo-challenge-2',
      username: 'employee02',
      challengeId: 'demo-challenge-2',
      submitted: true,
      submittedAt: '2024-01-16T00:00:00.000Z',
      fileUrl: '/demo/employee02-ecommerce.zip',
      fileName: 'ecommerce.zip',
      fileSize: 1500000,
      shortDescription: 'E-commerce API integration',
      technologies: 'Node.js, Express, React',
      sourceCodeUrl: 'https://github.com/employee02/ecommerce',
      hostedAppUrl: 'https://employee02-ecommerce.netlify.app',
      status: 'Needs Rework'
    },
    {
      id: 'employee03-demo-challenge-3',
      username: 'employee03',
      challengeId: 'demo-challenge-3',
      submitted: true,
      submittedAt: '2024-01-17T00:00:00.000Z',
      fileUrl: '/demo/employee03-mobile.zip',
      fileName: 'mobile-app.zip',
      fileSize: 2000000,
      shortDescription: 'React Native app with push notifications',
      technologies: 'React Native, Firebase',
      sourceCodeUrl: 'https://github.com/employee03/mobile-app',
      hostedAppUrl: 'https://employee03-mobile.netlify.app',
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
      reviewComment: 'Excellent work! Great implementation.',
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
      reviewComment: 'Good start but needs some improvements.',
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

  // Set all data at once
  localStorage.setItem('challengeHub_challenges', JSON.stringify(challenges));
  localStorage.setItem('challengeHub_acceptances', JSON.stringify(acceptances));
  localStorage.setItem('challengeHub_submissions', JSON.stringify(submissions));
  localStorage.setItem('challengeHub_reviews', JSON.stringify(reviews));

  console.log('✅ EMERGENCY DATA SET COMPLETE');
  console.log('   - Challenges:', challenges.length);
  console.log('   - Acceptances:', acceptances.length);
  console.log('   - Submissions:', submissions.length);
  console.log('   - Reviews:', reviews.length);
  
  console.log('🎯 Expected results:');
  console.log('   - employee01 (John Doe): 500 points, 1 accepted, 1 submission');
  console.log('   - employee02 (Lisa Thompson): 350 points, 1 accepted, 1 submission'); 
  console.log('   - employee03 (Mike Chen): 0 points, 1 accepted, 1 submission');
  console.log('   - Dashboard should show: 3 challenges, 1-3 accepted, 1-3 submissions');
}

// Make available globally
if (typeof window !== 'undefined') {
  (window as any).emergencyDataFix = emergencyDataFix;
}

export default emergencyDataFix;
