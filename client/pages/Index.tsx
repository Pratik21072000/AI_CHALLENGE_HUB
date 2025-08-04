import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Search, Calendar, Trophy, Users, User, ThumbsUp, Edit, Star, Award, Eye, ChevronLeft, ChevronRight, CheckCircle, XCircle } from 'lucide-react';
import Layout from '@/components/Layout';
import CreateChallengeDialog from '@/components/CreateChallengeDialog';
import EditChallengeDialog from '@/components/EditChallengeDialog';
import ChallengeAcceptanceDialog from '@/components/ChallengeAcceptanceDialog';
import { useChallenges } from '@/contexts/ChallengesContext';
import { useChallengeAcceptance } from '@/contexts/ChallengeAcceptanceContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSubmission } from '@/contexts/SubmissionContext';
import { useSubmissionReview } from '@/contexts/SubmissionReviewContext';
import { useChallengeStatus } from '@/hooks/useChallengeStatus';
import { Challenge, ChallengeStatus } from '@shared/types';
import { toast } from '@/hooks/use-toast';
import '@/utils/clearStuckChallenge';

const statusColors = {
  'Open': 'bg-muted text-muted-foreground border-border', // Neutral for available
  'Accepted': 'bg-info/10 text-info border-info/20', // Blue for in progress
  'Submitted': 'bg-warning/10 text-warning border-warning/20', // Orange for pending review
  'Approved': 'bg-success/10 text-success border-success/20', // Green for success
  'Rejected': 'bg-error/10 text-error border-error/20', // Red for rejected
  'Needs Rework': 'bg-warning/10 text-warning border-warning/20', // Orange for needs attention
  'Withdrawn': 'bg-gray-100 text-gray-500 border-gray-300' // Gray for withdrawn
};

