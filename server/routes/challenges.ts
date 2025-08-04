import { RequestHandler } from "express";
import {
  Challenge,
  ChallengeAcceptance,
  AcceptChallengeRequest,
  AcceptChallengeResponse,
  ErrorResponse
} from "@shared/api";
import { supabase, ensureUserExists, getUserIdByUsername, isSupabaseAvailable } from '../config/supabase';

// In-memory database (fallback when Supabase is not available)
let legacyChallenges: Challenge[] = [
  {
    id: 'ch001',
    title: 'React Dashboard Builder',
    description: 'Build a comprehensive admin dashboard using React, TypeScript, and Tailwind CSS with data visualization components.',
    fullDescription: 'Create a modern, responsive admin dashboard that showcases key business metrics through interactive charts and graphs. The dashboard should include user management, analytics overview, and real-time data updates.',
    expectedOutcome: 'A fully functional admin dashboard with at least 5 different chart types, user authentication, and responsive design that works across all device sizes.',
    tags: ['React', 'TypeScript', 'Tailwind CSS', 'Chart.js'],
    status: 'Open',
    points: 1200,
    penaltyPoints: 100,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    createdBy: 'Sarah Wilson',
    createdAt: new Date().toISOString()
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
    createdAt: new Date().toISOString()
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
    createdAt: new Date().toISOString()
  }
];

// In-memory acceptances storage (fallback)
let acceptances: ChallengeAcceptance[] = [];

// GET /api/challenges - Get all challenges
export const getAllChallenges: RequestHandler = async (req, res) => {
  try {
    // Use Supabase if available, otherwise fall back to in-memory storage
    if (isSupabaseAvailable() && supabase) {
      const { data: challenges, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('status', 'Open')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching challenges:', error);
        console.log('⚠️ Falling back to in-memory storage');
      } else {
        return res.status(200).json({
          success: true,
          data: challenges || []
        });
      }
    }

    // Fallback to in-memory storage
    console.log('📝 Using in-memory storage for challenges');
    res.status(200).json({
      success: true,
      data: legacyChallenges.filter(c => c.status === 'Open')
    });
  } catch (error) {
    console.error('Unexpected error fetching challenges:', error);
    // Fallback to in-memory storage
    res.status(200).json({
      success: true,
      data: legacyChallenges.filter(c => c.status === 'Open')
    });
  }
};

// GET /api/challenges/:id - Get specific challenge
export const getChallengeById: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Use Supabase if available
    if (isSupabaseAvailable() && supabase) {
      try {
        const { data: challenge, error } = await supabase
          .from('challenges')
          .select('*')
          .eq('id', id)
          .single();

        if (!error && challenge) {
          return res.status(200).json({
            success: true,
            data: challenge
          });
        } else {
          console.log('⚠️ Challenge not found in Supabase, falling back to in-memory storage');
        }
      } catch (supabaseError) {
        console.error('Supabase error, falling back to in-memory storage:', supabaseError);
      }
    }

    // Fallback to in-memory storage
    console.log('📝 Using in-memory storage for challenge lookup');
    const challenge = legacyChallenges.find(c => c.id === id);

    if (!challenge) {
      const errorResponse: ErrorResponse = {
        success: false,
        error: 'NOT_FOUND',
        message: 'Challenge not found'
      };
      return res.status(404).json(errorResponse);
    }

    res.status(200).json({
      success: true,
      data: challenge
    });
  } catch (error) {
    console.error('Error fetching challenge:', error);
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    };
    return res.status(500).json(errorResponse);
  }
};

