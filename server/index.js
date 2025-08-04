const express = require('express');
const cors = require('cors');
const path = require('path');
const { initializeDatabase } = require('./config/database');

// Import route handlers
const challengeRoutes = require('./routes/challenges');
const submissionRoutes = require('./routes/submissions');
const userRoutes = require('./routes/users');

function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check routes
  app.get('/api/ping', (req, res) => {
    const ping = process.env.PING_MESSAGE || 'ping';
    res.json({ message: ping });
  });

  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  app.use('/api/challenges', challengeRoutes);
  app.use('/api/submissions', submissionRoutes);
  app.use('/api/users', userRoutes);

  // In production, serve the built SPA files
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.join(__dirname, '../dist');
    app.use(express.static(distPath));

    // Handle React Router - serve index.html for all non-API routes
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  return app;
}

// Initialize database and start server
async function startServer() {
  const dbInitialized = await initializeDatabase();
  
  if (!dbInitialized) {
    console.error('❌ Failed to initialize database. Exiting...');
    process.exit(1);
  }

  const app = createServer();
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔧 API: http://localhost:${port}/api`);
  });
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { createServer, startServer };

export { createServer }