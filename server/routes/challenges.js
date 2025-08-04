const express = require('express');
const { Challenge, ChallengeAcceptance, User, Submission } = require('../config/database');

const router = express.Router();

// GET /api/challenges - Get all challenges
router.get('/', async (req, res) => {
  try {
    const challenges = await Challenge.findAll({
      where: { status: 'Open' },
      order: [['created_at', 'DESC']],
    });

    res.json({
      success: true,
      data: challenges,
    });
  } catch (error) {
    console.error('Error fetching challenges:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch challenges',
    });
  }
});

// GET /api/challenges/:id - Get specific challenge
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const challenge = await Challenge.findByPk(id);
    
    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Challenge not found',
      });
    }

    res.json({
      success: true,
      data: challenge,
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch challenge',
    });
  }
});

// GET /api/challenges/:id/acceptance-status - Check acceptance status
router.get('/:id/acceptance-status', async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.headers['x-user-id'];

    if (!username) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User authentication required',
      });
    }

    // Get user
    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Check if user has accepted this specific challenge
    const userAcceptance = await ChallengeAcceptance.findOne({
      where: {
        user_id: user.id,
        challenge_id: id,
      },
    });

    // Check if user has any active challenge
    const activeAcceptance = await ChallengeAcceptance.findOne({
      where: {
        user_id: user.id,
        status: ['Accepted', 'Submitted', 'Pending Review', 'Under Review'],
      },
    });

    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    const isCurrentChallengeAccepted = userAcceptance && activeStatuses.includes(userAcceptance.status);

    res.json({
      success: true,
      data: {
        accepted: !!isCurrentChallengeAccepted,
        acceptedChallengeId: activeAcceptance?.challenge_id || null,
        userAcceptance: userAcceptance || null,
        isCurrentChallengeAccepted: !!isCurrentChallengeAccepted,
        hasActiveChallenge: !!activeAcceptance,
        activeChallengeId: activeAcceptance?.challenge_id || null,
      },
    });
  } catch (error) {
    console.error('Error checking acceptance status:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to check acceptance status',
    });
  }
});

// POST /api/challenges - Create new challenge
router.post('/', async (req, res) => {
  try {
    const challengeData = req.body;
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

    const newChallenge = await Challenge.create({
      id: `ch${Date.now()}`,
      title: challengeData.title,
      description: challengeData.description,
      full_description: challengeData.fullDescription,
      expected_outcome: challengeData.expectedOutcome,
      tags: challengeData.tags,
      status: user.role === 'Management' ? 'Open' : 'Pending Approval',
      points: challengeData.points || 500,
      penalty_points: challengeData.penaltyPoints || 50,
      deadline: challengeData.deadline,
      created_by_id: user.id,
      created_by_name: user.display_name,
      attachments: challengeData.attachments || [],
    });

    res.status(201).json({
      success: true,
      data: newChallenge,
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create challenge',
    });
  }
});

// POST /api/challenges/accept - Accept a challenge
router.post('/accept', async (req, res) => {
  try {
    const { challengeId, committedDate } = req.body;
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

    // Check if user already has an active challenge
    const activeAcceptance = await ChallengeAcceptance.findOne({
      where: {
        user_id: user.id,
        status: ['Accepted', 'Submitted', 'Pending Review', 'Under Review'],
      },
    });

    if (activeAcceptance) {
      return res.status(409).json({
        success: false,
        error: 'CONFLICT',
        message: 'You already have an active challenge. Complete it first.',
      });
    }

    // Check if challenge exists and is open
    const challenge = await Challenge.findOne({
      where: { id: challengeId, status: 'Open' },
    });

    if (!challenge) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Challenge not found or not available',
      });
    }

    // Create new acceptance
    const newAcceptance = await ChallengeAcceptance.create({
      user_id: user.id,
      username: user.username,
      challenge_id: challengeId,
      status: 'Accepted',
      committed_date: committedDate,
    });

    res.status(201).json({
      success: true,
      data: {
        id: newAcceptance.id,
        username: newAcceptance.username,
        challengeId: newAcceptance.challenge_id,
        status: newAcceptance.status,
        committedDate: newAcceptance.committed_date,
        acceptedAt: newAcceptance.accepted_at,
      },
    });
  } catch (error) {
    console.error('Error accepting challenge:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to accept challenge',
    });
  }
});

// GET /api/challenges/acceptances/:username - Get user's acceptances
router.get('/acceptances/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    const acceptances = await ChallengeAcceptance.findAll({
      where: { username },
      order: [['accepted_at', 'DESC']],
    });

    const formattedAcceptances = acceptances.map(acc => ({
      id: acc.id,
      username: acc.username,
      challengeId: acc.challenge_id,
      status: acc.status,
      committedDate: acc.committed_date,
      acceptedAt: acc.accepted_at,
    }));

    res.json({
      success: true,
      data: formattedAcceptances,
    });
  } catch (error) {
    console.error('Error fetching user acceptances:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch acceptances',
    });
  }
});

// GET /api/challenges/:id/acceptances - Get challenge acceptances
router.get('/:id/acceptances', async (req, res) => {
  try {
    const { id } = req.params;
    
    const acceptances = await ChallengeAcceptance.findAll({
      where: { challenge_id: id },
      order: [['accepted_at', 'DESC']],
    });

    const formattedAcceptances = acceptances.map(acc => ({
      id: acc.id,
      username: acc.username,
      challengeId: acc.challenge_id,
      status: acc.status,
      committedDate: acc.committed_date,
      acceptedAt: acc.accepted_at,
    }));

    res.json({
      success: true,
      data: formattedAcceptances,
    });
  } catch (error) {
    console.error('Error fetching challenge acceptances:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to fetch acceptances',
    });
  }
});

// PATCH /api/challenges/acceptances/:id - Update acceptance status
router.patch('/acceptances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const username = req.headers['x-user-id'];

    if (!username) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User authentication required',
      });
    }

    const acceptance = await ChallengeAcceptance.findOne({
      where: { id, username },
    });

    if (!acceptance) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Acceptance not found',
      });
    }

    await acceptance.update({ status });

    res.json({
      success: true,
      data: {
        id: acceptance.id,
        username: acceptance.username,
        challengeId: acceptance.challenge_id,
        status: acceptance.status,
        committedDate: acceptance.committed_date,
        acceptedAt: acceptance.accepted_at,
      },
    });
  } catch (error) {
    console.error('Error updating acceptance:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to update acceptance',
    });
  }
});

// DELETE /api/challenges/accept/:id - Withdraw from challenge
router.delete('/accept/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.headers['x-user-id'];

    if (!username) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User authentication required',
      });
    }

    const acceptance = await ChallengeAcceptance.findOne({
      where: { id, username },
    });

    if (!acceptance) {
      return res.status(404).json({
        success: false,
        error: 'NOT_FOUND',
        message: 'Acceptance not found',
      });
    }

    await acceptance.update({ status: 'Withdrawn' });

    res.json({
      success: true,
      data: {
        id: acceptance.id,
        username: acceptance.username,
        challengeId: acceptance.challenge_id,
        status: acceptance.status,
        committedDate: acceptance.committed_date,
        acceptedAt: acceptance.accepted_at,
      },
    });
  } catch (error) {
    console.error('Error withdrawing challenge:', error);
    res.status(500).json({
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to withdraw challenge',
    });
  }
});

module.exports = router;