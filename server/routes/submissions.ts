import { RequestHandler } from "express";
import { 
  ChallengeSubmission, 
  SubmissionReview,
  SubmitSolutionRequest, 
  SubmitSolutionResponse,
  ReviewSubmissionRequest,
  ReviewSubmissionResponse,
  ErrorResponse 
} from "@shared/api";

// In-memory database (replace with real DB in production)
let submissions: ChallengeSubmission[] = [];
let reviews: SubmissionReview[] = [];

// GET /api/submissions - Get all submissions (with optional user filter)
export const getAllSubmissions: RequestHandler = (req, res) => {
  const { userId } = req.query;
  
  let filteredSubmissions = submissions;
  if (userId) {
    filteredSubmissions = submissions.filter(sub => sub.username === userId);
  }
  
  res.status(200).json({
    success: true,
    data: filteredSubmissions
  });
};

// GET /api/submissions/:id - Get specific submission
export const getSubmissionById: RequestHandler = (req, res) => {
  const { id } = req.params;
  const submission = submissions.find(s => s.id === id);
  
  if (!submission) {
    const error: ErrorResponse = {
      success: false,
      error: 'NOT_FOUND',
      message: 'Submission not found'
    };
    return res.status(404).json(error);
  }
  
  res.status(200).json({
    success: true,
    data: submission
  });
};

// POST /api/submissions - Submit a solution
export const submitSolution: RequestHandler = (req, res) => {
  const submissionData: SubmitSolutionRequest = req.body;
  const username = req.headers['x-user-id'] as string;
  
  if (!username) {
    const error: ErrorResponse = {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'User authentication required'
    };
    return res.status(401).json(error);
  }
  
  // Check if user has already submitted for this challenge
  const existingSubmission = submissions.find(
    sub => sub.username === username && sub.challengeId === submissionData.challengeId
  );
  
  if (existingSubmission) {
    const error: ErrorResponse = {
      success: false,
      error: 'CONFLICT',
      message: 'You have already submitted a solution for this challenge'
    };
    return res.status(409).json(error);
  }
  
  // Create submission record
  const newSubmission: ChallengeSubmission = {
    id: `sub${Date.now()}`,
    username,
    challengeId: submissionData.challengeId,
    submitted: true,
    submittedAt: new Date().toISOString(),
    fileUrl: `/mock/submissions/${username}-${submissionData.challengeId}-${Date.now()}.zip`,
    fileName: submissionData.fileName,
    fileSize: submissionData.fileSize,
    shortDescription: submissionData.shortDescription,
    technologies: submissionData.technologies,
    sourceCodeUrl: submissionData.sourceCodeUrl,
    hostedAppUrl: submissionData.hostedAppUrl,
    status: 'Submitted'
  };
  
  submissions.push(newSubmission);
  
  // Create initial review record
  const newReview: SubmissionReview = {
    id: `rev${Date.now()}`,
    submissionId: newSubmission.id,
    challengeId: submissionData.challengeId,
    username,
    status: 'Pending Review',
    submissionDate: newSubmission.submittedAt,
    isOnTime: true // TODO: Calculate based on commitment date
  };
  
  reviews.push(newReview);
  
  const response: SubmitSolutionResponse = {
    success: true,
    submission: newSubmission,
    message: 'Solution submitted successfully'
  };
  
  res.status(201).json(response);
};

// GET /api/submissions/reviews - Get all reviews
export const getAllReviews: RequestHandler = (req, res) => {
  const { status } = req.query;
  
  let filteredReviews = reviews;
  if (status) {
    filteredReviews = reviews.filter(rev => rev.status === status);
  }
  
  res.status(200).json({
    success: true,
    data: filteredReviews
  });
};

// PATCH /api/submissions/:id/review - Review a submission
export const reviewSubmission: RequestHandler = (req, res) => {
  const { id } = req.params;
  const { action, comment }: ReviewSubmissionRequest = req.body;
  const reviewerUsername = req.headers['x-user-id'] as string;
  
  if (!reviewerUsername) {
    const error: ErrorResponse = {
      success: false,
      error: 'UNAUTHORIZED',
      message: 'User authentication required'
    };
    return res.status(401).json(error);
  }
  
  const submission = submissions.find(s => s.id === id);
  if (!submission) {
    const error: ErrorResponse = {
      success: false,
      error: 'NOT_FOUND',
      message: 'Submission not found'
    };
    return res.status(404).json(error);
  }
  
  const review = reviews.find(r => r.submissionId === id);
  if (!review) {
    const error: ErrorResponse = {
      success: false,
      error: 'NOT_FOUND',
      message: 'Review record not found'
    };
    return res.status(404).json(error);
  }
  
  // Update review status
  let newStatus: 'Approved' | 'Rejected' | 'Needs Rework';
  let pointsAwarded = 0;
  
  switch (action) {
    case 'approve':
      newStatus = 'Approved';
      pointsAwarded = 1000; // TODO: Calculate based on challenge points and timing
      break;
    case 'reject':
      newStatus = 'Rejected';
      pointsAwarded = 0;
      break;
    case 'rework':
      newStatus = 'Needs Rework';
      pointsAwarded = 0;
      break;
    default:
      const error: ErrorResponse = {
        success: false,
        error: 'BAD_REQUEST',
        message: 'Invalid action'
      };
      return res.status(400).json(error);
  }
  
  // Update review record
  review.status = newStatus;
  review.reviewedBy = reviewerUsername;
  review.reviewedAt = new Date().toISOString();
  review.reviewComment = comment;
  review.pointsAwarded = pointsAwarded;
  
  // Update submission status
  submission.status = newStatus;
  
  const response: ReviewSubmissionResponse = {
    success: true,
    review,
    message: `Submission ${action}ed successfully`
  };
  
  res.status(200).json(response);
};

// GET /api/submissions/user/:username - Get user's submissions
export const getUserSubmissions: RequestHandler = (req, res) => {
  const { username } = req.params;
  const userSubmissions = submissions.filter(sub => sub.username === username);
  
  res.status(200).json({
    success: true,
    data: userSubmissions
  });
};

// GET /api/submissions/challenge/:challengeId - Get challenge submissions
export const getChallengeSubmissions: RequestHandler = (req, res) => {
  const { challengeId } = req.params;
  const challengeSubmissions = submissions.filter(sub => sub.challengeId === challengeId);
  
  res.status(200).json({
    success: true,
    data: challengeSubmissions
  });
};
