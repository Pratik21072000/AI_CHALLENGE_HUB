import React from 'react';
import { useChallengeAcceptance } from '@/contexts/ChallengeAcceptanceContext';
import { useSubmission } from '@/contexts/SubmissionContext';
import { useSubmissionReview } from '@/contexts/SubmissionReviewContext';
import { useChallenges } from '@/contexts/ChallengesContext';
import { storageService } from '@/services/storageService';

export interface ChallengeStatus {
  challengeId: string;
  username: string;
  effectiveStatus: string;
  isActive: boolean;
  canAcceptNew: boolean;
  displayText: string;
  displayStatus: 'active' | 'completed' | 'available';
}

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

  // Debug logging to understand data state
  React.useEffect(() => {
    console.log('🔍 useChallengeStatus Data Check:');
    console.log('  - Acceptances:', acceptances.length, acceptances);
    console.log('  - Submissions:', submissions.length, submissions);
    console.log('  - Reviews:', reviews.length, reviews);
  }, [acceptances, submissions, reviews]);

  // Define status hierarchy according to requirements
  const getEffectiveStatus = (username: string, challengeId: string): ChallengeStatus => {
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
        canAcceptNew: true, // Will be overridden by canUserAcceptAnyChallenge
        displayText: 'Accept',
        displayStatus: 'available'
      };
    }

    // Safety check: If acceptance exists but was created very recently (less than 10 seconds ago)
    // and status is still 'Accepted' with no submission, it might be a false positive
    const acceptedAt = new Date(acceptance.acceptedAt);
    const now = new Date();
    const timeDiffSeconds = (now.getTime() - acceptedAt.getTime()) / 1000;

    if (timeDiffSeconds < 10 && acceptance.status === 'Accepted') {
      const hasSubmitted = hasUserSubmitted(username, challengeId);
      if (!hasSubmitted) {
        console.log(`⚠️ Possible false positive acceptance for ${username}-${challengeId} (created ${timeDiffSeconds}s ago)`);
        // For very recent acceptances without submissions, don't treat as active
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
    }

    // If withdrawn, treat as non-active (user can accept new challenges)
    if (acceptance.status === 'Withdrawn') {
      return {
        challengeId,
        username,
        effectiveStatus: 'Withdrawn',
        isActive: false,
        canAcceptNew: true,
        displayText: 'Accept',
        displayStatus: 'available' // Change to available so Accept button shows
      };
    }

    // Check if user has submitted a solution
    const hasSubmitted = hasUserSubmitted(username, challengeId);
    const submission = getUserSubmission(username, challengeId);

    if (hasSubmitted && submission) {
      // Check if there's a review for this submission
      const reviewKey = `${username}-${challengeId}`;
      const review = getSubmissionReview(reviewKey);

      console.log(`🔍 Detailed review lookup for ${username}-${challengeId}:`, {
        reviewKey,
        review,
        allReviews: reviews,
        submissionData: submission,
        hasSubmitted,
        reviewsCount: reviews.length
      });

      if (review) {
        // Review exists - use review status to determine final state
        switch (review.status) {
          case 'Approved':
            return {
              challengeId,
              username,
              effectiveStatus: 'Approved',
              isActive: false,
              canAcceptNew: true, // Can accept new challenges after approval
              displayText: 'Completed',
              displayStatus: 'completed'
            };

          case 'Rejected':
            return {
              challengeId,
              username,
              effectiveStatus: 'Rejected',
              isActive: false,
              canAcceptNew: true, // Can accept new challenges after rejection
              displayText: 'Accept',
              displayStatus: 'available' // Change to available so Accept button shows
            };

          case 'Needs Rework':
            return {
              challengeId,
              username,
              effectiveStatus: 'Needs Rework',
              isActive: false,
              canAcceptNew: true, // Can accept new challenges - rework is considered completed
              displayText: 'Accept',
              displayStatus: 'available' // Change to available so Accept button shows
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

  const getUserChallengeStatus = (username: string, challengeId: string): ChallengeStatus => {
    const status = getEffectiveStatus(username, challengeId);

    // Enhanced debugging
    const acceptance = acceptances.find(acc => acc.username === username && acc.challengeId === challengeId);
    const submission = submissions.find(sub => sub.username === username && sub.challengeId === challengeId);
    const review = reviews.find(rev => rev.username === username && rev.challengeId === challengeId);

    console.log(`🔍 Challenge Status for ${username} - ${challengeId}:`, {
      status,
      acceptance,
      submission,
      review,
      hasSubmission: hasUserSubmitted(username, challengeId)
    });

    return status;
  };

  const canUserAcceptAnyChallenge = (username: string): boolean => {
    const userAcceptances = acceptances.filter(acc => acc.username === username);

    // Check if user has any truly active challenges
    const hasActiveInContext = userAcceptances.some(acceptance => {
      const status = getEffectiveStatus(username, acceptance.challengeId);

      // Only consider it active if status indicates active state
      return status.isActive;
    });

    console.log(`🔍 canUserAcceptAnyChallenge(${username}):`, {
      userAcceptancesCount: userAcceptances.length,
      userAcceptances: userAcceptances.map(acc => ({
        challengeId: acc.challengeId,
        status: acc.status,
        effectiveStatus: getEffectiveStatus(username, acc.challengeId)
      })),
      hasActiveInContext,
      finalDecision: !hasActiveInContext
    });

    return !hasActiveInContext;
  };

  const getUserActiveChallengeName = (username: string): string | null => {
    const userAcceptances = acceptances.filter(acc => acc.username === username);

    for (const acceptance of userAcceptances) {
      const status = getEffectiveStatus(username, acceptance.challengeId);

      if (status.isActive) {
        // Try to get the challenge title
        let challenge = getChallenge(acceptance.challengeId);

        // If getChallenge didn't work, try direct lookup
        if (!challenge) {
          challenge = challenges.find(c => c.id === acceptance.challengeId);
        }

        // Emergency fallback: If we can't find the exact challenge,
        // return the first available challenge title since the user clearly has an active challenge
        if (!challenge && challenges.length > 0) {
          challenge = challenges[0];
        }

        if (challenge?.title) {
          return challenge.title;
        }

        // Final fallback: Format the ID nicely
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
