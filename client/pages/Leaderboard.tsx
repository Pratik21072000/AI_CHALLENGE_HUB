import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trophy, Crown, Medal, Star, TrendingUp, Award, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, Minus, Target, Calendar, Clock, Flame, CheckCircle, X, AlertTriangle } from 'lucide-react';
import Layout from '@/components/Layout';
import { useChallenges } from '@/contexts/ChallengesContext';

interface LeaderboardUser {
  id: string;
  name: string;
  email: string;
  department: string;
  role: 'Participant' | 'Reviewer' | 'Admin';
  totalPoints: number;
  weeklyPoints: number;
  monthlyPoints: number;
  avatar?: string;
  badges: string[];
  rank: number;
  completedChallenges: number;
  approvedSolutions: number;
  submittedChallenges: number;
  maxPoints?: number;
  submittedDate?: string;
  committedDate?: string;
  reviewStatus?: 'approved' | 'pending' | 'rejected';
  penalty?: number;
  timingStatus?: 'on-time' | 'late' | 'not-submitted';
  challengeBreakdowns?: Array<{
    challengeTitle: string;
    score: number;
    breakdown: string;
    colorClass: string;
    badgeType: 'on-time' | 'late' | 'none';
  }>;
}

// Points calculation logic (from Dashboard)
const calculateChallengePoints = (challenge: Challenge): number => {
  // If rejected, always 0 points
  if (challenge.status === 'Rejected') {
    return 0;
  }

  // If already has awardedPoints, use that
  if (challenge.awardedPoints !== undefined) {
    return challenge.awardedPoints;
  }

  // Calculate based on timing for approved challenges
  if (challenge.status === 'Approved' && challenge.committedDate && challenge.submittedAt) {
    const committedDate = new Date(challenge.committedDate);
    const submittedDate = new Date(challenge.submittedAt);

    // If submitted on time or early, full points
    if (submittedDate <= committedDate) {
      return challenge.points;
    }

    // If submitted late, deduct penalty
    const penaltyPoints = challenge.penaltyPoints || 0;
    return Math.max(0, challenge.points - penaltyPoints);
  }

  // For submitted/needs rework without timing data, show potential points
  if (['Submitted', 'Needs Rework'].includes(challenge.status)) {
    return challenge.points;
  }

  return 0;
};

// Enhanced score breakdown calculation
const getScoreBreakdown = (challenge: Challenge) => {
  const isApproved = challenge.status === 'Approved';
  const maxPoints = challenge.points;
  const penaltyPoints = challenge.penaltyPoints || 0;
  const submittedDate = challenge.submittedAt;
  const commitmentDate = challenge.committedDate;

  let score = 0;
  let breakdown = '';
  let colorClass = '';
  let badgeType: 'on-time' | 'late' | 'none' = 'none';

  if (isApproved && submittedDate && commitmentDate) {
    const submitted = new Date(submittedDate);
    const committed = new Date(commitmentDate);

    if (submitted <= committed) {
      // On-time submission
      score = maxPoints;
      breakdown = `${score} pts (Full Points)`;
      colorClass = 'text-green-600';
      badgeType = 'on-time';
    } else {
      // Late submission
      score = Math.max(0, maxPoints - penaltyPoints);
      breakdown = `${score} pts = ${maxPoints} - ${penaltyPoints} Penalty`;
      colorClass = 'text-orange-600';
      badgeType = 'late';
    }
  } else if (isApproved) {
    // Approved without timing data
    score = maxPoints;
    breakdown = `${score} pts (Approved)`;
    colorClass = 'text-green-600';
    badgeType = 'on-time';
  } else if (challenge.status === 'Rejected') {
    // Rejected submission
    score = 0;
    breakdown = '0 pts (Rejected)';
    colorClass = 'text-red-600';
    badgeType = 'none';
  } else if (['Submitted', 'Needs Rework'].includes(challenge.status)) {
    // Pending or needs rework
    score = maxPoints; // Potential points
    breakdown = `${score} pts (Pending)`;
    colorClass = 'text-blue-600';
    badgeType = 'none';
  }

  return { score, breakdown, colorClass, badgeType };
};

