const express = require('express');
const { User, ChallengeAcceptance, Submission, SubmissionReview } = require('../config/database');

const router = express.Router();

// GET /api/users/:username - Get user data
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const user = await User.findOne({
      where: { username },
      include: [
        {
          model: ChallengeAcceptance,
          required: false,
        },
        {
          model: Submission,
          required: false,
        },
      ],
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Get user's reviews
    const reviews = await SubmissionReview.findAll({
      where: { username },
      order: [['reviewed_at', 'DESC']],
    });

    const userData = {
      user: {
        username: user.username,
        displayName: user.display_name,
        role: user.role,
        department: user.department,
        totalPoints: user.total_points,
      },
      acceptances: user.ChallengeAcceptances?.map(acc => ({
        id: acc.id,
        username: acc.username,
        challengeId: acc.challenge_id,
        status: acc.status,
        committedDate: acc.committed_date,
        acceptedAt: acc.accepted_at,
      })) || [],
      submissions: user.Submissions?.map(sub => ({
        id: sub.id,
        username: sub.username,
        challengeId: sub.challenge_id,
        submitted: sub.is_submitted,
        submittedAt: sub.submitted_at,
        fileUrl: `/mock/submissions/${sub.username}-${sub.challenge_id}.zip`,
        fileName: `${sub.challenge_id}-solution.zip`,
        fileSize: 1024000,
        shortDescription: sub.short_description,
        technologies: sub.technologies,
        sourceCodeUrl: sub.github_url,
        hostedAppUrl: sub.demo_url,
        status: sub.status,
      })) || [],
      reviews: reviews.map(review => ({
        submissionId: review.submission_id,
        challengeId: review.challenge_id,
        username: review.username,
        status: review.status,
        reviewedBy: review.reviewer_name,
        reviewedAt: review.reviewed_at,
        reviewComment: review.review_comment,
        pointsAwarded: review.points_awarded,
        submissionDate: review.submission_date,
        commitmentDate: review.commitment_date,
        isOnTime: review.is_on_time,
      })),
    };

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch user data',
    });
  }
});

// GET /api/users - Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.findAll({
      order: [['total_points', 'DESC']],
    });

    const formattedUsers = users.map(user => ({
      username: user.username,
      displayName: user.display_name,
      role: user.role,
      department: user.department,
      totalPoints: user.total_points,
    }));

    res.json({
      success: true,
      data: formattedUsers,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch users',
    });
  }
});

// PATCH /api/users/:username/points - Update user points
router.patch('/:username/points', async (req, res) => {
  try {
    const { username } = req.params;
    const { pointsChange, reason } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    await user.update({
      total_points: user.total_points + pointsChange,
    });

    res.json({
      success: true,
      data: {
        username: user.username,
        totalPoints: user.total_points,
      },
    });
  } catch (error) {
    console.error('Error updating user points:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update points',
    });
  }
});

module.exports = router;