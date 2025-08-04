const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

// Initialize Sequelize with SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../../database.sqlite'),
  logging: console.log,
  define: {
    timestamps: true,
    underscored: true,
  },
});

// Define User model
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(50),
    unique: true,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING(255),
    unique: true,
    allowNull: false,
  },
  display_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM('Employee', 'Management', 'Admin'),
    defaultValue: 'Employee',
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING(50),
    defaultValue: 'General',
  },
  total_points: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  avatar_url: {
    type: DataTypes.TEXT,
  },
});

// Define Challenge model
const Challenge = sequelize.define('Challenge', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  full_description: {
    type: DataTypes.TEXT,
  },
  expected_outcome: {
    type: DataTypes.TEXT,
  },
  tags: {
    type: DataTypes.JSON,
  },
  status: {
    type: DataTypes.ENUM('Open', 'Closed', 'Draft', 'Pending Approval'),
    defaultValue: 'Open',
  },
  points: {
    type: DataTypes.INTEGER,
    defaultValue: 500,
  },
  penalty_points: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
  },
  deadline: {
    type: DataTypes.DATEONLY,
  },
  created_by_id: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id',
    },
  },
  created_by_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  attachments: {
    type: DataTypes.JSON,
  },
});

// Define ChallengeAcceptance model
const ChallengeAcceptance = sequelize.define('ChallengeAcceptance', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  challenge_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: Challenge,
      key: 'id',
    },
  },
  status: {
    type: DataTypes.ENUM(
      'Accepted', 'Submitted', 'Pending Review', 'Under Review', 
      'Approved', 'Rejected', 'Needs Rework', 'Withdrawn'
    ),
    defaultValue: 'Accepted',
  },
  committed_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  accepted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Define Submission model
const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: 'id',
    },
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  challenge_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
    references: {
      model: Challenge,
      key: 'id',
    },
  },
  acceptance_id: {
    type: DataTypes.UUID,
    references: {
      model: ChallengeAcceptance,
      key: 'id',
    },
  },
  solution_description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  short_description: {
    type: DataTypes.STRING(500),
  },
  github_url: {
    type: DataTypes.TEXT,
  },
  demo_url: {
    type: DataTypes.TEXT,
  },
  technologies: {
    type: DataTypes.STRING(500),
  },
  files_attached: {
    type: DataTypes.JSON,
  },
  status: {
    type: DataTypes.ENUM('Submitted', 'Under Review', 'Approved', 'Rejected', 'Needs Rework'),
    defaultValue: 'Submitted',
  },
  submitted_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  is_submitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
});

// Define SubmissionReview model
const SubmissionReview = sequelize.define('SubmissionReview', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  submission_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: Submission,
      key: 'id',
    },
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  challenge_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  reviewer_id: {
    type: DataTypes.UUID,
    references: {
      model: User,
      key: 'id',
    },
  },
  reviewer_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('Pending Review', 'Approved', 'Rejected', 'Needs Rework'),
    defaultValue: 'Pending Review',
  },
  review_comment: {
    type: DataTypes.TEXT,
  },
  points_awarded: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  is_on_time: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  submission_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  commitment_date: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  reviewed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

// Define associations
User.hasMany(ChallengeAcceptance, { foreignKey: 'user_id' });
User.hasMany(Submission, { foreignKey: 'user_id' });
User.hasMany(SubmissionReview, { foreignKey: 'reviewer_id' });

Challenge.hasMany(ChallengeAcceptance, { foreignKey: 'challenge_id' });
Challenge.hasMany(Submission, { foreignKey: 'challenge_id' });

ChallengeAcceptance.belongsTo(User, { foreignKey: 'user_id' });
ChallengeAcceptance.belongsTo(Challenge, { foreignKey: 'challenge_id' });
ChallengeAcceptance.hasMany(Submission, { foreignKey: 'acceptance_id' });

Submission.belongsTo(User, { foreignKey: 'user_id' });
Submission.belongsTo(Challenge, { foreignKey: 'challenge_id' });
Submission.belongsTo(ChallengeAcceptance, { foreignKey: 'acceptance_id' });
Submission.hasOne(SubmissionReview, { foreignKey: 'submission_id' });

SubmissionReview.belongsTo(Submission, { foreignKey: 'submission_id' });
SubmissionReview.belongsTo(User, { foreignKey: 'reviewer_id' });

// Initialize database
async function initializeDatabase() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully.');
    
    // Sync all models
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized.');
    
    // Create default users if they don't exist
    await createDefaultUsers();
    
    return true;
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    return false;
  }
}

// Create default users
async function createDefaultUsers() {
  const defaultUsers = [
    {
      username: 'employee01',
      email: 'john.doe@company.com',
      display_name: 'John Doe',
      role: 'Employee',
      department: 'Engineering',
    },
    {
      username: 'employee02',
      email: 'lisa.thompson@company.com',
      display_name: 'Lisa Thompson',
      role: 'Employee',
      department: 'Design',
    },
    {
      username: 'employee03',
      email: 'mike.chen@company.com',
      display_name: 'Mike Chen',
      role: 'Employee',
      department: 'Product',
    },
    {
      username: 'manager01',
      email: 'sarah.wilson@company.com',
      display_name: 'Sarah Wilson',
      role: 'Management',
      department: 'Management',
    },
  ];

  for (const userData of defaultUsers) {
    try {
      await User.findOrCreate({
        where: { username: userData.username },
        defaults: userData,
      });
    } catch (error) {
      console.error(`Error creating user ${userData.username}:`, error);
    }
  }
  
  console.log('✅ Default users created/verified.');
}

module.exports = {
  sequelize,
  User,
  Challenge,
  ChallengeAcceptance,
  Submission,
  SubmissionReview,
  initializeDatabase,
};