// GET /api/challenges/:id/acceptance-status - Check acceptance status for a challenge
export const getChallengeAcceptanceStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const username = req.headers['x-user-id'] as string;

    if (!username) {
      const error: ErrorResponse = {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User authentication required'
      };
      return res.status(401).json(error);
    }

    // Use Supabase if available
    if (isSupabaseAvailable() && supabase) {
      try {
        // Get user ID
        const userId = await getUserIdByUsername(username);
        if (!userId) {
          console.log('⚠️ User not found in Supabase, falling back to in-memory storage');
        } else {
          // Check if user has accepted this specific challenge
          const { data: userAcceptance, error: userAcceptanceError } = await supabase
            .from('challenge_acceptances')
            .select('*')
            .eq('user_id', userId)
            .eq('challenge_id', id)
            .single();

          if (userAcceptanceError && userAcceptanceError.code !== 'PGRST116') {
            console.error('Error fetching user acceptance:', userAcceptanceError);
          }

          // Check if user has any active challenge
          const { data: activeAcceptance, error: activeError } = await supabase
            .from('challenge_acceptances')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['Accepted', 'Submitted', 'Pending Review', 'Under Review'])
            .single();

          if (activeError && activeError.code !== 'PGRST116') {
            console.error('Error fetching active acceptance:', activeError);
          }

          const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
          const isCurrentChallengeAccepted = userAcceptance && activeStatuses.includes(userAcceptance.status);

          return res.status(200).json({
            success: true,
            data: {
              accepted: !!isCurrentChallengeAccepted,
              acceptedChallengeId: activeAcceptance?.challenge_id || null,
              userAcceptance: userAcceptance || null,
              isCurrentChallengeAccepted: !!isCurrentChallengeAccepted,
              hasActiveChallenge: !!activeAcceptance,
              activeChallengeId: activeAcceptance?.challenge_id || null
            }
          });
        }
      } catch (supabaseError) {
        console.error('Supabase error, falling back to in-memory storage:', supabaseError);
      }
    }

    // Fallback to in-memory storage
    console.log('📝 Using in-memory storage for acceptance status');

    // Check if user has accepted this specific challenge
    const userAcceptance = acceptances.find(
      acc => acc.username === username && acc.challengeId === id
    );

    // Check if user has any active challenge
    const activeAcceptance = acceptances.find(
      acc => acc.username === username &&
             ['Accepted', 'Submitted', 'Pending Review', 'Under Review'].includes(acc.status)
    );

    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    const isCurrentChallengeAccepted = userAcceptance && activeStatuses.includes(userAcceptance.status);

    res.status(200).json({
      success: true,
      data: {
        accepted: !!isCurrentChallengeAccepted,
        acceptedChallengeId: activeAcceptance?.challengeId || null,
        userAcceptance: userAcceptance || null,
        isCurrentChallengeAccepted: !!isCurrentChallengeAccepted,
        hasActiveChallenge: !!activeAcceptance,
        activeChallengeId: activeAcceptance?.challengeId || null
      }
    });
  } catch (error) {
    console.error('Error checking acceptance status:', error);
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    };
    return res.status(500).json(errorResponse);
  }
};

// POST /api/challenges - Create new challenge
export const createChallenge: RequestHandler = async (req, res) => {
  try {
    const challengeData = req.body;

    const newChallenge: Challenge = {
      id: `ch${Date.now()}`,
      ...challengeData,
      status: 'Open' as const,
      createdAt: new Date().toISOString()
    };

    // Try Supabase first if available
    if (isSupabaseAvailable() && supabase) {
      try {
        const { data: insertedChallenge, error } = await supabase
          .from('challenges')
          .insert({
            id: newChallenge.id,
            title: newChallenge.title,
            description: newChallenge.description,
            full_description: newChallenge.fullDescription,
            expected_outcome: newChallenge.expectedOutcome,
            tags: newChallenge.tags,
            status: newChallenge.status,
            points: newChallenge.points,
            penalty_points: newChallenge.penaltyPoints,
            deadline: newChallenge.deadline,
            created_by_name: newChallenge.createdBy,
            attachments: newChallenge.attachments
          })
          .select()
          .single();

        if (!error && insertedChallenge) {
          return res.status(201).json({
            success: true,
            data: newChallenge
          });
        } else {
          console.error('Error creating challenge in Supabase:', error);
          console.log('⚠️ Falling back to in-memory storage');
        }
      } catch (supabaseError) {
        console.error('Supabase error, falling back to in-memory storage:', supabaseError);
      }
    }

    // Fallback to in-memory storage
    console.log('📝 Using in-memory storage for challenge creation');
    legacyChallenges.push(newChallenge);

    res.status(201).json({
      success: true,
      data: newChallenge
    });
  } catch (error) {
    console.error('Error creating challenge:', error);
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Failed to create challenge'
    };
    return res.status(500).json(errorResponse);
  }
};

