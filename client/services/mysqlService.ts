// MySQL Service - Client-side wrapper for MySQL API endpoints
// Fixes data consistency issues and provides real-time synchronization

interface MySQLConfig {
  apiUrl: string; // Base API URL for MySQL endpoints
}

interface UserData {
  id: string;
  username: string;
  email: string;
  display_name: string;
  role: 'Employee' | 'Management' | 'Admin';
  department: string;
  total_points: number;
  created_at: string;
  updated_at: string;
}

interface ChallengeAcceptance {
  id: string;
  user_id: string;
  username: string;
  challenge_id: string;
  status: 'Accepted' | 'Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework' | 'Withdrawn' | 'Completed';
  committed_date: string;
  accepted_at: string;
  updated_at: string;
}

interface Submission {
  id: string;
  user_id: string;
  username: string;
  challenge_id: string;
  acceptance_id?: string;
  solution_description: string;
  short_description?: string;
  github_url?: string;
  demo_url?: string;
  technologies?: string;
  files_attached?: string[];
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework';
  submitted_at: string;
  is_submitted: boolean;
  created_at: string;
  updated_at: string;
}

interface SubmissionReview {
  id: string;
  submission_id: string;
  username: string;
  challenge_id: string;
  reviewer_id?: string;
  reviewer_name: string;
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Needs Rework';
  review_comment?: string;
  points_awarded: number;
  is_on_time: boolean;
  submission_date: string;
  commitment_date: string;
  reviewed_at: string;
  created_at: string;
  updated_at: string;
}

class MySQLService {
  private config: MySQLConfig | null = null;
  private isConnected = false;

  // Initialize API configuration
  async initialize(config: MySQLConfig): Promise<{ success: boolean; error?: string }> {
    try {
      this.config = config;

      // Test API connection
      const response = await fetch(`${config.apiUrl}/api/mysql/test`);
      if (response.ok) {
        this.isConnected = true;
        console.log('✅ MySQL API connection established');
        return { success: true };
      } else {
        const error = await response.text();
        console.error('❌ MySQL API connection failed:', error);
        return { success: false, error };
      }
    } catch (error: any) {
      console.error('❌ MySQL API connection failed:', error.message);
      this.isConnected = false;
      return { success: false, error: error.message };
    }
  }

