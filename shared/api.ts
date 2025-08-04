/**
 * Shared API types between client and server
 */

export interface DemoResponse {
  message: string;
}

// Challenge Management API Types
export interface Challenge {
  id: string;
  title: string;
  description: string;
  fullDescription: string;
  expectedOutcome: string;
  tags: string[];
  status: 'Open' | 'Accepted' | 'Submitted' | 'Approved' | 'Rejected' | 'Needs Rework' | 'Withdrawn' | 'Completed' | 'Cancelled';
  points: number;
  penaltyPoints: number;
  deadline: string;
  createdBy: string;
  acceptedBy?: string[];
  createdAt?: string;
  attachments?: string[];
}

export interface ChallengeAcceptance {
  id: string;
  username: string;
  challengeId: string;
  status: 'Accepted' | 'Submitted' | 'Completed' | 'Withdrawn';
  committedDate: string;
  acceptedAt: string;
}

export interface ChallengeSubmission {
  id: string;
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

export interface SubmissionReview {
  id: string;
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

// API Request/Response Types
export interface AcceptChallengeRequest {
  challengeId: string;
  committedDate: string;
}

export interface AcceptChallengeResponse {
  success: boolean;
  data: ChallengeAcceptance;
  message?: string;
}

export interface SubmitSolutionRequest {
  challengeId: string;
  shortDescription: string;
  technologies: string;
  sourceCodeUrl: string;
  hostedAppUrl: string;
  fileName: string;
  fileSize: number;
}

export interface SubmitSolutionResponse {
  success: boolean;
  submission: ChallengeSubmission;
  message?: string;
}

export interface ReviewSubmissionRequest {
  action: 'approve' | 'reject' | 'rework';
  comment?: string;
}

export interface ReviewSubmissionResponse {
  success: boolean;
  review: SubmissionReview;
  message?: string;
}

export interface GetUserDataResponse {
  user: {
    username: string;
    displayName: string;
    role: string;
    department: string;
  };
  acceptances: ChallengeAcceptance[];
  submissions: ChallengeSubmission[];
  reviews: SubmissionReview[];
}

export interface ErrorResponse {
  success: false;
  error: string;
  message: string;
}
