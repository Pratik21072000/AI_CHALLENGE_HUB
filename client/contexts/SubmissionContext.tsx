import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { apiService } from '@/services/api';

// Submission tracking includes submitted boolean to track submission state
export interface ChallengeSubmission {
  id?: string;
  username: string;
  challengeId: string;
  submitted: boolean;
  submittedAt: string;
  fileUrl: string;
  fileName: string;
  fileSize: number;
  shortDescription: string;
  technologies: string;
  sourceCodeUrl: string;
  hostedAppUrl: string;
  supportingDocs?: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
  }[];
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework';
}

export interface SubmissionFormData {
  shortDescription: string;
  technologies: string;
  sourceCodeUrl: string;
  hostedAppUrl: string;
  solutionFile: File;
  supportingDocs: File[];
}

interface SubmissionContextType {
  submissions: ChallengeSubmission[];
  submitSolution: (challengeId: string, formData: SubmissionFormData) => Promise<boolean>;
  hasUserSubmitted: (username: string, challengeId: string) => boolean;
  getUserSubmission: (username: string, challengeId: string) => ChallengeSubmission | null;
  getSubmissionCount: (challengeId: string) => number;
  updateSubmissionStatus?: (username: string, challengeId: string, status: ChallengeSubmission['status']) => void;
  removeSubmission: (username: string, challengeId: string) => void;
}

const SubmissionContext = createContext<SubmissionContextType | undefined>(undefined);

// Mock initial submissions for testing
const INITIAL_SUBMISSIONS: ChallengeSubmission[] = [
  // Starting fresh - no submissions
];

interface SubmissionProviderProps {
  children: ReactNode;
}

export function SubmissionProvider({ children }: SubmissionProviderProps) {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<ChallengeSubmission[]>([]);

  // We'll use a ref to avoid circular dependency issues
  const updateAcceptanceStatusRef = React.useRef<((username: string, challengeId: string, newStatus: 'Accepted' | 'Submitted' | 'Completed' | 'Withdrawn') => void) | null>(null);

  // Load submissions from localStorage on mount
  useEffect(() => {
    const storedSubmissions = localStorage.getItem('challengeHub_submissions');
    if (storedSubmissions) {
      try {
        const loaded = JSON.parse(storedSubmissions);
        setSubmissions(loaded);
        console.log('✅ Loaded submissions from localStorage:', loaded.length, 'records');
      console.log('   Submissions details:', loaded);
      } catch (error) {
        console.error('Error loading submissions:', error);
        setSubmissions(INITIAL_SUBMISSIONS);
      }
    } else {
      setSubmissions(INITIAL_SUBMISSIONS);
      console.log('📝 No existing submissions found, starting fresh');
    }
  }, []);

  // Save submissions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('challengeHub_submissions', JSON.stringify(submissions));
    console.log('✅ Submissions saved to localStorage:', submissions.length, 'records');
  }, [submissions]);

  const submitSolution = async (challengeId: string, formData: SubmissionFormData): Promise<boolean> => {
    if (!user) return false;

    // Check if user has already submitted for this challenge
    if (hasUserSubmitted(user.username, challengeId)) {
      return false;
    }

    try {
      // Simulate file upload delay
      await new Promise(resolve => setTimeout(resolve, 2500));

      // Create mock file URLs (in real app, this would be from file upload service)
      const timestamp = Date.now();
      const fileUrl = `/mock/submissions/${user.username}-${challengeId}-${timestamp}.${formData.solutionFile.name.split('.').pop()}`;

      // Process supporting documents
      const supportingDocs = formData.supportingDocs.map((file, index) => ({
        fileUrl: `/mock/supporting-docs/${user.username}-${challengeId}-${timestamp}-${index}.${file.name.split('.').pop()}`,
        fileName: file.name,
        fileSize: file.size
      }));

      const newSubmission: ChallengeSubmission = {
        id: `${user.username}-${challengeId}`,
        username: user.username,
        challengeId,
        submitted: true,
        submittedAt: new Date().toISOString(),
        fileUrl,
        fileName: formData.solutionFile.name,
        fileSize: formData.solutionFile.size,
        shortDescription: formData.shortDescription,
        technologies: formData.technologies,
        sourceCodeUrl: formData.sourceCodeUrl,
        hostedAppUrl: formData.hostedAppUrl,
        supportingDocs: supportingDocs.length > 0 ? supportingDocs : undefined,
        status: 'Submitted'
      };

      setSubmissions(prev => {
        const updated = [...prev, newSubmission];
        console.log('✅ Submission stored:', newSubmission);
        return updated;
      });
      return true;
    } catch (error) {
      console.error('Error submitting solution:', error);
      return false;
    }
  };

  const hasUserSubmitted = (username: string, challengeId: string): boolean => {
    return submissions.some(
      submission => 
        submission.username === username && 
        submission.challengeId === challengeId &&
        submission.submitted
    );
  };

  const getUserSubmission = (username: string, challengeId: string): ChallengeSubmission | null => {
    return submissions.find(
      submission => 
        submission.username === username && 
        submission.challengeId === challengeId &&
        submission.submitted
    ) || null;
  };

  const getSubmissionCount = (challengeId: string): number => {
    return submissions.filter(
      submission =>
        submission.challengeId === challengeId &&
        submission.submitted
    ).length;
  };

  const updateSubmissionStatus = (username: string, challengeId: string, status: ChallengeSubmission['status']) => {
    setSubmissions(prev => {
      const updated = prev.map(submission =>
        submission.username === username && submission.challengeId === challengeId
          ? { ...submission, status }
          : submission
      );
      console.log('✅ Submission status updated:', { username, challengeId, status });
      return updated;
    });
  };

  const removeSubmission = (username: string, challengeId: string) => {
    setSubmissions(prev => {
      const updated = prev.filter(submission =>
        !(submission.username === username && submission.challengeId === challengeId)
      );
      console.log('✅ Submission removed for withdrawn challenge:', { username, challengeId });
      return updated;
    });
  };

  const value: SubmissionContextType = {
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
