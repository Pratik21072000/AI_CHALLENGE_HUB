import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useSubmission, ChallengeSubmission } from './SubmissionContext';
import { useChallengeAcceptance } from './ChallengeAcceptanceContext';
import { useChallenges } from './ChallengesContext';
import { storageService } from '@/services/storageService';

export interface SubmissionReview {
  submissionId: string;
  challengeId: string;
  username: string;
  status: 'Pending Review' | 'Approved' | 'Rejected' | 'Needs Rework';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewComment?: string;
  pointsAwarded?: number;
  submissionDate: string;
  commitmentDate?: string;
  isOnTime: boolean;
}

interface SubmissionReviewContextType {
  reviews: SubmissionReview[];
  pendingReviews: SubmissionReview[];
  approvedReviews: SubmissionReview[];
  rejectedReviews: SubmissionReview[];
  reworkReviews: SubmissionReview[];
  approveSubmission: (submissionId: string, comment?: string) => Promise<boolean>;
  rejectSubmission: (submissionId: string, comment: string) => Promise<boolean>;
  requestRework: (submissionId: string, comment: string, customPenalty?: number) => Promise<boolean>;
  getSubmissionReview: (submissionId: string) => SubmissionReview | null;
  getReviewsByChallenge: (challengeId: string) => SubmissionReview[];
}

const SubmissionReviewContext = createContext<SubmissionReviewContextType | undefined>(undefined);

interface SubmissionReviewProviderProps {
  children: ReactNode;
}

