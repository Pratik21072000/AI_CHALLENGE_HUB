// MySQL API Endpoints - Server-side MySQL operations
import express from 'express';
import mysql from 'mysql2/promise';

const router = express.Router();

// MySQL connection configuration
let mysqlPool: mysql.Pool | null = null;

// Initialize MySQL connection pool
function initializeMySQL(config: {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}) {
  mysqlPool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    charset: 'utf8mb4'
  });
}

// Test MySQL connection
router.get('/test', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    const connection = await mysqlPool.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    
    res.json({ success: true, message: 'MySQL connection successful' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Configure MySQL connection
router.post('/configure', async (req, res) => {
  try {
    const { host, port, user, password, database } = req.body;
    
    if (!host || !port || !user || !password || !database) {
      return res.status(400).json({ error: 'Missing required configuration parameters' });
    }

    initializeMySQL({ host, port: parseInt(port), user, password, database });
    
    // Test the connection
    const connection = await mysqlPool!.getConnection();
    await connection.execute('SELECT 1');
    connection.release();
    
    res.json({ success: true, message: 'MySQL configured and connected successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// User endpoints
router.post('/users', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    const { username, email, display_name, role, department } = req.body;
    
    const [result] = await mysqlPool.execute(
      `INSERT INTO users (username, email, display_name, role, department) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, display_name, role, department || 'General']
    );

    // Fetch and return the created user
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    ) as any;

    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/:username', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    const { username } = req.params;
    
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    ) as any;

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/users/:username/points', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    const { username } = req.params;
    const { pointsChange, reason } = req.body;
    
    // Update user points
    await mysqlPool.execute(
      'UPDATE users SET total_points = total_points + ? WHERE username = ?',
      [pointsChange, username]
    );

    // Get user ID for points history
    const [userRows] = await mysqlPool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    ) as any;

    if (userRows.length > 0) {
      // Record in points history
      await mysqlPool.execute(
        `INSERT INTO user_points_history (user_id, username, action_type, points_change, reason) 
         VALUES (?, ?, ?, ?, ?)`,
        [userRows[0].id, username, pointsChange > 0 ? 'earned' : 'penalty', pointsChange, reason || 'API update']
      );
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Challenge acceptance endpoints
router.post('/acceptances', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    const { username, challenge_id, committed_date } = req.body;
    
    // Get user ID
    const [userRows] = await mysqlPool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    ) as any;

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user_id = userRows[0].id;

    // Check for existing active challenges
    const [activeRows] = await mysqlPool.execute(
      `SELECT COUNT(*) as count FROM challenge_acceptances 
       WHERE username = ? AND status IN ('Accepted', 'Submitted', 'Pending Review', 'Under Review')`,
      [username]
    ) as any;

    if (activeRows[0].count > 0) {
      return res.status(400).json({ error: 'User already has an active challenge' });
    }

    // Insert new acceptance
    const [result] = await mysqlPool.execute(
      `INSERT INTO challenge_acceptances (user_id, username, challenge_id, committed_date) 
       VALUES (?, ?, ?, ?)`,
      [user_id, username, challenge_id, committed_date]
    ) as any;

    // Fetch and return the created acceptance
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM challenge_acceptances WHERE id = ?',
      [result.insertId]
    ) as any;

    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/acceptances/:username', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    const { username } = req.params;
    
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM challenge_acceptances WHERE username = ? ORDER BY accepted_at DESC',
      [username]
    ) as any;

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Submission endpoints
router.post('/submissions', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    const {
      username, challenge_id, solution_description, short_description,
      github_url, demo_url, technologies, files_attached
    } = req.body;
    
    // Get user ID
    const [userRows] = await mysqlPool.execute(
      'SELECT id FROM users WHERE username = ?',
      [username]
    ) as any;

    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user_id = userRows[0].id;

    // Get acceptance ID
    const [acceptanceRows] = await mysqlPool.execute(
      'SELECT id FROM challenge_acceptances WHERE username = ? AND challenge_id = ?',
      [username, challenge_id]
    ) as any;

    const acceptance_id = acceptanceRows.length > 0 ? acceptanceRows[0].id : null;

    const [result] = await mysqlPool.execute(
      `INSERT INTO submissions (
        user_id, username, challenge_id, acceptance_id, 
        solution_description, short_description, github_url, demo_url, 
        technologies, files_attached
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, username, challenge_id, acceptance_id,
        solution_description, short_description, github_url, demo_url,
        technologies, JSON.stringify(files_attached || [])
      ]
    ) as any;

    // Fetch and return the created submission
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM submissions WHERE id = ?',
      [result.insertId]
    ) as any;

    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all acceptances
router.get('/acceptances', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    const [rows] = await mysqlPool.execute(
      'SELECT * FROM challenge_acceptances ORDER BY accepted_at DESC'
    ) as any;

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update acceptance status
router.patch('/acceptances/:username/:challengeId', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    const { username, challengeId } = req.params;
    const { status } = req.body;

    await mysqlPool.execute(
      'UPDATE challenge_acceptances SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ? AND challenge_id = ?',
      [status, username, challengeId]
    );

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all submissions
router.get('/submissions', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    const [rows] = await mysqlPool.execute(
      'SELECT * FROM submissions ORDER BY submitted_at DESC'
    ) as any;

    res.json(rows.map(row => ({
      ...row,
      files_attached: row.files_attached ? JSON.parse(row.files_attached) : []
    })));
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all reviews
router.get('/reviews', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    const [rows] = await mysqlPool.execute(
      'SELECT * FROM submission_reviews ORDER BY reviewed_at DESC'
    ) as any;

    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create review
router.post('/reviews', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    const {
      submission_id, username, challenge_id, reviewer_name, status,
      review_comment, points_awarded, is_on_time, submission_date, commitment_date
    } = req.body;

    const [result] = await mysqlPool.execute(
      `INSERT INTO submission_reviews (
        submission_id, username, challenge_id, reviewer_name, status,
        review_comment, points_awarded, is_on_time, submission_date, commitment_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        submission_id, username, challenge_id, reviewer_name, status,
        review_comment, points_awarded, is_on_time, submission_date, commitment_date
      ]
    ) as any;

    // Fetch and return the created review
    const [rows] = await mysqlPool.execute(
      'SELECT * FROM submission_reviews WHERE id = ?',
      [result.insertId]
    ) as any;

    res.json(rows[0]);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Clear all data (for development)
router.delete('/clear-all', async (req, res) => {
  try {
    if (!mysqlPool) {
      return res.status(500).json({ error: 'MySQL not configured' });
    }

    // Clear in correct order due to foreign key constraints
    await mysqlPool.execute('DELETE FROM submission_reviews');
    await mysqlPool.execute('DELETE FROM submissions');
    await mysqlPool.execute('DELETE FROM challenge_acceptances');
    await mysqlPool.execute('DELETE FROM user_points_history');

    res.json({ success: true, message: 'All data cleared' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export router and initialization function
export { router as mysqlRouter, initializeMySQL };
export default router;
