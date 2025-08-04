import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  ArrowLeft, 
  ExternalLink, 
  Calendar, 
  Code, 
  Globe, 
  FileText, 
  Download,
  Lock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Clock
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useSubmission } from '@/contexts/SubmissionContext';
import { useSubmissionReview } from '@/contexts/SubmissionReviewContext';
import { useAuth } from '@/contexts/AuthContext';

const statusConfig = {
  'Submitted': {
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Clock,
    label: 'Submitted'
  },
  'Under Review': {
    color: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    icon: Clock,
    label: 'Under Review'
  },
  'Approved': {
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCircle,
    label: 'Approved'
  },
  'Rejected': {
    color: 'bg-red-50 text-red-700 border-red-200',
    icon: XCircle,
    label: 'Rejected'
  },
  'Needs Rework': {
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    icon: RotateCcw,
    label: 'Needs Rework'
  }
};

export default function SubmissionViewer() {
  const { challengeId, username } = useParams<{ challengeId: string; username: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getChallenge } = useChallenges();
  const { getUserSubmission } = useSubmission();
  const { getSubmissionReview } = useSubmissionReview();

  // Get challenge, submission, and review data
  const challenge = getChallenge(challengeId || '');
  const submission = getUserSubmission(username || '', challengeId || '');
  const review = getSubmissionReview(`${username}-${challengeId}`);

  // Access control - employees can only view their own submissions
  const canView = user?.role === 'Management' || user?.role === 'Admin' || user?.username === username;

  if (!canView) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">You don't have permission to view this submission.</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (!challenge || !submission) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Submission Not Found</h1>
            <p className="text-gray-600 mb-4">The requested submission could not be found.</p>
            <Button onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const StatusIcon = statusConfig[submission.status]?.icon || Clock;
  const statusStyle = statusConfig[submission.status]?.color || 'bg-gray-50 text-gray-700 border-gray-200';

  // Helper function to get user display name
  const getUserDisplayName = (username: string) => {
    const nameMap: Record<string, string> = {
      'employee01': 'John Doe',
      'employee02': 'Lisa Thompson',
      'employee03': 'Mike Chen',
      'manager01': 'Sarah Wilson'
    };
    return nameMap[username] || username;
  };

  const handleExternalLink = (url: string) => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button size="sm" variant="ghost" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Read-Only View</span>
            </div>
          </div>
          
          {/* Status Badge */}
          <Badge variant="outline" className={`${statusStyle} font-medium flex items-center`}>
            <StatusIcon className="w-4 h-4 mr-1" />
            {statusConfig[submission.status]?.label || submission.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Submission Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Submission Details</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Submitter Info */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Submitted By</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <div className="font-medium text-gray-900">{getUserDisplayName(username || '')}</div>
                    <div className="text-sm text-gray-500">{username}</div>
                  </div>
                </div>

                {/* Submission Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Submitted</label>
                  <div className="p-3 bg-gray-50 rounded-lg border flex items-center">
                    <Calendar className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-gray-900">
                      {new Date(submission.submittedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                </div>

                {/* Solution Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Solution Description</label>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <p className="text-gray-900 whitespace-pre-wrap">
                      {submission.shortDescription || 'No description provided'}
                    </p>
                  </div>
                </div>

                {/* Technologies Used */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Technologies Used</label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    {submission.technologies ? (
                      <div className="flex flex-wrap gap-2">
                        {submission.technologies.split(',').map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tech.trim()}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No technologies specified</span>
                    )}
                  </div>
                </div>

                {/* URLs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Source Code URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source Code</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {submission.sourceCodeUrl ? (
                        <button
                          onClick={() => handleExternalLink(submission.sourceCodeUrl)}
                          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline w-full text-left"
                        >
                          <Code className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{submission.sourceCodeUrl}</span>
                          <ExternalLink className="w-3 h-3 ml-2 flex-shrink-0" />
                        </button>
                      ) : (
                        <span className="text-gray-500">No source code URL provided</span>
                      )}
                    </div>
                  </div>

                  {/* Demo URL */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Live Demo</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      {submission.hostedAppUrl ? (
                        <button
                          onClick={() => handleExternalLink(submission.hostedAppUrl)}
                          className="flex items-center text-blue-600 hover:text-blue-800 hover:underline w-full text-left"
                        >
                          <Globe className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="truncate">{submission.hostedAppUrl}</span>
                          <ExternalLink className="w-3 h-3 ml-2 flex-shrink-0" />
                        </button>
                      ) : (
                        <span className="text-gray-500">No demo URL provided</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Supporting Documents */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Supporting Documents</label>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    {submission.supportingDocs && submission.supportingDocs.length > 0 ? (
                      <div className="space-y-2">
                        {submission.supportingDocs.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                            <div className="flex items-center">
                              <FileText className="w-4 h-4 text-gray-400 mr-2" />
                              <span className="text-sm font-medium">{doc.fileName}</span>
                              <span className="text-xs text-gray-500 ml-2">
                                ({(doc.fileSize / 1024 / 1024).toFixed(2)} MB)
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleExternalLink(doc.fileUrl)}
                            >
                              <Download className="w-4 h-4 mr-1" />
                              Download
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-500">No supporting documents uploaded</span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Manager Review Section */}
            {(user?.role === 'Management' || user?.role === 'Admin') && review && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5" />
                    <span>Review Details</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Reviewed By</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">{review.reviewedBy || 'System'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Review Date</label>
                      <div className="p-3 bg-gray-50 rounded-lg border">
                        <span className="text-gray-900">
                          {review.reviewedAt ? new Date(review.reviewedAt).toLocaleDateString() : 'Not reviewed yet'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {review.reviewComment && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Review Comments</label>
                      <div className="p-4 bg-gray-50 rounded-lg border">
                        <p className="text-gray-900 whitespace-pre-wrap">{review.reviewComment}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Points Awarded</label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-900 font-medium">{review.pointsAwarded || 0} points</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Challenge Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Challenge Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{challenge.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">{challenge.description}</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Points:</span>
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800">
                      {challenge.points} pts
                    </Badge>
                  </div>
                  
                  {challenge.tags && challenge.tags.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-500 block mb-2">Required Technologies:</span>
                      <div className="flex flex-wrap gap-1">
                        {challenge.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {challenge.fullDescription && (
                    <div>
                      <span className="text-sm text-gray-500 block mb-2">Full Description:</span>
                      <p className="text-sm text-gray-700">{challenge.fullDescription}</p>
                    </div>
                  )}

                  {challenge.expectedOutcome && (
                    <div>
                      <span className="text-sm text-gray-500 block mb-2">Expected Outcome:</span>
                      <p className="text-sm text-gray-700">{challenge.expectedOutcome}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Submission Status */}
            <Card>
              <CardHeader>
                <CardTitle>Submission Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-center">
                    <Badge variant="outline" className={`${statusStyle} font-medium flex items-center text-base px-4 py-2`}>
                      <StatusIcon className="w-5 h-5 mr-2" />
                      {statusConfig[submission.status]?.label || submission.status}
                    </Badge>
                  </div>
                  
                  <div className="text-center text-sm text-gray-600">
                    {submission.status === 'Approved' && 'This submission has been approved and points have been awarded.'}
                    {submission.status === 'Rejected' && 'This submission was rejected. Please review the feedback.'}
                    {submission.status === 'Needs Rework' && 'This submission needs additional work. Please review the feedback.'}
                    {submission.status === 'Under Review' && 'This submission is currently being reviewed by management.'}
                    {submission.status === 'Submitted' && 'This submission is awaiting review.'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
