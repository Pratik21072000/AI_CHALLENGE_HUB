import React from 'react';
import { useChallengeAcceptance } from '../contexts/ChallengeAcceptanceContext';
import { useSubmission } from '../contexts/SubmissionContext';
import { useSubmissionReview } from '../contexts/SubmissionReviewContext';
import { useChallenges } from '../contexts/ChallengesContext';

export const useChallengeStatus = () => {
  const {
    acceptances,
    getUserActiveChallenge,
    hasUserAcceptedChallenge,
    canUserAcceptChallenge,
    isStatusActive
  } = useChallengeAcceptance();
  const { submissions, hasUserSubmitted, getUserSubmission } = useSubmission();
  const { reviews, getSubmissionReview } = useSubmissionReview();
  const { getChallenge, challenges } = useChallenges();

  // Define status hierarchy according to requirements
  const getEffectiveStatus = (username, challengeId) => {
    // Check if user has accepted this challenge
    const acceptance = acceptances.find(
      acc => acc.username === username && acc.challengeId === challengeId
    );

    // If no acceptance record, challenge is available
    if (!acceptance) {
      return {
        challengeId,
        username,
        effectiveStatus: 'Not Accepted',
        isActive: false,
        canAcceptNew: true,
        displayText: 'Accept',
        displayStatus: 'available'
      };
    }

    // If withdrawn, treat as non-active
    if (acceptance.status === 'Withdrawn') {
      return {
        challengeId,
        username,
        effectiveStatus: 'Withdrawn',
        isActive: false,
        canAcceptNew: true,
        displayText: 'Accept',
        displayStatus: 'available'
      };
    }

    // Check if user has submitted a solution
    const hasSubmitted = hasUserSubmitted(username, challengeId);
    const submission = getUserSubmission(username, challengeId);

    if (hasSubmitted && submission) {
      // Check if there's a review for this submission
      const reviewKey = `${username}-${challengeId}`;
      const review = getSubmissionReview(reviewKey);

      if (review) {
        // Review exists - use review status to determine final state
        switch (review.status) {
          case 'Approved':
            return {
              challengeId,
              username,
              effectiveStatus: 'Approved',
              isActive: false,
              canAcceptNew: true,
              displayText: 'Completed',
              displayStatus: 'completed'
            };

          case 'Rejected':
            return {
              challengeId,
              username,
              effectiveStatus: 'Rejected',
              isActive: false,
              canAcceptNew: true,
              displayText: 'Accept',
              displayStatus: 'available'
            };

          case 'Needs Rework':
            return {
              challengeId,
              username,
              effectiveStatus: 'Needs Rework',
              isActive: false,
              canAcceptNew: true,
              displayText: 'Accept',
              displayStatus: 'available'
            };

          case 'Pending Review':
          default:
            return {
              challengeId,
              username,
              effectiveStatus: 'Under Review',
              isActive: true,
              canAcceptNew: false,
              displayText: 'Under Review',
              displayStatus: 'active'
            };
        }
      } else {
        // Submitted but no review yet - still active
        return {
          challengeId,
          username,
          effectiveStatus: 'Pending Review',
          isActive: true,
          canAcceptNew: false,
          displayText: 'Pending Review',
          displayStatus: 'active'
        };
      }
    }

    // Accepted but not submitted yet - still active
    return {
      challengeId,
      username,
      effectiveStatus: 'Accepted',
      isActive: true,
      canAcceptNew: false,
      displayText: 'Accepted',
      displayStatus: 'active'
    };
  };

  const getUserChallengeStatus = (username, challengeId) => {
    return getEffectiveStatus(username, challengeId);
  };

  const canUserAcceptAnyChallenge = (username) => {
    const userAcceptances = acceptances.filter(acc => acc.username === username);

    // Check if user has any truly active challenges
    const hasActiveInContext = userAcceptances.some(acceptance => {
      const status = getEffectiveStatus(username, acceptance.challengeId);
      return status.isActive;
    });

    return !hasActiveInContext;
  };

  const getUserActiveChallengeName = (username) => {
    const userAcceptances = acceptances.filter(acc => acc.username === username);

    for (const acceptance of userAcceptances) {
      const status = getEffectiveStatus(username, acceptance.challengeId);

      if (status.isActive) {
        let challenge = getChallenge(acceptance.challengeId);

        if (!challenge) {
          challenge = challenges.find(c => c.id === acceptance.challengeId);
        }

        if (!challenge && challenges.length > 0) {
          challenge = challenges[0];
        }

        if (challenge?.title) {
          return challenge.title;
        }

        const challengeId = acceptance.challengeId;
        if (challengeId.startsWith('ch')) {
          return `Challenge #${challengeId.substring(2)}`;
        }

        return challengeId;
      }
    }

    return null;
  };

  return {
    getUserChallengeStatus,
    canUserAcceptAnyChallenge,
    getUserActiveChallengeName,
    getEffectiveStatus
  };
};