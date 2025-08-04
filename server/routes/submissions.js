const express = require('express');
const { Submission, SubmissionReview, User, Challenge, ChallengeAcceptance } = require('../config/database');

const router = express.Router();

// GET /api/submissions - Get all submissions
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    
    const whereClause = userId ? { username: userId } : {};
    
    const submissions = await Submission.findAll({
      where: whereClause,
      order: [['submitted_at', 'DESC']],
      include: [
        {
          model: SubmissionReview,
          required: false,
        },
      ],
    });

    const formattedSubmissions = submissions.map(sub => ({
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
    }));

    res.json({
      success: true,
      data: formattedSubmissions,
    });
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch submissions',
    });
  }
});

// GET /api/submissions/:id - Get specific submission
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const submission = await Submission.findByPk(id, {
      include: [
        {
          model: SubmissionReview,
          required: false,
        },
      ],
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Submission not found',
      });
    }

    const formattedSubmission = {
      id: submission.id,
      username: submission.username,
      challengeId: submission.challenge_id,
      submitted: submission.is_submitted,
      submittedAt: submission.submitted_at,
      fileUrl: `/mock/submissions/${submission.username}-${submission.challenge_id}.zip`,
      fileName: `${submission.challenge_id}-solution.zip`,
      fileSize: 1024000,
      shortDescription: submission.short_description,
      technologies: submission.technologies,
      sourceCodeUrl: submission.github_url,
      hostedAppUrl: submission.demo_url,
      status: submission.status,
    };

    res.json({
      success: true,
      data: formattedSubmission,
    });
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch submission',
    });
  }
});

// POST /api/submissions - Submit a solution
router.post('/', async (req, res) => {
  try {
    const submissionData = req.body;
    const username = req.headers['x-user-id'];

    if (!username) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User authentication required',
      });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Check if user has already submitted for this challenge
    const existingSubmission = await Submission.findOne({
      where: {
        username,
        challenge_id: submissionData.challengeId,
      },
    });

    if (existingSubmission) {
      return res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: 'You have already submitted a solution for this challenge',
      });
    }

    // Get acceptance record
    const acceptance = await ChallengeAcceptance.findOne({
      where: {
        username,
        challenge_id: submissionData.challengeId,
      },
    });

    // Create submission
    const newSubmission = await Submission.create({
      user_id: user.id,
      username: user.username,
      challenge_id: submissionData.challengeId,
      acceptance_id: acceptance?.id,
      solution_description: submissionData.shortDescription,
      short_description: submissionData.shortDescription,
      github_url: submissionData.sourceCodeUrl,
      demo_url: submissionData.hostedAppUrl,
      technologies: submissionData.technologies,
      files_attached: [],
      status: 'Submitted',
    });

    // Update acceptance status
    if (acceptance) {
      await acceptance.update({ status: 'Submitted' });
    }

    // Create initial review record
    await SubmissionReview.create({
      submission_id: newSubmission.id,
      username: user.username,
      challenge_id: submissionData.challengeId,
      reviewer_name: 'System',
      status: 'Pending Review',
      submission_date: newSubmission.submitted_at,
      commitment_date: acceptance?.committed_date || newSubmission.submitted_at,
      is_on_time: true,
    });

    const formattedSubmission = {
      id: newSubmission.id,
      username: newSubmission.username,
      challengeId: newSubmission.challenge_id,
      submitted: newSubmission.is_submitted,
      submittedAt: newSubmission.submitted_at,
      fileUrl: `/mock/submissions/${newSubmission.username}-${newSubmission.challenge_id}.zip`,
      fileName: `${newSubmission.challenge_id}-solution.zip`,
      fileSize: 1024000,
      shortDescription: newSubmission.short_description,
      technologies: newSubmission.technologies,
      sourceCodeUrl: newSubmission.github_url,
      hostedAppUrl: newSubmission.demo_url,
      status: newSubmission.status,
    };

    res.status(201).json({
      success: true,
      submission: formattedSubmission,
      message: 'Solution submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting solution:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to submit solution',
    });
  }
});

