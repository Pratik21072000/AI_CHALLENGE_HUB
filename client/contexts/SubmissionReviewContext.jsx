import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useSubmission } from './SubmissionContext';
import { useChallengeAcceptance } from './ChallengeAcceptanceContext';
import { apiService } from '../services/api';

const SubmissionReviewContext = createContext(undefined);

export function SubmissionReviewProvider({ children }) {
  const { user } = useAuth();
  const { submissions, updateSubmissionStatus } = useSubmission();
  const { updateAcceptanceStatus } = useChallengeAcceptance();
  const [reviews, setReviews] = useState([]);

  // Load reviews from API
  useEffect(() => {
    const loadReviews = async () => {
      try {
        const allReviews = await apiService.getAllReviews();
        setReviews(allReviews);
        console.log('✅ Loaded reviews from API:', allReviews.length, 'records');
      } catch (error) {
        console.error('Error loading reviews:', error);
        setReviews([]);
      }
    };

    loadReviews();
  }, []);

  const approveSubmission = async (submissionId, comment) => {
    if (!user || user.role !== 'Management') return false;

    try {
      const review = await apiService.reviewSubmission(submissionId, 'approve', comment);
      
      // Update local state
      setReviews(prev => {
        const existingIndex = prev.findIndex(r => r.submissionId === submissionId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = review;
          return updated;
        } else {
          return [...prev, review];
        }
      });

      // Update submission status
      updateSubmissionStatus?.(review.username, review.challengeId, 'Approved');
      
      // Update acceptance status
      updateAcceptanceStatus(review.username, review.challengeId, 'Approved');
      
      console.log('✅ Submission approved and review recorded');
      return true;
    } catch (error) {
      console.error('Error approving submission:', error);
      return false;
    }
  };

  const rejectSubmission = async (submissionId, comment) => {
    if (!user || user.role !== 'Management') return false;

    try {
      const review = await apiService.reviewSubmission(submissionId, 'reject', comment);
      
      // Update local state
      setReviews(prev => {
        const existingIndex = prev.findIndex(r => r.submissionId === submissionId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = review;
          return updated;
        } else {
          return [...prev, review];
        }
      });

      // Update submission status
      updateSubmissionStatus?.(review.username, review.challengeId, 'Rejected');
      
      // Update acceptance status
      updateAcceptanceStatus(review.username, review.challengeId, 'Rejected');
      
      console.log('✅ Submission rejected and review recorded');
      return true;
    } catch (error) {
      console.error('Error rejecting submission:', error);
      return false;
    }
  };

  const requestRework = async (submissionId, comment, customPenalty) => {
    if (!user || user.role !== 'Management') return false;

    try {
      const review = await apiService.reviewSubmission(submissionId, 'rework', comment);
      
      // Update local state
      setReviews(prev => {
        const existingIndex = prev.findIndex(r => r.submissionId === submissionId);
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = review;
          return updated;
        } else {
          return [...prev, review];
        }
      });

      // Update submission status
      updateSubmissionStatus?.(review.username, review.challengeId, 'Needs Rework');
      
      // Update acceptance status
      updateAcceptanceStatus(review.username, review.challengeId, 'Needs Rework');
      
      console.log('✅ Rework requested and review recorded');
      return true;
    } catch (error) {
      console.error('Error requesting rework:', error);
      return false;
    }
  };

  const getSubmissionReview = (submissionId) => {
    return reviews.find(r => r.submissionId === submissionId) || null;
  };

  const getReviewsByChallenge = (challengeId) => {
    return reviews.filter(r => r.challengeId === challengeId);
  };

  // Filter reviews by status
  const pendingReviews = reviews.filter(r => r.status === 'Pending Review');
  const approvedReviews = reviews.filter(r => r.status === 'Approved');
  const rejectedReviews = reviews.filter(r => r.status === 'Rejected');
  const reworkReviews = reviews.filter(r => r.status === 'Needs Rework');

  const value = {
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