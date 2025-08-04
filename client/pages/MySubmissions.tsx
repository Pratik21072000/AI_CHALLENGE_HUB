import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  FileText,
  Clock,
  CheckCircle,
  Eye,
  ChevronRight,
  ChevronLeft,
  RefreshCw
} from 'lucide-react';
import Layout from '@/components/Layout';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useSubmission } from '@/contexts/SubmissionContext';
import { useChallengeAcceptance } from '@/contexts/ChallengeAcceptanceContext';
import { useSubmissionReview } from '@/contexts/SubmissionReviewContext';
import { useAuth } from '@/contexts/AuthContext';
import SubmissionCard, { SubmissionCardData } from '@/components/SubmissionCard';
import SubmitSolutionDialog, { SubmissionFormData } from '@/components/SubmitSolutionDialog';
import SubmissionOnlyDetailsDialog from '@/components/SubmissionOnlyDetailsDialog';
import { toast } from '@/hooks/use-toast';
import { cleanAllWithdrawnData } from '@/utils/ensureCleanAcceptanceState';

export default function MySubmissions() {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [isSubmittingSolution, setIsSubmittingSolution] = useState(false);
  const [isSubmissionDetailsOpen, setIsSubmissionDetailsOpen] = useState(false);
  const [selectedSubmissionChallenge, setSelectedSubmissionChallenge] = useState<string>('');
  const [selectedSubmissionUsername, setSelectedSubmissionUsername] = useState<string>('');
  
  const { challenges } = useChallenges();
  const { submissions, getUserSubmission, submitSolution, removeSubmission } = useSubmission();
  const { getChallengeAcceptances, getUserAcceptances, getAllUserAcceptances, refreshAcceptances, withdrawChallenge, updateAcceptanceStatus } = useChallengeAcceptance();
  const { reviews, getSubmissionReview } = useSubmissionReview();
  const { user } = useAuth();

  const currentUsername = user?.username || 'employee01';

  // Refresh acceptances when component mounts or user changes
  useEffect(() => {
    // Auto-cleanup disabled to prevent data loss
    console.log('🛡️ Auto-cleanup disabled to preserve completed challenges');

    refreshAcceptances();
  }, [currentUsername, refreshAcceptances]);

  // Auto-refresh data every 30 seconds to ensure real-time sync
  useEffect(() => {
    const interval = setInterval(() => {
      refreshAcceptances();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [refreshAcceptances]);

  // Refresh data when page becomes visible (user switches back to tab)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        refreshAcceptances();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [refreshAcceptances]);

  // Helper function to get display names
  const getUserDisplayName = (username: string) => {
    const nameMap: Record<string, string> = {
      'employee01': 'John Doe',
      'employee02': 'Lisa Thompson',
      'employee03': 'Mike Chen',
      'manager01': 'Sarah Wilson'
    };
    return nameMap[username] || username;
  };

  // Get only challenges accepted by the current user
  const getUserAcceptedChallenges = (): SubmissionCardData[] => {
    // Get ALL acceptances for current user (including completed ones), but exclude withdrawn challenges
    const userAcceptances = getAllUserAcceptances(currentUsername).filter(acceptance =>
      acceptance.status !== 'Withdrawn'
    );

    const submissionData = userAcceptances.map(acceptance => {
      const challenge = challenges.find(c => c.id === acceptance.challengeId);
      const submission = getUserSubmission(acceptance.username, acceptance.challengeId);
      const review = getSubmissionReview(`${acceptance.username}-${acceptance.challengeId}`);

      // Determine status based on acceptance status (which gets updated by reviews)
      let status: 'Accepted' | 'In Review' | 'Approved' | 'Denied' | 'Rework' = 'Accepted';
      let submittedDate: string | undefined;

      // Use acceptance status directly since it gets updated by the review process
      switch (acceptance.status) {
        case 'Accepted':
          status = 'Accepted';
          break;
        case 'Submitted':
        case 'Pending Review':
        case 'Under Review':
          status = 'In Review';
          submittedDate = submission?.submittedAt;
          break;
        case 'Approved':
          status = 'Approved';
          submittedDate = submission?.submittedAt;
          break;
        case 'Rejected':
          status = 'Denied';
          submittedDate = submission?.submittedAt;
          break;
        case 'Needs Rework':
          status = 'Rework';
          submittedDate = submission?.submittedAt;
          break;
        default:
          status = 'Accepted';
      }

      return {
        id: `${challenge?.id}-${acceptance.username}`,
        submitterName: getUserDisplayName(acceptance.username),
        submitterUsername: acceptance.username,
        submittedDate: submittedDate || acceptance.acceptedAt,
        challengeTitle: challenge?.title || 'Unknown Challenge',
        challengeDescription: challenge?.description || 'No description available',
        challengeId: acceptance.challengeId,
        techTags: challenge?.tags || [],
        status,
        hasSubmission: !!submission?.submitted,
        shortDescription: submission?.shortDescription,
        challenge // Include challenge reference for sorting
      };
    }).filter(item => item.challengeTitle !== 'Unknown Challenge'); // Only include valid challenges

    // Sort by challenge creation time (latest first)
    return submissionData.sort((a, b) => {
      const dateA = new Date(a.challenge?.createdAt || a.challenge?.lastUpdated || a.challenge?.id || 0);
      const dateB = new Date(b.challenge?.createdAt || b.challenge?.lastUpdated || b.challenge?.id || 0);
      return dateB.getTime() - dateA.getTime();
    });
  };

  const acceptedChallenges = getUserAcceptedChallenges();

  // Debug logging to track what we're getting
  useEffect(() => {
    console.log('🔍 MySubmissions Debug:', {
      currentUser: currentUsername,
      totalAcceptances: getAllUserAcceptances(currentUsername).length,
      acceptedChallenges: acceptedChallenges.length,
      allStatuses: acceptedChallenges.map(c => ({ id: c.challengeId, status: c.status }))
    });
  }, [currentUsername, acceptedChallenges]);

  // KPI calculations
  const getTotalSubmissions = () => acceptedChallenges.length;
  const getPendingSubmissions = () => acceptedChallenges.filter(c => c.status === 'Accepted').length;
  const getUnderReview = () => acceptedChallenges.filter(c => c.status === 'In Review').length;
  const getApproved = () => acceptedChallenges.filter(c => c.status === 'Approved').length;
  const getRejected = () => acceptedChallenges.filter(c => c.status === 'Denied').length;
  const getNeedsRework = () => acceptedChallenges.filter(c => c.status === 'Rework').length;

  // Handlers for Submit Solution and Withdraw Challenge
  const handleSubmitSolution = (challengeId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a solution.",
        variant: "destructive"
      });
      return;
    }
    setSelectedChallengeId(challengeId);
    setIsSubmitDialogOpen(true);
  };

  const handleWithdrawChallenge = async (challengeId: string) => {
    if (!user) return;

    const success = withdrawChallenge(challengeId);
    if (success) {
      // Clean up any submissions for this withdrawn challenge
      removeSubmission(user.username, challengeId);

      // Clean up all withdrawn data to ensure clean state
      cleanAllWithdrawnData(user.username);

      toast({
        title: "Challenge Withdrawn",
        description: "You have successfully withdrawn from this challenge."
      });
      refreshAcceptances(); // Refresh the data
    } else {
      toast({
        title: "Withdrawal Failed",
        description: "Failed to withdraw from challenge. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Manual cleanup function for debugging
  const handleManualCleanup = () => {
    const cleanupPerformed = cleanAllWithdrawnData(currentUsername);
    if (cleanupPerformed) {
      refreshAcceptances();
      toast({
        title: "Data Cleaned",
        description: "Withdrawn challenges have been removed from your submissions."
      });
    } else {
      toast({
        title: "No Cleanup Needed",
        description: "No withdrawn challenges found to clean up."
      });
    }
  };

  const handleViewSubmission = (challengeId: string, username: string) => {
    setSelectedSubmissionChallenge(challengeId);
    setSelectedSubmissionUsername(username);
    setIsSubmissionDetailsOpen(true);
  };

  const handleConfirmSubmission = async (submissionData: SubmissionFormData) => {
    if (!user || !selectedChallengeId) return;

    setIsSubmittingSolution(true);

    try {
      // Create submission record
      const submissionSuccess = await submitSolution(selectedChallengeId, {
        shortDescription: submissionData.description,
        technologies: typeof submissionData.techStack === 'string'
          ? submissionData.techStack
          : submissionData.techStack.join(', '),
        sourceCodeUrl: submissionData.sourceCodeUrl,
        hostedAppUrl: submissionData.hostedUrl,
        solutionFile: new File([], 'solution.txt'), // Mock file
        supportingDocs: []
      });

      if (submissionSuccess) {
        // Update acceptance status to submitted
        updateAcceptanceStatus(user.username, selectedChallengeId, 'Submitted');

        toast({
          title: "Solution Submitted!",
          description: "Your solution has been submitted for review. Status updated to 'In Review'."
        });

        setIsSubmitDialogOpen(false);
        setSelectedChallengeId('');
        refreshAcceptances(); // Refresh the data
      } else {
        toast({
          title: "Submission Failed",
          description: "Failed to submit solution. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error submitting solution:', error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit solution. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmittingSolution(false);
    }
  };

  // Pagination
  const totalPages = Math.ceil(acceptedChallenges.length / itemsPerPage);
  const paginatedChallenges = acceptedChallenges.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );



  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="role-card-title font-bold text-gray-900 mb-2">My Submissions</h1>
            <p className="role-description text-gray-600">
              Track your accepted challenges and submission progress
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualCleanup}
            className="flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* KPI Cards - 4 cards as requested */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6 text-center">
              <FileText className="w-8 h-8 text-blue-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{getTotalSubmissions()}</div>
              <div className="role-description text-gray-600">Total Submissions</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 text-orange-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{getPendingSubmissions()}</div>
              <div className="role-description text-gray-600">Pending Submissions</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6 text-center">
              <Eye className="w-8 h-8 text-yellow-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{getUnderReview()}</div>
              <div className="role-description text-gray-600">Under Review</div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900 mb-1">{getApproved() + getRejected() + getNeedsRework()}</div>
              <div className="role-description text-gray-600">Completed Reviews</div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List - Horizontal Layout */}
        <div className="space-y-4 mb-8">
          {paginatedChallenges.map((challenge) => (
            <SubmissionCard
              key={challenge.id}
              submission={challenge}
              showChallengeInfo={true}
              onSubmitSolution={handleSubmitSolution}
              onWithdrawChallenge={handleWithdrawChallenge}
              onViewSubmission={handleViewSubmission}
              useSubmissionPopup={true}
            />
          ))}
        </div>

        {/* Empty State */}
        {acceptedChallenges.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="role-card-title font-medium text-gray-900 mb-2">No Accepted Challenges</h3>
              <p className="role-description text-gray-500 mb-6 max-w-sm mx-auto">
                You haven't accepted any challenges yet. Browse and accept challenges to start your submissions journey.
              </p>
              <Button 
                size="sm"
                onClick={() => window.location.href = '/'}
              >
                Browse Challenges
              </Button>
            </CardContent>
          </Card>
        )}

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

        {/* Submit Solution Dialog */}
        {selectedChallengeId && (
          <SubmitSolutionDialog
            open={isSubmitDialogOpen}
            onOpenChange={setIsSubmitDialogOpen}
            challengeTitle={challenges.find(c => c.id === selectedChallengeId)?.title || 'Challenge'}
            onSubmit={handleConfirmSubmission}
            loading={isSubmittingSolution}
          />
        )}

        {/* Submission Details Dialog */}
        {selectedSubmissionChallenge && selectedSubmissionUsername && (
          <SubmissionOnlyDetailsDialog
            challenge={challenges.find(c => c.id === selectedSubmissionChallenge)}
            submission={getUserSubmission(selectedSubmissionUsername, selectedSubmissionChallenge)}
            isOpen={isSubmissionDetailsOpen}
            onOpenChange={(open) => {
              setIsSubmissionDetailsOpen(open);
              if (!open) {
                setSelectedSubmissionChallenge('');
                setSelectedSubmissionUsername('');
              }
            }}
          />
        )}
      </div>
    </Layout>
  );
}