// GET /api/submissions/reviews - Get all reviews
router.get('/reviews', async (req, res) => {
  try {
    const { status } = req.query;
    
    const whereClause = status ? { status } : {};
    
    const reviews = await SubmissionReview.findAll({
      where: whereClause,
      order: [['reviewed_at', 'DESC']],
    });

    const formattedReviews = reviews.map(review => ({
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
    }));

    res.json({
      success: true,
      data: formattedReviews,
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch reviews',
    });
  }
});

// PATCH /api/submissions/:id/review - Review a submission
router.patch('/:id/review', async (req, res) => {
  try {
    const { id } = req.params;
    const { action, comment } = req.body;
    const reviewerUsername = req.headers['x-user-id'];

    if (!reviewerUsername) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User authentication required',
      });
    }

    const reviewer = await User.findOne({ where: { username: reviewerUsername } });
    if (!reviewer || reviewer.role !== 'Management') {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: 'Only managers can review submissions',
      });
    }

    const submission = await Submission.findByPk(id);
    if (!submission) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Submission not found',
      });
    }

    // Determine new status and points
    let newStatus;
    let pointsAwarded = 0;

    switch (action) {
      case 'approve':
        newStatus = 'Approved';
        pointsAwarded = 500; // Base points
        break;
      case 'reject':
        newStatus = 'Rejected';
        pointsAwarded = 0;
        break;
      case 'rework':
        newStatus = 'Needs Rework';
        pointsAwarded = 400; // Reduced points
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'BAD_REQUEST',
          message: 'Invalid action',
        });
    }

    // Update submission status
    await submission.update({ status: newStatus });

    // Update or create review
    const [review] = await SubmissionReview.findOrCreate({
      where: { submission_id: id },
      defaults: {
        submission_id: id,
        username: submission.username,
        challenge_id: submission.challenge_id,
        reviewer_id: reviewer.id,
        reviewer_name: reviewer.display_name,
        status: newStatus,
        review_comment: comment,
        points_awarded: pointsAwarded,
        submission_date: submission.submitted_at,
        commitment_date: submission.submitted_at,
        is_on_time: true,
      },
    });

    if (review.id) {
      await review.update({
        status: newStatus,
        reviewer_id: reviewer.id,
        reviewer_name: reviewer.display_name,
        review_comment: comment,
        points_awarded: pointsAwarded,
        reviewed_at: new Date(),
      });
    }

    // Update acceptance status
    await ChallengeAcceptance.update(
      { status: newStatus },
      {
        where: {
          username: submission.username,
          challenge_id: submission.challenge_id,
        },
      }
    );

    // Update user points if approved
    if (newStatus === 'Approved') {
      const user = await User.findOne({ where: { username: submission.username } });
      if (user) {
        await user.update({
          total_points: user.total_points + pointsAwarded,
        });
      }
    }

    const formattedReview = {
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
    };

    res.json({
      success: true,
      review: formattedReview,
      message: `Submission ${action}ed successfully`,
    });
  } catch (error) {
    console.error('Error reviewing submission:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to review submission',
    });
  }
});

// GET /api/submissions/user/:username - Get user's submissions
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const submissions = await Submission.findAll({
      where: { username },
      order: [['submitted_at', 'DESC']],
    });

    const formattedSubmissions = submissions.map(sub => ({
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
    }));

    res.json({
      success: true,
      data: formattedSubmissions,
    });
  } catch (error) {
    console.error('Error fetching user submissions:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch submissions',
    });
  }
});

// GET /api/submissions/challenge/:challengeId - Get challenge submissions
router.get('/challenge/:challengeId', async (req, res) => {
  try {
    const { challengeId } = req.params;
    
    const submissions = await Submission.findAll({
      where: { challenge_id: challengeId },
      order: [['submitted_at', 'DESC']],
    });

    const formattedSubmissions = submissions.map(sub => ({
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
    }));

    res.json({
      success: true,
      data: formattedSubmissions,
    });
  } catch (error) {
    console.error('Error fetching challenge submissions:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch submissions',
    });
  }
});

module.exports = router;