  // Test connection
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.config) {
      return { success: false, error: 'No configuration set' };
    }

    try {
      const response = await fetch(`${this.config.apiUrl}/api/mysql/test`);
      if (response.ok) {
        return { success: true };
      } else {
        const error = await response.text();
        return { success: false, error };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Check if service is ready
  isReady(): boolean {
    return this.isConnected && this.config !== null;
  }

  // Helper method for API calls
  private async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
    if (!this.config) {
      throw new Error('MySQL service not initialized');
    }

    const response = await fetch(`${this.config.apiUrl}/api/mysql${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error}`);
    }

    return response.json();
  }

  // User Management
  async createUser(userData: {
    username: string;
    email: string;
    display_name: string;
    role: 'Employee' | 'Management' | 'Admin';
    department?: string;
  }): Promise<UserData | null> {
    try {
      return await this.apiCall('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  async getUserByUsername(username: string): Promise<UserData | null> {
    try {
      return await this.apiCall(`/users/${username}`);
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  }

  async updateUserPoints(username: string, pointsChange: number, reason?: string): Promise<boolean> {
    try {
      await this.apiCall(`/users/${username}/points`, {
        method: 'PATCH',
        body: JSON.stringify({ pointsChange, reason }),
      });
      return true;
    } catch (error) {
      console.error('Error updating user points:', error);
      return false;
    }
  }

  // Challenge Acceptance Management
  async acceptChallenge(data: {
    username: string;
    challenge_id: string;
    committed_date: string;
  }): Promise<ChallengeAcceptance | null> {
    if (!this.connection) return null;

    try {
      const user = await this.getUserByUsername(data.username);
      if (!user) return null;

      // Check for existing active challenges
      const [activeRows] = await this.connection.execute(
        `SELECT COUNT(*) as count FROM challenge_acceptances 
         WHERE username = ? AND status IN ('Accepted', 'Submitted', 'Pending Review', 'Under Review')`,
        [data.username]
      ) as any;

      if (activeRows[0].count > 0) {
        throw new Error('User already has an active challenge');
      }

      // Insert new acceptance
      const [result] = await this.connection.execute(
        `INSERT INTO challenge_acceptances (user_id, username, challenge_id, committed_date) 
         VALUES (?, ?, ?, ?)`,
        [user.id, data.username, data.challenge_id, data.committed_date]
      ) as any;

      // Fetch and return the created acceptance
      const [rows] = await this.connection.execute(
        'SELECT * FROM challenge_acceptances WHERE id = ?',
        [result.insertId]
      ) as any;

      return rows[0] || null;
    } catch (error) {
      console.error('Error accepting challenge:', error);
      return null;
    }
  }

  async getUserAcceptances(username: string): Promise<ChallengeAcceptance[]> {
    if (!this.connection) return [];

    try {
      const [rows] = await this.connection.execute(
        'SELECT * FROM challenge_acceptances WHERE username = ? ORDER BY accepted_at DESC',
        [username]
      ) as any;

      return rows;
    } catch (error) {
      console.error('Error fetching user acceptances:', error);
      return [];
    }
  }

  async updateAcceptanceStatus(username: string, challenge_id: string, status: string): Promise<boolean> {
    if (!this.connection) return false;

    try {
      await this.connection.execute(
        'UPDATE challenge_acceptances SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE username = ? AND challenge_id = ?',
        [status, username, challenge_id]
      );
      return true;
    } catch (error) {
      console.error('Error updating acceptance status:', error);
      return false;
    }
  }

  async withdrawChallenge(username: string, challenge_id: string): Promise<boolean> {
    if (!this.connection) return false;

    try {
      await this.connection.execute(
        'UPDATE challenge_acceptances SET status = "Withdrawn", updated_at = CURRENT_TIMESTAMP WHERE username = ? AND challenge_id = ?',
        [username, challenge_id]
      );
      return true;
    } catch (error) {
      console.error('Error withdrawing challenge:', error);
      return false;
    }
  }

  // Submission Management
  async createSubmission(data: {
    username: string;
    challenge_id: string;
    solution_description: string;
    short_description?: string;
    github_url?: string;
    demo_url?: string;
    technologies?: string;
    files_attached?: string[];
  }): Promise<Submission | null> {
    if (!this.connection) return null;

    try {
      const user = await this.getUserByUsername(data.username);
      if (!user) return null;

      // Get acceptance ID
      const [acceptanceRows] = await this.connection.execute(
        'SELECT id FROM challenge_acceptances WHERE username = ? AND challenge_id = ?',
        [data.username, data.challenge_id]
      ) as any;

      const acceptance_id = acceptanceRows.length > 0 ? acceptanceRows[0].id : null;

      const [result] = await this.connection.execute(
        `INSERT INTO submissions (
          user_id, username, challenge_id, acceptance_id, 
          solution_description, short_description, github_url, demo_url, 
          technologies, files_attached
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          user.id, data.username, data.challenge_id, acceptance_id,
          data.solution_description, data.short_description, data.github_url, data.demo_url,
          data.technologies, JSON.stringify(data.files_attached || [])
        ]
      ) as any;

      // Fetch and return the created submission
      const [rows] = await this.connection.execute(
        'SELECT * FROM submissions WHERE id = ?',
        [result.insertId]
      ) as any;

      return rows[0] || null;
    } catch (error) {
      console.error('Error creating submission:', error);
      return null;
    }
  }

  async getUserSubmissions(username: string): Promise<Submission[]> {
    if (!this.connection) return [];

    try {
      const [rows] = await this.connection.execute(
        'SELECT * FROM submissions WHERE username = ? ORDER BY submitted_at DESC',
        [username]
      ) as any;

      return rows.map(row => ({
        ...row,
        files_attached: row.files_attached ? JSON.parse(row.files_attached) : []
      }));
    } catch (error) {
      console.error('Error fetching user submissions:', error);
      return [];
    }
  }

  async getAllSubmissions(): Promise<Submission[]> {
    if (!this.connection) return [];

    try {
      const [rows] = await this.connection.execute(
        'SELECT * FROM submissions ORDER BY submitted_at DESC'
      ) as any;

      return rows.map(row => ({
        ...row,
        files_attached: row.files_attached ? JSON.parse(row.files_attached) : []
      }));
    } catch (error) {
      console.error('Error fetching all submissions:', error);
      return [];
    }
  }

  // Review Management
  async createReview(data: {
    submission_id: string;
    username: string;
    challenge_id: string;
    reviewer_name: string;
    status: 'Approved' | 'Rejected' | 'Needs Rework';
    review_comment?: string;
    points_awarded: number;
    is_on_time: boolean;
    submission_date: string;
    commitment_date: string;
  }): Promise<SubmissionReview | null> {
    if (!this.connection) return null;

    try {
      const [result] = await this.connection.execute(
        `INSERT INTO submission_reviews (
          submission_id, username, challenge_id, reviewer_name, status,
          review_comment, points_awarded, is_on_time, submission_date, commitment_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.submission_id, data.username, data.challenge_id, data.reviewer_name, data.status,
          data.review_comment, data.points_awarded, data.is_on_time, data.submission_date, data.commitment_date
        ]
      ) as any;

      // Fetch and return the created review
      const [rows] = await this.connection.execute(
        'SELECT * FROM submission_reviews WHERE id = ?',
        [result.insertId]
      ) as any;

      return rows[0] || null;
    } catch (error) {
      console.error('Error creating review:', error);
      return null;
    }
  }

  async getAllReviews(): Promise<SubmissionReview[]> {
    if (!this.connection) return [];

    try {
      const [rows] = await this.connection.execute(
        'SELECT * FROM submission_reviews ORDER BY reviewed_at DESC'
      ) as any;

      return rows;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      return [];
    }
  }

  async getUserReviews(username: string): Promise<SubmissionReview[]> {
    if (!this.connection) return [];

    try {
      const [rows] = await this.connection.execute(
        'SELECT * FROM submission_reviews WHERE username = ? ORDER BY reviewed_at DESC',
        [username]
      ) as any;

      return rows;
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      return [];
    }
  }

  // Dashboard and Analytics
  async getDashboardStats(username?: string): Promise<{
    totalChallenges: number;
    acceptedChallenges: number;
    completedChallenges: number;
    totalSubmissions: number;
    totalUsers: number;
    totalPoints: number;
  }> {
    if (!this.connection) return {
      totalChallenges: 0,
      acceptedChallenges: 0,
      completedChallenges: 0,
      totalSubmissions: 0,
      totalUsers: 0,
      totalPoints: 0
    };

    try {
      let stats: any = {};

      if (username) {
        // User-specific stats
        const [userStats] = await this.connection.execute(`
          SELECT 
            COUNT(DISTINCT c.id) as totalChallenges,
            COUNT(DISTINCT ca.challenge_id) as acceptedChallenges,
            COUNT(DISTINCT CASE WHEN ca.status = 'Approved' THEN ca.challenge_id END) as completedChallenges,
            COUNT(DISTINCT s.id) as totalSubmissions,
            COALESCE(u.total_points, 0) as totalPoints
          FROM challenges c
          LEFT JOIN challenge_acceptances ca ON c.id = ca.challenge_id AND ca.username = ?
          LEFT JOIN submissions s ON ca.id = s.acceptance_id
          LEFT JOIN users u ON u.username = ?
        `, [username, username]) as any;

        stats = userStats[0];
        stats.totalUsers = 1;
      } else {
        // Global stats
        const [globalStats] = await this.connection.execute(`
          SELECT 
            COUNT(DISTINCT c.id) as totalChallenges,
            COUNT(DISTINCT ca.challenge_id) as acceptedChallenges,
            COUNT(DISTINCT CASE WHEN ca.status = 'Approved' THEN ca.challenge_id END) as completedChallenges,
            COUNT(DISTINCT s.id) as totalSubmissions,
            COUNT(DISTINCT u.id) as totalUsers,
            COALESCE(SUM(u.total_points), 0) as totalPoints
          FROM challenges c
          LEFT JOIN challenge_acceptances ca ON c.id = ca.challenge_id
          LEFT JOIN submissions s ON ca.id = s.acceptance_id
          LEFT JOIN users u ON u.id = ca.user_id
        `) as any;

        stats = globalStats[0];
      }

      return {
        totalChallenges: stats.totalChallenges || 0,
        acceptedChallenges: stats.acceptedChallenges || 0,
        completedChallenges: stats.completedChallenges || 0,
        totalSubmissions: stats.totalSubmissions || 0,
        totalUsers: stats.totalUsers || 0,
        totalPoints: stats.totalPoints || 0
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      return {
        totalChallenges: 0,
        acceptedChallenges: 0,
        completedChallenges: 0,
        totalSubmissions: 0,
        totalUsers: 0,
        totalPoints: 0
      };
    }
  }

  async getLeaderboard(): Promise<UserData[]> {
    if (!this.connection) return [];

    try {
      const [rows] = await this.connection.execute(`
        SELECT u.*, 
               COUNT(DISTINCT ca.challenge_id) as challenges_accepted,
               COUNT(DISTINCT CASE WHEN ca.status = 'Approved' THEN ca.challenge_id END) as challenges_completed
        FROM users u
        LEFT JOIN challenge_acceptances ca ON u.id = ca.user_id
        GROUP BY u.id
        ORDER BY u.total_points DESC, challenges_completed DESC
      `) as any;

      return rows;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      return [];
    }
  }

  // Utility methods
  async getUserActiveChallenge(username: string): Promise<ChallengeAcceptance | null> {
    if (!this.connection) return null;

    try {
      const [rows] = await this.connection.execute(
        `SELECT * FROM challenge_acceptances 
         WHERE username = ? AND status IN ('Accepted', 'Submitted', 'Pending Review', 'Under Review')
         ORDER BY accepted_at DESC LIMIT 1`,
        [username]
      ) as any;

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error fetching active challenge:', error);
      return null;
    }
  }

  async canUserAcceptNewChallenge(username: string): Promise<boolean> {
    const activeChallenge = await this.getUserActiveChallenge(username);
    return activeChallenge === null;
  }

  // Close connection
  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
      this.isConnected = false;
    }
  }
}

// Export singleton instance
export const mysqlService = new MySQLService();
export default MySQLService;
