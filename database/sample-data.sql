-- Sample Data for Challenge Management System
-- This includes users, challenges, and some example acceptances/submissions

-- Insert sample users
INSERT INTO users (id, username, email, display_name, role, total_points) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'employee01', 'john.doe@company.com', 'John Doe', 'Employee', 850),
('550e8400-e29b-41d4-a716-446655440002', 'employee02', 'lisa.thompson@company.com', 'Lisa Thompson', 'Employee', 1200),
('550e8400-e29b-41d4-a716-446655440003', 'employee03', 'mike.chen@company.com', 'Mike Chen', 'Employee', 750),
('550e8400-e29b-41d4-a716-446655440004', 'manager01', 'sarah.wilson@company.com', 'Sarah Wilson', 'Management', 0),
('550e8400-e29b-41d4-a716-446655440005', 'admin01', 'admin@company.com', 'System Admin', 'Admin', 0)
ON CONFLICT (username) DO UPDATE SET
email = EXCLUDED.email,
display_name = EXCLUDED.display_name,
role = EXCLUDED.role,
total_points = EXCLUDED.total_points;

-- Insert challenges (matching your current system)
INSERT INTO challenges (id, title, description, full_description, expected_outcome, tags, status, points, penalty_points, deadline, created_by_id, created_by_name, attachments) VALUES
('ch1754040356417', 'React Dashboard Builder', 'Create a comprehensive dashboard using React with data visualization capabilities.', 
'Build a modern, responsive dashboard application using React that displays various data metrics through interactive charts and graphs. The dashboard should include user authentication, real-time data updates, and be mobile-friendly.

Key Requirements:
- Use React 18+ with functional components and hooks
- Implement responsive design with Tailwind CSS or similar
- Include at least 3 different chart types (bar, line, pie)
- Add user authentication (login/logout)
- Include data filtering and search functionality
- Implement dark/light theme toggle
- Add loading states and error handling
- Write unit tests for key components

Technical Specifications:
- Must use TypeScript for type safety
- Implement proper error boundaries
- Use React Query or SWR for data fetching
- Follow React best practices and patterns
- Include proper documentation (README.md)

Bonus Points:
- Add real-time updates using WebSockets
- Implement data export functionality (CSV/PDF)
- Add internationalization (i18n) support', 
'A fully functional React dashboard with authentication, data visualization, responsive design, and comprehensive documentation. The application should be production-ready with proper error handling and testing.',
ARRAY['React', 'TypeScript', 'Tailwind CSS', 'Chart.js', 'Authentication'],
'Open',
1200,
100,
CURRENT_DATE + INTERVAL '14 days',
'550e8400-e29b-41d4-a716-446655440004',
'Sarah Wilson',
ARRAY['dashboard-wireframes.pdf', 'api-documentation.md']),

('ch001', 'E-commerce API Integration', 'Develop a RESTful API for an e-commerce platform with payment processing.',
'Create a comprehensive RESTful API for an e-commerce platform that handles product management, user authentication, shopping cart functionality, and payment processing integration.

Core Features Required:
- User registration and authentication (JWT-based)
- Product catalog management (CRUD operations)
- Shopping cart functionality
- Order management system
- Payment processing integration (Stripe/PayPal)
- Inventory management
- User profiles and preferences
- Admin panel endpoints

Technical Requirements:
- Use Node.js with Express.js or NestJS
- PostgreSQL or MongoDB for data storage
- Implement proper validation and error handling
- Add comprehensive API documentation (Swagger/OpenAPI)
- Include rate limiting and security measures
- Write integration and unit tests
- Implement caching strategy (Redis recommended)
- Add logging and monitoring

Security & Performance:
- Input validation and sanitization
- SQL injection prevention
- Authentication and authorization
- Password hashing (bcrypt)
- CORS configuration
- Performance optimization techniques

Deliverables:
- Complete API codebase with documentation
- Database schema and migrations
- Postman collection or similar for testing
- Deployment instructions
- Unit and integration test suite',
'A production-ready e-commerce API with full CRUD operations, payment processing, security measures, and comprehensive documentation.',
ARRAY['Node.js', 'Express', 'PostgreSQL', 'JWT', 'Stripe API', 'Redis'],
'Open',
1500,
150,
CURRENT_DATE + INTERVAL '21 days',
'550e8400-e29b-41d4-a716-446655440004',
'Sarah Wilson',
ARRAY['api-requirements.pdf', 'database-schema.sql']),