// Generate leaderboard users with enhanced points calculation
const generateLeaderboardUsers = (challenges: Challenge[]): LeaderboardUser[] => {
  const userMap = new Map<string, LeaderboardUser>();

  // Add challenge creators
  challenges.forEach(challenge => {
    if (challenge.createdBy && !userMap.has(challenge.createdBy)) {
      userMap.set(challenge.createdBy, {
        id: Math.random().toString(36).substr(2, 9),
        name: challenge.createdBy,
        email: `${challenge.createdBy.toLowerCase().replace(/\s+/g, '.')}@company.com`,
        department: getDepartmentForUser(challenge.createdBy),
        role: 'Participant',
        totalPoints: 0,
        weeklyPoints: 0,
        monthlyPoints: 0,
        badges: [],
        rank: 0,
        completedChallenges: 0,
        approvedSolutions: 0,
        submittedChallenges: 0,
        timingStatus: 'on-time',
        challengeBreakdowns: []
      });
    }
  });

  // Add challenge acceptors and calculate their points using proper logic
  challenges.forEach(challenge => {
    if (challenge.acceptedBy) {
      const acceptorName = Array.isArray(challenge.acceptedBy) ? challenge.acceptedBy[0] : challenge.acceptedBy;

      if (!userMap.has(acceptorName)) {
        userMap.set(acceptorName, {
          id: Math.random().toString(36).substr(2, 9),
          name: acceptorName,
          email: `${acceptorName.toLowerCase().replace(/\s+/g, '.')}@company.com`,
          department: getDepartmentForUser(acceptorName),
          role: 'Participant',
          totalPoints: 0,
          weeklyPoints: 0,
          monthlyPoints: 0,
          badges: [],
          rank: 0,
          completedChallenges: 0,
          approvedSolutions: 0,
          submittedChallenges: 0,
          timingStatus: 'on-time',
          challengeBreakdowns: []
        });
      }

      const user = userMap.get(acceptorName)!;
      const scoreData = getScoreBreakdown(challenge);

      // Add to user's total points based on status
      if (challenge.status === 'Approved') {
        // Use awardedPoints if available, otherwise calculate from score breakdown
        const pointsToAdd = challenge.awardedPoints !== undefined ? challenge.awardedPoints : scoreData.score;
        user.totalPoints += pointsToAdd;
        user.weeklyPoints += Math.round(pointsToAdd * 0.3);
        user.monthlyPoints += Math.round(pointsToAdd * 0.8);
        user.approvedSolutions++;
        user.completedChallenges++;

        // Set timing status based on actual submission vs commitment dates
        if (challenge.submittedAt && challenge.committedDate) {
          const submitted = new Date(challenge.submittedAt);
          const committed = new Date(challenge.committedDate);
          user.timingStatus = submitted <= committed ? 'on-time' : 'late';
        } else {
          // Default to on-time if no timing data available
          user.timingStatus = 'on-time';
        }
        user.submittedDate = challenge.submittedAt;
        user.committedDate = challenge.committedDate;
        user.maxPoints = challenge.points;
        user.penalty = challenge.penaltyPoints || 0;
        user.reviewStatus = 'approved';
      } else if (challenge.status === 'Submitted') {
        user.submittedChallenges++;
        // For submitted challenges, show potential points but don't add to total
        // Total should remain 0 until approval
        user.submittedDate = challenge.submittedAt;
        user.committedDate = challenge.committedDate;
        user.maxPoints = challenge.points;
        user.penalty = challenge.penaltyPoints || 0;
        user.reviewStatus = 'pending';
      } else if (challenge.status === 'Rejected') {
        // No points for rejected challenges
        user.timingStatus = 'on-time';
        user.reviewStatus = 'rejected';
      }

      // Store challenge breakdown for detailed view
      if (!user.challengeBreakdowns) {
        user.challengeBreakdowns = [];
      }
      user.challengeBreakdowns.push({
        challengeTitle: challenge.title,
        ...scoreData
      });
    }
  });

  const users = Array.from(userMap.values());

  // Add some default users if we don't have enough for top 3
  if (users.length < 3) {
    const defaultUsers = [
      {
        id: 'default-1',
        name: 'Alex Rodriguez',
        email: 'alex.rodriguez@company.com',
        department: 'Engineering',
        role: 'Participant' as const,
        totalPoints: 1500,
        weeklyPoints: 450,
        monthlyPoints: 1200,
        badges: [],
        rank: 0,
        completedChallenges: 4,
        approvedSolutions: 4,
        submittedChallenges: 0,
        timingStatus: 'on-time' as const,
        reviewStatus: 'approved' as const,
        challengeBreakdowns: []
      },
      {
        id: 'default-2',
        name: 'Sarah Wilson',
        email: 'sarah.wilson@company.com',
        department: 'Design',
        role: 'Participant' as const,
        totalPoints: 1200,
        weeklyPoints: 360,
        monthlyPoints: 960,
        badges: [],
        rank: 0,
        completedChallenges: 3,
        approvedSolutions: 3,
        submittedChallenges: 0,
        timingStatus: 'late' as const,
        reviewStatus: 'approved' as const,
        challengeBreakdowns: []
      },
      {
        id: 'default-3',
        name: 'Lisa Thompson',
        email: 'lisa.thompson@company.com',
        department: 'Engineering',
        role: 'Participant' as const,
        totalPoints: 650,
        weeklyPoints: 195,
        monthlyPoints: 520,
        badges: [],
        rank: 0,
        completedChallenges: 1,
        approvedSolutions: 1,
        submittedChallenges: 0,
        timingStatus: 'on-time' as const,
        reviewStatus: 'approved' as const,
        challengeBreakdowns: []
      }
    ];

    defaultUsers.forEach(defaultUser => {
      if (!users.find(u => u.name === defaultUser.name)) {
        users.push(defaultUser);
      }
    });
  }

  return users.sort((a, b) => b.totalPoints - a.totalPoints);
};

