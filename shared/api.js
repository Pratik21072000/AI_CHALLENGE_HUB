// Shared API types and interfaces

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

export const UserRoles = {
  EMPLOYEE: 'Employee',
  MANAGEMENT: 'Management',
  ADMIN: 'Admin'
};

export const SubmissionStatus = {
  SUBMITTED: 'Submitted',
  UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_REWORK: 'Needs Rework'
};

export const ReviewStatus = {
  PENDING_REVIEW: 'Pending Review',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  NEEDS_REWORK: 'Needs Rework'
};