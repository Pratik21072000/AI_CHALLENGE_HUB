import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, CheckCircle, ThumbsDown, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import Layout from '@/components/Layout';
import ReviewSubmissionCard, { ReviewSubmissionData } from '@/components/ReviewSubmissionCard';
import { useSubmissionReview } from '@/contexts/SubmissionReviewContext';
import { useSubmission } from '@/contexts/SubmissionContext';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export default function Submit() {
  const { user } = useAuth();
  const {
    reviews,
    pendingReviews,
    approvedReviews,
    rejectedReviews,
    reworkReviews,
    approveSubmission,
    rejectSubmission,
    requestRework
  } = useSubmissionReview();
  const { submissions } = useSubmission();
  const { challenges } = useChallenges();
  const [statusFilter, setStatusFilter] = useState<string>('Pending Review');
  const [currentPage, setCurrentPage] = useState(1);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const itemsPerPage = 6;

  // Filter reviews based on current status
  const getFilteredReviews = () => {
    switch (statusFilter) {
      case 'Pending Review':
        return pendingReviews;
      case 'Approved':
        return approvedReviews;
      case 'Rejected':
        return rejectedReviews;
      case 'Needs Rework':
        return reworkReviews;
      default:
        return reviews;
    }
  };

  const currentFilteredReviews = getFilteredReviews();

  // Debug logging to understand data flow
  React.useEffect(() => {
    console.log('🔍 Submit.tsx Debug Info:');
    console.log('  - Total reviews:', reviews.length);
    console.log('  - Total submissions:', submissions.length);
    console.log('  - Pending reviews:', pendingReviews.length);
    console.log('  - Current filter:', statusFilter);
    console.log('  - Filtered reviews:', currentFilteredReviews.length);
    console.log('  - Reviews data:', reviews);
    console.log('  - Submissions data:', submissions);
  }, [reviews, submissions, pendingReviews, currentFilteredReviews, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(currentFilteredReviews.length / itemsPerPage);
  const paginatedReviews = currentFilteredReviews.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when status filter changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const handleApprove = async (submissionId: string, comment?: string) => {
    setProcessingId(submissionId);
    try {
      const success = await approveSubmission(submissionId, comment);
      if (success) {
        toast({
          title: "Submission Approved",
          description: "The submission has been approved, points awarded, and changes saved.",
          duration: 4000,
        });
      } else {
        throw new Error('Failed to approve submission');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve submission. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (submissionId: string, comment: string) => {
    setProcessingId(submissionId);
    try {
      const success = await rejectSubmission(submissionId, comment);
      if (success) {
        toast({
          title: "Submission Rejected",
          description: "The submission has been rejected with feedback and changes saved.",
          duration: 4000,
        });
      } else {
        throw new Error('Failed to reject submission');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject submission. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRework = async (submissionId: string, comment: string) => {
    setProcessingId(submissionId);
    try {
      const success = await requestRework(submissionId, comment);
      if (success) {
        toast({
          title: "Rework Requested",
          description: "The employee has been notified to improve their submission and changes saved.",
          duration: 4000,
        });
      } else {
        throw new Error('Failed to request rework');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request rework. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Challenges</h1>
          <p className="text-gray-600">Review and manage employee challenge submissions</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card
            className={`cursor-pointer hover:shadow-md transition-shadow duration-200 ${
              statusFilter === 'Pending Review' ? 'ring-2 ring-blue-500 shadow-md' : ''
            }`}
            onClick={() => setStatusFilter('Pending Review')}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{pendingReviews.length}</p>
                  <p className="text-xs text-gray-600">Pending Review</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer hover:shadow-md transition-shadow duration-200 ${
              statusFilter === 'Approved' ? 'ring-2 ring-blue-500 shadow-md' : ''
            }`}
            onClick={() => setStatusFilter('Approved')}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{approvedReviews.length}</p>
                  <p className="text-xs text-gray-600">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer hover:shadow-md transition-shadow duration-200 ${
              statusFilter === 'Rejected' ? 'ring-2 ring-blue-500 shadow-md' : ''
            }`}
            onClick={() => setStatusFilter('Rejected')}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <ThumbsDown className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{rejectedReviews.length}</p>
                  <p className="text-xs text-gray-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card
            className={`cursor-pointer hover:shadow-md transition-shadow duration-200 ${
              statusFilter === 'Needs Rework' ? 'ring-2 ring-blue-500 shadow-md' : ''
            }`}
            onClick={() => setStatusFilter('Needs Rework')}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <RefreshCw className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{reworkReviews.length}</p>
                  <p className="text-xs text-gray-600">Needs Rework</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions Review Section */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {statusFilter} ({currentFilteredReviews.length})
          </h2>
          {currentFilteredReviews.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paginatedReviews.map((review) => {
                const submission = submissions.find(s =>
                  s.username === review.username && s.challengeId === review.challengeId
                );

                if (!submission) return null;

                // Get challenge details
                const challenge = challenges.find(c => c.id === review.challengeId);

                // Get user display name
                const getUserDisplayName = (username: string) => {
                  const nameMap = {
                    'employee01': 'John Doe',
                    'employee02': 'Lisa Thompson',
                    'employee03': 'Mike Chen',
                    'manager01': 'Sarah Wilson'
                  };
                  return nameMap[username as keyof typeof nameMap] || username;
                };

                // Transform data to match ReviewSubmissionData interface
                const reviewSubmissionData: ReviewSubmissionData = {
                  id: review.submissionId,
                  submitterName: getUserDisplayName(submission.username),
                  submitterUsername: submission.username,
                  submittedDate: submission.submittedAt,
                  challengeTitle: challenge?.title || 'Unknown Challenge',
                  challengeDescription: challenge?.description || 'No description available',
                  challengeId: submission.challengeId,
                  techTags: submission.technologies ? submission.technologies.split(',').map(t => t.trim()) : [],
                  status: review.status,
                  hasSubmission: true,
                  shortDescription: submission.shortDescription
                };

                return (
                  <ReviewSubmissionCard
                    key={review.submissionId}
                    submission={reviewSubmissionData}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    onRework={handleRework}
                    isProcessing={processingId === review.submissionId}
                  />
                );
              })}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No {statusFilter} Submissions
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  {statusFilter === 'Pending Review' && 'There are currently no submissions waiting for review.'}
                  {statusFilter === 'Approved' && 'No submissions have been approved yet.'}
                  {statusFilter === 'Rejected' && 'No submissions have been rejected yet.'}
                  {statusFilter === 'Needs Rework' && 'No submissions currently need rework.'}
                </p>
                <Link to="/">
                  <Button size="sm">Browse Dashboard</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                  className="w-8 h-8 p-0"
                >
                  {page}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </Layout>
  );
}