const getDepartmentForUser = (name: string): string => {
  const departments = {
    'John Doe': 'Engineering',
    'Lisa Thompson': 'Engineering',
    'Sarah Johnson': 'Design',
    'Mike Chen': 'Product',
    'Emily Davis': 'Engineering',
    'Robert Wilson': 'DevOps',
    'Jennifer Lee': 'IoT',
    'Carlos Martinez': 'Mobile'
  };
  return departments[name as keyof typeof departments] || 'Engineering';
};

// Performance Badge Configuration
const performanceBadges = {
  'Challenge Champion': {
    icon: '🏆',
    color: 'bg-yellow-100 text-yellow-900 border-yellow-300',
    description: 'Top performer across all challenges this period'
  },
  'On-Time Star': {
    icon: '🌟',
    color: 'bg-green-50 text-green-700 border-green-200',
    description: 'Submission approved and submitted on/before commitment date'
  },
  'Late Success': {
    icon: '⏰',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'Submission approved but submitted after commitment date'
  }
};

// Function to determine performance badges for a user
const getPerformanceBadges = (user: LeaderboardUser, userRank: number): string[] => {
  const badges: string[] = [];

  // Challenge Champion badge (only for #1 ranked user)
  if (userRank === 1) {
    badges.push('Challenge Champion');
  }

  // Check user's submission timing and approval status
  if (user.reviewStatus === 'approved') {
    if (user.timingStatus === 'on-time') {
      badges.push('On-Time Star');
    } else if (user.timingStatus === 'late') {
      badges.push('Late Success');
    }
  }

  return badges.slice(0, 3); // Max 3 visible badges
};

// Enhanced Score Display Component
interface ScoreDisplayProps {
  user: LeaderboardUser;
  period: string;
  showBreakdown?: boolean;
  className?: string;
}

