import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  Eye,
  Calendar,
  Code,
  Globe,
  FileText,
  Clock,
  AlertTriangle
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useAuth } from '@/contexts/AuthContext';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useSubmission } from '@/contexts/SubmissionContext';
import { useSubmissionReview } from '@/contexts/SubmissionReviewContext';
import { useChallengeAcceptance } from '@/contexts/ChallengeAcceptanceContext';

interface ReviewAction {
  type: 'approve' | 'reject' | 'rework';
  submissionId: string;
  challengeId: string;
  username: string;
  comment: string;
}

export default function ReviewChallenges() {
  const { user } = useAuth();
  const { challenges } = useChallenges();
  const { submissions } = useSubmission();
  const { approveSubmission, rejectSubmission, requestRework } = useSubmissionReview();
  const { getAllUserAcceptances } = useChallengeAcceptance();

  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    action: ReviewAction | null;
  }>({
    open: false,
    action: null
  });
  const [reviewComment, setReviewComment] = useState('');
  const [customPenalty, setCustomPenalty] = useState<string>('75');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Access control - only managers can access this page
  if (!user || (user.role !== 'Management' && user.role !== 'Admin')) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
            <p className="text-gray-600 mb-4">Only managers can access the review page.</p>
          </div>
        </div>
      </Layout>
    );
  }

  // Get submissions that are ready for review (submitted but not yet reviewed)
  const getSubmissionsForReview = () => {
    const submittedSubmissions = submissions.filter(sub =>
      sub.submitted && (sub.status === 'Submitted' || sub.status === 'Under Review')
    );

    return submittedSubmissions.map(submission => {
      const challenge = challenges.find(c => c.id === submission.challengeId);
      const allAcceptances = getAllUserAcceptances(submission.username);
      const acceptance = allAcceptances.find(acc => acc.challengeId === submission.challengeId);

      return {
        submission,
        challenge,
        acceptance,
        submittedDate: new Date(submission.submittedAt),
        committedDate: acceptance ? new Date(acceptance.committedDate) : null,
        isLate: acceptance ? new Date(submission.submittedAt) > new Date(acceptance.committedDate) : false
      };
    }).sort((a, b) => b.submittedDate.getTime() - a.submittedDate.getTime());
  };

  // Get challenges that need approval (created by employees)
  const getChallengesForApproval = () => {
    return challenges.filter(challenge => challenge.status === 'Pending Approval')
      .map(challenge => ({
        challenge,
        createdDate: new Date(challenge.createdAt || Date.now())
      }))
      .sort((a, b) => b.createdDate.getTime() - a.createdDate.getTime());
  };

  const pendingSubmissions = getSubmissionsForReview();
  const pendingChallenges = getChallengesForApproval();

  const getUserDisplayName = (username: string) => {
    const nameMap: Record<string, string> = {
      'employee01': 'John Doe',
      'employee02': 'Lisa Thompson',
      'employee03': 'Mike Chen',
      'manager01': 'Sarah Wilson'
    };
    return nameMap[username] || username;
  };

  const handleReviewAction = (type: 'approve' | 'reject' | 'rework', submissionData: any) => {
    setReviewDialog({
      open: true,
      action: {
        type,
        submissionId: submissionData.submission.id || `${submissionData.submission.username}-${submissionData.submission.challengeId}`,
        challengeId: submissionData.submission.challengeId,
        username: submissionData.submission.username,
        comment: ''
      }
    });
    setReviewComment('');
  };

  const handleConfirmReview = async () => {
    if (!reviewDialog.action || !user) return;

    setIsSubmitting(true);

    try {
      let success = false;
      const { type, submissionId, challengeId, username } = reviewDialog.action;

      switch (type) {
        case 'approve':
          success = await approveSubmission(submissionId, reviewComment);
          break;
        case 'reject':
          success = await rejectSubmission(submissionId, reviewComment);
          break;
        case 'rework':
          const penalty = parseInt(customPenalty) || 75;
          success = await requestRework(submissionId, reviewComment, penalty);
          break;
      }

      if (success) {
        setReviewDialog({ open: false, action: null });
        setReviewComment('');
        setCustomPenalty('75');
      }
    } catch (error) {
      console.error('Review submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChallengeApproval = async (challengeId: string, action: 'approve' | 'reject') => {
    if (!user) return;

    try {
      // Update challenge status
      const newStatus = action === 'approve' ? 'Open' : 'Rejected';

      // For now, update locally (in a real app, this would be an API call)
      const updatedChallenges = challenges.map(challenge =>
        challenge.id === challengeId
          ? { ...challenge, status: newStatus as any, reviewedBy: user.displayName, reviewedAt: new Date().toISOString() }
          : challenge
      );

      console.log(`✅ Challenge ${action}d:`, challengeId);

      // Force a page refresh to see updated challenges
      setTimeout(() => {
        window.location.reload();
      }, 1000);

    } catch (error) {
      console.error('Challenge approval error:', error);
    }
  };

  const getActionButton = (type: 'approve' | 'reject' | 'rework') => {
    const configs = {
      approve: {
        icon: CheckCircle,
        label: 'Approve',
        className: 'bg-green-600 hover:bg-green-700 text-white'
      },
      reject: {
        icon: XCircle,
        label: 'Reject',
        className: 'bg-red-600 hover:bg-red-700 text-white'
      },
      rework: {
        icon: RotateCcw,
        label: 'Request Rework',
        className: 'bg-orange-600 hover:bg-orange-700 text-white'
      }
    };

    const config = configs[type];
    const Icon = config.icon;

    return (
      <Button
        size="sm"
        className={config.className}
        onClick={() => handleReviewAction(type, reviewDialog.action)}
      >
        <Icon className="w-4 h-4 mr-1" />
        {config.label}
      </Button>
    );
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="role-card-title font-bold text-gray-900 mb-2">Review Management</h1>
          <p className="role-description text-gray-600">
            Review submitted solutions and approve employee-created challenges
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{pendingChallenges.length}</div>
              <div className="role-description text-gray-600">Challenge Approvals</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{pendingSubmissions.length}</div>
              <div className="role-description text-gray-600">Pending Reviews</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {pendingSubmissions.filter(s => s.isLate).length}
              </div>
              <div className="role-description text-gray-600">Late Submissions</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {pendingSubmissions.filter(s => !s.isLate).length}
              </div>
              <div className="role-description text-gray-600">On Time</div>
            </CardContent>
          </Card>
        </div>

        {/* Pending Challenge Approvals */}
        {pendingChallenges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Pending Challenge Approvals</h2>
            <div className="space-y-4">
              {pendingChallenges.map((item) => (
                <Card key={item.challenge.id} className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-green-500 text-white">
                              {item.challenge.createdBy.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-gray-900">
                              {item.challenge.createdBy}
                            </h3>
                            <p className="text-sm text-gray-600">Challenge Creator</p>
                          </div>
                        </div>
                        <h4 className="text-lg font-medium text-gray-900">
                          {item.challenge.title}
                        </h4>
                      </div>

                      <div className="text-right space-y-2">
                        <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                          Pending Approval
                        </Badge>
                        <div className="text-sm text-gray-500">
                          Created: {item.createdDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Challenge Description */}
                    <div>
                      <Label className="font-medium text-gray-700">Description:</Label>
                      <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded">
                        {item.challenge.description}
                      </p>
                    </div>

                    {/* Expected Outcome */}
                    <div>
                      <Label className="font-medium text-gray-700">Expected Outcome:</Label>
                      <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded">
                        {item.challenge.expectedOutcome}
                      </p>
                    </div>

                    {/* Tech Stack */}
                    <div>
                      <Label className="font-medium text-gray-700">Technologies:</Label>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {item.challenge.tags && item.challenge.tags.length > 0 ? (
                          item.challenge.tags.map((tech, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tech}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-500 text-sm">No technologies specified</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-medium text-gray-700">Points:</Label>
                        <p className="text-lg font-semibold text-green-600">{item.challenge.points}</p>
                      </div>
                      <div>
                        <Label className="font-medium text-gray-700">Penalty:</Label>
                        <p className="text-lg font-semibold text-red-600">{item.challenge.penaltyPoints || 0}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-4 border-t">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleChallengeApproval(item.challenge.id, 'approve')}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve Challenge
                      </Button>

                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleChallengeApproval(item.challenge.id, 'reject')}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject Challenge
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Submissions List */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Submission Reviews</h2>
          {pendingSubmissions.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="role-card-title font-medium text-gray-900 mb-2">No Pending Reviews</h3>
                <p className="role-description text-gray-500 max-w-sm mx-auto">
                  All submissions have been reviewed. New submissions will appear here when submitted.
                </p>
              </CardContent>
            </Card>
          ) : (
            pendingSubmissions.map((item) => (
              <Card key={`${item.submission.username}-${item.submission.challengeId}`} className="border-l-4 border-l-orange-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-blue-500 text-white">
                            {getUserDisplayName(item.submission.username).split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {getUserDisplayName(item.submission.username)}
                          </h3>
                          <p className="text-sm text-gray-600">{item.submission.username}</p>
                        </div>
                      </div>
                      <h4 className="text-lg font-medium text-gray-900">
                        {item.challenge?.title || 'Unknown Challenge'}
                      </h4>
                    </div>
                    
                    <div className="text-right space-y-2">
                      <Badge variant={item.isLate ? 'destructive' : 'default'}>
                        {item.isLate ? 'Late Submission' : 'On Time'}
                      </Badge>
                      <div className="text-sm text-gray-500">
                        Submitted: {item.submittedDate.toLocaleDateString()}
                      </div>
                      {item.committedDate && (
                        <div className="text-sm text-gray-500">
                          Due: {item.committedDate.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Solution Description */}
                  <div>
                    <Label className="font-medium text-gray-700">Solution Description:</Label>
                    <p className="mt-1 text-gray-900 bg-gray-50 p-3 rounded">
                      {item.submission.shortDescription || 'No description provided'}
                    </p>
                  </div>

                  {/* Tech Stack */}
                  <div>
                    <Label className="font-medium text-gray-700">Technologies:</Label>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {item.submission.technologies ? (
                        item.submission.technologies.split(',').map((tech, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tech.trim()}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No technologies specified</span>
                      )}
                    </div>
                  </div>

                  {/* URLs */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="font-medium text-gray-700 flex items-center gap-1">
                        <Code className="w-4 h-4" />
                        Source Code:
                      </Label>
                      {item.submission.sourceCodeUrl ? (
                        <a
                          href={item.submission.sourceCodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {item.submission.sourceCodeUrl}
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">Not provided</span>
                      )}
                    </div>

                    <div>
                      <Label className="font-medium text-gray-700 flex items-center gap-1">
                        <Globe className="w-4 h-4" />
                        Demo URL:
                      </Label>
                      {item.submission.hostedAppUrl ? (
                        <a
                          href={item.submission.hostedAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline text-sm break-all"
                        >
                          {item.submission.hostedAppUrl}
                        </a>
                      ) : (
                        <span className="text-gray-500 text-sm">Not provided</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/submission/${item.submission.challengeId}/${item.submission.username}`, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    
                    <div className="flex gap-2 ml-auto">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => handleReviewAction('approve', item)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700 text-white"
                        onClick={() => handleReviewAction('rework', item)}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Rework
                      </Button>
                      
                      <Button
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleReviewAction('reject', item)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Review Confirmation Dialog */}
        <Dialog open={reviewDialog.open} onOpenChange={(open) => !isSubmitting && setReviewDialog({ open, action: reviewDialog.action })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {reviewDialog.action?.type === 'approve' && 'Approve Submission'}
                {reviewDialog.action?.type === 'reject' && 'Reject Submission'}
                {reviewDialog.action?.type === 'rework' && 'Request Rework'}
              </DialogTitle>
              <DialogDescription>
                Provide feedback for the employee regarding their submission.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="comment">
                  {reviewDialog.action?.type === 'approve' && 'Feedback (Optional)'}
                  {reviewDialog.action?.type === 'reject' && 'Reason for Rejection *'}
                  {reviewDialog.action?.type === 'rework' && 'Required Changes *'}
                </Label>
                <Textarea
                  id="comment"
                  placeholder={
                    reviewDialog.action?.type === 'approve'
                      ? "Great work! Your solution meets all requirements..."
                      : reviewDialog.action?.type === 'reject'
                      ? "The solution doesn't meet the requirements because..."
                      : "Please make the following changes to your solution..."
                  }
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  className="min-h-24"
                />
              </div>

              {/* Custom Penalty Input for Rework */}
              {reviewDialog.action?.type === 'rework' && (
                <div>
                  <Label htmlFor="penalty">
                    Custom Penalty Points *
                  </Label>
                  <Input
                    id="penalty"
                    type="number"
                    placeholder="75"
                    value={customPenalty}
                    onChange={(e) => setCustomPenalty(e.target.value)}
                    min="0"
                    max="500"
                    className="w-32"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Enter penalty amount to deduct from 500 points (e.g., 75 = 425 final points)
                  </p>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setReviewDialog({ open: false, action: null })}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirmReview}
                disabled={isSubmitting || (reviewDialog.action?.type !== 'approve' && !reviewComment.trim())}
                className={
                  reviewDialog.action?.type === 'approve' 
                    ? 'bg-green-600 hover:bg-green-700'
                    : reviewDialog.action?.type === 'reject'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-orange-600 hover:bg-orange-700'
                }
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {reviewDialog.action?.type === 'approve' && <CheckCircle className="w-4 h-4 mr-2" />}
                    {reviewDialog.action?.type === 'reject' && <XCircle className="w-4 h-4 mr-2" />}
                    {reviewDialog.action?.type === 'rework' && <RotateCcw className="w-4 h-4 mr-2" />}
                    Confirm {reviewDialog.action?.type === 'approve' ? 'Approval' : reviewDialog.action?.type === 'reject' ? 'Rejection' : 'Rework Request'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
