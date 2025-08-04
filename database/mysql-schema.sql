-- Challenge Hub MySQL Database Schema
-- Fixes data consistency issues and provides proper relational storage

-- Enable foreign key constraints
SET FOREIGN_KEY_CHECKS = 1;

-- Users table - stores employee and manager data
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    role ENUM('Employee', 'Management', 'Admin') NOT NULL DEFAULT 'Employee',
    department VARCHAR(100) DEFAULT 'General',
    total_points INT DEFAULT 0,
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_total_points (total_points)
);

-- Challenges table - stores all challenge definitions
CREATE TABLE IF NOT EXISTS challenges (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    full_description TEXT,
    expected_outcome TEXT,
    tags JSON,
    status ENUM('Open', 'Closed', 'Draft') NOT NULL DEFAULT 'Open',
    points INT DEFAULT 100,
    penalty_points INT DEFAULT 0,
    deadline DATETIME,
    created_by_id VARCHAR(36),
    created_by_name VARCHAR(255) NOT NULL,
    attachments JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_status (status),
    INDEX idx_created_by (created_by_name),
    INDEX idx_points (points),
    INDEX idx_deadline (deadline),
    
    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Challenge acceptances - tracks who accepted which challenges
CREATE TABLE IF NOT EXISTS challenge_acceptances (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    username VARCHAR(255) NOT NULL,
    challenge_id VARCHAR(50) NOT NULL,
    status ENUM(
        'Accepted', 
        'Submitted', 
        'Pending Review', 
        'Under Review', 
        'Approved', 
        'Rejected', 
        'Needs Rework', 
        'Withdrawn',
        'Completed'
    ) NOT NULL DEFAULT 'Accepted',
    committed_date DATETIME NOT NULL,
    accepted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_user_challenge (user_id, challenge_id),
    INDEX idx_username (username),
    INDEX idx_challenge_id (challenge_id),
    INDEX idx_status (status),
    INDEX idx_committed_date (committed_date),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

-- Submissions table - stores challenge solutions
CREATE TABLE IF NOT EXISTS submissions (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    username VARCHAR(255) NOT NULL,
    challenge_id VARCHAR(50) NOT NULL,
    acceptance_id VARCHAR(36),
    solution_description TEXT NOT NULL,
    short_description VARCHAR(500),
    github_url TEXT,
    demo_url TEXT,
    technologies VARCHAR(500),
    files_attached JSON,
    status ENUM('Submitted', 'Under Review', 'Approved', 'Rejected', 'Needs Rework') NOT NULL DEFAULT 'Submitted',
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_submitted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_challenge_id (challenge_id),
    INDEX idx_status (status),
    INDEX idx_submitted_at (submitted_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (acceptance_id) REFERENCES challenge_acceptances(id) ON DELETE SET NULL
);

-- Submission reviews - stores manager reviews and scoring
CREATE TABLE IF NOT EXISTS submission_reviews (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    submission_id VARCHAR(36) NOT NULL,
    username VARCHAR(255) NOT NULL,
    challenge_id VARCHAR(50) NOT NULL,
    reviewer_id VARCHAR(36),
    reviewer_name VARCHAR(255) NOT NULL,
    status ENUM('Pending Review', 'Approved', 'Rejected', 'Needs Rework') NOT NULL DEFAULT 'Pending Review',
    review_comment TEXT,
    points_awarded INT DEFAULT 0,
    is_on_time BOOLEAN DEFAULT TRUE,
    submission_date DATETIME NOT NULL,
    commitment_date DATETIME NOT NULL,
    reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY unique_submission_review (submission_id),
    INDEX idx_username (username),
    INDEX idx_challenge_id (challenge_id),
    INDEX idx_reviewer (reviewer_name),
    INDEX idx_status (status),
    INDEX idx_points_awarded (points_awarded),
    
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (reviewer_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE
);

-- User points history - tracks all point changes for transparency
CREATE TABLE IF NOT EXISTS user_points_history (
    id VARCHAR(36) PRIMARY KEY DEFAULT (UUID()),
    user_id VARCHAR(36) NOT NULL,
    username VARCHAR(255) NOT NULL,
    challenge_id VARCHAR(50),
    action_type ENUM('earned', 'penalty', 'bonus', 'adjustment') NOT NULL,
    points_change INT NOT NULL,
    reason VARCHAR(500),
    review_id VARCHAR(36),
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_username (username),
    INDEX idx_challenge_id (challenge_id),
    INDEX idx_action_type (action_type),
    INDEX idx_created_at (created_at),
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE SET NULL,
    FOREIGN KEY (review_id) REFERENCES submission_reviews(id) ON DELETE SET NULL
);

-- Views for easier data querying

-- Comprehensive user challenge status view
CREATE OR REPLACE VIEW user_challenge_status AS
SELECT 
    u.username,
    u.display_name,
    c.id as challenge_id,
    c.title as challenge_title,
    ca.status as acceptance_status,
    ca.accepted_at,
    ca.committed_date,
    s.status as submission_status,
    s.submitted_at,
    sr.status as review_status,
    sr.points_awarded,
    sr.reviewed_at
FROM users u
LEFT JOIN challenge_acceptances ca ON u.id = ca.user_id
LEFT JOIN challenges c ON ca.challenge_id = c.id
LEFT JOIN submissions s ON ca.id = s.acceptance_id
LEFT JOIN submission_reviews sr ON s.id = sr.submission_id;

-- Active user challenges view
CREATE OR REPLACE VIEW active_user_challenges AS
SELECT 
    username,
    challenge_id,
    status,
    accepted_at,
    committed_date
FROM challenge_acceptances 
WHERE status IN ('Accepted', 'Submitted', 'Pending Review', 'Under Review')
ORDER BY accepted_at DESC;

-- User leaderboard view
CREATE OR REPLACE VIEW user_leaderboard AS
SELECT 
    u.username,
    u.display_name,
    u.role,
    u.department,
    u.total_points,
    COUNT(DISTINCT ca.challenge_id) as challenges_accepted,
    COUNT(DISTINCT CASE WHEN ca.status = 'Approved' THEN ca.challenge_id END) as challenges_completed,
    COUNT(DISTINCT s.id) as submissions_made,
    AVG(sr.points_awarded) as avg_points_per_challenge
FROM users u
LEFT JOIN challenge_acceptances ca ON u.id = ca.user_id
LEFT JOIN submissions s ON ca.id = s.acceptance_id
LEFT JOIN submission_reviews sr ON s.id = sr.submission_id
GROUP BY u.id
ORDER BY u.total_points DESC;

-- Triggers for maintaining data consistency

-- Update user total points when review is completed
DELIMITER //
CREATE TRIGGER update_user_points_after_review
    AFTER INSERT ON submission_reviews
    FOR EACH ROW
BEGIN
    DECLARE user_uuid VARCHAR(36);
    
    -- Get user ID from username
    SELECT id INTO user_uuid FROM users WHERE username = NEW.username LIMIT 1;
    
    IF user_uuid IS NOT NULL THEN
        -- Update user's total points
        UPDATE users 
        SET total_points = total_points + NEW.points_awarded 
        WHERE id = user_uuid;
        
        -- Record in points history
        INSERT INTO user_points_history (
            user_id, username, challenge_id, action_type, 
            points_change, reason, review_id, created_by
        ) VALUES (
            user_uuid, NEW.username, NEW.challenge_id, 'earned',
            NEW.points_awarded, CONCAT('Challenge completion: ', NEW.challenge_id),
            NEW.id, NEW.reviewer_name
        );
        
        -- Update acceptance status to match review
        UPDATE challenge_acceptances 
        SET status = NEW.status,
            updated_at = CURRENT_TIMESTAMP
        WHERE username = NEW.username 
        AND challenge_id = NEW.challenge_id;
    END IF;
END //

-- Update acceptance status when submission is created
CREATE TRIGGER update_acceptance_on_submission
    AFTER INSERT ON submissions
    FOR EACH ROW
BEGIN
    UPDATE challenge_acceptances 
    SET status = 'Submitted',
        updated_at = CURRENT_TIMESTAMP
    WHERE username = NEW.username 
    AND challenge_id = NEW.challenge_id;
END //

-- Prevent multiple active challenges per user
CREATE TRIGGER prevent_multiple_active_challenges
    BEFORE INSERT ON challenge_acceptances
    FOR EACH ROW
BEGIN
    DECLARE active_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO active_count
    FROM challenge_acceptances 
    WHERE username = NEW.username 
    AND status IN ('Accepted', 'Submitted', 'Pending Review', 'Under Review');
    
    IF active_count > 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'User already has an active challenge. Complete current challenge before accepting a new one.';
    END IF;
END //

DELIMITER ;

-- Insert sample data for testing (if not exists)
INSERT IGNORE INTO users (username, email, display_name, role, department) VALUES
('lisa.thompson', 'lisa.thompson@company.com', 'Lisa Thompson', 'Employee', 'Engineering'),
('john.manager', 'john.manager@company.com', 'John Manager', 'Management', 'Engineering'),
('admin.user', 'admin.user@company.com', 'Admin User', 'Admin', 'IT');

-- Sample challenges
INSERT IGNORE INTO challenges (id, title, description, points, created_by_name) VALUES
('ch001', 'Database Optimization', 'Optimize database queries for better performance', 150, 'John Manager'),
('ch002', 'API Security Enhancement', 'Implement better security measures for our APIs', 200, 'John Manager'),
('ch003', 'Frontend Performance', 'Improve frontend loading times and user experience', 175, 'John Manager');

-- Indexes for performance optimization
CREATE INDEX idx_user_challenge_lookup ON challenge_acceptances (username, challenge_id, status);
CREATE INDEX idx_submission_lookup ON submissions (username, challenge_id, status);
CREATE INDEX idx_review_lookup ON submission_reviews (username, challenge_id, status);
CREATE INDEX idx_points_history_lookup ON user_points_history (username, challenge_id, created_at);

-- Ensure proper charset and collation
ALTER DATABASE challengehub CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