('ch002', 'Data Analytics Dashboard', 'Build a data analytics dashboard with advanced reporting features.',
'Develop a comprehensive data analytics dashboard that processes large datasets and provides interactive visualizations and reporting capabilities.

Key Features:
- Connect to multiple data sources (APIs, databases, CSV files)
- Real-time data processing and visualization
- Interactive charts and graphs (D3.js, Chart.js, or similar)
- Custom report generation
- Data export functionality (PDF, Excel, CSV)
- User role-based access control
- Advanced filtering and search capabilities
- Responsive design for mobile and desktop

Technical Stack Options:
- Frontend: React/Vue.js/Angular with TypeScript
- Backend: Python (Django/Flask) or Node.js
- Database: PostgreSQL with analytics extensions
- Visualization: D3.js, Chart.js, or Plotly
- Data Processing: Pandas, NumPy (Python) or similar tools

Advanced Features:
- Machine learning insights integration
- Automated report scheduling
- Data alerting system
- Performance optimization for large datasets
- Caching strategies for faster load times
- API integration for external data sources

Quality Requirements:
- Comprehensive error handling
- Loading states and user feedback
- Accessibility compliance (WCAG 2.1)
- Cross-browser compatibility
- Performance optimization
- Security best practices
- Complete documentation and testing',
'A full-featured analytics dashboard with real-time data processing, interactive visualizations, and advanced reporting capabilities.',
ARRAY['React', 'D3.js', 'Python', 'PostgreSQL', 'Data Analysis'],
'Open',
1800,
180,
CURRENT_DATE + INTERVAL '28 days',
'550e8400-e29b-41d4-a716-446655440004',
'Sarah Wilson',
ARRAY['data-sample.csv', 'analytics-requirements.md']),

('ch003', 'Mobile App with Push Notifications', 'Develop a mobile application using React Native with real-time push notification capabilities.',
'Create a cross-platform mobile application using React Native that implements real-time push notifications, user authentication, and offline data synchronization.

Core Requirements:
- Cross-platform compatibility (iOS and Android)
- User authentication and profile management
- Real-time push notifications (Firebase Cloud Messaging)
- Offline data storage and synchronization
- Modern UI/UX with smooth animations
- Camera and photo upload functionality
- GPS location services integration
- In-app messaging or chat functionality

Technical Specifications:
- React Native with TypeScript
- State management (Redux Toolkit or Zustand)
- Navigation (React Navigation v6+)
- Offline storage (AsyncStorage or SQLite)
- Real-time features (WebSockets or Firebase)
- Image handling and optimization
- Push notification handling (background/foreground)
- Deep linking support

Advanced Features:
- Biometric authentication (Face ID/Touch ID)
- Social media login integration
- File sharing capabilities
- Custom animations and transitions
- Performance optimization techniques
- Analytics integration (Firebase Analytics)
- Crash reporting (Crashlytics)
- App store optimization considerations

Quality Assurance:
- Comprehensive testing strategy
- Performance profiling and optimization
- Security best practices implementation
- Accessibility features
- Code splitting and lazy loading
- Proper error boundaries and handling
- Documentation for setup and deployment',
'A production-ready mobile app for iOS and Android with push notifications, offline capabilities, and modern user experience.',
ARRAY['React Native', 'TypeScript', 'Firebase', 'Push Notifications', 'Mobile Development'],
'Open',
2000,
200,
CURRENT_DATE + INTERVAL '35 days',
'550e8400-e29b-41d4-a716-446655440004',
'Sarah Wilson',
ARRAY['mobile-mockups.pdf', 'notification-specs.md'])

