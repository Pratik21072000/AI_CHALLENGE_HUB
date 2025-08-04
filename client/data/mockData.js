export const mockChallenges = [
  {
    id: 'ch001',
    title: 'React Dashboard Builder',
    description: 'Build a comprehensive admin dashboard using React and modern CSS with data visualization components.',
    fullDescription: 'Create a modern, responsive admin dashboard that showcases key business metrics through interactive charts and graphs. The dashboard should include user management, analytics overview, and real-time data updates.',
    expectedOutcome: 'A fully functional admin dashboard with at least 5 different chart types, user authentication, and responsive design that works across all device sizes.',
    tags: ['React', 'CSS', 'Tailwind CSS', 'Chart.js'],
    status: 'Open',
    points: 1200,
    penaltyPoints: 100,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdBy: 'Sarah Wilson',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ch002',
    title: 'E-commerce API Integration',
    description: 'Integrate with a third-party e-commerce API to create a product catalog with shopping cart functionality.',
    fullDescription: 'Build a complete e-commerce interface that connects to external APIs for product data, implements shopping cart functionality, and handles checkout processes.',
    expectedOutcome: 'A working e-commerce site with product listing, search functionality, cart management, and mock payment processing.',
    tags: ['API Integration', 'JavaScript', 'Node.js', 'Express'],
    status: 'Open',
    points: 1500,
    penaltyPoints: 150,
    deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdBy: 'Sarah Wilson',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    lastUpdated: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'ch003',
    title: 'Mobile App with Push Notifications',
    description: 'Develop a mobile application using React Native with real-time push notification capabilities.',
    fullDescription: 'Create a cross-platform mobile app that can send and receive push notifications, with user authentication and offline data synchronization.',
    expectedOutcome: 'A mobile app available for both iOS and Android that successfully implements push notifications and works offline.',
    tags: ['React Native', 'Mobile Development', 'Push Notifications', 'Firebase'],
    status: 'Open',
    points: 1800,
    penaltyPoints: 200,
    deadline: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdBy: 'Sarah Wilson',
    createdAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString()
  }
];

export const mockUsers = [
  {
    id: '1',
    name: 'Alex Rodriguez',
    email: 'alex.rodriguez@company.com',
    department: 'Engineering',
    totalPoints: 2150,
    badges: ['Innovation Champion', 'Code Master', 'Team Player']
  },
  {
    id: '2',
    name: 'Lisa Thompson',
    email: 'lisa.thompson@company.com',
    department: 'Engineering',
    totalPoints: 1890,
    badges: ['Problem Solver', 'Quality Expert']
  },
  {
    id: '3',
    name: 'David Kim',
    email: 'david.kim@company.com',
    department: 'Product',
    totalPoints: 1650,
    badges: ['Innovation Champion', 'Blockchain Expert']
  },
  {
    id: '4',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@company.com',
    department: 'Design',
    totalPoints: 1420,
    badges: ['UI/UX Expert', 'Creative Thinker']
  },
  {
    id: '5',
    name: 'John Doe',
    email: 'john.doe@company.com',
    department: 'Engineering',
    totalPoints: 1250,
    badges: ['Team Player']
  }
];