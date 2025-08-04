import { useMemo, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import { useChallengeAcceptance } from '@/contexts/ChallengeAcceptanceContext';
import { useSubmission } from '@/contexts/SubmissionContext';
import { useSubmissionReview } from '@/contexts/SubmissionReviewContext';
import { useChallenges } from '@/contexts/ChallengesContext';

interface UserPointsDisplayProps {
  userId: string;
  userName: string;
}



export default function UserPointsDisplay({ userId, userName }: UserPointsDisplayProps) {
  const { acceptances } = useChallengeAcceptance();
  const { submissions, getUserSubmission } = useSubmission();
  const { reviews, getSubmissionReview } = useSubmissionReview();
  const { getChallenge } = useChallenges();

  // Auto-refresh when data changes (via dependency array in useMemo)

  // Calculate user's total points
  const totalPoints = useMemo(() => {
    let total = 0;

    // Get all user's acceptances
    const userAcceptances = acceptances.filter(acc => acc.username === userId);

    userAcceptances.forEach(acceptance => {
      const submission = getUserSubmission(userId, acceptance.challengeId);
      const review = getSubmissionReview(`${userId}-${acceptance.challengeId}`);
      const challenge = getChallenge(acceptance.challengeId);

      // Only count if submission exists
      if (!submission) return;

      let points = 0;
      let reason = '';
      let status = 'Pending';
      
      const committedDate = new Date(acceptance.committedDate);
      const submittedDate = new Date(submission.submittedAt);
      const isOnTime = submittedDate <= committedDate;

      // If manager set specific pointsAwarded, use that
      if (review?.pointsAwarded !== undefined && review.pointsAwarded !== null) {
        points = review.pointsAwarded;
        status = review.status;
        
        switch (review.status) {
          case 'Approved':
            reason = points === 500 ? 'Approved (On Time)' : points === 450 ? 'Approved (Late)' : `Approved (${points} pts)`;
            break;
          case 'Needs Rework':
            reason = `Needs Rework (${points} pts)`;
            break;
          case 'Rejected':
            reason = 'Rejected (0 pts)';
            break;
          default:
            reason = 'Under Review';
        }
      } else if (review?.status) {
        // Calculate based on status and timing
        const basePoints = 500;
        const latePenalty = 50;
        status = review.status;

        switch (review.status) {
          case 'Approved':
            points = isOnTime ? basePoints : (basePoints - latePenalty);
            reason = isOnTime ? 'Approved (On Time)' : 'Approved (Late)';
            break;
            
          case 'Needs Rework':
            const reworkPenalty = 100;
            points = Math.max(0, basePoints - reworkPenalty);
            reason = 'Needs Rework';
            break;
            
          case 'Rejected':
            points = 0;
            reason = 'Rejected';
            break;
            
          default:
            points = 0;
            reason = 'Under Review';
        }
      }

      // Only add to total if it's a final status that awards points
      if (['Approved', 'Needs Rework', 'Rejected'].includes(status)) {
        total += points;
      }
    });

    return total;
  }, [acceptances, userId, getUserSubmission, getSubmissionReview, getChallenge]);



  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full">
        <Trophy className="w-4 h-4 text-yellow-600" />
        <span className="font-medium text-gray-900">{totalPoints}</span>
        <span className="text-xs text-gray-600">pts</span>
      </div>
    </div>
  );
}