ON CONFLICT (id) DO UPDATE SET
title = EXCLUDED.title,
description = EXCLUDED.description,
full_description = EXCLUDED.full_description,
expected_outcome = EXCLUDED.expected_outcome,
tags = EXCLUDED.tags,
status = EXCLUDED.status,
points = EXCLUDED.points,
penalty_points = EXCLUDED.penalty_points,
deadline = EXCLUDED.deadline,
created_by_name = EXCLUDED.created_by_name,
attachments = EXCLUDED.attachments,
updated_at = NOW();

-- Insert current challenge acceptance (Mike Chen has accepted the React Dashboard challenge)
INSERT INTO challenge_acceptances (id, user_id, username, challenge_id, status, committed_date, accepted_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', 'employee03', 'ch1754040356417', 'Accepted', CURRENT_DATE + INTERVAL '14 days', NOW() - INTERVAL '2 hours')
ON CONFLICT (user_id, challenge_id) DO UPDATE SET
status = EXCLUDED.status,
committed_date = EXCLUDED.committed_date,
updated_at = NOW();

-- Add some example submissions and reviews for demonstration
INSERT INTO submissions (id, user_id, username, challenge_id, acceptance_id, solution_description, short_description, github_url, demo_url, technologies, status, submitted_at) VALUES
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'employee01', 'ch001', '650e8400-e29b-41d4-a716-446655440002', 
'Implemented a comprehensive e-commerce API with all required features including user authentication, product management, shopping cart, and Stripe payment integration. The API includes proper error handling, validation, and security measures.', 
'Complete e-commerce API with payment integration and admin features.',
'https://github.com/johndoe/ecommerce-api',
'https://ecommerce-api-demo.herokuapp.com',
'Node.js, Express, PostgreSQL, Stripe, JWT, Redis',
'Approved',
NOW() - INTERVAL '5 days')
ON CONFLICT (user_id, challenge_id) DO NOTHING;

-- Add corresponding acceptance for the submission above
INSERT INTO challenge_acceptances (id, user_id, username, challenge_id, status, committed_date, accepted_at) VALUES
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'employee01', 'ch001', 'Approved', CURRENT_DATE - INTERVAL '7 days', NOW() - INTERVAL '14 days')
ON CONFLICT (user_id, challenge_id) DO UPDATE SET
status = EXCLUDED.status,
updated_at = NOW();

-- Add a review for the approved submission
INSERT INTO submission_reviews (id, submission_id, reviewer_id, reviewer_name, status, review_comment, points_awarded, is_on_time, submission_date, commitment_date, reviewed_at) VALUES
('850e8400-e29b-41d4-a716-446655440001', '750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', 'Sarah Wilson', 
'Approved', 
'Excellent implementation! The API is well-structured, includes comprehensive error handling, and the documentation is thorough. All requirements have been met and the code quality is outstanding.', 
1500, 
true, 
CURRENT_DATE - INTERVAL '5 days', 
CURRENT_DATE - INTERVAL '7 days', 
NOW() - INTERVAL '3 days')
ON CONFLICT (submission_id) DO UPDATE SET
status = EXCLUDED.status,
review_comment = EXCLUDED.review_comment,
points_awarded = EXCLUDED.points_awarded,
reviewed_at = EXCLUDED.reviewed_at,
updated_at = NOW();

-- Add points history for the approved challenge
INSERT INTO user_points_history (id, user_id, challenge_id, submission_id, points_change, reason, previous_total, new_total) VALUES
('950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'ch001', '750e8400-e29b-41d4-a716-446655440001', 1500, 'challenge_approved', 350, 850)
ON CONFLICT DO NOTHING;
