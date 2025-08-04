// Shared type definitions

export const ChallengeStatus = {
  OPEN: 'Open',
  ACCEPTED: 'Accepted',
  SUBMITTED: 'Submitted',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_REWORK: 'Needs Rework',
  WITHDRAWN: 'Withdrawn',
  PENDING_APPROVAL: 'Pending Approval',
  DRAFT: 'Draft'
};

// Challenge structure
export function createChallenge({
  id,
  title,
  description,
  fullDescription,
  expectedOutcome,
  tags = [],
  status = ChallengeStatus.OPEN,
  points = 500,
  penaltyPoints = 50,
  deadline,
  attachments = [],
  createdBy,
  createdAt,
  lastUpdated,
  acceptedBy,
  committedDate,
  submittedAt,
  reviewedAt,
  reviewedBy,
  reviewComment,
  withdrawnAt,
  withdrawnBy,
  awardedPoints,
  submissionDetails
}) {
  return {
    id,
    title,
    description,
    fullDescription,
    expectedOutcome,
    tags,
    status,
    points,
    penaltyPoints,
    deadline,
    attachments,
    createdBy,
    createdAt,
    lastUpdated,
    acceptedBy,
    committedDate,
    submittedAt,
    reviewedAt,
    reviewedBy,
    reviewComment,
    withdrawnAt,
    withdrawnBy,
    awardedPoints,
    submissionDetails
  };
}

// User structure
export function createUser({
  id,
  name,
  email,
  department,
  totalPoints = 0,
  badges = [],
  avatar
}) {
  return {
    id,
    name,
    email,
    department,
    totalPoints,
    badges,
    avatar
  };
}

// Challenge Acceptance structure
export function createChallengeAcceptance({
  id,
  username,
  challengeId,
  status = 'Accepted',
  committedDate,
  acceptedAt
}) {
  return {
    id,
    username,
    challengeId,
    status,
    committedDate,
    acceptedAt
  };
}

// Submission structure
export function createSubmission({
  id,
  username,
  challengeId,
  submitted = true,
  submittedAt,
  fileUrl,
  fileName,
  fileSize,
  shortDescription,
  technologies,
  sourceCodeUrl,
  hostedAppUrl,
  supportingDocs = [],
  status = 'Submitted'
}) {
  return {
    id,
    username,
    challengeId,
    submitted,
    submittedAt,
    fileUrl,
    fileName,
    fileSize,
    shortDescription,
    technologies,
    sourceCodeUrl,
    hostedAppUrl,
    supportingDocs,
    status
  };
}

// Review structure
export function createReview({
  submissionId,
  challengeId,
  username,
  status = 'Pending Review',
  reviewedBy,
  reviewedAt,
  reviewComment,
  pointsAwarded = 0,
  submissionDate,
  commitmentDate,
  isOnTime = true
}) {
  return {
    submissionId,
    challengeId,
    username,
    status,
    reviewedBy,
    reviewedAt,
    reviewComment,
    pointsAwarded,
    submissionDate,
    commitmentDate,
    isOnTime
  };
}