export function SubmissionReviewProvider({ children }: SubmissionReviewProviderProps) {
  const { user } = useAuth();
  const { submissions, updateSubmissionStatus } = useSubmission();
  const { getChallengeAcceptances, updateAcceptanceStatus } = useChallengeAcceptance();
  const { getChallenge } = useChallenges();
  const [reviews, setReviews] = useState<SubmissionReview[]>([]);

  // Create review entries from submissions
  useEffect(() => {
    const submissionReviews = submissions.map((submission: ChallengeSubmission): SubmissionReview => {
      // Check if user has an acceptance record for timing
      const acceptances = getChallengeAcceptances(submission.challengeId);
      const userAcceptance = acceptances.find(acc => acc.username === submission.username);
      
      const commitmentDate = userAcceptance?.committedDate;
      const submissionDate = submission.submittedAt;
      
      // Determine if submission is on time
      const isOnTime = commitmentDate ? 
        new Date(submissionDate) <= new Date(commitmentDate) : true;

      return {
        submissionId: `${submission.username}-${submission.challengeId}`,
        challengeId: submission.challengeId,
        username: submission.username,
        status: submission.status === 'Submitted' ? 'Pending Review' : 
                submission.status === 'Under Review' ? 'Pending Review' :
                submission.status as 'Approved' | 'Rejected' | 'Needs Rework',
        submissionDate: submission.submittedAt,
        commitmentDate,
        isOnTime
      };
    });

    setReviews(submissionReviews);
    console.log('🔄 SubmissionReviewContext: Generated reviews from submissions');
    console.log('  - Submissions count:', submissions.length);
    console.log('  - Generated reviews count:', submissionReviews.length);
    console.log('  - Reviews data:', submissionReviews);
  }, [submissions, getChallengeAcceptances]);

  // Load reviews from localStorage on mount
  useEffect(() => {
    const storedReviews = localStorage.getItem('challengeHub_reviews');
    if (storedReviews) {
      try {
        const loadedReviews = JSON.parse(storedReviews);
        // Merge with current submission-based reviews
        setReviews(prev => {
          const merged = [...prev];
          loadedReviews.forEach((stored: SubmissionReview) => {
            const existingIndex = merged.findIndex(r => r.submissionId === stored.submissionId);
            if (existingIndex >= 0) {
              merged[existingIndex] = { ...merged[existingIndex], ...stored };
            } else {
              merged.push(stored);
            }
          });
          return merged;
        });
      } catch (error) {
        console.error('Error loading reviews:', error);
      }
    }
  }, []);

  // Save reviews to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('challengeHub_reviews', JSON.stringify(reviews));
    console.log('✅ Reviews saved to localStorage:', reviews.length, 'records');
  }, [reviews]);

  const approveSubmission = async (submissionId: string, comment?: string): Promise<boolean> => {
    if (!user || user.role !== 'Management') return false;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const review = reviews.find(r => r.submissionId === submissionId);
      if (!review) return false;

      // Backend-based point calculation logic
      const basePoints = 500; // Fixed backend value, not displayed in UI
      const defaultPenalty = 50; // Fixed backend value, not displayed in UI

      // New Point Logic:
      // If Submitted Date == Committed Date AND Reviewer approves: Award full 500 points
      // If Submitted Date > Committed Date AND Reviewer approves: Award (Points - Penalty) = 450 points
      const pointsAwarded = review.isOnTime ? basePoints : (basePoints - defaultPenalty);

      setReviews(prev => {
        const updated = prev.map(r =>
          r.submissionId === submissionId
            ? {
                ...r,
                status: 'Approved',
                reviewedBy: user.displayName,
                reviewedAt: new Date().toISOString(),
                reviewComment: comment,
                pointsAwarded
              }
            : r
        );
        console.log('✅ Submission approved and review recorded');
        return updated;
      });

      // Update submission status in SubmissionContext
      updateSubmissionStatus?.(review.username, review.challengeId, 'Approved');

      // IMPORTANT: Update acceptance status so user can accept new challenges
      updateAcceptanceStatus(review.username, review.challengeId, 'Approved');
      console.log('✅ Updated acceptance status to Approved for', review.username, review.challengeId);

      return true;
    } catch (error) {
      console.error('Error approving submission:', error);
      return false;
    }
  };

  const rejectSubmission = async (submissionId: string, comment: string): Promise<boolean> => {
    if (!user || user.role !== 'Management') return false;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const review = reviews.find(r => r.submissionId === submissionId);
      if (!review) return false;

      setReviews(prev => {
        const updated = prev.map(r =>
          r.submissionId === submissionId
            ? {
                ...r,
                status: 'Rejected',
                reviewedBy: user.displayName,
                reviewedAt: new Date().toISOString(),
                reviewComment: comment,
                pointsAwarded: 0
              }
            : r
        );
        console.log('✅ Submission rejected and review recorded');
        return updated;
      });

      // Update submission status in SubmissionContext
      updateSubmissionStatus?.(review.username, review.challengeId, 'Rejected');

      // IMPORTANT: Update acceptance status so user can accept new challenges
      updateAcceptanceStatus(review.username, review.challengeId, 'Rejected');
      console.log('✅ Updated acceptance status to Rejected for', review.username, review.challengeId);

      return true;
    } catch (error) {
      console.error('Error rejecting submission:', error);
      return false;
    }
  };

  const requestRework = async (submissionId: string, comment: string, customPenalty?: number): Promise<boolean> => {
    if (!user || user.role !== 'Management') return false;

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));

      const review = reviews.find(r => r.submissionId === submissionId);
      if (!review) return false;

      // Backend-based point calculation for rework
      const basePoints = 500; // Fixed backend value
      const penaltyAmount = customPenalty || 75; // Use custom penalty or default to 75

      // Rework Logic: Deduct custom penalty from 500 and store as final awarded points
      const pointsAwarded = Math.max(0, basePoints - penaltyAmount);

      setReviews(prev => {
        const updated = prev.map(r =>
          r.submissionId === submissionId
            ? {
                ...r,
                status: 'Needs Rework',
                reviewedBy: user.displayName,
                reviewedAt: new Date().toISOString(),
                reviewComment: comment,
                pointsAwarded
              }
            : r
        );
        console.log('✅ Rework requested and review recorded');
        return updated;
      });

      // Update submission status in SubmissionContext
      updateSubmissionStatus?.(review.username, review.challengeId, 'Needs Rework');

      // IMPORTANT: Update acceptance status so user can accept new challenges
      updateAcceptanceStatus(review.username, review.challengeId, 'Needs Rework');
      console.log('✅ Updated acceptance status to Needs Rework for', review.username, review.challengeId);

      return true;
    } catch (error) {
      console.error('Error requesting rework:', error);
      return false;
    }
  };

  const getSubmissionReview = (submissionId: string): SubmissionReview | null => {
    return reviews.find(r => r.submissionId === submissionId) || null;
  };

  const getReviewsByChallenge = (challengeId: string): SubmissionReview[] => {
    return reviews.filter(r => r.challengeId === challengeId);
  };

  // Filter reviews by status
  const pendingReviews = reviews.filter(r => r.status === 'Pending Review');
  const approvedReviews = reviews.filter(r => r.status === 'Approved');
  const rejectedReviews = reviews.filter(r => r.status === 'Rejected');
  const reworkReviews = reviews.filter(r => r.status === 'Needs Rework');

  const value: SubmissionReviewContextType = {
    reviews,
    pendingReviews,
    approvedReviews,
    rejectedReviews,
    reworkReviews,
    approveSubmission,
    rejectSubmission,
    requestRework,
    getSubmissionReview,
    getReviewsByChallenge
  };

  return (
    <SubmissionReviewContext.Provider value={value}>
      {children}
    </SubmissionReviewContext.Provider>
  );
}

export function useSubmissionReview() {
  const context = useContext(SubmissionReviewContext);
  if (context === undefined) {
    throw new Error('useSubmissionReview must be used within a SubmissionReviewProvider');
  }
  return context;
}
