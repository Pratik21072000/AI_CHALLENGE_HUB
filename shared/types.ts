export type ChallengeStatus = 'Open' | 'Accepted' | 'Submitted' | 'Approved' | 'Rejected' | 'Needs Rework' | 'Withdrawn' | 'Pending Approval' | 'Draft';

export interface ChallengeAcceptance {
  id?: string;
  username: string;
  challengeId: string;
  status: 'Accepted' | 'Submitted' | 'Pending Review' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework' | 'Withdrawn';
  committedDate: string;
  acceptedAt: string;
}

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
  technologies: string; // Free text, comma-separated
  sourceCodeUrl: string;
  hostedAppUrl: string;
  supportingDocs?: {
    fileUrl: string;
    fileName: string;
    fileSize: number;
  }[];
  status: 'Submitted' | 'Under Review' | 'Approved' | 'Rejected' | 'Needs Rework';
}

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

export interface Challenge {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  expectedOutcome: string;
  tags: string[];
  status: ChallengeStatus;
  points: number;
  penaltyPoints?: number;
  deadline: string;
  attachments?: string[];
  createdBy: string;
  createdAt?: string; // ISO timestamp when challenge was created
  lastUpdated?: string; // ISO timestamp when challenge was last modified
  acceptedBy?: string | string[]; // Allow single user or array of users
  committedDate?: string; // Set when user accepts the challenge
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
  withdrawnAt?: string;
  withdrawnBy?: string;
  awardedPoints?: number; // Points actually awarded after review
  // Submission details
  submissionDetails?: {
    description: string;
    techStack: string[];
    sourceCodeUrl: string;
    hostedAppUrl?: string;
    additionalNotes?: string;
    files?: string[]; // File names/paths
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  department: string;
  totalPoints: number;
  badges: string[];
  avatar?: string;
}

export interface Submission {
  id: string;
  challengeId: string;
  userId: string;
  description: string;
  techStack: string[];
  sourceCodeUrl: string;
  hostedAppUrl: string;
  documents: string[];
  submittedAt: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  feedback?: string;
  awardedPoints?: number; // Points awarded for this submission
}

export interface UserPointsRecord {
  id: string;
  userId: string;
  challengeId: string;
  points: number; // Can be positive (awarded) or negative (penalty)
  reason: 'approval' | 'late_submission' | 'no_submission' | 'rejection';
  awardedAt: string;
  description: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}