// POST /api/challenges/accept - Accept a challenge
export const acceptChallenge: RequestHandler = async (req, res) => {
  try {
    const { challengeId, committedDate }: AcceptChallengeRequest = req.body;
    const username = req.headers['x-user-id'] as string;

    if (!username) {
      const error: ErrorResponse = {
        success: false,
        error: 'UNAUTHORIZED',
        message: 'User authentication required'
      };
      return res.status(401).json(error);
    }

    // Try Supabase first if available
    if (isSupabaseAvailable() && supabase) {
      try {
        // Ensure user exists in database
        const userId = await ensureUserExists(username, username, 'Employee');
        if (userId) {
          // Check if user already has an active challenge
          const { data: activeAcceptance, error: activeError } = await supabase
            .from('challenge_acceptances')
            .select('*')
            .eq('user_id', userId)
            .in('status', ['Accepted', 'Submitted', 'Pending Review', 'Under Review'])
            .single();

          if (activeError && activeError.code !== 'PGRST116') {
            console.error('Error checking active challenges:', activeError);
          }

          if (activeAcceptance) {
            const error: ErrorResponse = {
              success: false,
              error: 'CONFLICT',
              message: 'You already have an active challenge. Complete it first.'
            };
            return res.status(409).json(error);
          }

          // Check if challenge exists and is open
          const { data: challenge, error: challengeError } = await supabase
            .from('challenges')
            .select('*')
            .eq('id', challengeId)
            .eq('status', 'Open')
            .single();

          if (challengeError || !challenge) {
            console.log('⚠️ Challenge not found in Supabase, falling back to in-memory storage');
          } else {
            // Create new acceptance
            const { data: newAcceptance, error: insertError } = await supabase
              .from('challenge_acceptances')
              .insert({
                user_id: userId,
                username,
                challenge_id: challengeId,
                status: 'Accepted',
                committed_date: committedDate
              })
              .select()
              .single();

            if (!insertError && newAcceptance) {
              // Convert to legacy format for compatibility
              const legacyAcceptance: ChallengeAcceptance = {
                id: newAcceptance.id,
                username: newAcceptance.username,
                challengeId: newAcceptance.challenge_id,
                status: newAcceptance.status as any,
                committedDate: newAcceptance.committed_date,
                acceptedAt: newAcceptance.accepted_at
              };

              const response: AcceptChallengeResponse = {
                success: true,
                data: legacyAcceptance
              };

              return res.status(201).json(response);
            } else {
              console.error('Error creating acceptance in Supabase:', insertError);
            }
          }
        }
      } catch (supabaseError) {
        console.error('Supabase error, falling back to in-memory storage:', supabaseError);
      }
    }

    // Fallback to in-memory storage
    console.log('📝 Using in-memory storage for challenge acceptance');

    // Check if user already has an active challenge
    const activeAcceptance = acceptances.find(
      acc => acc.username === username &&
             ['Accepted', 'Submitted'].includes(acc.status)
    );

    if (activeAcceptance) {
      const error: ErrorResponse = {
        success: false,
        error: 'CONFLICT',
        message: 'You already have an active challenge. Complete it first.'
      };
      return res.status(409).json(error);
    }

    // Check if challenge exists
    const challenge = legacyChallenges.find(c => c.id === challengeId);
    if (!challenge) {
      const error: ErrorResponse = {
        success: false,
        error: 'NOT_FOUND',
        message: 'Challenge not found'
      };
      return res.status(404).json(error);
    }

    // Create acceptance record
    const newAcceptance: ChallengeAcceptance = {
      id: `acc${Date.now()}`,
      username,
      challengeId,
      status: 'Accepted',
      committedDate,
      acceptedAt: new Date().toISOString()
    };

    acceptances.push(newAcceptance);

    const response: AcceptChallengeResponse = {
      success: true,
      data: newAcceptance
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Unexpected error accepting challenge:', error);
    const errorResponse: ErrorResponse = {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Internal server error'
    };
    return res.status(500).json(errorResponse);
  }
};

// GET /api/challenges/acceptances/:username - Get user's acceptances
export const getUserAcceptances: RequestHandler = (req, res) => {
  const { username } = req.params;
  const userAcceptances = acceptances.filter(acc => acc.username === username);
  
  res.status(200).json({
    success: true,
    data: userAcceptances
  });
};

// GET /api/challenges/:id/acceptances - Get challenge acceptances
export const getChallengeAcceptances: RequestHandler = (req, res) => {
  const { id } = req.params;
  const challengeAcceptances = acceptances.filter(acc => acc.challengeId === id);
  
  res.status(200).json({
    success: true,
    data: challengeAcceptances
  });
};

// DELETE /api/challenges/accept/:id - Withdraw from challenge
export const withdrawChallenge: RequestHandler = (req, res) => {
  const { id } = req.params;
  const username = req.headers['x-user-id'] as string;
  
  const acceptanceIndex = acceptances.findIndex(
    acc => acc.id === id && acc.username === username
  );
  
  if (acceptanceIndex === -1) {
    const error: ErrorResponse = {
      success: false,
      error: 'NOT_FOUND',
      message: 'Acceptance not found'
    };
    return res.status(404).json(error);
  }
  
  acceptances[acceptanceIndex].status = 'Withdrawn';
  
  res.status(200).json({
    success: true,
    data: acceptances[acceptanceIndex]
  });
};