const ScoreDisplay: React.FC<ScoreDisplayProps> = ({ user, period, showBreakdown = false, className = "" }) => {
  const points = period === 'weekly' ? user.weeklyPoints :
                period === 'monthly' ? user.monthlyPoints :
                user.totalPoints;

  // Determine color based on user's review status and timing
  let colorClass = 'text-gray-900';
  if (user.reviewStatus === 'approved' && user.timingStatus === 'on-time') {
    colorClass = 'text-green-600';
  } else if (user.reviewStatus === 'approved' && user.timingStatus === 'late') {
    colorClass = 'text-orange-600';
  } else if (user.reviewStatus === 'rejected') {
    colorClass = 'text-red-600';
  } else if (user.reviewStatus === 'pending') {
    colorClass = 'text-blue-600';
  }

  // Create breakdown text for approved challenges
  let breakdownText = '';
  if (user.reviewStatus === 'approved' && user.maxPoints && user.penalty !== undefined) {
    if (user.timingStatus === 'on-time') {
      breakdownText = `${points} pts (Full Points)`;
    } else if (user.timingStatus === 'late') {
      breakdownText = `${points} pts = ${user.maxPoints} - ${user.penalty} Penalty`;
    }
  } else if (user.reviewStatus === 'pending' && user.maxPoints) {
    breakdownText = `${user.maxPoints} pts (Pending)`;
  } else if (user.reviewStatus === 'rejected') {
    breakdownText = '0 pts (Rejected)';
  }

  if (showBreakdown && breakdownText) {
    return (
      <Tooltip>
        <TooltipTrigger>
          <div className={`cursor-help text-center ${className}`}>
            <div className={`font-bold ${colorClass}`}>
              {points.toLocaleString()} pts
            </div>
            {breakdownText && (
              <div className="text-xs text-gray-600 mt-1">
                {breakdownText}
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Click for detailed breakdown</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <div className={`text-center ${className}`}>
      <div className={`font-bold ${colorClass}`}>
        {points.toLocaleString()} pts
      </div>
    </div>
  );
};

// Horizontal Badge Component
interface HorizontalBadgesProps {
  user: LeaderboardUser;
  userRank: number;
  className?: string;
}

const HorizontalBadges: React.FC<HorizontalBadgesProps> = ({ user, userRank, className = "" }) => {
  const badges = getPerformanceBadges(user, userRank);

  // Sort badges to ensure Challenge Champion appears first
  const sortedBadges = badges.sort((a, b) => {
    if (a === 'Challenge Champion') return -1;
    if (b === 'Challenge Champion') return 1;
    return 0;
  });

  const visibleBadges = sortedBadges.slice(0, 3);
  const overflowCount = sortedBadges.length - 3;

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-2 items-center ${className}`}>
      {visibleBadges.map((badgeName, index) => {
        const badgeInfo = performanceBadges[badgeName as keyof typeof performanceBadges];
        const isChampion = badgeName === 'Challenge Champion';

        return (
          <Tooltip key={index}>
            <TooltipTrigger>
              <div
                className={`
                  inline-flex items-center rounded-full border transition-all duration-200 hover:shadow-sm hover:scale-105
                  ${badgeInfo.color}
                  ${isChampion ? 'px-5 py-2 text-sm font-bold shadow-md' : 'px-4 py-2 text-sm font-medium'}
                `}
              >
                <span className={`mr-2 ${isChampion ? 'text-base' : 'text-sm'}`}>{badgeInfo.icon}</span>
                <span className="font-bold whitespace-nowrap">{badgeName}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-sm">{badgeInfo.description}</p>
            </TooltipContent>
          </Tooltip>
        );
      })}

      {overflowCount > 0 && (
        <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
          <span className="font-bold">+{overflowCount}</span>
        </div>
      )}
    </div>
  );
};

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState('all-time');
  const [currentPage, setCurrentPage] = useState(1);

  const { challenges } = useChallenges();

  const ITEMS_PER_PAGE = 10;

  // Generate users based on actual challenge data
  const allUsers = generateLeaderboardUsers(challenges);

  const getPointsForPeriod = (user: LeaderboardUser, period: string) => {
    switch (period) {
      case 'weekly':
        return user.weeklyPoints;
      case 'monthly':
        return user.monthlyPoints;
      default:
        return user.totalPoints;
    }
  };

  const getSortedUsers = (period: string) => {
    return [...allUsers].sort((a, b) => getPointsForPeriod(b, period) - getPointsForPeriod(a, period));
  };

  const topThreeUsers = getSortedUsers(activeTab).slice(0, 3);
  const remainingUsers = getSortedUsers(activeTab).slice(3);

  // Reset page when tab changes
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setCurrentPage(1);
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankBackgroundColor = (rank: number) => {
    switch (rank) {
      case 1: return 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300';
      case 2: return 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300';
      case 3: return 'bg-gradient-to-br from-amber-100 to-amber-200 border-amber-300';
      default: return 'bg-white border-gray-200';
    }
  };

  const getTimingStatusColor = (status?: string) => {
    switch (status) {
      case 'on-time': return 'text-green-600';
      case 'late': return 'text-orange-600';
      case 'not-submitted': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTimingStatusIcon = (status?: string) => {
    switch (status) {
      case 'on-time': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'late': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'not-submitted': return <X className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
    }
  };



  // Calculate pagination for remaining users
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedUsers = remainingUsers.slice(startIndex, endIndex);
  const totalPages = Math.ceil(remainingUsers.length / ITEMS_PER_PAGE);

  return (
    <TooltipProvider>
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">🏆 Leaderboard</h1>
            <p className="text-gray-600">Track top performers and competition standings</p>
          </div>

          {/* Time Period Tabs */}
          <div className="mb-8">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto">
                <TabsTrigger value="weekly" className="text-xs">This Week</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs">This Month</TabsTrigger>
                <TabsTrigger value="all-time" className="text-xs">All Time</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Top 3 Staggered Layout */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">🏆 Top Performers</h2>
            <div className="flex flex-col lg:flex-row items-end justify-center gap-6 max-w-6xl mx-auto">
              {topThreeUsers.map((user, index) => {
                const rank = index + 1;
                const points = getPointsForPeriod(user, activeTab);
                const completionPercentage = Math.round((user.completedChallenges / 8) * 100);
                const userBadges = getPerformanceBadges(user, rank);
                const isOnTime = user.timingStatus === 'on-time';

                // Define card styling based on rank
                const getCardStyles = (rank: number) => {
                  switch (rank) {
                    case 1:
                      return {
                        height: '320px',
                        width: '320px',
                        gradient: 'bg-gradient-to-br from-yellow-50 to-amber-100',
                        border: 'border-2 border-yellow-300',
                        order: 'order-2 lg:order-2',
                        shadow: 'shadow-lg hover:shadow-xl',
                        scale: 'hover:scale-105'
                      };
                    case 2:
                      return {
                        height: '240px',
                        width: '320px',
                        gradient: 'bg-gradient-to-br from-slate-50 to-gray-100',
                        border: 'border-2 border-gray-300',
                        order: 'order-1 lg:order-1',
                        shadow: 'shadow-md hover:shadow-lg',
                        scale: 'hover:scale-102'
                      };
                    case 3:
                      return {
                        height: '240px',
                        width: '320px',
                        gradient: 'bg-gradient-to-br from-orange-50 to-orange-100',
                        border: 'border-2 border-orange-300',
                        order: 'order-3 lg:order-3',
                        shadow: 'shadow-md hover:shadow-lg',
                        scale: 'hover:scale-102'
                      };
                    default:
                      return {
                        height: '220px',
                        width: '260px',
                        gradient: 'bg-white',
                        border: 'border border-gray-200',
                        order: '',
                        shadow: 'shadow hover:shadow-md',
                        scale: 'hover:scale-101'
                      };
                  }
                };

                const cardStyles = getCardStyles(rank);

                return (
                  <Card
                    key={user.id}
                    className={`
                      ${cardStyles.gradient} ${cardStyles.border} ${cardStyles.order}
                      ${cardStyles.shadow} ${cardStyles.scale}
                      transition-all duration-300 rounded-2xl overflow-hidden
                      flex flex-col relative
                    `}
                    style={{ height: cardStyles.height, width: cardStyles.width }}
                  >
                    {/* Rank Badge in Corner */}
                    <div className="absolute top-4 right-4 z-10">
                      <div className={`
                        text-2xl font-bold p-2 rounded-full
                        ${rank === 1 ? 'bg-yellow-200 text-yellow-800' :
                          rank === 2 ? 'bg-gray-200 text-gray-800' :
                          'bg-orange-200 text-orange-800'}
                      `}>
                        {getRankEmoji(rank)}
                      </div>
                    </div>

                    <CardContent className="p-6 flex flex-col h-full">
                      {/* Avatar and Name */}
                      <div className="flex flex-col items-center text-center mb-4">
                        <Avatar className={`
                          ${rank === 1 ? 'w-20 h-20' : 'w-16 h-16'}
                          mb-3 border-4
                          ${rank === 1 ? 'border-yellow-300' :
                            rank === 2 ? 'border-gray-300' :
                            'border-orange-300'}
                          shadow-lg
                        `}>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className={`
                            ${rank === 1 ? 'text-lg' : 'text-base'} font-bold
                            ${rank === 1 ? 'bg-yellow-100 text-yellow-800' :
                              rank === 2 ? 'bg-gray-100 text-gray-800' :
                              'bg-orange-100 text-orange-800'}
                          `}>
                            {user.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>

                        <h3 className={`
                          ${rank === 1 ? 'text-xl' : 'text-lg'} font-bold text-gray-900
                          leading-tight truncate max-w-full
                        `}>
                          {user.name}
                        </h3>
                        <p className="text-sm text-gray-600 font-medium">{user.department}</p>
                      </div>

                      {/* Points Display */}
                      <div className="text-center mb-4">
                        <ScoreDisplay
                          user={user}
                          period={activeTab}
                          showBreakdown={false}
                          className={`${rank === 1 ? 'text-3xl' : 'text-2xl'}`}
                        />
                      </div>

                      {/* Performance Badges */}
                      <div className="flex flex-wrap justify-center gap-2 mb-6 px-1 min-h-[60px]">
                        <HorizontalBadges
                          user={user}
                          userRank={rank}
                          className=""
                        />
                      </div>

                      {/* Progress Bar - Only show if user has completed challenges */}
                      {user.completedChallenges > 0 && (
                        <div className="mt-auto">
                          <div className="text-center mb-2">
                            <span className="text-sm text-gray-600">
                              {user.completedChallenges}/8 challenges completed
                            </span>
                          </div>
                          <div className={`
                            w-full rounded-full h-2
                            ${rank === 1 ? 'bg-yellow-200' :
                              rank === 2 ? 'bg-gray-200' :
                              'bg-orange-200'}
                          `}>
                            <div
                              className={`
                                h-2 rounded-full transition-all duration-500
                                ${rank === 1 ? 'bg-yellow-500' :
                                  rank === 2 ? 'bg-gray-500' :
                                  'bg-orange-500'}
                              `}
                              style={{ width: `${completionPercentage}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Remaining Users Table */}
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">All Rankings</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Challenges</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badges</th>

                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsers.map((user, index) => {
                    const rank = startIndex + index + 4; // +4 because we skip top 3
                    const points = getPointsForPeriod(user, activeTab);

                    return (
                      <React.Fragment key={user.id}>
                        <tr className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              {getRankIcon(rank)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.avatar} alt={user.name} />
                                <AvatarFallback className="text-xs">
                                  {user.name.split(' ').map(n => n[0]).join('')}
                                </AvatarFallback>
                              </Avatar>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.department}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <ScoreDisplay
                              user={user}
                              period={activeTab}
                              showBreakdown={true}
                              className="text-sm"
                            />
                            <div className="text-sm text-gray-500">
                              {activeTab === 'weekly' ? 'This week' :
                               activeTab === 'monthly' ? 'This month' : 'Total'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {user.completedChallenges} completed
                            </div>
                            <div className="text-sm text-gray-500">
                              {user.approvedSolutions} approved
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <HorizontalBadges user={user} userRank={rank} />
                          </td>

                        </tr>

                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 py-4 border-t border-gray-200">
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
        </div>
      </Layout>
    </TooltipProvider>
  );
}
