import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, User, FileText, ArrowLeft, Upload, X, ThumbsUp, Users, Eye, Star, CheckCircle, Calendar, Code, AlertTriangle, Send } from 'lucide-react';
import Layout from '@/components/Layout';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useChallengeAcceptance } from '@/contexts/ChallengeAcceptanceContext';
import { useSubmission } from '@/contexts/SubmissionContext';
import { useSubmissionReview } from '@/contexts/SubmissionReviewContext';
import { useAuth } from '@/contexts/AuthContext';
import { useChallengeStatus } from '@/hooks/useChallengeStatus';
import { Challenge } from '@shared/types';
import { toast } from '@/hooks/use-toast';
import SubmitSolutionDialog, { SubmissionFormData } from '@/components/SubmitSolutionDialog';
import ChallengeAcceptanceDialog from '@/components/ChallengeAcceptanceDialog';
import SubmissionCard, { SubmissionCardData } from '@/components/SubmissionCard';
import SubmissionOnlyDetailsDialog from '@/components/SubmissionOnlyDetailsDialog';
import { storageService } from '@/services/storageService';
import { getDefinitiveAcceptanceStatus } from '@/utils/definitiveAcceptanceCheck';
import '@/utils/manualAcceptanceFixer';
import '@/utils/definitiveAcceptanceState';
import '@/utils/debugAcceptanceState';
import { getDirectAcceptanceStatus } from '@/utils/directAcceptanceCheck';
import '@/utils/emergencyFix';

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { getChallenge } = useChallenges();
  const { user } = useAuth();
  const {
    acceptChallenge,
    withdrawChallenge,
    hasUserAcceptedChallenge,
    canUserAcceptChallenge,
    getUserActiveChallenge,
    getChallengeAcceptances,
    acceptances,
    getEffectiveUserStatus,
    updateAcceptanceStatus,
    refreshAcceptances
  } = useChallengeAcceptance();
  const {
    hasUserSubmitted,
    getUserSubmission,
    getSubmissionCount,
    submissions,
    submitSolution,
    removeSubmission
  } = useSubmission();
  const { reviews } = useSubmissionReview();
  const { getUserChallengeStatus, canUserAcceptAnyChallenge, getUserActiveChallengeName } = useChallengeStatus();

  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [isAcceptingChallenge, setIsAcceptingChallenge] = useState(false);
  const [isSubmittingSolution, setIsSubmittingSolution] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [isSubmissionDetailsOpen, setIsSubmissionDetailsOpen] = useState(false);
  const [selectedSubmissionChallenge, setSelectedSubmissionChallenge] = useState<string>('');
  const [selectedSubmissionUsername, setSelectedSubmissionUsername] = useState<string>('');
  const submissionsTabRef = useRef<HTMLDivElement>(null);

  // State for API-based acceptance status
  const [acceptanceStatus, setAcceptanceStatus] = useState<{
    accepted: boolean;
    acceptedChallengeId: string | null;
    userAcceptance: any | null;
    isCurrentChallengeAccepted: boolean;
    hasActiveChallenge: boolean;
    activeChallengeId: string | null;
  } | null>(null);
  const [loadingAcceptanceStatus, setLoadingAcceptanceStatus] = useState(true);

  const challenge = getChallenge(id || '') || null;

  // Force re-render trigger
  const [forceUpdate, setForceUpdate] = useState(0);

  // Foolproof acceptance check - multiple fallbacks for demo reliability
  const isAccepted = useMemo(() => {
    if (!user || !challenge) return false;

    try {
      // Method 1: Direct localStorage check
      const acceptancesStr = localStorage.getItem('challengeHub_acceptances');
      if (acceptancesStr) {
        const acceptances = JSON.parse(acceptancesStr);
        const userAcceptance = acceptances.find((acc: any) =>
          acc.username === user.username && acc.challengeId === challenge.id
        );
        if (userAcceptance) {
          const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review', 'Approved', 'Needs Rework'];
          if (activeStatuses.includes(userAcceptance.status)) {
            console.log('✅ Found acceptance via localStorage:', userAcceptance);
            return true;
          }
        }
      }

      // Method 2: Context check
      const contextResult = hasUserAcceptedChallenge(user.username, challenge.id);
      if (contextResult) {
        console.log('✅ Found acceptance via context');
        return true;
      }

      // Method 3: Direct acceptances array check
      const directCheck = acceptances.find((acc: any) =>
        acc.username === user.username &&
        acc.challengeId === challenge.id &&
        ['Accepted', 'Submitted', 'Pending Review', 'Under Review', 'Approved', 'Needs Rework'].includes(acc.status)
      );
      if (directCheck) {
        console.log('✅ Found acceptance via direct array check:', directCheck);
        return true;
      }

      console.log('❌ No acceptance found for', user.username, 'on challenge', challenge.id);
      return false;
    } catch (error) {
      console.error('Acceptance check error:', error);
      return false;
    }
  }, [user, challenge, acceptances, hasUserAcceptedChallenge, forceUpdate]);

  // Mount-only refresh logic to prevent loops
  useEffect(() => {
    if (!user || !challenge) return;

    // Only run once on mount
    if (refreshAcceptances) {
      refreshAcceptances();
    }
  }, [user?.username, challenge?.id]); // Only depend on stable IDs

  // Ensure loading state doesn't last too long
  useEffect(() => {
    const maxLoadingTimer = setTimeout(() => {
      if (loadingAcceptanceStatus) {
        console.log('⚠️ Max loading time reached, forcing fallback mode');
        setLoadingAcceptanceStatus(false);
        setAcceptanceStatus(null);
      }
    }, 3000); // Max 3 seconds loading

    return () => clearTimeout(maxLoadingTimer);
  }, [loadingAcceptanceStatus]);

  // Helper function to create acceptance status from storage service
  const createStatusFromContext = useCallback((username: string, challengeId: string) => {
    if (!username || !challengeId) return null;

    // Use acceptances from context to prevent loops
    const userAcceptance = acceptances.find((acc: any) =>
      acc.username === username && acc.challengeId === challengeId
    );

    console.log('🔍 Context acceptances check:', { username, challengeId, userAcceptance, totalAcceptances: acceptances.length });

    // Check if user has accepted this specific challenge
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review', 'Approved', 'Needs Rework'];
    const isCurrentChallengeAccepted = userAcceptance && activeStatuses.includes(userAcceptance.status);

    // Find any active challenge for this user
    const activeAcceptance = acceptances.find((acc: any) =>
      acc.username === username && activeStatuses.includes(acc.status)
    );

    const result = {
      accepted: !!isCurrentChallengeAccepted,
      acceptedChallengeId: activeAcceptance?.challengeId || null,
      userAcceptance: userAcceptance || null,
      isCurrentChallengeAccepted: !!isCurrentChallengeAccepted,
      hasActiveChallenge: !!activeAcceptance,
      activeChallengeId: activeAcceptance?.challengeId || null
    };

    console.log('✅ Acceptance status result:', result);
    return result;
  }, [acceptances]);

  // Simple acceptance status loading - no loops
  useEffect(() => {
    if (!user || !challenge) {
      setAcceptanceStatus(null);
      setLoadingAcceptanceStatus(false);
      return;
    }

    try {
      const contextStatus = createStatusFromContext(user.username, challenge.id);
      setAcceptanceStatus(contextStatus);
      setLoadingAcceptanceStatus(false);
    } catch (error) {
      console.error('❌ Failed to load acceptance status:', error);
      setAcceptanceStatus(null);
      setLoadingAcceptanceStatus(false);
    }
  }, [user?.username, challenge?.id]); // Only on mount/challenge change

  if (!challenge) {
    return (
      <Layout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Challenge Not Found</h1>
            <p className="text-gray-600 mb-8">The challenge you're looking for doesn't exist.</p>
            <Link to="/">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  // Helper functions
  const challengeAcceptances = getChallengeAcceptances(challenge.id);
  const challengeSubmissions = submissions.filter(s => s.challengeId === challenge.id && s.submitted);
  const submissionCount = challengeSubmissions.length;
  const getActiveChallengerCount = () => {
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    return challengeAcceptances.filter(acceptance =>
      activeStatuses.includes(acceptance.status)
    ).length;
  };

  // Use API-based acceptance status with fallback to context
  const userChallengeStatus = user ? getUserChallengeStatus(user.username, challenge.id) : null;

  // Check if user has any active challenge (for preventing multiple acceptances)
  const hasAnyActiveChallenge = acceptanceStatus ?
    acceptanceStatus.hasActiveChallenge :
    !canUserAcceptAnyChallenge(user?.username || '');

  // Check if challenge is in a completed/final state (approved, rejected, needs rework)
  // Exclude withdrawn to allow re-acceptance
  const isCompleted = userChallengeStatus ?
    ['Approved', 'Rejected', 'Needs Rework'].includes(userChallengeStatus.effectiveStatus) : false;

  const hasUserSubmittedSolution = user ? hasUserSubmitted(user.username, challenge.id) : false;

  // Additional fallback check by directly looking at acceptances data (for debugging)
  const directAcceptanceCheck = user ? acceptances.find(acc =>
    acc.username === user.username &&
    acc.challengeId === challenge.id &&
    ['Accepted', 'Submitted', 'Pending Review', 'Under Review'].includes(acc.status)
  ) : null;

  // Real-time acceptance check directly from acceptances array
  const directContextCheck = user && challenge ?
    acceptances.find(acc =>
      acc.username === user.username &&
      acc.challengeId === challenge.id &&
      ['Accepted', 'Submitted', 'Pending Review', 'Under Review', 'Approved', 'Needs Rework'].includes(acc.status)
    ) : null;

  // Debug logging to understand the current state
  console.log('=== CHALLENGE DETAIL DEBUG START ===');
  console.log('User:', user?.username);
  console.log('Challenge ID:', challenge.id);
  console.log('Loading acceptance status:', loadingAcceptanceStatus);
  console.log('All acceptances count:', acceptances.length);
  console.log('User acceptances:', user ? acceptances.filter(acc => acc.username === user.username) : []);
  console.log('Direct context check:', directContextCheck);
  console.log('Context-based hasUserAcceptedChallenge:', user ? hasUserAcceptedChallenge(user.username, challenge.id) : null);
  console.log('Final isAccepted:', isAccepted);
  console.log('hasAnyActiveChallenge:', hasAnyActiveChallenge);
  console.log('isCompleted:', isCompleted);
  console.log('hasUserSubmittedSolution:', hasUserSubmittedSolution);
  console.log('=== CHALLENGE DETAIL DEBUG END ===');

  // Critical: What will the UI show?
  console.log('🎯 UI STATE PREDICTION:');
  console.log('   Will show Accept Challenge button?', !isAccepted && !isCompleted);
  console.log('   Will show Already Accepted?', isAccepted && !isCompleted);
  console.log('   Will show Completed state?', isCompleted);

  // Add global debug function
  if (typeof window !== 'undefined' && user && challenge) {
    (window as any).debugChallengeAcceptance = () => {
      console.log('🔍 Manual debug check:');
      const currentAcceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
      const userAcceptance = currentAcceptances.find((acc: any) =>
        acc.username === user.username && acc.challengeId === challenge.id
      );
      console.log('User acceptance:', userAcceptance);
      console.log('All acceptances for user:', currentAcceptances.filter((acc: any) => acc.username === user.username));

      // Force refresh acceptance status
      const newStatus = createStatusFromContext(user.username, challenge.id);
      console.log('Fresh status:', newStatus);
    };

    (window as any).forceAcceptanceRefresh = () => {
      console.log('🔄 Forcing acceptance refresh...');
      // First try refreshing acceptances from context
      if (refreshAcceptances) {
        refreshAcceptances();
      }

      // Then update local state
      const updatedStatus = createStatusFromContext(user.username, challenge.id);
      setAcceptanceStatus(updatedStatus);

      // Force component re-render
      setLoadingAcceptanceStatus(true);
      setTimeout(() => setLoadingAcceptanceStatus(false), 100);

      console.log('✅ Manual refresh completed');
    };

    // Development helper - show acceptance status on page
    (window as any).showAcceptanceDebug = () => {
      const debugDiv = document.createElement('div');
      debugDiv.style.cssText = 'position:fixed;top:10px;right:10px;background:red;color:white;padding:10px;z-index:9999;font-family:monospace;font-size:12px;max-width:300px;';
      debugDiv.innerHTML = `
        <div><strong>DEBUG INFO</strong></div>
        <div>USER: ${user.username}</div>
        <div>CHALLENGE: ${challenge.id}</div>
        <div>IS_ACCEPTED: ${isAccepted}</div>
        <div>CONTEXT_CHECK: ${directContextCheck ? 'FOUND' : 'NOT_FOUND'}</div>
        <div>ACCEPTANCES_COUNT: ${acceptances.length}</div>
        <div>USER_ACCEPTANCES: ${acceptances.filter(a => a.username === user.username).length}</div>
        <div style="margin-top:8px;">
          <button onclick="window.quickDebug()" style="background:white;color:black;padding:4px;margin:2px;border:none;cursor:pointer;font-size:10px;">Debug</button>
          <button onclick="window.emergencyFix()" style="background:red;color:white;padding:4px;margin:2px;border:none;cursor:pointer;font-size:10px;">EMERGENCY FIX</button>
          <button onclick="window.location.reload()" style="background:blue;color:white;padding:4px;margin:2px;border:none;cursor:pointer;font-size:10px;">Reload</button>
        </div>
      `;
      document.body.appendChild(debugDiv);
      setTimeout(() => debugDiv.remove(), 10000);
    };
  }

  const getUserDisplayName = (username: string) => {
    const nameMap = {
      'employee01': 'John Doe',
      'employee02': 'Lisa Thompson', 
      'employee03': 'Mike Chen',
      'manager01': 'Sarah Wilson'
    };
    return nameMap[username as keyof typeof nameMap] || username;
  };
  
  const getSubmissionCards = (): SubmissionCardData[] => {
    const submissionCards = challengeSubmissions.map(submission => {
      const submitterName = getUserDisplayName(submission.username);
      const techTags = submission.technologies ? submission.technologies.split(',').map(t => t.trim()) : [];
      const review = reviews.find(r => r.username === submission.username && r.challengeId === submission.challengeId);

      // Determine status based on review
      let status: 'Accepted' | 'In Review' | 'Approved' | 'Denied' | 'Rework' = 'In Review';
      if (review) {
        switch (review.status) {
          case 'Approved':
            status = 'Approved';
            break;
          case 'Rejected':
            status = 'Denied';
            break;
          case 'Needs Rework':
            status = 'Rework';
            break;
          default:
            status = 'In Review';
        }
      }

      return {
        id: `${submission.challengeId}-${submission.username}`,
        submitterName,
        submitterUsername: submission.username,
        submittedDate: submission.submittedAt,
        challengeTitle: challenge.title,
        challengeDescription: challenge.description,
        challengeId: submission.challengeId,
        techTags,
        status,
        hasSubmission: true,
        shortDescription: submission.shortDescription
      };
    });

    // Sort submissions by submitted date (latest first)
    return submissionCards.sort((a, b) => {
      const dateA = new Date(a.submittedDate).getTime();
      const dateB = new Date(b.submittedDate).getTime();
      return dateB - dateA;
    });
  };
  
  const handleAcceptChallenge = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to accept this challenge.",
        variant: "destructive"
      });
      return;
    }

    // Get comprehensive challenge status
    const challengeStatus = getUserChallengeStatus(user.username, challenge.id);
    const canAcceptAny = canUserAcceptAnyChallenge(user.username);

    // Check if user already has this challenge in any active state
    if (challengeStatus.isActive) {
      toast({
        title: "Challenge Already Active",
        description: `This challenge is currently ${challengeStatus.effectiveStatus.toLowerCase()}.`,
        variant: "destructive"
      });
      return;
    }

    // Check if user can accept any new challenge
    if (!canAcceptAny) {
      const activeChallengeId = getUserActiveChallengeName(user.username);
      toast({
        title: "Cannot Accept New Challenge",
        description: `You have an active challenge (${activeChallengeId}). Complete it first to accept another.`,
        variant: "destructive"
      });
      return;
    }

    // Show acceptance dialog
    setIsAcceptDialogOpen(true);
  };

  const handleConfirmAcceptance = async (committedDate: string) => {
    if (!user) return;

    setIsAcceptingChallenge(true);

    try {
      const success = await acceptChallenge(challenge.id, committedDate);

      if (success) {
        toast({
          title: "Challenge Accepted!",
          description: `Challenge accepted! You committed to complete it by ${new Date(committedDate).toLocaleDateString()}.`
        });
        console.log('✅ Challenge accepted successfully for user:', user.username, 'Challenge:', challenge.id);

        // Refresh acceptance status from storage
        const updatedStatus = createStatusFromContext(user.username, challenge.id);
        setAcceptanceStatus(updatedStatus);
        setIsAcceptDialogOpen(false);
      } else {
        toast({
          title: "Unable to Accept",
          description: "Failed to accept challenge. Please try again.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('❌ Error accepting challenge:', error);
      toast({
        title: "Unable to Accept",
        description: error instanceof Error ? error.message : "Failed to accept challenge. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAcceptingChallenge(false);
    }
  };
  
  const handleSubmitSolution = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a solution.",
        variant: "destructive"
      });
      return;
    }
    setIsSubmitDialogOpen(true);
  };

  const handleConfirmSubmission = async (submissionData: any) => {
    if (!user) return;

    setIsSubmittingSolution(true);

    try {
      // Create submission record
      const submissionSuccess = await submitSolution(challenge.id, {
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
        updateAcceptanceStatus(user.username, challenge.id, 'Submitted');

        // Also update localStorage directly to ensure immediate effect
        try {
          const acceptancesStr = localStorage.getItem('challengeHub_acceptances') || '[]';
          const acceptances = JSON.parse(acceptancesStr);
          const updatedAcceptances = acceptances.map((acc: any) =>
            acc.username === user.username && acc.challengeId === challenge.id
              ? { ...acc, status: 'Submitted' }
              : acc
          );
          localStorage.setItem('challengeHub_acceptances', JSON.stringify(updatedAcceptances));
          console.log('✅ Updated acceptance status to Submitted in localStorage');

          // Trigger events to update context
          window.dispatchEvent(new CustomEvent('challengeHub:acceptanceChanged'));
          window.dispatchEvent(new CustomEvent('challengeHub:dataChanged'));
        } catch (error) {
          console.error('Failed to update localStorage:', error);
        }

        toast({
          title: "Solution Submitted!",
          description: "Your solution has been submitted for review. Status updated to 'In Review'."
        });

        setIsSubmitDialogOpen(false);

        // Force component re-render
        setForceUpdate(prev => prev + 1);

        // Also trigger refresh of acceptances from context
        if (refreshAcceptances) {
          refreshAcceptances();
        }

        // Debug: Check status after submission
        setTimeout(() => {
          console.log('🔍 POST-SUBMISSION DEBUG:');
          const currentAcceptances = JSON.parse(localStorage.getItem('challengeHub_acceptances') || '[]');
          const userAcceptance = currentAcceptances.find((acc: any) =>
            acc.username === user.username && acc.challengeId === challenge.id
          );
          console.log('User acceptance after submission:', userAcceptance);
          console.log('Context acceptances count:', acceptances.length);
          console.log('hasUserAcceptedChallenge result:', hasUserAcceptedChallenge(user.username, challenge.id));
        }, 500);
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
  
  const handleWithdrawChallenge = () => {
    if (!user) return;

    const success = withdrawChallenge(challenge.id);
    if (success) {
      // Clean up any submissions for this withdrawn challenge
      removeSubmission(user.username, challenge.id);

      toast({
        title: "Challenge Withdrawn",
        description: "You have successfully withdrawn from this challenge."
      });
    }
  };

  const scrollToSubmissions = () => {
    setActiveTab('submissions');
    setTimeout(() => {
      submissionsTabRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  };

  const handleViewSubmission = (challengeId: string, username: string) => {
    setSelectedSubmissionChallenge(challengeId);
    setSelectedSubmissionUsername(username);
    setIsSubmissionDetailsOpen(true);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Back Button */}
        <div className="flex items-center mb-8">
          <Link to="/">
            <Button size="sm" variant="ghost" className="mr-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>



        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Created By Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <User className="h-10 w-10 text-blue-500 mr-4" />
                <div>
                  <p className="role-description text-gray-500 mb-1">Created by</p>
                  <p className="role-header font-bold text-gray-900">{challenge.createdBy}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-10 w-10 text-yellow-500 mr-4" />
                <div>
                  <p className="role-description text-gray-500 mb-1">Points</p>
                  <p className="role-header font-bold text-gray-900">{challenge.points}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submissions Card */}
          <Card 
            className="cursor-pointer hover:shadow-lg transition-shadow duration-200"
            onClick={scrollToSubmissions}
          >
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-10 w-10 text-green-500 mr-4" />
                <div>
                  <p className="role-description text-gray-500 mb-1">Submissions</p>
                  <p className="role-header font-bold text-gray-900">{submissionCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Challenge Warning */}
        {user && !canUserAcceptAnyChallenge(user.username) && !isAccepted && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
              <div>
                <p className="role-header text-blue-800 font-medium">
                  You have an active challenge in progress
                </p>
                <p className="role-description text-blue-700 mt-1">
                  Complete your current challenge ({getUserActiveChallengeName(user.username)}) to accept another one.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8">
          {loadingAcceptanceStatus ? (
            // Loading state - show fallback buttons with loading indicator
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span>Checking challenge status...</span>
              </div>
              {/* Show fallback buttons based on context */}
              {user && hasUserAcceptedChallenge(user.username, challenge.id) ? (
                hasUserSubmittedSolution ? (
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                      <span className="role-header text-green-800 font-medium">
                        Solution Submitted Successfully
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <Button
                      size="sm"
                      onClick={handleSubmitSolution}
                      className="bg-green-600 hover:bg-green-700 text-white px-8"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Submit Solution
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleWithdrawChallenge}
                      variant="outline"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Withdraw Challenge
                    </Button>
                  </div>
                )
              ) : (
                <Button
                  size="sm"
                  onClick={handleAcceptChallenge}
                  disabled={!canUserAcceptAnyChallenge(user?.username || '')}
                  className={`px-8 ${
                    !canUserAcceptAnyChallenge(user?.username || '')
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Accept Challenge
                </Button>
              )}
            </div>
          ) : isCompleted ? (
            // Challenge is completed (approved, rejected, needs rework)
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                <span className="role-header text-blue-800 font-medium">
                  Challenge is Completed
                </span>
              </div>
              <p className="role-description text-blue-700 mt-1">
                {userChallengeStatus?.effectiveStatus === 'Approved' && 'Your solution has been approved! Great job!'}
                {userChallengeStatus?.effectiveStatus === 'Rejected' && 'Your solution was rejected. You can accept new challenges.'}
                {userChallengeStatus?.effectiveStatus === 'Needs Rework' && 'Your solution needs rework. You can work on this or accept new challenges.'}
                {!['Approved', 'Rejected', 'Needs Rework'].includes(userChallengeStatus?.effectiveStatus || '') && 'This challenge has been completed.'}
              </p>
            </div>
          ) : !isAccepted || userChallengeStatus?.effectiveStatus === 'Withdrawn' ? (
            // Challenge not accepted yet OR withdrawn (allow re-acceptance)
            userChallengeStatus?.effectiveStatus === 'Withdrawn' ? (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                    <span className="role-header text-blue-800 font-medium">
                      Challenge is Completed
                    </span>
                  </div>
                  <p className="role-description text-blue-700 mt-1">
                    You withdrew from this challenge. You can accept new challenges.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={handleAcceptChallenge}
                  disabled={hasAnyActiveChallenge && (acceptanceStatus?.activeChallengeId !== challenge.id)}
                  className={`px-8 ${
                    hasAnyActiveChallenge && (acceptanceStatus?.activeChallengeId !== challenge.id)
                      ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  Accept Challenge
                </Button>
              </div>
            ) : (
              <Button
                size="sm"
                onClick={handleAcceptChallenge}
                disabled={hasAnyActiveChallenge && (acceptanceStatus?.activeChallengeId !== challenge.id)}
                className={`px-8 ${
                  hasAnyActiveChallenge && (acceptanceStatus?.activeChallengeId !== challenge.id)
                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                Accept Challenge
              </Button>
            )
          ) : hasUserSubmittedSolution ? (
            // Challenge accepted and solution submitted
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center">
                <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                <span className="role-header text-green-800 font-medium">
                  Solution Submitted Successfully
                </span>
              </div>
              <p className="role-description text-green-700 mt-1">
                Your solution has been submitted and is being reviewed. Check the Submissions tab below for details.
              </p>
            </div>
          ) : (
            // Challenge accepted but no solution submitted yet
            <div className="flex gap-4">
              <Button
                size="sm"
                onClick={handleSubmitSolution}
                className="bg-green-600 hover:bg-green-700 text-white px-8"
              >
                <Upload className="w-4 h-4 mr-2" />
                Submit Solution
              </Button>
              <Button
                size="sm"
                onClick={handleWithdrawChallenge}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8"
              >
                <X className="w-4 h-4 mr-2" />
                Withdraw Challenge
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div ref={submissionsTabRef}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="details" className="text-base font-medium">
                Challenge Details
              </TabsTrigger>
              <TabsTrigger value="submissions" className="text-base font-medium">
                Submissions ({submissionCount})
              </TabsTrigger>
            </TabsList>

            {/* Challenge Details Tab */}
            <TabsContent value="details">
              {/* Main Challenge Content - Horizontal Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column - Primary Content */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Challenge Title & Description Card */}
                  <Card className="h-fit">
                    <CardHeader>
                      <CardTitle className="role-card-title flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        {challenge.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="prose max-w-none">
                        {challenge.fullDescription ? (
                          challenge.fullDescription.split('\n\n').map((paragraph, index) => (
                            <p key={index} className="mb-3 role-description text-gray-700 leading-relaxed">
                              {paragraph}
                            </p>
                          ))
                        ) : (
                          <p className="role-description text-gray-700 leading-relaxed">{challenge.description}</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  {/* Acceptance Criteria & Expected Outcome */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="role-card-title flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        Acceptance Criteria & Expected Outcome
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="text-gray-700 leading-relaxed">
                          {challenge.expectedOutcome ? (
                            <p className="role-description">{challenge.expectedOutcome}</p>
                          ) : (
                            <p className="role-description">Meet all requirements specified in the challenge description and submit a working solution with proper documentation.</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Right Column - Sidebar Info */}
                <div className="space-y-6">

                  {/* Challenge Summary Card */}
                  <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200">
                    <CardHeader>
                      <CardTitle className="role-card-title text-blue-800">Challenge Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-3">

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            Deadline
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {new Date(challenge.deadline).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <User className="w-4 h-4" />
                            Created by
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {challenge.createdBy}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Technologies Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="role-card-title flex items-center gap-2">
                        <Code className="w-5 h-5 text-purple-600" />
                        Technologies & Skills
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {challenge.tags && challenge.tags.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {challenge.tags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="px-3 py-1 text-xs font-medium border-purple-200 text-purple-700 bg-purple-50">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="role-description text-gray-500 text-center py-4">
                          No specific technologies mentioned
                          <br />
                          <span className="text-xs">Use your preferred tech stack</span>
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Supporting Documents Card */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="role-card-title flex items-center gap-2">
                        <FileText className="w-5 h-5 text-orange-600" />
                        Supporting Documents
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {challenge.attachments && challenge.attachments.length > 0 ? (
                        <div className="space-y-2">
                          {challenge.attachments.map((attachment, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer">
                              <FileText className="w-4 h-4 text-orange-600 flex-shrink-0" />
                              <span className="text-orange-800 hover:text-orange-900 font-medium text-sm truncate">
                                {attachment}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="role-description text-gray-500 text-sm">No documents attached</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Progress Stats Card */}
                  <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                    <CardHeader>
                      <CardTitle className="role-card-title text-emerald-800">Challenge Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            Active
                          </span>
                          <span className="text-lg font-bold text-emerald-700">
                            {getActiveChallengerCount()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 flex items-center gap-2">
                            <Send className="w-4 h-4" />
                            Submissions
                          </span>
                          <span className="text-lg font-bold text-emerald-700">
                            {submissionCount}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-emerald-200">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => scrollToSubmissions()}
                            className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-100"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View All Submissions
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                </div>
              </div>
            </TabsContent>

            {/* Submissions Tab */}
            <TabsContent value="submissions">
              <Card>
                <CardHeader>
                  <CardTitle className="role-card-title">All Submissions ({submissionCount})</CardTitle>
                </CardHeader>
                <CardContent>
                  {getSubmissionCards().length > 0 ? (
                    <div className="space-y-4">
                      {getSubmissionCards().map((submission) => (
                        <SubmissionCard
                          key={submission.id}
                          submission={submission}
                          showChallengeInfo={false}
                          onViewSubmission={handleViewSubmission}
                          useSubmissionPopup={true}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <FileText className="w-20 h-20 text-gray-300 mx-auto mb-4" />
                      <h3 className="role-card-title font-medium text-gray-900 mb-2">No Submissions Yet</h3>
                      <p className="role-description text-gray-500 max-w-sm mx-auto">
                        Be the first to submit a solution for this challenge! Accept the challenge and click "Submit Solution" to get started.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Submit Solution Dialog */}
      <SubmitSolutionDialog
        open={isSubmitDialogOpen}
        onOpenChange={setIsSubmitDialogOpen}
        challengeTitle={challenge.title}
        onSubmit={handleConfirmSubmission}
        loading={isSubmittingSolution}
      />

      {/* Challenge Acceptance Dialog */}
      <ChallengeAcceptanceDialog
        open={isAcceptDialogOpen}
        onOpenChange={setIsAcceptDialogOpen}
        challengeTitle={challenge.title}
        challengePoints={challenge.points}
        challengePenalty={challenge.penaltyPoints || 0}
        onAccept={handleConfirmAcceptance}
        loading={isAcceptingChallenge}
      />

      {/* Submission Details Dialog */}
      {selectedSubmissionChallenge && selectedSubmissionUsername && (
        <SubmissionOnlyDetailsDialog
          challenge={challenge}
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
    </Layout>
  );
}