export default function Index() {
  const { challenges, addChallenge, updateChallenge, getUserPoints, getChallenge } = useChallenges();
  const { user } = useAuth();
  const {
    acceptances,
    acceptChallenge,
    withdrawChallenge,
    getUserActiveChallenge,
    canUserAcceptChallenge,
    hasUserAcceptedChallenge,
    getChallengeAcceptances,
    getAllUserAcceptances
  } = useChallengeAcceptance();
  const { submissions, getUserSubmission, removeSubmission } = useSubmission();
  const { reviews, getSubmissionReview } = useSubmissionReview();
  const { getUserChallengeStatus, canUserAcceptAnyChallenge, getUserActiveChallengeName } = useChallengeStatus();
  const { refreshAcceptances } = useChallengeAcceptance();

  // Refresh all data when component mounts (user navigates back to dashboard)
  React.useEffect(() => {
    console.log('🔄 Dashboard mounted - refreshing all data');
    refreshAcceptances();
  }, [refreshAcceptances]);
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    return localStorage.getItem('challengeHub_statusFilter') || 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [technologyFilter, setTechnologyFilter] = useState<string>(() => {
    return localStorage.getItem('challengeHub_technologyFilter') || 'all';
  });

  const [expandedDescriptions, setExpandedDescriptions] = useState<Set<string>>(new Set());
  const [likedChallenges, setLikedChallenges] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('challengeHub_likedChallenges');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [editingChallenge, setEditingChallenge] = useState<Challenge | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const [isAcceptDialogOpen, setIsAcceptDialogOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isAcceptingChallenge, setIsAcceptingChallenge] = useState(false);


  // Current user from auth context
  const currentUser = user?.displayName || 'John Doe';
  const currentUsername = user?.username || 'employee01';

  // Calculate dashboard stats - same for all roles as per requirement
  const getTotalChallenges = () => {
    return challenges.length;
  };

  const getTotalAccepted = () => {
    if (!user) return 0;

    if (user.role === 'Management' || user.role === 'Admin') {
      // For managers/admins: show total count across all employees
      const allAcceptances = getChallengeAcceptances('');
      const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
      return allAcceptances.filter(acceptance => activeStatuses.includes(acceptance.status)).length;
    } else {
      // For employees: show only their own accepted challenges
      const allAcceptances = getChallengeAcceptances('');
      const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
      return allAcceptances.filter(acceptance =>
        acceptance.username === user.username && activeStatuses.includes(acceptance.status)
      ).length;
    }
  };

  const getTotalSubmissions = () => {
    if (!user) return 0;

    if (user.role === 'Management' || user.role === 'Admin') {
      // For managers/admins: show total submissions across all employees
      return submissions.filter(s => s.submitted).length;
    } else {
      // For employees: show only their own submissions
      return submissions.filter(s => s.submitted && s.username === user.username).length;
    }
  };

  // Helper functions for challenge cards
  const getSubmissionCount = (challengeId: string) => {
    return submissions.filter(s => s.challengeId === challengeId && s.submitted).length;
  };

  const getActiveChallengerCount = (challengeId: string) => {
    const activeStatuses = ['Accepted', 'Submitted', 'Pending Review', 'Under Review'];
    return getChallengeAcceptances(challengeId).filter(acceptance =>
      activeStatuses.includes(acceptance.status)
    ).length;
  };

  const getPointsEarnedSoFar = (challengeId: string) => {
    // For current user's view, show their earned points
    return calculateUserEarnedPoints(challengeId);
  };

  // Handle challenge acceptance - open dialog for date selection
  const handleAcceptChallenge = async (challengeId: string) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to accept challenges.",
        variant: "destructive",
      });
      return;
    }

    console.log('🎯 Attempting to accept challenge:', { user: user.username, challengeId });

    // Get comprehensive challenge status
    const challengeStatus = getUserChallengeStatus(user.username, challengeId);
    const canAcceptAny = canUserAcceptAnyChallenge(user.username);

    console.log('📊 Challenge Status Check:', {
      challengeStatus,
      canAcceptAny,
      activeChallenge: getUserActiveChallengeName(user.username)
    });

    // Check if user already has this challenge in any active state
    if (challengeStatus.isActive) {
      console.log('❌ Challenge is already active');
      toast({
        title: "Challenge Already Active",
        description: `This challenge is currently ${challengeStatus.effectiveStatus.toLowerCase()}.`,
        variant: "destructive",
      });
      return;
    }

    // Check if user can accept any new challenge
    if (!canAcceptAny) {
      const activeChallengeId = getUserActiveChallengeName(user.username);
      console.log('❌ User cannot accept new challenges, active:', activeChallengeId);
      toast({
        title: "Cannot Accept New Challenge",
        description: `You have an active challenge (${activeChallengeId}). Complete it first to accept another.`,
        variant: "destructive",
      });
      return;
    }

    console.log('✅ Validation passed, opening acceptance dialog');

    // Find the challenge and open the acceptance dialog
    const challenge = getChallenge(challengeId);
    if (challenge) {
      setSelectedChallenge(challenge);
      setIsAcceptDialogOpen(true);
    }
  };

  // Handle the actual acceptance after user confirms with date
  const handleConfirmAcceptance = async (committedDate: string) => {
    if (!user || !selectedChallenge) return;

    setIsAcceptingChallenge(true);

    try {
      const success = await acceptChallenge(selectedChallenge.id, committedDate);

      if (success) {
        // EMERGENCY FIX: Force save to localStorage directly
        try {
          const acceptancesStr = localStorage.getItem('challengeHub_acceptances') || '[]';
          const acceptances = JSON.parse(acceptancesStr);

          // Check if acceptance already exists
          const existingIndex = acceptances.findIndex((acc: any) =>
            acc.username === user.username && acc.challengeId === selectedChallenge.id
          );

          const newAcceptance = {
            id: `acc_${user.username}_${selectedChallenge.id}_${Date.now()}`,
            username: user.username,
            challengeId: selectedChallenge.id,
            status: 'Accepted',
            committedDate,
            acceptedAt: new Date().toISOString()
          };

          if (existingIndex >= 0) {
            acceptances[existingIndex] = newAcceptance;
          } else {
            acceptances.push(newAcceptance);
          }

          localStorage.setItem('challengeHub_acceptances', JSON.stringify(acceptances));
          console.log('🚨 EMERGENCY: Forced localStorage save:', newAcceptance);

          // Trigger all events
          window.dispatchEvent(new CustomEvent('challengeHub:acceptanceChanged'));
          window.dispatchEvent(new CustomEvent('challengeHub:dataChanged'));
        } catch (error) {
          console.error('Emergency save failed:', error);
        }

        toast({
          title: "Challenge Accepted!",
          description: `Challenge accepted! You committed to complete it by ${new Date(committedDate).toLocaleDateString()}.`,
        });
        console.log('✅ Challenge accepted successfully for user:', user.username, 'Challenge:', selectedChallenge.id);

        // Mark that user accepted from dashboard for auto-recovery
        sessionStorage.setItem('challengeAcceptedFrom', 'dashboard');
        sessionStorage.setItem(`recentAcceptance_${user.username}_${selectedChallenge.id}`, 'true');

        setIsAcceptDialogOpen(false);
        setSelectedChallenge(null);
      } else {
        console.log('❌ acceptChallenge returned false');
        toast({
          title: "Error",
          description: "Failed to accept challenge. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('❌ Error accepting challenge:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to accept challenge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAcceptingChallenge(false);
    }
  };

  // Handle challenge withdrawal
  const handleWithdrawChallenge = (challengeId: string) => {
    if (!user) return;

    const success = withdrawChallenge(challengeId);

    if (success) {
      // Clean up any submissions for this withdrawn challenge
      removeSubmission(user.username, challengeId);

      toast({
        title: "Challenge Withdrawn",
        description: "You have withdrawn from this challenge.",
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to withdraw from challenge. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Function to get final awarded points for current user based on submission status
  const calculateUserEarnedPoints = (challengeId: string) => {
    if (!user) return 0;

    // Get user's acceptance and submission for this challenge
    const acceptance = acceptances.find(acc => acc.username === user.username && acc.challengeId === challengeId);
    const submission = getUserSubmission(user.username, challengeId);
    const review = getSubmissionReview(`${user.username}-${challengeId}`);

    // If no acceptance or submission, no points earned
    if (!acceptance || !submission) return 0;

    // If there's a review with pointsAwarded set, use that (manager override)
    if (review?.pointsAwarded !== undefined && review.pointsAwarded !== null) {
      return review.pointsAwarded;
    }

    // Calculate points based on status and timing
    const basePoints = 500; // Base points for any challenge
    const latePenalty = 50;  // Penalty for late submission

    switch (review?.status) {
      case 'Approved':
        // Check if submitted on time
        const committedDate = new Date(acceptance.committedDate);
        const submittedDate = new Date(submission.submittedAt);
        const isOnTime = submittedDate <= committedDate;

        return isOnTime ? basePoints : (basePoints - latePenalty);

      case 'Needs Rework':
        // If manager set specific pointsAwarded, use that, otherwise apply default penalty
        const reworkPenalty = 100; // Default 100 point penalty for rework
        return Math.max(0, basePoints - reworkPenalty);

      case 'Rejected':
        return 0;

      default:
        // No review yet or other status
        return 0;
    }
  };

  // Function to get total points earned by all users for a challenge (for admin/manager display)
  const getPointsEarnedByAllUsers = (challengeId: string) => {
    // Get all acceptances for this challenge
    const challengeAcceptances = acceptances.filter(acc => acc.challengeId === challengeId);

    let totalPoints = 0;

    challengeAcceptances.forEach(acceptance => {
      const submission = getUserSubmission(acceptance.username, challengeId);
      const review = getSubmissionReview(`${acceptance.username}-${challengeId}`);

      // Skip if no submission
      if (!submission) return;

      // If there's a review with pointsAwarded set, use that (manager override)
      if (review?.pointsAwarded !== undefined && review.pointsAwarded !== null) {
        totalPoints += review.pointsAwarded;
        return;
      }

      // Calculate points based on status and timing
      const basePoints = 500;
      const latePenalty = 50;

      switch (review?.status) {
        case 'Approved':
          const committedDate = new Date(acceptance.committedDate);
          const submittedDate = new Date(submission.submittedAt);
          const isOnTime = submittedDate <= committedDate;
          totalPoints += isOnTime ? basePoints : (basePoints - latePenalty);
          break;

        case 'Needs Rework':
          const reworkPenalty = 100; // Default 100 point penalty for rework
          totalPoints += Math.max(0, basePoints - reworkPenalty);
          break;

        case 'Rejected':
          // 0 points for rejected
          break;

        default:
          // No points for other statuses
          break;
      }
    });

    return totalPoints;
  };

  // Function to get total points earned by all employees across ALL challenges (for admin dashboard)
  const getTotalPointsAllChallenges = () => {
    // Sum of all awarded points across all reviews and all challenges
    const allReviews = reviews.filter(r => r.pointsAwarded !== undefined);
    return allReviews.reduce((sum, review) => sum + (review.pointsAwarded || 0), 0);
  };







  const toggleDescription = (challengeId: string) => {
    setExpandedDescriptions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(challengeId)) {
        newSet.delete(challengeId);
      } else {
        newSet.add(challengeId);
      }
      return newSet;
    });
  };

  const toggleLike = (challengeId: string) => {
    setLikedChallenges(prev => {
      const newSet = new Set(prev);
      if (newSet.has(challengeId)) {
        newSet.delete(challengeId);
      } else {
        newSet.add(challengeId);
      }
      return newSet;
    });
  };

  // Get all unique technologies from challenges
  const getAllTechnologies = () => {
    const techSet = new Set<string>();
    challenges.forEach(challenge => {
      challenge.tags.forEach(tag => techSet.add(tag));
    });
    return Array.from(techSet).sort();
  };

  const filteredChallenges = challenges.filter(challenge => {
    // Role-based filtering: Employees only see approved/open challenges, Managers see all
    const isApprovedChallenge = challenge.status === 'Open' || challenge.status === 'Accepted' ||
                               challenge.status === 'Submitted' || challenge.status === 'Approved' ||
                               challenge.status === 'Rejected' || challenge.status === 'Needs Rework' ||
                               challenge.status === 'Withdrawn';
    const canViewChallenge = (user?.role === 'Management' || user?.role === 'Admin') || isApprovedChallenge;

    // Check if filter matches user's relationship with the challenge
    let matchesStatus = true;
    if (statusFilter !== 'all' && user) {
      const userChallengeStatus = getUserChallengeStatus(user.username, challenge.id);

      switch (statusFilter) {
        case 'Open':
          // Challenge is available to accept
          matchesStatus = !userChallengeStatus.isActive && userChallengeStatus.effectiveStatus !== 'Approved' && userChallengeStatus.effectiveStatus !== 'Rejected' && userChallengeStatus.effectiveStatus !== 'Needs Rework';
          break;
        case 'Accepted':
          // User has accepted this challenge
          matchesStatus = userChallengeStatus.effectiveStatus === 'Accepted';
          break;
        case 'Submitted':
          // User has submitted solution for this challenge
          matchesStatus = userChallengeStatus.effectiveStatus === 'Pending Review' || userChallengeStatus.effectiveStatus === 'Under Review';
          break;
        case 'Approved':
          // User's solution was approved
          matchesStatus = userChallengeStatus.effectiveStatus === 'Approved';
          break;
        case 'Rejected':
          // User's solution was rejected
          matchesStatus = userChallengeStatus.effectiveStatus === 'Rejected';
          break;
        case 'Needs Rework':
          // User's solution needs rework
          matchesStatus = userChallengeStatus.effectiveStatus === 'Needs Rework';
          break;
        case 'Withdrawn':
          // User has withdrawn from this challenge
          matchesStatus = userChallengeStatus.effectiveStatus === 'Withdrawn';
          break;
        case 'Completed':
          // User has completed this challenge (approved, rejected, or needs rework)
          matchesStatus = ['Approved', 'Rejected', 'Needs Rework'].includes(userChallengeStatus.effectiveStatus);
          break;
        case 'Cancelled':
          // For cancelled challenges (probably not used but included for completeness)
          matchesStatus = challenge.status === 'Cancelled';
          break;
        default:
          matchesStatus = true;
      }
    }
    const matchesSearch = challenge.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         challenge.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         challenge.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTechnology = technologyFilter === 'all' || challenge.tags.includes(technologyFilter);

    return canViewChallenge && matchesStatus && matchesSearch && matchesTechnology;
  });

  // Pagination
  const totalPages = Math.ceil(filteredChallenges.length / itemsPerPage);
  const paginatedChallenges = filteredChallenges.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, technologyFilter]);

  // Reset filters when user changes to prevent stale filter states
  React.useEffect(() => {
    if (user) {
      // Reset filters to defaults when user changes
      setStatusFilter('all');
      setTechnologyFilter('all');
      setSearchQuery('');

      // Clear localStorage filter values to ensure clean state
      localStorage.removeItem('challengeHub_statusFilter');
      localStorage.removeItem('challengeHub_technologyFilter');
    }
  }, [user?.username]);

  // Save filter states to localStorage
  React.useEffect(() => {
    localStorage.setItem('challengeHub_statusFilter', statusFilter);
  }, [statusFilter]);

  React.useEffect(() => {
    localStorage.setItem('challengeHub_technologyFilter', technologyFilter);
  }, [technologyFilter]);

  React.useEffect(() => {
    localStorage.setItem('challengeHub_likedChallenges', JSON.stringify(Array.from(likedChallenges)));
    if (likedChallenges.size > 0) {
      console.log('✅ Liked challenges saved:', likedChallenges.size, 'items');
    }
  }, [likedChallenges]);

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      const expiredDays = Math.abs(diffDays);
      return {
        text: expiredDays === 1 ? 'Expired 1 day ago' : `Expired ${expiredDays} days ago`,
        isExpired: true,
        isUrgent: false
      };
    }
    if (diffDays === 0) return { text: 'Due today', isExpired: false, isUrgent: true };
    if (diffDays === 1) return { text: 'Due tomorrow', isExpired: false, isUrgent: true };
    if (diffDays <= 3) return { text: `${diffDays} days left`, isExpired: false, isUrgent: true };
    return { text: `${diffDays} days left`, isExpired: false, isUrgent: false };
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Stats Cards - Consistent for all roles */}
        <div className={`grid grid-cols-1 gap-6 mb-8 ${user?.role === 'Management' || user?.role === 'Admin' ? 'md:grid-cols-4' : 'md:grid-cols-3'}`}>
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Trophy className="h-8 w-8 text-accent" />
                <div className="ml-4">
                  <p className="text-heading-primary text-gray-900">{getTotalChallenges()}</p>
                  <p className="text-small-primary text-gray-600">Total Challenges</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-info" />
                <div className="ml-4">
                  <p className="text-heading-primary text-gray-900">{getTotalAccepted()}</p>
                  <p className="text-small-primary text-gray-600">Accepted</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Award className="h-8 w-8 text-warning" />
                <div className="ml-4">
                  <p className="text-heading-primary text-gray-900">{getTotalSubmissions()}</p>
                  <p className="text-small-primary text-gray-600">Submissions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Points Card - Only for Admin/Manager */}
          {(user?.role === 'Management' || user?.role === 'Admin') && (
            <Card className="cursor-pointer hover:shadow-md transition-shadow duration-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <Trophy className="h-8 w-8 text-success" />
                  <div className="ml-4">
                    <p className="text-heading-primary text-gray-900">{getTotalPointsAllChallenges()}</p>
                    <p className="text-small-primary text-gray-600">Total Points Earned</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>



        {/* Filter Challenges Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="role-card-title">Filter Challenges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by title or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status Dropdown */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Withdrawn">Withdrawn</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              {/* Technologies Dropdown */}
              <Select value={technologyFilter} onValueChange={setTechnologyFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Technologies" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technologies</SelectItem>
                  {getAllTechnologies().map(tech => (
                    <SelectItem key={tech} value={tech}>{tech}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Active Challenge Warning */}
        {user && !canUserAcceptAnyChallenge(user.username) && (
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

        {/* Challenge Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedChallenges.map((challenge) => (
            <Card key={challenge.id} className="hover:shadow-lg transition-shadow duration-200 flex flex-col h-full">
              <CardHeader className="pb-3">
                {/* Challenge Title */}
                <CardTitle className="role-card-title font-semibold mb-2">
                  {challenge.title}
                </CardTitle>

                {/* Challenge Description */}
                <div className="role-description text-gray-600 mb-3">
                  <div className={`${!expandedDescriptions.has(challenge.id) ? 'line-clamp-3' : ''}`}>
                    {challenge.description}
                  </div>
                  {challenge.description.length > 150 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleDescription(challenge.id);
                      }}
                      className="text-blue-600 hover:text-blue-800 role-description font-medium focus:outline-none mt-1"
                    >
                      {expandedDescriptions.has(challenge.id) ? 'Show less' : 'Show more'}
                    </button>
                  )}
                </div>

                {/* Creator Name */}
                <div className="flex items-center role-description text-gray-500 mb-2">
                  <User className="w-4 h-4 mr-1" />
                  <span>By {challenge.createdBy}</span>
                </div>
              </CardHeader>

              <CardContent className="flex-grow py-0">
                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center role-description text-gray-600">
                    <span className="mr-1">📨</span>
                    <span>{getSubmissionCount(challenge.id)} Submissions</span>
                  </div>
                  <div className="flex items-center role-description text-gray-600">
                    <span className="mr-1">🔥</span>
                    <span>{getActiveChallengerCount(challenge.id)} Active</span>
                  </div>
                </div>

                {/* Points Earned */}
                <div className="flex items-center role-description text-green-600 mb-4">
                  <Trophy className="w-4 h-4 mr-1" />
                  <span className="font-medium">
                    {user ? `You earned: ${getPointsEarnedSoFar(challenge.id)} pts | ` : ''}
                    Total earned: {getPointsEarnedByAllUsers(challenge.id)} pts
                  </span>
                </div>
              </CardContent>
              
              <CardFooter className="flex gap-2 pt-4">
                {/* View Details Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    window.location.href = `/challenge/${challenge.id}`;
                  }}
                  className="flex-1 text-sm h-9"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </Button>

                {/* Accept Button - Enhanced with comprehensive status checking */}
                {(() => {
                  if (!user) {
                    return (
                      <Button
                        size="sm"
                        disabled
                        className="flex-1 text-sm h-9 bg-gray-400 text-gray-600 cursor-not-allowed"
                      >
                        Login Required
                      </Button>
                    );
                  }

                  const challengeStatus = getUserChallengeStatus(user.username, challenge.id);
                  const canAcceptAny = canUserAcceptAnyChallenge(user.username);

                  // Special handling for rejected/rework/withdrawn challenges
                  const isCompletedButReacceptable = ['Rejected', 'Needs Rework', 'Withdrawn'].includes(challengeStatus.effectiveStatus);

                  // Button should be enabled only if:
                  // 1. Challenge is available and user can accept any challenge, OR
                  // 2. Challenge was rejected/rework/withdrawn and user can accept any challenge
                  // Check if this is the user's own active challenge (should remain enabled for navigation)
                  const isUserOwnActiveChallenge = challengeStatus.displayStatus === 'active' &&
                    challengeStatus.displayText !== 'Accepted'; // Allow Under Review, Pending Review, etc.

                  // Check if this is an accepted challenge (should be disabled when user has active challenge)
                  const isAcceptedButNotSubmitted = challengeStatus.displayStatus === 'active' &&
                    challengeStatus.displayText === 'Accepted';

                  const shouldShowAcceptButton = (challengeStatus.displayStatus === 'available' && canAcceptAny) ||
                    (isCompletedButReacceptable && canAcceptAny) ||
                    (isUserOwnActiveChallenge) || // Enable for submitted challenges (Under Review, Pending Review)
                    (isAcceptedButNotSubmitted && canAcceptAny); // Only enable Accepted if user can accept new challenges

                  return (
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleAcceptChallenge(challenge.id);
                      }}
                      disabled={!shouldShowAcceptButton}
                      className={`flex-1 text-sm h-9 ${
                        shouldShowAcceptButton
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                      }`}
                    >
                      {challengeStatus.displayStatus === 'active'
                        ? challengeStatus.displayText // Shows "Accepted", "Under Review", "Pending Review", etc.
                        : challengeStatus.effectiveStatus === 'Approved'
                        ? 'Completed'
                        : 'Accept'
                      }
                    </Button>
                  );
                })()}
              </CardFooter>
              </Card>
          ))}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-xs mb-2">No challenges found</div>
            <div className="text-gray-500 text-xs">Try adjusting your filters or search query</div>
          </div>
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
      </div>

      {/* Edit Challenge Dialog */}
      {editingChallenge && (
        <EditChallengeDialog
          challenge={editingChallenge}
          isOpen={!!editingChallenge}
          onOpenChange={(open) => !open && setEditingChallenge(null)}
        />
      )}

      {/* Challenge Acceptance Dialog */}
      {selectedChallenge && (
        <ChallengeAcceptanceDialog
          open={isAcceptDialogOpen}
          onOpenChange={setIsAcceptDialogOpen}
          challengeTitle={selectedChallenge.title}
          challengePoints={selectedChallenge.points}
          challengePenalty={selectedChallenge.penaltyPoints || 0}
          onAccept={handleConfirmAcceptance}
          loading={isAcceptingChallenge}
        />
      )}
    </Layout>
  );
}
