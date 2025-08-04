import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

const SubmissionContext = createContext(undefined);

export function SubmissionProvider({ children }) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState([]);

  // Load submissions from API
  useEffect(() => {
    const loadSubmissions = async () => {
      try {
        const allSubmissions = await apiService.getAllSubmissions();
        setSubmissions(allSubmissions);
        console.log('✅ Loaded submissions from API:', allSubmissions.length, 'records');
      } catch (error) {
        console.error('Error loading submissions:', error);
        setSubmissions([]);
      }
    };

    loadSubmissions();
  }, []);

  const submitSolution = async (challengeId, formData) => {
    if (!user) return false;

    // Check if user has already submitted for this challenge
    if (hasUserSubmitted(user.username, challengeId)) {
      return false;
    }

    try {
      const submissionData = {
        challengeId,
        shortDescription: formData.shortDescription,
        technologies: formData.technologies,
        sourceCodeUrl: formData.sourceCodeUrl,
        hostedAppUrl: formData.hostedAppUrl,
      };

      const newSubmission = await apiService.submitSolution(submissionData);
      
      // Update local state
      setSubmissions(prev => [...prev, newSubmission]);
      console.log('✅ Submission stored:', newSubmission);
      return true;
    } catch (error) {
      console.error('Error submitting solution:', error);
      return false;
    }
  };

  const hasUserSubmitted = (username, challengeId) => {
    return submissions.some(
      submission => 
        submission.username === username && 
        submission.challengeId === challengeId &&
        submission.submitted
    );
  };

  const getUserSubmission = (username, challengeId) => {
    return submissions.find(
      submission => 
        submission.username === username && 
        submission.challengeId === challengeId &&
        submission.submitted
    ) || null;
  };

  const getSubmissionCount = (challengeId) => {
    return submissions.filter(
      submission =>
        submission.challengeId === challengeId &&
        submission.submitted
    ).length;
  };

  const updateSubmissionStatus = (username, challengeId, status) => {
    setSubmissions(prev => 
      prev.map(submission =>
        submission.username === username && submission.challengeId === challengeId
          ? { ...submission, status }
          : submission
      )
    );
  };

  const removeSubmission = (username, challengeId) => {
    setSubmissions(prev => 
      prev.filter(submission =>
        !(submission.username === username && submission.challengeId === challengeId)
      )
    );
  };

  const value = {
    submissions,
    submitSolution,
    hasUserSubmitted,
    getUserSubmission,
    getSubmissionCount,
    updateSubmissionStatus,
    removeSubmission
  };

  return (
    <SubmissionContext.Provider value={value}>
      {children}
    </SubmissionContext.Provider>
  );
}

export function useSubmission() {
  const context = useContext(SubmissionContext);
  if (context === undefined) {
    throw new Error('useSubmission must be used within a SubmissionProvider');
  }
  return context;
}